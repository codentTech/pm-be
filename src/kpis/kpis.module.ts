import { Module } from '@nestjs/common';
import { KpiRepository } from 'src/common/repositories/kpi.repository';
import { KpisController } from './kpis.controller';
import { KpisService } from './kpis.service';

@Module({
  controllers: [KpisController],
  providers: [KpisService, KpiRepository],
  exports: [KpiRepository],
})
export class KpisModule {}
