import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { DbService } from '../db/db.service';
import { PatientsService } from './patients.service';
import { PATIENT_ANALYTICS_REQUESTED } from './tracking.service';

describe('PatientsService', () => {
  let service: PatientsService;
  const db = {
    getPatients: jest.fn().mockResolvedValue([]),
    getHeartRateReadings: jest.fn().mockResolvedValue([]),
    getHighHeartRateEvents: jest.fn().mockResolvedValue([]),
    patientExists: jest.fn(),
    getPatientAnalytics: jest.fn(),
    getPatientTracking: jest.fn(),
  };
  const events = { emit: jest.fn() };

  const FROM = '2024-03-01T00:00:00Z';
  const TO = '2024-03-03T00:00:00Z';

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: DbService, useValue: db },
        { provide: EventEmitter2, useValue: events },
      ],
    }).compile();
    service = module.get(PatientsService);
  });

  describe('pagination envelope', () => {
    it('fetches limit+1 and reports no more rows', async () => {
      const res = await service.getPatients({ limit: 25, offset: 0 });
      expect(db.getPatients).toHaveBeenCalledWith(26, 0);
      expect(res).toEqual({ items: [], limit: 25, offset: 0, hasMore: false });
    });

    it('sets hasMore and trims the extra row when more rows exist', async () => {
      db.getPatients.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
      const res = await service.getPatients({ limit: 2, offset: 0 });
      expect(res.items).toHaveLength(2);
      expect(res.hasMore).toBe(true);
    });

    it('passes threshold and pagination through for high heart rate events', async () => {
      await service.getHighHeartRateEvents({ threshold: 110, limit: 10, offset: 5 });
      expect(db.getHighHeartRateEvents).toHaveBeenCalledWith(110, 11, 5);
    });
  });

  describe('getAnalytics', () => {
    it.each([
      ['from after to', TO, FROM],
      ['range longer than 365 days', '2023-01-01T00:00:00Z', '2024-06-01T00:00:00Z'],
    ])('rejects %s with 400 and does not emit', async (_name, from, to) => {
      await expect(service.getAnalytics(1, { from, to })).rejects.toBeInstanceOf(BadRequestException);
      expect(events.emit).not.toHaveBeenCalled();
    });

    it('rejects unknown patient with 404 and does not emit', async () => {
      db.patientExists.mockResolvedValue(false);
      await expect(service.getAnalytics(999, { from: FROM, to: TO })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(events.emit).not.toHaveBeenCalled();
    });

    it('returns merged stats and emits the tracking event once', async () => {
      db.patientExists.mockResolvedValue(true);
      db.getPatientAnalytics.mockResolvedValue({ count: 3, avg: 94.3, min: 85, max: 101 });

      const res = await service.getAnalytics(1, { from: FROM, to: TO });

      expect(res).toEqual({ patientId: 1, from: FROM, to: TO, count: 3, avg: 94.3, min: 85, max: 101 });
      expect(db.getPatientAnalytics).toHaveBeenCalledWith(1, FROM, TO);
      expect(events.emit).toHaveBeenCalledTimes(1);
      expect(events.emit).toHaveBeenCalledWith(PATIENT_ANALYTICS_REQUESTED, { patientId: 1 });
    });
  });

  describe('getTracking', () => {
    it('rejects unknown patient with 404', async () => {
      db.patientExists.mockResolvedValue(false);
      await expect(service.getTracking(999)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the tracking row', async () => {
      const row = { patientId: 1, requestCount: 2, lastRequestedAt: '2026-07-20T15:00:00Z' };
      db.patientExists.mockResolvedValue(true);
      db.getPatientTracking.mockResolvedValue(row);
      await expect(service.getTracking(1)).resolves.toEqual(row);
    });
  });
});
