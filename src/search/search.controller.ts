import { Controller, Get, HttpStatus, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { OrgMemberGuard } from 'src/common/guards/org-member.guard';
import { AuthenticatedRequest } from 'src/common/types/request.interface';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchService } from './search.service';


@Controller('search')
@ApiTags('Search')
@UseGuards(JwtAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Global search across cards, todos, and projects' })
  async search(@Query() query: SearchQueryDto, @Req() req: AuthenticatedRequest) {
    const user = req.user as UserEntity;
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);
    const response = await this.searchService.search(
      user.Id,
      query.q?.trim() ?? '',
      query.type,
      query.orgId,
      query.projectId,
      limit,
    );
    return new ApiResponse(true, HttpStatus.OK, 'Search results', response);
  }
}
