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

const FONT_PATH = '/usr/share/fonts/opentype/unifont/unifont.otf';
const PAGE_BOTTOM_MARGIN = 60;

/** 使用 CJK 字体渲染中文文本 */
function txt(doc: PDFKit.PDFDocument, text: string, options?: object) {
  return doc.font('CJK').text(text, options);
}

@Injectable()
export class ExportService {
  constructor(private readonly schedulesService: SchedulesService) {}

  async exportWeekPdf(startDate: string, endDate: string): Promise<Buffer> {
    const result = await this.schedulesService.findByWeek(startDate, endDate);
    const schedules = result.data;

    return new Promise((resolve, reject) => {
      const buffers: Buffer[] = [];
      const doc = new PDFDocument({ size: 'A4', margin: 30 });
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      doc.registerFont('CJK', FONT_PATH);

      // 标题
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dateStr = `${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`;

      doc.font('CJK').fontSize(18).text('英语排课表', { align: 'center' });
      doc.font('CJK').fontSize(12).text(dateStr, { align: 'center' });
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
        if (doc.y + 35 > doc.page.height - PAGE_BOTTOM_MARGIN) {
          doc.addPage();
        }
        txt(doc, dayLabel).font('CJK').fontSize(11).fillColor('#333');
        // 在文本下方画下划线
        doc.moveDown(0.3);

        for (const s of items) {
          // 每条课程占 ~90pt，如果不够则换页
          if (doc.y + 90 > doc.page.height - PAGE_BOTTOM_MARGIN) {
            doc.addPage();
          }

          // 课程名
          txt(doc, s.course?.name || '课程').font('CJK').fontSize(11).fillColor('#333');

          // 时间
          txt(doc, `时间：${s.start_time}-${s.end_time}`).font('CJK').fontSize(9).fillColor('#555');

          // 老师
          txt(doc, `老师：${s.teacher?.name || '未知'}`).font('CJK').fontSize(9).fillColor('#555');

          // 学生
          txt(doc, `学生：${s.student?.name || '未知'}`).font('CJK').fontSize(9).fillColor('#555');

          // 地址
          txt(doc, `地址：${s.location || '未填写'}`).font('CJK').fontSize(9).fillColor('#555');

          // 分割线
          doc.moveTo(30, doc.y + 4).lineTo(565, doc.y + 4).strokeColor('#eee').stroke();
          doc.moveDown(0.5);
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
      doc.registerFont('CJK', FONT_PATH);

      // 按日期分组
      const grouped: Record<string, ScheduleRow[]> = {};
      for (const s of schedules) {
        if (!grouped[s.date]) grouped[s.date] = [];
        grouped[s.date].push(s);
      }

      const monthLabel = `${year}年${month}月`;
      doc.font('CJK').fontSize(18).text('英语排课表', { align: 'center' });
      doc.font('CJK').fontSize(12).text(monthLabel, { align: 'center' });
      doc.moveDown(1);

      const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
      const pageWidth = doc.page.width - 40;
      const colW = pageWidth / 7;
      const rowH = 18;
      const cellH = 120;

      const startX = 20;
      let startY = doc.y;

      // 表头
      doc.font('CJK').fontSize(9).fillColor('#333');
      for (let i = 0; i < 7; i++) {
        doc.text(dayNames[i], startX + i * colW + (colW - 14) / 2, startY, { width: colW, align: 'center' });
      }
      startY += rowH + 4;

      const firstDayOfWeek = firstDay.getDay();

      for (let day = 1; day <= daysInMonth; day++) {
        const col = (firstDayOfWeek + day - 1) % 7;
        const row = Math.floor((firstDayOfWeek + day - 1) / 7);

        const cellX = startX + col * colW;
        const cellY = startY + row * cellH;

        // 画格子边框
        doc.rect(cellX, cellY, colW, cellH).strokeColor('#ddd').stroke();

        // 日期数字
        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        doc.font('CJK').fontSize(8).fillColor('#666');
        doc.text(String(day), cellX + 2, cellY + 2, { width: 20, align: 'left' });

        // 课程内容
        const daySchedules = grouped[dateKey];
        if (daySchedules) {
          doc.font('CJK').fontSize(6).fillColor('#333');
          let textY = cellY + 14;
          for (const s of daySchedules) {
            if (textY >= cellY + cellH - 4) {
              const remaining = daySchedules.length - daySchedules.indexOf(s);
              doc.font('CJK').fontSize(6).fillColor('#999').text(`+${remaining}`, cellX + 2, textY - 10, { width: colW - 4, align: 'left' });
              break;
            }
            // 课程名 + 时间
            doc.font('CJK').text(`${s.course?.name || ''} ${s.start_time}`, cellX + 2, textY, { width: colW - 4, align: 'left' });
            textY += 9;
            // 学生
            doc.font('CJK').text(`学生:${s.student?.name || ''}`, cellX + 2, textY, { width: colW - 4, align: 'left' });
            textY += 9;
            // 老师
            doc.font('CJK').text(`老师:${s.teacher?.name || ''}`, cellX + 2, textY, { width: colW - 4, align: 'left' });
            textY += 9;
            // 地址
            if (s.location) {
              doc.font('CJK').text(`地址:${s.location}`, cellX + 2, textY, { width: colW - 4, align: 'left' });
              textY += 9;
            }
          }
        }

        // 行末检查是否需要换页
        if (col === 6 && day < daysInMonth) {
          const nextRow = Math.floor((firstDayOfWeek + day) / 7);
          if (nextRow > row) {
            const totalH = startY + (nextRow + 1) * cellH + 20;
            if (totalH > doc.page.height - 40) {
              doc.addPage();
              doc.font('CJK');
              // 在新页面重绘表头
              startY = 50;
              doc.font('CJK').fontSize(9).fillColor('#333');
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

  async exportByStudentPdf(
    studentId: number,
    studentName: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Buffer> {
    const { data: schedules } = await this.schedulesService.findByStudent(studentId, startDate, endDate);

    return new Promise((resolve, reject) => {
      const buffers: Buffer[] = [];
      const doc = new PDFDocument({ size: 'A4', margin: 20 });
      doc.registerFont('CJK', FONT_PATH);
      doc.font('CJK');

      doc.on('data', (b: Buffer) => buffers.push(b));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // 标题
      doc.font('CJK').fontSize(18).text(`学生排课表 - ${studentName}`, { align: 'center' });
      doc.font('CJK').fontSize(10).fillColor('#666').text(
        startDate && endDate ? `${startDate} ~ ${endDate}` : '全部排课',
        { align: 'center' }
      );
      doc.moveDown(1.5);

      // 分割线
      doc.moveTo(20, doc.y).lineTo(575, doc.y).strokeColor('#ddd').stroke();
      doc.moveDown(0.5);

      // 按日期分组
      const grouped: Record<string, any[]> = {};
      for (const s of schedules) {
        if (!grouped[s.date]) grouped[s.date] = [];
        grouped[s.date].push(s);
      }

      const dates = Object.keys(grouped).sort();
      if (dates.length === 0) {
        doc.font('CJK').fontSize(12).fillColor('#999').text('该学生暂无排课记录', { align: 'center' });
        doc.end();
        return;
      }

      for (const date of dates) {
        // 检查分页
        if (doc.y > 700) {
          doc.addPage();
          doc.font('CJK');
        }

        const items = grouped[date];

        // 日期标题
        const d = new Date(date);
        const weekDay = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
        doc.font('CJK').fontSize(13).fillColor('#4F46E5')
          .text(`${date.replace('2026-', '').replace('-', '月')}日 周${weekDay}`, { indent: 5 });
        doc.moveDown(0.3);

        for (const s of items) {
          // 检查分页
          if (doc.y > 730) {
            doc.addPage();
            doc.font('CJK');
          }

          const y = doc.y;
          // 卡片背景
          doc.roundedRect(30, y - 2, 530, 52, 4).fillColor('#f8f8ff').fill();
          doc.fillColor('#333');
          doc.moveDown(0.3);

          // 课程名 + 时间
          doc.font('CJK').fontSize(11).fillColor('#333');
          const courseName = s.course?.name || '未知课程';
          const timeStr = `${s.start_time} - ${s.end_time}`;
          doc.text(`${courseName}  ${timeStr}`, { indent: 40 });

          // 老师 + 地址
          doc.font('CJK').fontSize(9).fillColor('#555');
          const teacherName = s.teacher?.name || '未知';
          const loc = s.location || '未填写';
          doc.text(`老师：${teacherName}  |  地址：${loc}`, { indent: 40 });

          doc.moveDown(0.5);
        }

        doc.moveDown(0.3);
      }

      doc.end();
    });
  }
}