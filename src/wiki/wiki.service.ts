import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ProjectRepository } from "src/common/repositories/project.repository";
import { OrganizationMemberRepository } from "src/common/repositories/organization-member.repository";
import { WikiPageRepository } from "src/common/repositories/wiki-page.repository";
import { WikiAttachmentRepository } from "src/common/repositories/wiki-attachment.repository";
import { OrgRole } from "src/common/types/org-role.enum";
import { UserEntity } from "src/core/database/entities/user.entity";
import { WikiPageEntity } from "src/core/database/entities/wiki-page.entity";
import { WikiAttachmentEntity } from "src/core/database/entities/wiki-attachment.entity";
import { AttachmentType } from "src/common/types/attachment-type.enum";
import { createPaginatedResponse } from "src/common/dto/paginated-response.dto";
import { CreateWikiPageDto, UpdateWikiPageDto } from "./dto/wiki.dto";
import * as path from "path";
import * as fs from "fs";

@Injectable()
export class WikiService {
  private readonly uploadsDir = path.join(process.cwd(), "uploads/wiki");

  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly orgMemberRepository: OrganizationMemberRepository,
    private readonly wikiPageRepository: WikiPageRepository,
    private readonly wikiAttachmentRepository: WikiAttachmentRepository,
  ) {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /* ---------------------------------- Access Control ---------------------------------- */

  private async assertProjectAccess(projectId: string, user: UserEntity) {
    const project = await this.projectRepository.findOneById(projectId, [
      "CreatedBy",
    ]);
    if (!project) throw new NotFoundException("Project not found");

    if (project.OrganizationId) {
      const isMember = await this.orgMemberRepository.isMember(
        user.Id,
        project.OrganizationId,
      );
      if (!isMember) throw new ForbiddenException("Access denied");
    } else if (project.CreatedBy?.Id !== user.Id) {
      throw new ForbiddenException("Access denied");
    }

    return project;
  }

  private async assertCanEdit(projectId: string, user: UserEntity) {
    const project = await this.assertProjectAccess(projectId, user);

    if (project.OrganizationId) {
      const hasRole = await this.orgMemberRepository.hasRole(
        user.Id,
        project.OrganizationId,
        [OrgRole.ADMIN, OrgRole.OWNER],
      );
      if (!hasRole) throw new ForbiddenException("Admin access required");
    } else if (project.CreatedBy?.Id !== user.Id) {
      throw new ForbiddenException("Admin access required");
    }

    return project;
  }

  private async assertPage(projectId: string, pageId: string) {
    const page = await this.wikiPageRepository.findById(pageId);
    if (!page || page.ProjectId !== projectId) {
      throw new NotFoundException("Wiki page not found");
    }
    return page;
  }

  /* ---------------------------------- Slug Utils ---------------------------------- */

  private normalizeSlug(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  private async buildUniqueSlug(
    projectId: string,
    seed: string,
    pageId?: string,
  ) {
    const base = this.normalizeSlug(seed);
    if (!base) throw new BadRequestException("Invalid slug");

    let slug = base;
    let counter = 2;

    while (true) {
      const existing = await this.wikiPageRepository.findBySlug(
        projectId,
        slug,
      );
      if (!existing || existing.Id === pageId) break;
      slug = `${base}-${counter++}`;
    }

    return slug;
  }

  /* ---------------------------------- Pages ---------------------------------- */

  async listPages(
    projectId: string,
    user: UserEntity,
  ): Promise<WikiPageEntity[]> {
    await this.assertProjectAccess(projectId, user);
    return this.wikiPageRepository.findByProjectId(projectId);
  }

  async getBySlug(
    projectId: string,
    slug: string,
    user: UserEntity,
  ): Promise<WikiPageEntity> {
    await this.assertProjectAccess(projectId, user);
    const page = await this.wikiPageRepository.findBySlug(projectId, slug);
    if (!page) throw new NotFoundException("Wiki page not found");
    return page;
  }

  async createPage(
    projectId: string,
    dto: CreateWikiPageDto,
    user: UserEntity,
  ): Promise<WikiPageEntity> {
    await this.assertCanEdit(projectId, user);

    const slug = await this.buildUniqueSlug(projectId, dto.Slug || dto.Title);

    const page = this.wikiPageRepository.create({
      ProjectId: projectId,
      Title: dto.Title.trim(),
      Slug: slug,
      Content: dto.Content?.trim() || null,
      CreatedBy: user,
    });

    return this.wikiPageRepository.save(page);
  }

  async updatePage(
    projectId: string,
    pageId: string,
    dto: UpdateWikiPageDto,
    user: UserEntity,
  ): Promise<WikiPageEntity> {
    await this.assertCanEdit(projectId, user);
    const page = await this.assertPage(projectId, pageId);

    if (dto.Title !== undefined) page.Title = dto.Title.trim();
    if (dto.Content !== undefined) page.Content = dto.Content?.trim() || null;

    if (dto.Slug) {
      page.Slug = await this.buildUniqueSlug(projectId, dto.Slug, page.Id);
    }

    return this.wikiPageRepository.save(page);
  }

  async removePage(
    projectId: string,
    pageId: string,
    user: UserEntity,
  ): Promise<void> {
    await this.assertCanEdit(projectId, user);
    const page = await this.assertPage(projectId, pageId);
    await this.wikiPageRepository.remove(page);
  }

  /* ---------------------------------- Attachments ---------------------------------- */

  async uploadAttachment(
    projectId: string,
    pageId: string,
    file: Express.Multer.File,
    user: UserEntity,
  ): Promise<WikiAttachmentEntity> {
    await this.assertCanEdit(projectId, user);
    if (!file) throw new BadRequestException("No file provided");

    await this.assertPage(projectId, pageId);

    const relativeUrl = `/uploads/wiki/${projectId}/${pageId}/${file.filename}`;

    const attachment = this.wikiAttachmentRepository.create({
      WikiPageId: pageId,
      ProjectId: projectId,
      Type: AttachmentType.FILE,
      Url: relativeUrl,
      FileName: file.originalname,
      FileSize: file.size,
      MimeType: file.mimetype,
      CreatedBy: user,
    });

    return this.wikiAttachmentRepository.save(attachment);
  }

  async listAttachments(
    projectId: string,
    pageId: string,
    user: UserEntity,
    page: number,
    limit: number,
  ) {
    await this.assertProjectAccess(projectId, user);
    await this.assertPage(projectId, pageId);

    const take = Math.min(100, Math.max(1, limit));
    const skip = (Math.max(1, page) - 1) * take;

    const [items, total] =
      await this.wikiAttachmentRepository.findByPageIdPaginated(
        pageId,
        skip,
        take,
      );

    return createPaginatedResponse(items, total, page, take);
  }

  async removeAttachment(
    projectId: string,
    attachmentId: string,
    user: UserEntity,
  ): Promise<void> {
    await this.assertCanEdit(projectId, user);

    const attachment =
      await this.wikiAttachmentRepository.findById(attachmentId);
    if (!attachment) throw new NotFoundException("Attachment not found");

    const page = await this.assertPage(projectId, attachment.WikiPageId);

    await this.wikiAttachmentRepository.remove(attachment);
  }
}
