import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Runs against the real AppModule + a seeded Postgres (db/init.sql):
// locally via docker compose, in CI via the postgres service container.
describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET) returns hello', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
  });

  it('/patients (GET) returns seeded patients', async () => {
    const res = await request(app.getHttpServer()).get('/patients').expect(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body.map((p: { name: string }) => p.name)).toContain('Alice Johnson');
  });

  it('/api/high-heart-rate-events (GET) returns only readings above 100', async () => {
    const res = await request(app.getHttpServer()).get('/api/high-heart-rate-events').expect(200);
    expect(res.body).toHaveLength(2);
    for (const e of res.body as { heartRate: number }[]) {
      expect(e.heartRate).toBeGreaterThan(100);
    }
  });

  it('/api/patient/1/analytics (GET) aggregates the seeded range', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/patient/1/analytics')
      .query({ from: '2024-03-01T00:00:00Z', to: '2024-03-02T00:00:00Z' })
      .expect(200);
    expect(res.body).toMatchObject({ patientId: 1, count: 3, min: 85, max: 101 });
    expect(res.body.avg).toBeCloseTo(94.33, 1);
  });

  it('/api/patient/999/analytics (GET) → 404', () => {
    return request(app.getHttpServer())
      .get('/api/patient/999/analytics')
      .query({ from: '2024-03-01T00:00:00Z', to: '2024-03-02T00:00:00Z' })
      .expect(404);
  });

  it('/api/patient/1/analytics (GET) with bad dates → 400', () => {
    return request(app.getHttpServer())
      .get('/api/patient/1/analytics')
      .query({ from: 'nope', to: '2024-03-02T00:00:00Z' })
      .expect(400);
  });

  it('/api/patient/1/tracking (GET) returns a tracking row', async () => {
    const res = await request(app.getHttpServer()).get('/api/patient/1/tracking').expect(200);
    // count depends on how many analytics calls ran before; assert shape, not value
    expect(res.body.patientId).toBe(1);
    expect(typeof res.body.requestCount).toBe('number');
  });
});
