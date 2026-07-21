import { Test, TestingModule } from '@nestjs/testing';
import { PatientsService } from '../services/patients.service';
import { PatientsController } from './patients.controller';

describe('PatientsController', () => {
  let controller: PatientsController;
  const patients = {
    getHighHeartRateEvents: jest.fn(),
    getAnalytics: jest.fn(),
    getTracking: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientsController],
      providers: [{ provide: PatientsService, useValue: patients }],
    }).compile();
    controller = module.get(PatientsController);
  });

  it('delegates high heart rate events to the service', () => {
    const query = { threshold: 100, limit: 25, offset: 0 };
    controller.getHighHeartRateEvents(query);
    expect(patients.getHighHeartRateEvents).toHaveBeenCalledWith(query);
  });

  it('delegates analytics to the service', () => {
    const query = { from: '2024-03-01T00:00:00Z', to: '2024-03-03T00:00:00Z' };
    controller.getAnalytics(1, query);
    expect(patients.getAnalytics).toHaveBeenCalledWith(1, query);
  });

  it('delegates tracking to the service', () => {
    controller.getTracking(1);
    expect(patients.getTracking).toHaveBeenCalledWith(1);
  });
});
