import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('week')
  async exportWeek(@Query('start_date') startDate: string, @Query('end_date') endDate: string, @Res() res: Response) {
    if (!startDate || !endDate) {
      res.status(HttpStatus.BAD_REQUEST).json({ code: 400, msg: '请提供 start_date 和 end_date 参数' });
      return;
    }

    const pdfBuffer = await this.exportService.exportWeekPdf(startDate, endDate);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="schedule_${startDate}_${endDate}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.status(HttpStatus.OK).send(pdfBuffer);
  }

  @Get('student')
  async exportStudent(
    @Query('student_id') studentIdStr: string,
    @Query('student_name') studentName: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Res() res: Response,
  ) {
    const studentId = parseInt(studentIdStr, 10);
    if (!studentId) {
      res.status(HttpStatus.BAD_REQUEST).json({ code: 400, msg: '请提供 student_id 参数' });
      return;
    }

    const pdfBuffer = await this.exportService.exportByStudentPdf(studentId, studentName || '未知', startDate, endDate);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="student_${studentId}_schedule.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.status(HttpStatus.OK).send(pdfBuffer);
  }

  @Get('month')
  async exportMonth(@Query('year') yearStr: string, @Query('month') monthStr: string, @Res() res: Response) {
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    if (!year || !month || month < 1 || month > 12) {
      res.status(HttpStatus.BAD_REQUEST).json({ code: 400, msg: '请提供有效的 year 和 month 参数' });
      return;
    }

    const pdfBuffer = await this.exportService.exportMonthPdf(year, month);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="schedule_${year}_${String(month).padStart(2, '0')}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.status(HttpStatus.OK).send(pdfBuffer);
  }
}