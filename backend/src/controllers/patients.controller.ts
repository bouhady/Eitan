import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DbService } from '../db/db.service';
import { PATIENT_ANALYTICS_REQUESTED } from '../services/tracking.service';
import { HeartRateAnalytics, HighHeartRateEvent, PatientRequestTracking } from '../types/patient';

@Controller('api')
export class PatientsController {
  constructor(
    private readonly db: DbService,
    private readonly events: EventEmitter2,
  ) {}

  @Get('high-heart-rate-events')
  getHighHeartRateEvents(): Promise<HighHeartRateEvent[]> {
    return this.db.getHighHeartRateEvents();
  }

  @Get('patient/:id/analytics')
  async getAnalytics(
    @Param('id', ParseIntPipe) id: number,
    @Query('from') from: string,
    @Query('to') to: string,
  ): Promise<HeartRateAnalytics> {
    if (!from || !to || isNaN(Date.parse(from)) || isNaN(Date.parse(to))) {
      throw new BadRequestException('from and to must be valid ISO dates');
    }
    if (!(await this.db.patientExists(id))) {
      throw new NotFoundException(`patient ${id} not found`);
    }
    const stats = await this.db.getPatientAnalytics(id, from, to);
    this.events.emit(PATIENT_ANALYTICS_REQUESTED, { patientId: id }); // async fire-and-forget
    return { patientId: id, from, to, ...stats };
  }

  @Get('patient/:id/tracking')
  async getTracking(@Param('id', ParseIntPipe) id: number): Promise<PatientRequestTracking> {
    if (!(await this.db.patientExists(id))) {
      throw new NotFoundException(`patient ${id} not found`);
    }
    return this.db.getPatientTracking(id);
  }
}
