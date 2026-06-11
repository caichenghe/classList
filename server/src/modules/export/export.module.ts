import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { SchedulesModule } from '@/modules/schedules/schedules.module';

@Module({
  imports: [SchedulesModule],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}