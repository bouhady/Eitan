import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from '../services/app.service';
import { DbService } from '../db/db.service';
import { paginate, parsePagination } from './pagination';

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
  async getPatients(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const p = parsePagination(limit, offset);
    // fetch limit+1 rows so the envelope can report hasMore
    const rows = await this.db.getPatients(p.limit + 1, p.offset);
    return paginate(rows, p.limit, p.offset);
  }

  @Get('heart-rate-readings')
  async getHeartRateReadings(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const p = parsePagination(limit, offset);
    const rows = await this.db.getHeartRateReadings(p.limit + 1, p.offset);
    return paginate(rows, p.limit, p.offset);
  }
}
