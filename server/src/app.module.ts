import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { TeachersModule } from '@/modules/teachers/teachers.module';
import { StudentsModule } from '@/modules/students/students.module';
import { CoursesModule } from '@/modules/courses/courses.module';
import { SchedulesModule } from '@/modules/schedules/schedules.module';

import { ExportModule } from '@/modules/export/export.module';

@Module({
  imports: [TeachersModule, StudentsModule, CoursesModule, SchedulesModule, ExportModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
