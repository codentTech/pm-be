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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import * as path from "path";
import * as fs from "fs";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { ApiResponse } from "src/common/dto/api-response.dto";
import { AuthenticatedRequest } from "src/common/types/request.interface";
import { PaginationQueryDto } from "src/common/dto/pagination-query.dto";

import { WikiService } from "./wiki.service";
import { CreateWikiPageDto, UpdateWikiPageDto } from "./dto/wiki.dto";

@Controller("projects/:projectId/wiki")
@ApiTags("Project Wiki")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class WikiController {
  constructor(private readonly wikiService: WikiService) {}

  /* ============================= Pages ============================= */

  @Get()
  @ApiOperation({ summary: "List wiki pages for project" })
  async listPages(
    @Param("projectId") projectId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.wikiService.listPages(projectId, req.user);
    return new ApiResponse(true, HttpStatus.OK, "Wiki pages fetched", response);
  }

  @Get("search")
  @ApiOperation({ summary: "Search wiki pages by title or content" })
  async searchPages(
    @Param("projectId") projectId: string,
    @Query("q") q: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.wikiService.searchPages(
      projectId,
      q || "",
      req.user,
    );
    return new ApiResponse(true, HttpStatus.OK, "Search results", response);
  }

  @Post()
  @ApiOperation({ summary: "Create wiki page" })
  async createPage(
    @Param("projectId") projectId: string,
    @Body() dto: CreateWikiPageDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.wikiService.createPage(
      projectId,
      dto,
      req.user,
    );
    return new ApiResponse(
      true,
      HttpStatus.CREATED,
      "Wiki page created",
      response,
    );
  }

  @Get(":slug")
  @ApiOperation({ summary: "Get wiki page by slug" })
  async getPageBySlug(
    @Param("projectId") projectId: string,
    @Param("slug") slug: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.wikiService.getBySlug(
      projectId,
      slug,
      req.user,
    );
    return new ApiResponse(true, HttpStatus.OK, "Wiki page fetched", response);
  }

  @Put(":pageId")
  @ApiOperation({ summary: "Update wiki page" })
  async updatePage(
    @Param("projectId") projectId: string,
    @Param("pageId") pageId: string,
    @Body() dto: UpdateWikiPageDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.wikiService.updatePage(
      projectId,
      pageId,
      dto,
      req.user,
    );
    return new ApiResponse(true, HttpStatus.OK, "Wiki page updated", response);
  }

  @Delete(":pageId")
  @ApiOperation({ summary: "Delete wiki page" })
  async deletePage(
    @Param("projectId") projectId: string,
    @Param("pageId") pageId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.wikiService.removePage(projectId, pageId, req.user);
    return new ApiResponse(true, HttpStatus.OK, "Wiki page deleted");
  }

  /* ============================= Attachments ============================= */

  @Post(":pageId/attachments/upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const { projectId, pageId } = req.params as {
            projectId: string;
            pageId: string;
          };

          const uploadsDir = path.join(
            process.cwd(),
            "uploads",
            "wiki",
            projectId,
            pageId,
          );

          fs.mkdirSync(uploadsDir, { recursive: true });
          cb(null, uploadsDir);
        },
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname) || "";
          const baseName = path.basename(file.originalname, ext);
          const safeName = `${baseName}-${Date.now()}${ext}`.replace(
            /[^a-zA-Z0-9._-]/g,
            "_",
          );
          cb(null, safeName);
        },
      }),
    }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
      },
    },
  })
  @ApiOperation({ summary: "Upload wiki attachment" })
  async uploadAttachment(
    @Param("projectId") projectId: string,
    @Param("pageId") pageId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    const response = await this.wikiService.uploadAttachment(
      projectId,
      pageId,
      file,
      req.user,
    );
    return new ApiResponse(
      true,
      HttpStatus.CREATED,
      "Attachment uploaded",
      response,
    );
  }

  @Get(":pageId/attachments")
  @ApiOperation({ summary: "List wiki attachments (paginated)" })
  async listAttachments(
    @Param("projectId") projectId: string,
    @Param("pageId") pageId: string,
    @Query() query: PaginationQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const response = await this.wikiService.listAttachments(
      projectId,
      pageId,
      req.user,
      page,
      limit,
    );

    return new ApiResponse(
      true,
      HttpStatus.OK,
      "Attachments fetched",
      response,
    );
  }

  @Delete(":pageId/attachments/:attachmentId")
  @ApiOperation({ summary: "Delete wiki attachment" })
  async deleteAttachment(
    @Param("projectId") projectId: string,
    @Param("pageId") pageId: string,
    @Param("attachmentId") attachmentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.wikiService.removeAttachment(projectId, attachmentId, req.user);
    return new ApiResponse(true, HttpStatus.OK, "Attachment deleted");
  }
}
