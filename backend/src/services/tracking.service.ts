import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DbService } from '../db/db.service';

export const PATIENT_ANALYTICS_REQUESTED = 'patient.analytics.requested';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(private readonly db: DbService) {}

  @OnEvent(PATIENT_ANALYTICS_REQUESTED, { async: true })
  async onAnalyticsRequested({ patientId }: { patientId: number }) {
    try {
      await this.db.trackPatientRequest(patientId);
    } catch (err) {
      // tracking must never break the request path
      this.logger.error(`failed to track request for patient ${patientId}`, err);
    }
  }
}
