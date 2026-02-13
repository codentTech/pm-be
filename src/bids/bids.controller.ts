import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiResponse } from "src/common/dto/api-response.dto";
import { PaginationQueryDto } from "src/common/dto/pagination-query.dto";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { OrgMemberGuard } from "src/common/guards/org-member.guard";
import { AuthenticatedRequest } from "src/common/types/request.interface";
import { UserEntity } from "src/core/database/entities/user.entity";
import { BidsService } from "./bids.service";
import { BidListQueryDto } from "./dto/bid-query.dto";
import {
  BulkDeleteBidsDto,
  CreateBidDto,
  TransitionBidStatusDto,
  UpdateBidDto,
} from "./dto/bid.dto";

@Controller("bids")
@ApiTags("Bids")
@UseGuards(JwtAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Post()
  @ApiOperation({ summary: "Create a bid" })
  async create(@Body() dto: CreateBidDto, @Req() req: AuthenticatedRequest) {
    const orgId = req.headers["x-organization-id"] as string | undefined;
    const response = await this.bidsService.create(
      dto,
      req.user as UserEntity,
      orgId,
    );
    return new ApiResponse(
      true,
      HttpStatus.CREATED,
      "Bid created successfully",
      response,
    );
  }

  @Get()
  @ApiOperation({
    summary: "Get all bids for the current organization (paginated)",
  })
  async findAll(
    @Query() query: BidListQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const orgId = req.headers["x-organization-id"] as string | undefined;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const response = await this.bidsService.findAllPaginated(
      req.user as UserEntity,
      orgId,
      page,
      limit,
      query.sort,
      query.order,
      query.status,
    );
    return new ApiResponse(
      true,
      HttpStatus.OK,
      "Bids fetched successfully",
      response,
    );
  }

  @Get("backlogs/drafts")
  @ApiOperation({ summary: "Get draft backlog (aging drafts)" })
  async draftBacklog(
    @Query() query: PaginationQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const orgId = req.headers["x-organization-id"] as string | undefined;
    const response = await this.bidsService.getDraftBacklog(
      req.user as UserEntity,
      orgId,
      query.page ?? 1,
      query.limit ?? 20,
    );
    return new ApiResponse(true, HttpStatus.OK, "Draft backlog fetched", response);
  }

  @Get("backlogs/follow-ups")
  @ApiOperation({ summary: "Get follow-up backlog (overdue follow-ups)" })
  async followUpBacklog(
    @Query() query: PaginationQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const orgId = req.headers["x-organization-id"] as string | undefined;
    const response = await this.bidsService.getFollowUpBacklog(
      req.user as UserEntity,
      orgId,
      query.page ?? 1,
      query.limit ?? 20,
    );
    return new ApiResponse(true, HttpStatus.OK, "Follow-up backlog fetched", response);
  }

  @Get("backlogs/interviews")
  @ApiOperation({ summary: "Get interview backlog" })
  async interviewBacklog(
    @Query() query: PaginationQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const orgId = req.headers["x-organization-id"] as string | undefined;
    const response = await this.bidsService.getInterviewBacklog(
      req.user as UserEntity,
      orgId,
      query.page ?? 1,
      query.limit ?? 20,
    );
    return new ApiResponse(true, HttpStatus.OK, "Interview backlog fetched", response);
  }

  @Get("backlogs/review")
  @ApiOperation({ summary: "Get review backlog (incomplete terminal data)" })
  async reviewBacklog(
    @Query() query: PaginationQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const orgId = req.headers["x-organization-id"] as string | undefined;
    const response = await this.bidsService.getReviewBacklog(
      req.user as UserEntity,
      orgId,
      query.page ?? 1,
      query.limit ?? 20,
    );
    return new ApiResponse(true, HttpStatus.OK, "Review backlog fetched", response);
  }

  @Get("ghosted-suggestions")
  @ApiOperation({ summary: "Get bids suggested for ghosting" })
  async ghostedSuggestions(
    @Query() query: PaginationQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const orgId = req.headers["x-organization-id"] as string | undefined;
    const response = await this.bidsService.getGhostedSuggestions(
      req.user as UserEntity,
      orgId,
      query.page ?? 1,
      query.limit ?? 20,
    );
    return new ApiResponse(true, HttpStatus.OK, "Ghosted suggestions fetched", response);
  }

  @Get("metrics")
  @ApiOperation({ summary: "Get bid metrics for BD dashboard" })
  async metrics(@Req() req: AuthenticatedRequest) {
    const orgId = req.headers["x-organization-id"] as string | undefined;
    const response = await this.bidsService.getMetrics(req.user as UserEntity, orgId);
    return new ApiResponse(true, HttpStatus.OK, "Bid metrics fetched", response);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get bid by ID" })
  async findOne(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    const response = await this.bidsService.findOne(id, req.user as UserEntity);
    return new ApiResponse(
      true,
      HttpStatus.OK,
      "Bid fetched successfully",
      response,
    );
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a bid" })
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateBidDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.bidsService.update(
      id,
      dto,
      req.user as UserEntity,
    );
    return new ApiResponse(
      true,
      HttpStatus.OK,
      "Bid updated successfully",
      response,
    );
  }

  @Post(":id/transition")
  @ApiOperation({ summary: "Transition bid status" })
  async transitionStatus(
    @Param("id") id: string,
    @Body() dto: TransitionBidStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.bidsService.transitionStatus(
      id,
      dto,
      req.user as UserEntity,
    );
    return new ApiResponse(
      true,
      HttpStatus.OK,
      "Bid status updated successfully",
      response,
    );
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a bid" })
  async remove(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    await this.bidsService.remove(id, req.user as UserEntity);
    return new ApiResponse(true, HttpStatus.OK, "Bid deleted successfully");
  }

  @Post("bulk-delete")
  @ApiOperation({ summary: "Bulk delete bids" })
  async bulkDelete(
    @Body() dto: BulkDeleteBidsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const orgId = req.headers["x-organization-id"] as string | undefined;
    const response = await this.bidsService.bulkDelete(
      dto.ids,
      req.user as UserEntity,
      orgId,
    );
    return new ApiResponse(
      true,
      HttpStatus.OK,
      `Bulk delete completed: ${response.deleted} deleted, ${response.failed.length} failed`,
      response,
    );
  }
}
