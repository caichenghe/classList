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
  constructor(private readonly schedulesService: SchedulesService) {}

  async exportWeekPdf(startDate: string, endDate: string): Promise<Buffer> {
    const result = await this.schedulesService.findByWeek(startDate, endDate);
    const schedules = result.data;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 30 });
      const buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      doc.registerFont('CJK', '/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf');
      doc.font('CJK');
      doc.registerFont('CJK', '/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf');
      doc.font('CJK');

    // 解析日期范围
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateStr = `${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`;

    // 标题
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
    let cursor = doc.y;
    for (const [dateStrKey, items] of Object.entries(grouped)) {
      const d = new Date(dateStrKey);
      const dayLabel = `${d.getMonth() + 1}月${d.getDate()}日 ${dayNames[d.getDay()]}`;

      // 检查是否需要新页
      if (cursor > 600) {
        doc.addPage();
        cursor = doc.y;
      }

      // 日期标题
      doc.fontSize(13).font('CJK').fillColor('#333').text(dayLabel, { underline: true });
      cursor = doc.y + 4;

      for (const s of items) {
        const line = `${s.start_time}-${s.end_time}  ${s.teacher?.name || '未知'} · ${s.student?.name || '未知'} · ${s.course?.name || '未知'}`;
        doc.fontSize(10).font('CJK').fillColor('#555');
        doc.text(line, { indent: 10 });
        cursor = doc.y + 2;

        if (s.location) {
          doc.fontSize(9).fillColor('#888').text(`   📍 ${s.location}`, { indent: 10 });
          cursor = doc.y + 2;
        }

        // 画分割线
        doc.moveTo(30, doc.y + 2).lineTo(565, doc.y + 2).strokeColor('#eee').stroke();
        cursor = doc.y + 6;
      }

      doc.moveDown(0.5);
      cursor = doc.y;
    }

    doc.end();
    });
  }

  async exportMonthPdf(year: number, month: number): Promise<Buffer> {
    // 计算该月的第一天和最后一天
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
      doc.registerFont('CJK', '/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf');
      doc.font('CJK');

    // 按日期分组
    const grouped: Record<string, ScheduleRow[]> = {};
    for (const s of schedules) {
      if (!grouped[s.date]) grouped[s.date] = [];
      grouped[s.date].push(s);
    }

    const monthLabel = `${year}年${month}月`;
    doc.fontSize(18).font('CJK').text('英语排课表', { align: 'center' });
    doc.fontSize(12).font('CJK').text(monthLabel, { align: 'center' });
    doc.moveDown(1);

    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    const colW = 79; // 7 columns in A4 with 20 margins = (575-40)/7 ≈ 76
    const rowH = 18;

    // 绘制日历表头
    const startX = 20;
    let startY = doc.y;

    // 表头
    doc.fontSize(9).font('CJK').fillColor('#333');
    for (let i = 0; i < 7; i++) {
      doc.text(dayNames[i], startX + i * colW + (colW - 14) / 2, startY, { width: colW, align: 'center' });
    }
    startY += rowH + 4;

    // 获取当月第一天是星期几
    const firstDayOfWeek = firstDay.getDay();

    // 日历网格：最多 6 行 * 7 列
    let cellX = startX;
    let cellY = startY;
    const cellH = 80; // 每个日期格子高度

    for (let day = 1; day <= daysInMonth; day++) {
      const weekDay = (firstDayOfWeek + day - 1) % 7;
      const col = (firstDayOfWeek + day - 1) % 7;
      const row = Math.floor((firstDayOfWeek + day - 1) / 7);

      cellX = startX + col * colW;
      cellY = startY + row * cellH;

      // 画格子边框
      doc.rect(cellX, cellY, colW, cellH).strokeColor('#ddd').stroke();

      // 日期数字
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      doc.fontSize(8).font('CJK').fillColor('#666');
      doc.text(String(day), cellX + 2, cellY + 2, { width: 20, align: 'left' });

      // 课程内容
      const daySchedules = grouped[dateKey];
      if (daySchedules) {
        doc.fontSize(6.5).font('CJK').fillColor('#333');
        let textY = cellY + 14;
        for (const s of daySchedules.slice(0, 3)) {
          const text = `${s.start_time} ${s.teacher?.name || ''}`;
          if (textY < cellY + cellH - 4) {
            doc.text(text, cellX + 2, textY, { width: colW - 4, align: 'left' });
            textY += 10;
          }
        }
        if (daySchedules.length > 3) {
          doc.fontSize(6).fillColor('#999').text(`+${daySchedules.length - 3}`, cellX + 2, textY, { width: colW - 4, align: 'left' });
        }
      }

      // 每行结束后换页
      if (col === 6 && day < daysInMonth) {
        const nextRow = Math.floor((firstDayOfWeek + day) / 7);
        if (nextRow > row) {
          const totalH = startY + (nextRow) * cellH + 20;
          if (totalH > 750) {
            doc.addPage();
            startY = 50;
          }
        }
      }
    }

    doc.end();
    });
  }
}