import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LabelRepository } from 'src/common/repositories/label.repository';
import { OrganizationMemberRepository } from 'src/common/repositories/organization-member.repository';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { LabelEntity } from 'src/core/database/entities/label.entity';
import { CreateLabelDto, UpdateLabelDto } from './dto/label.dto';

@Injectable()
export class LabelsService {
  constructor(
    private readonly labelRepository: LabelRepository,
    private readonly orgMemberRepository: OrganizationMemberRepository,
  ) {}

  private async ensureOrgAccess(orgId: string, userId: string): Promise<void> {
    const isMember = await this.orgMemberRepository.isMember(userId, orgId);
    if (!isMember) throw new ForbiddenException('You do not have access to this organization');
  }

  async findAll(orgId: string, user: UserEntity): Promise<LabelEntity[]> {
    await this.ensureOrgAccess(orgId, user.Id);
    return this.labelRepository.findByOrgId(orgId);
  }

  async create(orgId: string, dto: CreateLabelDto, user: UserEntity): Promise<LabelEntity> {
    await this.ensureOrgAccess(orgId, user.Id);
    const label = this.labelRepository.create({
      OrganizationId: orgId,
      Name: dto.Name,
      Color: dto.Color ?? '#6b7280',
      CreatedBy: user,
    });
    return this.labelRepository.save(label);
  }

  async update(id: string, dto: UpdateLabelDto, user: UserEntity): Promise<LabelEntity> {
    const label = await this.labelRepository.findOneById(id);
    if (!label) throw new NotFoundException('Label not found');
    await this.ensureOrgAccess(label.OrganizationId, user.Id);
    Object.assign(label, dto);
    return this.labelRepository.save(label);
  }

  async remove(id: string, user: UserEntity): Promise<void> {
    const label = await this.labelRepository.findOneById(id);
    if (!label) throw new NotFoundException('Label not found');
    await this.ensureOrgAccess(label.OrganizationId, user.Id);
    await this.labelRepository.remove(label);
  }
}
