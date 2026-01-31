import { DataSource, EntityTarget, QueryRunner, Repository } from 'typeorm';

export class BaseRepository<T> {
  private repository: Repository<T>;

  constructor(private dataSource: DataSource, entity: EntityTarget<T>) {
    this.repository = this.dataSource.getRepository(entity);
  }

  protected getRepository(request?: any): Repository<T> {
    const queryRunner: QueryRunner | undefined = request?.queryRunner;
    return queryRunner
      ? queryRunner.manager.getRepository(this.repository.target)
      : this.repository;
  }
}
