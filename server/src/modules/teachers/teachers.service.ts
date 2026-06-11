import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

export interface Teacher {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTeacherDto {
  name: string;
  phone?: string;
  email?: string;
  bio?: string;
}

export interface UpdateTeacherDto {
  name?: string;
  phone?: string;
  email?: string;
  bio?: string;
}

@Injectable()
export class TeachersService {
  async findAll(): Promise<{ data: Teacher[] }> {
    const { data, error } = await client
      .from('teachers')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw new Error(`查询教师列表失败: ${error.message}`);
    return { data: (data as Teacher[]) || [] };
  }

  async findOne(id: number): Promise<{ data: Teacher | null }> {
    const { data, error } = await client
      .from('teachers')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`查询教师失败: ${error.message}`);
    return { data: data as Teacher | null };
  }

  async create(dto: CreateTeacherDto): Promise<{ data: Teacher }> {
    const { data, error } = await client
      .from('teachers')
      .insert({ name: dto.name, phone: dto.phone || null, email: dto.email || null, bio: dto.bio || null })
      .select()
      .single();
    if (error) throw new Error(`创建教师失败: ${error.message}`);
    return { data: data as Teacher };
  }

  async update(id: number, dto: UpdateTeacherDto): Promise<{ data: Teacher | null }> {
    const { data, error } = await client
      .from('teachers')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(`更新教师失败: ${error.message}`);
    return { data: data as Teacher | null };
  }

  async remove(id: number): Promise<{ data: Teacher | null }> {
    const { data, error } = await client
      .from('teachers')
      .delete()
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(`删除教师失败: ${error.message}`);
    return { data: data as Teacher | null };
  }
}