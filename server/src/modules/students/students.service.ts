import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

export interface Student {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  parent_name: string | null;
  level: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateStudentDto {
  name: string;
  phone?: string;
  email?: string;
  parent_name?: string;
  level?: string;
  notes?: string;
}

export interface UpdateStudentDto {
  name?: string;
  phone?: string;
  email?: string;
  parent_name?: string;
  level?: string;
  notes?: string;
}

@Injectable()
export class StudentsService {
  async findAll(): Promise<{ data: Student[] }> {
    const { data, error } = await client
      .from('students')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw new Error(`查询学生列表失败: ${error.message}`);
    return { data: (data as Student[]) || [] };
  }

  async findOne(id: number): Promise<{ data: Student | null }> {
    const { data, error } = await client
      .from('students')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`查询学生失败: ${error.message}`);
    return { data: data as Student | null };
  }

  async create(dto: CreateStudentDto): Promise<{ data: Student }> {
    const { data, error } = await client
      .from('students')
      .insert({
        name: dto.name,
        phone: dto.phone || null,
        email: dto.email || null,
        parent_name: dto.parent_name || null,
        level: dto.level || null,
        notes: dto.notes || null,
      })
      .select()
      .single();
    if (error) throw new Error(`创建学生失败: ${error.message}`);
    return { data: data as Student };
  }

  async update(id: number, dto: UpdateStudentDto): Promise<{ data: Student | null }> {
    const { data, error } = await client
      .from('students')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(`更新学生失败: ${error.message}`);
    return { data: data as Student | null };
  }

  async remove(id: number): Promise<{ data: Student | null }> {
    const { data, error } = await client
      .from('students')
      .delete()
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(`删除学生失败: ${error.message}`);
    return { data: data as Student | null };
  }
}