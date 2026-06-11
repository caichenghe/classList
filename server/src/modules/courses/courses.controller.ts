import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { CoursesService, CreateCourseDto, UpdateCourseDto } from './courses.service';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async findAll() {
    const result = await this.coursesService.findAll();
    return { code: 200, msg: 'success', data: result.data };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.coursesService.findOne(id);
    return { code: 200, msg: 'success', data: result.data };
  }

  @Post()
  async create(@Body() dto: CreateCourseDto) {
    const result = await this.coursesService.create(dto);
    return { code: 200, msg: 'success', data: result.data };
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCourseDto) {
    const result = await this.coursesService.update(id, dto);
    return { code: 200, msg: 'success', data: result.data };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.coursesService.remove(id);
    return { code: 200, msg: 'success', data: result.data };
  }
}