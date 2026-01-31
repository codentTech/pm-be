import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { KpiRepository } from 'src/common/repositories/kpi.repository';
import { UserEntity } from 'src/core/database/entities/user.entity';
import { KpiEntity } from 'src/core/database/entities/kpi.entity';
import { CreateKpiDto, UpdateKpiDto } from './dto/kpi.dto';

@Injectable()
export class KpisService {
  constructor(private readonly kpiRepository: KpiRepository) {}

  async create(dto: CreateKpiDto, user: UserEntity): Promise<KpiEntity> {
    const kpi = this.kpiRepository.create({
      ...dto,
      CurrentValue: dto.CurrentValue ?? 0,
      DueDate: dto.DueDate ? new Date(dto.DueDate) : undefined,
      CreatedBy: user,
    });
    return this.kpiRepository.save(kpi);
  }

  async findAll(user: UserEntity): Promise<KpiEntity[]> {
    return this.kpiRepository.findAllByUserId(user.Id);
  }

  async findOne(id: string, user: UserEntity): Promise<KpiEntity> {
    const kpi = await this.kpiRepository.findOneByIdAndUserId(id, user.Id);
    if (!kpi) throw new NotFoundException('KPI not found');
    return kpi;
  }

  async update(id: string, dto: UpdateKpiDto, user: UserEntity): Promise<KpiEntity> {
    const kpi = await this.findOne(id, user);
    const { DueDate, ...rest } = dto;
    Object.assign(kpi, rest);
    if (DueDate !== undefined) kpi.DueDate = DueDate ? new Date(DueDate) : null;
    return this.kpiRepository.save(kpi);
  }

  async remove(id: string, user: UserEntity): Promise<void> {
    const kpi = await this.findOne(id, user);
    await this.kpiRepository.remove(kpi);
  }
}
