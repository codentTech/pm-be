import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';
import { NotificationEntity } from 'src/core/database/entities/notification.entity';

@Injectable()
export class NotificationRepository extends BaseRepository<NotificationEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, NotificationEntity);
  }

  private get repo() {
    return this.getRepository();
  }

  async findByUserId(userId: string, limit = 50): Promise<NotificationEntity[]> {
    return this.repo.find({
      where: { UserId: userId },
      relations: ['User'],
      order: { CreatedAt: 'DESC' },
      take: limit,
    });
  }

  async findByUserIdPaginated(
    userId: string,
    skip: number,
    take: number,
  ): Promise<[NotificationEntity[], number]> {
    const [items, total] = await this.repo.findAndCount({
      where: { UserId: userId },
      relations: ['User'],
      order: { CreatedAt: 'DESC' },
      skip,
      take,
    });
    return [items, total];
  }

  async findOneById(id: string, userId: string): Promise<NotificationEntity | null> {
    return this.repo.findOne({
      where: { Id: id, UserId: userId },
      relations: ['User'],
    });
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    return this.repo.count({ where: { UserId: userId, IsRead: false } });
  }

  create(data: Partial<NotificationEntity>): NotificationEntity {
    return this.repo.create(data);
  }

  async save(entity: NotificationEntity): Promise<NotificationEntity> {
    return this.repo.save(entity);
  }

  async remove(entity: NotificationEntity): Promise<void> {
    await this.repo.remove(entity);
  }
}
