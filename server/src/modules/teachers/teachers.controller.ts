import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { TeachersService, CreateTeacherDto, UpdateTeacherDto } from './teachers.service';

@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  async findAll() {
    const result = await this.teachersService.findAll();
    return { code: 200, msg: 'success', data: result.data };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.teachersService.findOne(id);
    return { code: 200, msg: 'success', data: result.data };
  }

  @Post()
  async create(@Body() dto: CreateTeacherDto) {
    const result = await this.teachersService.create(dto);
    return { code: 200, msg: 'success', data: result.data };
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTeacherDto) {
    const result = await this.teachersService.update(id, dto);
    return { code: 200, msg: 'success', data: result.data };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.teachersService.remove(id);
    return { code: 200, msg: 'success', data: result.data };
  }
}