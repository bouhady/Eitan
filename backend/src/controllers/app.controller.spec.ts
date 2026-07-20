import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from '../services/app.service';
import { DbService } from '../db/db.service';

describe('AppController', () => {
  let appController: AppController;
  const db = {
    getPatients: jest.fn().mockResolvedValue([]),
    getHeartRateReadings: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: DbService, useValue: db }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('root returns the service name', () => {
    expect(appController.getHello()).toBe('Patients & Heart Rate Service');
  });

  describe('pagination', () => {
    it('defaults to limit 25 offset 0 (fetches limit+1 for hasMore)', async () => {
      const res = await appController.getPatients();
      expect(db.getPatients).toHaveBeenCalledWith(26, 0);
      expect(res).toEqual({ items: [], limit: 25, offset: 0, hasMore: false });
    });

    it('passes custom limit and offset through', async () => {
      await appController.getHeartRateReadings('10', '5');
      expect(db.getHeartRateReadings).toHaveBeenCalledWith(11, 5);
    });

    it('sets hasMore and trims the extra row when more rows exist', async () => {
      db.getPatients.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
      const res = await appController.getPatients('2');
      expect(res.items).toHaveLength(2);
      expect(res.hasMore).toBe(true);
    });

    it.each([
      ['limit 0', '0', undefined],
      ['limit above max', '101', undefined],
      ['non-numeric limit', 'abc', undefined],
      ['negative offset', '25', '-1'],
      ['non-numeric offset', '25', 'abc'],
    ])('rejects %s with 400', async (_name, limit, offset) => {
      await expect(appController.getPatients(limit, offset)).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
