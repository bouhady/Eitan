import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from '../services/app.service';
import { DbService } from '../db/db.service';
import { parsePagination } from './pagination';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly db: DbService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('ping')
  async ping(): Promise<string> {
    await new Promise((r) => setTimeout(r, 2000)); // mock 2s delay
    return 'ok';
  }

  @Get('patients')
  getPatients(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const p = parsePagination(limit, offset);
    return this.db.getPatients(p.limit, p.offset);
  }

  @Get('heart-rate-readings')
  getHeartRateReadings(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const p = parsePagination(limit, offset);
    return this.db.getHeartRateReadings(p.limit, p.offset);
  }
}
