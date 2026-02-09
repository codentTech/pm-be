import { Injectable } from '@nestjs/common';
import { OrganizationEntity } from 'src/core/database/entities/organization.entity';
import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';

@Injectable()
export class OrganizationRepository extends BaseRepository<OrganizationEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, OrganizationEntity);
  }

  private get repo() {
    return this.getRepository();
  }

  async findById(id: string): Promise<OrganizationEntity | null> {
    return this.repo.findOne({
      where: { Id: id },
      relations: ['Members', 'Members.User'],
    });
  }

  async findBySlug(slug: string): Promise<OrganizationEntity | null> {
    return this.repo.findOne({ where: { Slug: slug } });
  }

  async findByIds(ids: string[]): Promise<OrganizationEntity[]> {
    if (ids.length === 0) return [];
    return this.repo.find({
      where: ids.map((Id) => ({ Id })),
      relations: ['Members'],
    });
  }

  create(data: Partial<OrganizationEntity>): OrganizationEntity {
    return this.repo.create(data);
  }

  async save(entity: OrganizationEntity): Promise<OrganizationEntity> {
    return this.repo.save(entity);
  }

  async remove(entity: OrganizationEntity): Promise<void> {
    await this.repo.remove(entity);
  }
}
