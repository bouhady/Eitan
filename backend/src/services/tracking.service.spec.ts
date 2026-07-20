import { Logger } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { DbService } from '../db/db.service';

describe('TrackingService', () => {
  const db = { trackPatientRequest: jest.fn() };
  const service = new TrackingService(db as unknown as DbService);

  beforeAll(() => jest.spyOn(Logger.prototype, 'error').mockImplementation());
  beforeEach(() => jest.clearAllMocks());

  it('tracks the request for the emitted patientId', async () => {
    db.trackPatientRequest.mockResolvedValue(undefined);
    await service.onAnalyticsRequested({ patientId: 1 });
    expect(db.trackPatientRequest).toHaveBeenCalledWith(1);
  });

  it('swallows db failures so tracking never breaks the request path', async () => {
    db.trackPatientRequest.mockRejectedValue(new Error('db down'));
    await expect(service.onAnalyticsRequested({ patientId: 1 })).resolves.toBeUndefined();
    expect(Logger.prototype.error).toHaveBeenCalled();
  });
});
