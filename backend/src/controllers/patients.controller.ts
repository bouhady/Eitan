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
import { DbService, HIGH_HEART_RATE_THRESHOLD } from '../db/db.service';
import { PATIENT_ANALYTICS_REQUESTED } from '../services/tracking.service';
import { HeartRateAnalytics, HighHeartRateEvent, PatientRequestTracking } from '../types/patient';
import { Paginated, paginate, parsePagination } from './pagination';
import { assertIsoDate } from './validation';

export const MAX_ANALYTICS_RANGE_DAYS = 365;

@Controller('api')
export class PatientsController {
  constructor(
    private readonly db: DbService,
    private readonly events: EventEmitter2,
  ) {}

  @Get('high-heart-rate-events')
  async getHighHeartRateEvents(
    @Query('threshold') threshold?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<Paginated<HighHeartRateEvent>> {
    const t = threshold === undefined ? HIGH_HEART_RATE_THRESHOLD : Number(threshold);
    if (!Number.isFinite(t) || t < 0) {
      throw new BadRequestException('threshold must be a non-negative number');
    }
    const p = parsePagination(limit, offset);
    const rows = await this.db.getHighHeartRateEvents(t, p.limit + 1, p.offset);
    return paginate(rows, p.limit, p.offset);
  }

  @Get('patient/:id/analytics')
  async getAnalytics(
    @Param('id', ParseIntPipe) id: number,
    @Query('from') from: string,
    @Query('to') to: string,
  ): Promise<HeartRateAnalytics> {
    assertIsoDate(from, 'from');
    assertIsoDate(to, 'to');
    if (Date.parse(from) > Date.parse(to)) {
      throw new BadRequestException('from must be earlier than or equal to to');
    }
    // guardrail against unbounded scans on a large readings table
    if (Date.parse(to) - Date.parse(from) > MAX_ANALYTICS_RANGE_DAYS * 24 * 60 * 60 * 1000) {
      throw new BadRequestException(`date range must not exceed ${MAX_ANALYTICS_RANGE_DAYS} days`);
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
