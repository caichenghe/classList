import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { SchedulesService } from '@/modules/schedules/schedules.service';

interface ScheduleRow {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  location: string | null;
  teacher?: { id: number; name: string };
  student?: { id: number; name: string };
  course?: { id: number; name: string; color: string };
}

@Injectable()
export class ExportService {
  private readonly FONT_PATH = '/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf';
  private readonly PAGE_BOTTOM_MARGIN = 60; // 底部留白

  constructor(private readonly schedulesService: SchedulesService) {}

  private registerFont(doc: typeof PDFDocument.prototype) {
    doc.registerFont('CJK', this.FONT_PATH);
  }

  /** 检查当前页剩余空间是否足够，不够则新建一页并重置 Y */
  private checkSpace(doc: typeof PDFDocument.prototype, needed: number) {
    if (doc.y + needed > doc.page.height - this.PAGE_BOTTOM_MARGIN) {
      doc.addPage();
      doc.font('CJK');
    }
  }

  async exportWeekPdf(startDate: string, endDate: string): Promise<Buffer> {
    const result = await this.schedulesService.findByWeek(startDate, endDate);
    const schedules = result.data;

    return new Promise((resolve, reject) => {
      const buffers: Buffer[] = [];
      const doc = new PDFDocument({ size: 'A4', margin: 30 });
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      this.registerFont(doc);
      doc.font('CJK');

      // 标题
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dateStr = `${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`;

      doc.fontSize(18).text('英语排课表', { align: 'center' });
      doc.fontSize(12).text(dateStr, { align: 'center' });
      doc.moveDown(1.5);

      // 按日期分组
      const grouped: Record<string, ScheduleRow[]> = {};
      for (const s of schedules) {
        if (!grouped[s.date]) grouped[s.date] = [];
        grouped[s.date].push(s);
      }

      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

      // 遍历每一天
      for (const [dateStrKey, items] of Object.entries(grouped)) {
        const d = new Date(dateStrKey);
        const dayLabel = `${d.getMonth() + 1}月${d.getDate()}日 ${dayNames[d.getDay()]}`;

        // 日期标题占 ~35pt，检查空间
        this.checkSpace(doc, 35);
        doc.fontSize(13).fillColor('#333').text(dayLabel, { underline: true });
        doc.moveDown(0.3);

        for (const s of items) {
          // 每条课程占 ~60pt（含备注、分割线），如果不够则换页
          this.checkSpace(doc, 60);

          const line = `${s.start_time}-${s.end_time}  ${s.teacher?.name || '未知'} · ${s.student?.name || '未知'} · ${s.course?.name || '未知'}`;
          doc.fontSize(10).fillColor('#555').text(line, { indent: 10 });

          if (s.location) {
            doc.fontSize(9).fillColor('#888').text(`  📍 ${s.location}`, { indent: 10 });
          }

          // 画分割线
          doc.moveTo(30, doc.y + 2).lineTo(565, doc.y + 2).strokeColor('#eee').stroke();
          doc.moveDown(0.3);
        }

        doc.moveDown(0.5);
      }

      doc.end();
    });
  }

  async exportMonthPdf(year: number, month: number): Promise<Buffer> {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const result = await this.schedulesService.findByWeek(startDate, endDate);
    const schedules = result.data;

    return new Promise((resolve, reject) => {
      const buffers: Buffer[] = [];
      const doc = new PDFDocument({ size: 'A4', margin: 20 });
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      this.registerFont(doc);
      doc.font('CJK');

      // 按日期分组
      const grouped: Record<string, ScheduleRow[]> = {};
      for (const s of schedules) {
        if (!grouped[s.date]) grouped[s.date] = [];
        grouped[s.date].push(s);
      }

      const monthLabel = `${year}年${month}月`;
      doc.fontSize(18).text('英语排课表', { align: 'center' });
      doc.fontSize(12).text(monthLabel, { align: 'center' });
      doc.moveDown(1);

      const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
      const pageWidth = doc.page.width - 40; // 20 margin each side
      const colW = pageWidth / 7;
      const rowH = 18;
      const cellH = 82;

      const startX = 20;
      let startY = doc.y;

      // 表头
      doc.fontSize(9).fillColor('#333');
      for (let i = 0; i < 7; i++) {
        doc.text(dayNames[i], startX + i * colW + (colW - 14) / 2, startY, { width: colW, align: 'center' });
      }
      startY += rowH + 4;

      const firstDayOfWeek = firstDay.getDay();

      let cellX = startX;
      let cellY = startY;
      let prevRow = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const col = (firstDayOfWeek + day - 1) % 7;
        const row = Math.floor((firstDayOfWeek + day - 1) / 7);

        cellX = startX + col * colW;
        cellY = startY + row * cellH;

        // 画格子边框
        doc.rect(cellX, cellY, colW, cellH).strokeColor('#ddd').stroke();

        // 日期数字
        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        doc.fontSize(8).fillColor('#666');
        doc.text(String(day), cellX + 2, cellY + 2, { width: 20, align: 'left' });

        // 课程内容
        const daySchedules = grouped[dateKey];
        if (daySchedules) {
          doc.fontSize(6.5).fillColor('#333');
          let textY = cellY + 14;
          for (const s of daySchedules) {
            const text = `${s.start_time} ${s.teacher?.name || ''}`;
            if (textY < cellY + cellH - 4) {
              doc.text(text, cellX + 2, textY, { width: colW - 4, align: 'left' });
              textY += 10;
            } else {
              // 超出格子显示 +N
              const remaining = daySchedules.length - daySchedules.indexOf(s);
              doc.fontSize(6).fillColor('#999').text(`+${remaining}`, cellX + 2, textY - 10, { width: colW - 4, align: 'left' });
              break;
            }
          }
        }

        // 行末检查是否需要换页
        if (col === 6 && day < daysInMonth) {
          const nextRow = Math.floor((firstDayOfWeek + day) / 7);
          if (nextRow > prevRow) {
            prevRow = nextRow;
            const totalH = startY + (nextRow + 1) * cellH + 20;
            if (totalH > doc.page.height - 40) {
              doc.addPage();
              doc.font('CJK');
              // 在新的页面上重绘表头
              startY = 50;
              doc.fontSize(9).fillColor('#333');
              for (let i = 0; i < 7; i++) {
                doc.text(dayNames[i], startX + i * colW + (colW - 14) / 2, startY, { width: colW, align: 'center' });
              }
              startY += rowH + 4;
            }
          }
        }
      }

      doc.end();
    });
  }
}