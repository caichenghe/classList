import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { StudentsService, CreateStudentDto, UpdateStudentDto } from './students.service';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  async findAll() {
    const result = await this.studentsService.findAll();
    return { code: 200, msg: 'success', data: result.data };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.studentsService.findOne(id);
    return { code: 200, msg: 'success', data: result.data };
  }

  @Post()
  async create(@Body() dto: CreateStudentDto) {
    const result = await this.studentsService.create(dto);
    return { code: 200, msg: 'success', data: result.data };
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStudentDto) {
    const result = await this.studentsService.update(id, dto);
    return { code: 200, msg: 'success', data: result.data };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.studentsService.remove(id);
    return { code: 200, msg: 'success', data: result.data };
  }
}