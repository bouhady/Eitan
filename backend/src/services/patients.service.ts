import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DbService } from '../db/db.service';
import { PATIENT_ANALYTICS_REQUESTED } from './tracking.service';
import { PaginationDto } from '../dto/pagination.dto';
import { HighHeartRateEventsQueryDto } from '../dto/high-heart-rate-events-query.dto';
import { PatientAnalyticsQueryDto } from '../dto/patient-analytics-query.dto';
import {
  Paginated,
  Patient,
  HeartRateReading,
  HeartRateAnalytics,
  HighHeartRateEvent,
  PatientRequestTracking,
} from '../types/patient';

export const MAX_ANALYTICS_RANGE_DAYS = 365;

/** Build the response envelope from limit+1 fetched rows. */
function paginate<T>(rows: T[], limit: number, offset: number): Paginated<T> {
  return { items: rows.slice(0, limit), limit, offset, hasMore: rows.length > limit };
}

/** Use-case layer: business validation + orchestration. DbService stays SQL-only. */
@Injectable()
export class PatientsService {
  constructor(
    private readonly db: DbService,
    private readonly events: EventEmitter2,
  ) {}

  async getPatients(q: PaginationDto): Promise<Paginated<Patient>> {
    const rows = await this.db.getPatients(q.limit + 1, q.offset);
    return paginate(rows, q.limit, q.offset);
  }

  async getHeartRateReadings(q: PaginationDto): Promise<Paginated<HeartRateReading>> {
    const rows = await this.db.getHeartRateReadings(q.limit + 1, q.offset);
    return paginate(rows, q.limit, q.offset);
  }

  async getHighHeartRateEvents(q: HighHeartRateEventsQueryDto): Promise<Paginated<HighHeartRateEvent>> {
    const rows = await this.db.getHighHeartRateEvents(q.threshold, q.limit + 1, q.offset);
    return paginate(rows, q.limit, q.offset);
  }

  async getAnalytics(id: number, q: PatientAnalyticsQueryDto): Promise<HeartRateAnalytics> {
    this.validateAnalyticsRange(q.from, q.to);
    await this.assertPatientExists(id);

    const stats = await this.db.getPatientAnalytics(id, q.from, q.to);
    this.events.emit(PATIENT_ANALYTICS_REQUESTED, { patientId: id }); // async fire-and-forget, can be replaced in the future with message queue service
    return { patientId: id, from: q.from, to: q.to, ...stats };
  }

  async getTracking(id: number): Promise<PatientRequestTracking> {
    await this.assertPatientExists(id);
    return this.db.getPatientTracking(id);
  }

  private async assertPatientExists(id: number): Promise<void> {
    if (!(await this.db.patientExists(id))) {
      throw new NotFoundException(`patient ${id} not found`);
    }
  }

  private validateAnalyticsRange(from: string, to: string): void {
    if (Date.parse(from) > Date.parse(to)) {
      throw new BadRequestException('from must be earlier than or equal to to');
    }
    // guardrail against unbounded scans on a large readings table
    if (Date.parse(to) - Date.parse(from) > MAX_ANALYTICS_RANGE_DAYS * 24 * 60 * 60 * 1000) {
      throw new BadRequestException(`date range must not exceed ${MAX_ANALYTICS_RANGE_DAYS} days`);
    }
  }
}
