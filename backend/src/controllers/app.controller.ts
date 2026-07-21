import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from '../services/app.service';
import { PatientsService } from '../services/patients.service';
import { PaginationDto } from '../dto/pagination.dto';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly patients: PatientsService,
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
  getPatients(@Query() query: PaginationDto) {
    return this.patients.getPatients(query);
  }

  @Get('heart-rate-readings')
  getHeartRateReadings(@Query() query: PaginationDto) {
    return this.patients.getHeartRateReadings(query);
  }
}
