import { Injectable } from '@nestjs/common';
import { InvitationEntity } from 'src/core/database/entities/invitation.entity';
import { DataSource, IsNull } from 'typeorm';
import { BaseRepository } from './base.repository';

@Injectable()
export class InvitationRepository extends BaseRepository<InvitationEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, InvitationEntity);
  }

  private get repo() {
    return this.getRepository();
  }

  async findByToken(token: string): Promise<InvitationEntity | null> {
    return this.repo.findOne({
      where: { Token: token },
      relations: ['Organization', 'CreatedBy'],
    });
  }

  async findByEmailAndOrg(email: string, orgId: string): Promise<InvitationEntity | null> {
    return this.repo.findOne({
      where: { Email: email, OrganizationId: orgId, AcceptedAt: IsNull() },
    });
  }

  async findPendingByOrg(orgId: string): Promise<InvitationEntity[]> {
    return this.repo.find({
      where: { OrganizationId: orgId, AcceptedAt: IsNull() },
      relations: ['CreatedBy'],
      order: { CreatedAt: 'DESC' },
    });
  }

  async findPendingByEmail(email: string): Promise<InvitationEntity[]> {
    return this.repo.find({
      where: { Email: email, AcceptedAt: IsNull() },
      relations: ['Organization', 'CreatedBy'],
      order: { CreatedAt: 'DESC' },
    });
  }

  create(data: Partial<InvitationEntity>): InvitationEntity {
    return this.repo.create(data);
  }

  async save(entity: InvitationEntity): Promise<InvitationEntity> {
    return this.repo.save(entity);
  }

  async remove(entity: InvitationEntity): Promise<void> {
    await this.repo.remove(entity);
  }
}
