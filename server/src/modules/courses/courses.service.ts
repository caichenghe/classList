import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

export interface Course {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCourseDto {
  name: string;
  description?: string;
  duration_minutes?: number;
  color?: string;
}

export interface UpdateCourseDto {
  name?: string;
  description?: string;
  duration_minutes?: number;
  color?: string;
}

@Injectable()
export class CoursesService {
  async findAll(): Promise<{ data: Course[] }> {
    const { data, error } = await client
      .from('courses')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw new Error(`查询课程列表失败: ${error.message}`);
    return { data: (data as Course[]) || [] };
  }

  async findOne(id: number): Promise<{ data: Course | null }> {
    const { data, error } = await client
      .from('courses')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`查询课程失败: ${error.message}`);
    return { data: data as Course | null };
  }

  async create(dto: CreateCourseDto): Promise<{ data: Course }> {
    const { data, error } = await client
      .from('courses')
      .insert({
        name: dto.name,
        description: dto.description || null,
        duration_minutes: dto.duration_minutes || 60,
        color: dto.color || '#8B5CF6',
      })
      .select()
      .single();
    if (error) throw new Error(`创建课程失败: ${error.message}`);
    return { data: data as Course };
  }

  async update(id: number, dto: UpdateCourseDto): Promise<{ data: Course | null }> {
    const { data, error } = await client
      .from('courses')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(`更新课程失败: ${error.message}`);
    return { data: data as Course | null };
  }

  async remove(id: number): Promise<{ data: Course | null }> {
    const { data, error } = await client
      .from('courses')
      .delete()
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(`删除课程失败: ${error.message}`);
    return { data: data as Course | null };
  }
}