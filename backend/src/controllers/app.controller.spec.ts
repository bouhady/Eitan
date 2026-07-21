import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from '../services/app.service';
import { PatientsService } from '../services/patients.service';

describe('AppController', () => {
  let appController: AppController;
  const patients = {
    getPatients: jest.fn(),
    getHeartRateReadings: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: PatientsService, useValue: patients }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('root returns the service name', () => {
    expect(appController.getHello()).toBe('Patients & Heart Rate Service');
  });

  it('delegates patients listing to the service', () => {
    const query = { limit: 25, offset: 0 };
    appController.getPatients(query);
    expect(patients.getPatients).toHaveBeenCalledWith(query);
  });

  it('delegates readings listing to the service', () => {
    const query = { limit: 10, offset: 5 };
    appController.getHeartRateReadings(query);
    expect(patients.getHeartRateReadings).toHaveBeenCalledWith(query);
  });
});
