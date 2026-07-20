import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { DbService } from '../db/db.service';
import { PATIENT_ANALYTICS_REQUESTED } from '../services/tracking.service';
import { PatientsController } from './patients.controller';

describe('PatientsController', () => {
  let controller: PatientsController;
  const db = {
    patientExists: jest.fn(),
    getPatientAnalytics: jest.fn(),
    getHighHeartRateEvents: jest.fn(),
    getPatientTracking: jest.fn(),
  };
  const events = { emit: jest.fn() };

  const FROM = '2024-03-01T00:00:00Z';
  const TO = '2024-03-03T00:00:00Z';

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientsController],
      providers: [
        { provide: DbService, useValue: db },
        { provide: EventEmitter2, useValue: events },
      ],
    }).compile();
    controller = module.get(PatientsController);
  });

  describe('getAnalytics', () => {
    it.each([
      ['missing from', '', TO],
      ['missing to', FROM, ''],
      ['invalid from', 'not-a-date', TO],
      ['invalid to', FROM, 'not-a-date'],
      ['non-ISO from (US format)', '03/01/2024', TO],
      ['non-ISO from (verbose)', 'March 1, 2024', TO],
      ['from after to', TO, FROM],
      ['range longer than 365 days', '2023-01-01T00:00:00Z', '2024-06-01T00:00:00Z'],
    ])('rejects %s with 400 and does not emit', async (_name, from, to) => {
      await expect(controller.getAnalytics(1, from, to)).rejects.toBeInstanceOf(BadRequestException);
      expect(events.emit).not.toHaveBeenCalled();
    });

    it('rejects unknown patient with 404 and does not emit', async () => {
      db.patientExists.mockResolvedValue(false);
      await expect(controller.getAnalytics(999, FROM, TO)).rejects.toBeInstanceOf(NotFoundException);
      expect(events.emit).not.toHaveBeenCalled();
    });

    it('returns merged stats and emits the tracking event once', async () => {
      db.patientExists.mockResolvedValue(true);
      db.getPatientAnalytics.mockResolvedValue({ count: 3, avg: 94.3, min: 85, max: 101 });

      const res = await controller.getAnalytics(1, FROM, TO);

      expect(res).toEqual({ patientId: 1, from: FROM, to: TO, count: 3, avg: 94.3, min: 85, max: 101 });
      expect(db.getPatientAnalytics).toHaveBeenCalledWith(1, FROM, TO);
      expect(events.emit).toHaveBeenCalledTimes(1);
      expect(events.emit).toHaveBeenCalledWith(PATIENT_ANALYTICS_REQUESTED, { patientId: 1 });
    });
  });

  describe('getTracking', () => {
    it('rejects unknown patient with 404', async () => {
      db.patientExists.mockResolvedValue(false);
      await expect(controller.getTracking(999)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the tracking row', async () => {
      const row = { patientId: 1, requestCount: 2, lastRequestedAt: '2026-07-20T15:00:00Z' };
      db.patientExists.mockResolvedValue(true);
      db.getPatientTracking.mockResolvedValue(row);
      await expect(controller.getTracking(1)).resolves.toEqual(row);
    });
  });

  describe('getHighHeartRateEvents', () => {
    const rows = [{ patientId: 1, timestamp: 't', heartRate: 101 }];

    it('uses default threshold 100 and returns the pagination envelope', async () => {
      db.getHighHeartRateEvents.mockResolvedValue(rows);
      await expect(controller.getHighHeartRateEvents()).resolves.toEqual({
        items: rows,
        limit: 25,
        offset: 0,
        hasMore: false,
      });
      expect(db.getHighHeartRateEvents).toHaveBeenCalledWith(100, 26, 0);
    });

    it('passes a custom threshold and pagination through', async () => {
      db.getHighHeartRateEvents.mockResolvedValue(rows);
      await controller.getHighHeartRateEvents('110', '10', '5');
      expect(db.getHighHeartRateEvents).toHaveBeenCalledWith(110, 11, 5);
    });

    it.each([
      ['non-numeric threshold', 'abc'],
      ['negative threshold', '-1'],
    ])('rejects %s with 400', async (_name, threshold) => {
      await expect(controller.getHighHeartRateEvents(threshold)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects invalid pagination with 400', async () => {
      await expect(controller.getHighHeartRateEvents('100', '101')).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
