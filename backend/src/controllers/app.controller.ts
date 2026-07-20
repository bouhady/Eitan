import { Controller, Get } from '@nestjs/common';
import { AppService } from '../services/app.service';
import { DbService } from '../db/db.service';

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
  getPatients() {
    return this.db.getPatients();
  }

  @Get('heart-rate-readings')
  getHeartRateReadings() {
    return this.db.getHeartRateReadings();
  }
}
