import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { SchedulesService, CreateScheduleDto, UpdateScheduleDto } from './schedules.service';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  async findAll(@Query('date_from') dateFrom?: string, @Query('date_to') dateTo?: string) {
    const result = await this.schedulesService.findAll(dateFrom, dateTo);
    return { code: 200, msg: 'success', data: result.data };
  }

  @Get('by-date')
  async findByDate(@Query('date') date: string) {
    const result = await this.schedulesService.findByDate(date);
    return { code: 200, msg: 'success', data: result.data };
  }

  @Get('by-week')
  async findByWeek(@Query('start_date') startDate: string, @Query('end_date') endDate: string) {
    const result = await this.schedulesService.findByWeek(startDate, endDate);
    return { code: 200, msg: 'success', data: result.data };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.schedulesService.findOne(id);
    return { code: 200, msg: 'success', data: result.data };
  }

  @Post()
  async create(@Body() dto: CreateScheduleDto) {
    const result = await this.schedulesService.create(dto);
    return { code: 200, msg: 'success', data: result.data };
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateScheduleDto) {
    const result = await this.schedulesService.update(id, dto);
    return { code: 200, msg: 'success', data: result.data };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.schedulesService.remove(id);
    return { code: 200, msg: 'success', data: result.data };
  }
}