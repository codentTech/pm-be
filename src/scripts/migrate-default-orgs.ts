/**
 * Data migration: Create default organizations for existing users and assign
 * their orphaned boards/KPIs (OrganizationId = null) to those orgs.
 *
 * Run with: yarn run migration:default-orgs
 * Or: npx ts-node -r tsconfig-paths/register src/scripts/migrate-default-orgs.ts
 */
import { config } from 'dotenv';
import * as path from 'path';
import 'reflect-metadata';
import { DataSource } from 'typeorm';

config({ path: path.join(__dirname, '../../.env') });

import { BoardEntity } from '../core/database/entities/board.entity';
import { KpiEntity } from '../core/database/entities/kpi.entity';
import { OrganizationEntity } from '../core/database/entities/organization.entity';
import { OrgRole } from '../common/types/org-role.enum';
import { OrganizationMemberEntity } from '../core/database/entities/organization-member.entity';
import { UserEntity } from '../core/database/entities/user.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: true,
  entities: [
    UserEntity,
    OrganizationEntity,
    OrganizationMemberEntity,
    BoardEntity,
    KpiEntity,
  ],
});

async function run() {
  console.log('Starting default org migration...');
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(UserEntity);
  const orgRepo = AppDataSource.getRepository(OrganizationEntity);
  const memberRepo = AppDataSource.getRepository(OrganizationMemberEntity);
  const boardRepo = AppDataSource.getRepository(BoardEntity);
  const kpiRepo = AppDataSource.getRepository(KpiEntity);

  const users = await userRepo.find();
  console.log(`Found ${users.length} users`);

  let orgsCreated = 0;
  let boardsUpdated = 0;
  let kpisUpdated = 0;

  for (const user of users) {
    const memberships = await memberRepo.find({
      where: { UserId: user.Id },
      relations: ['Organization'],
    });
    let defaultOrg: OrganizationEntity | null = null;

    if (memberships.length > 0) {
      defaultOrg = await orgRepo.findOne({
        where: { Id: memberships[0].OrganizationId },
      });
    }

    if (!defaultOrg) {
      const slug = `personal-${user.Id.slice(0, 8)}`;
      const existingSlug = await orgRepo.findOne({ where: { Slug: slug } });
      const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug;

      defaultOrg = orgRepo.create({
        Name: `${user.FullName}'s Workspace`,
        Slug: finalSlug,
        CreatedBy: user,
      });
      defaultOrg = await orgRepo.save(defaultOrg);

      const member = memberRepo.create({
        OrganizationId: defaultOrg.Id,
        UserId: user.Id,
        Role: OrgRole.OWNER,
      });
      await memberRepo.save(member);
      orgsCreated++;
      console.log(`  Created default org for user ${user.Email}`);
    }

    const boardsResult = await boardRepo
      .createQueryBuilder()
      .update(BoardEntity)
      .set({ OrganizationId: defaultOrg!.Id })
      .where('"CreatedBy" = :userId', { userId: user.Id })
      .andWhere('"OrganizationId" IS NULL')
      .execute();
    if (boardsResult.affected && boardsResult.affected > 0) {
      boardsUpdated += boardsResult.affected;
    }

    const kpisResult = await kpiRepo
      .createQueryBuilder()
      .update(KpiEntity)
      .set({ OrganizationId: defaultOrg!.Id })
      .where('"CreatedBy" = :userId', { userId: user.Id })
      .andWhere('"OrganizationId" IS NULL')
      .execute();
    if (kpisResult.affected && kpisResult.affected > 0) {
      kpisUpdated += kpisResult.affected;
    }
  }

  console.log('\nMigration complete:');
  console.log(`  Organizations created: ${orgsCreated}`);
  console.log(`  Boards updated: ${boardsUpdated}`);
  console.log(`  KPIs updated: ${kpisUpdated}`);

  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
