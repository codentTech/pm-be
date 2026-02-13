import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { BaseRepository } from "./base.repository";
import { WikiAttachmentEntity } from "src/core/database/entities/wiki-attachment.entity";

@Injectable()
export class WikiAttachmentRepository extends BaseRepository<WikiAttachmentEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, WikiAttachmentEntity);
  }

  private get repo() {
    return this.getRepository();
  }

  /* ----------------------------- Queries ----------------------------- */

  async findByPageId(pageId: string): Promise<WikiAttachmentEntity[]> {
    return this.repo.find({
      where: { WikiPageId: pageId },
      order: { CreatedAt: "DESC" }, // newest first
    });
  }

  async findByPageIdPaginated(
    pageId: string,
    skip: number,
    take: number,
  ): Promise<[WikiAttachmentEntity[], number]> {
    return this.repo.findAndCount({
      where: { WikiPageId: pageId },
      order: { CreatedAt: "DESC" },
      skip,
      take,
    });
  }

  async findById(id: string): Promise<WikiAttachmentEntity | null> {
    return this.repo.findOne({
      where: { Id: id },
    });
  }

  /* ----------------------------- Persistence ----------------------------- */

  create(data: Partial<WikiAttachmentEntity>): WikiAttachmentEntity {
    return this.repo.create(data);
  }

  async save(entity: WikiAttachmentEntity): Promise<WikiAttachmentEntity> {
    return this.repo.save(entity);
  }

  async remove(entity: WikiAttachmentEntity): Promise<void> {
    await this.repo.remove(entity);
  }
}
