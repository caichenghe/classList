import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

export interface Schedule {
  id: number;
  teacher_id: number;
  student_id: number;
  course_id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // 关联数据（通过嵌套查询获取）
  teacher?: { id: number; name: string };
  student?: { id: number; name: string };
  course?: { id: number; name: string; color: string };
}

export interface CreateScheduleDto {
  teacher_id: number;
  student_id: number;
  course_id: number;
  date: string;
  start_time: string;
  end_time: string;
  status?: string;
  notes?: string;
}

export interface UpdateScheduleDto {
  teacher_id?: number;
  student_id?: number;
  course_id?: number;
  date?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
  notes?: string;
}

@Injectable()
export class SchedulesService {
  async findAll(dateFrom?: string, dateTo?: string): Promise<{ data: Schedule[] }> {
    let query = client
      .from('schedules')
      .select('*, teacher:teachers(id, name), student:students(id, name), course:courses(id, name, color)')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('date', dateTo);
    }

    const { data, error } = await query;
    if (error) throw new Error(`查询排课列表失败: ${error.message}`);
    return { data: (data as unknown as Schedule[]) || [] };
  }

  async findOne(id: number): Promise<{ data: Schedule | null }> {
    const { data, error } = await client
      .from('schedules')
      .select('*, teacher:teachers(id, name), student:students(id, name), course:courses(id, name, color)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`查询排课失败: ${error.message}`);
    return { data: data as unknown as Schedule | null };
  }

  async findByDate(date: string): Promise<{ data: Schedule[] }> {
    const { data, error } = await client
      .from('schedules')
      .select('*, teacher:teachers(id, name), student:students(id, name), course:courses(id, name, color)')
      .eq('date', date)
      .order('start_time', { ascending: true });
    if (error) throw new Error(`按日期查询排课失败: ${error.message}`);
    return { data: (data as unknown as Schedule[]) || [] };
  }

  async findByWeek(startDate: string, endDate: string): Promise<{ data: Schedule[] }> {
    const { data, error } = await client
      .from('schedules')
      .select('*, teacher:teachers(id, name), student:students(id, name), course:courses(id, name, color)')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
    if (error) throw new Error(`按周查询排课失败: ${error.message}`);
    return { data: (data as unknown as Schedule[]) || [] };
  }

  async create(dto: CreateScheduleDto): Promise<{ data: Schedule }> {
    const { data, error } = await client
      .from('schedules')
      .insert({
        teacher_id: dto.teacher_id,
        student_id: dto.student_id,
        course_id: dto.course_id,
        date: dto.date,
        start_time: dto.start_time,
        end_time: dto.end_time,
        status: dto.status || 'scheduled',
        notes: dto.notes || null,
      })
      .select('*, teacher:teachers(id, name), student:students(id, name), course:courses(id, name, color)')
      .single();
    if (error) throw new Error(`创建排课失败: ${error.message}`);
    return { data: data as unknown as Schedule };
  }

  async update(id: number, dto: UpdateScheduleDto): Promise<{ data: Schedule | null }> {
    const { data, error } = await client
      .from('schedules')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, teacher:teachers(id, name), student:students(id, name), course:courses(id, name, color)')
      .maybeSingle();
    if (error) throw new Error(`更新排课失败: ${error.message}`);
    return { data: data as unknown as Schedule | null };
  }

  async remove(id: number): Promise<{ data: Schedule | null }> {
    const { data, error } = await client
      .from('schedules')
      .delete()
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(`删除排课失败: ${error.message}`);
    return { data: data as Schedule | null };
  }
}