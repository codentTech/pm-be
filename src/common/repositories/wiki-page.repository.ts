import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { BaseRepository } from "./base.repository";
import { WikiPageEntity } from "src/core/database/entities/wiki-page.entity";

@Injectable()
export class WikiPageRepository extends BaseRepository<WikiPageEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, WikiPageEntity);
  }

  private get repo() {
    return this.getRepository();
  }

  /* ----------------------------- Queries ----------------------------- */

  async findByProjectId(projectId: string): Promise<WikiPageEntity[]> {
    return this.repo.find({
      where: { ProjectId: projectId },
      order: { UpdatedAt: "DESC", CreatedAt: "DESC" },
    });
  }

  async search(
    projectId: string,
    query: string,
  ): Promise<WikiPageEntity[]> {
    const q = (query || "").trim();
    if (!q) return this.findByProjectId(projectId);

    const qb = this.repo
      .createQueryBuilder("p")
      .where("p.ProjectId = :projectId", { projectId })
      .andWhere(
        "(LOWER(p.Title) LIKE LOWER(:q) OR LOWER(p.Slug) LIKE LOWER(:q) OR LOWER(p.Content) LIKE LOWER(:q))",
        { q: `%${q.replace(/%/g, "\\%")}%` },
      )
      .orderBy("p.UpdatedAt", "DESC")
      .addOrderBy("p.CreatedAt", "DESC");

    return qb.getMany();
  }

  async findBySlug(
    projectId: string,
    slug: string,
  ): Promise<WikiPageEntity | null> {
    return this.repo.findOne({
      where: { ProjectId: projectId, Slug: slug },
    });
  }

  async findById(id: string): Promise<WikiPageEntity | null> {
    return this.repo.findOne({
      where: { Id: id },
    });
  }

  /* ----------------------------- Persistence ----------------------------- */

  create(data: Partial<WikiPageEntity>): WikiPageEntity {
    return this.repo.create(data);
  }

  async save(entity: WikiPageEntity): Promise<WikiPageEntity> {
    return this.repo.save(entity);
  }

  async remove(entity: WikiPageEntity): Promise<void> {
    await this.repo.remove(entity);
  }
}
