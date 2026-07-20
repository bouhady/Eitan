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

  it('/ (GET) returns the service name', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('Patients & Heart Rate Service');
  });

  it('/patients (GET) returns seeded patients in a pagination envelope', async () => {
    const res = await request(app.getHttpServer()).get('/patients').expect(200);
    expect(res.body).toMatchObject({ limit: 25, offset: 0, hasMore: false });
    expect(res.body.items.length).toBeGreaterThanOrEqual(2);
    expect(res.body.items.map((p: { name: string }) => p.name)).toContain('Alice Johnson');
  });

  it('/api/high-heart-rate-events (GET) returns only readings above 100', async () => {
    const res = await request(app.getHttpServer()).get('/api/high-heart-rate-events').expect(200);
    expect(res.body.items).toHaveLength(2);
    for (const e of res.body.items as { heartRate: number }[]) {
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

  it('/api/high-heart-rate-events honors custom threshold', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/high-heart-rate-events')
      .query({ threshold: 102 })
      .expect(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].heartRate).toBe(105);
  });

  it('/api/high-heart-rate-events rejects bad threshold and bad pagination', async () => {
    await request(app.getHttpServer()).get('/api/high-heart-rate-events').query({ threshold: 'abc' }).expect(400);
    await request(app.getHttpServer()).get('/api/high-heart-rate-events').query({ limit: 101 }).expect(400);
  });

  it('/heart-rate-readings paginates with limit/offset and reports hasMore', async () => {
    const res = await request(app.getHttpServer())
      .get('/heart-rate-readings')
      .query({ limit: 2, offset: 1 })
      .expect(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body).toMatchObject({ limit: 2, offset: 1, hasMore: true }); // 6 seed rows

    const lastPage = await request(app.getHttpServer())
      .get('/heart-rate-readings')
      .query({ limit: 100 })
      .expect(200);
    expect(lastPage.body.hasMore).toBe(false);
  });

  it('/api/patient/1/analytics rejects non-ISO date formats with 400', () => {
    return request(app.getHttpServer())
      .get('/api/patient/1/analytics')
      .query({ from: '03/01/2024', to: '2024-03-02T00:00:00Z' })
      .expect(400);
  });

  it('/api/patient/1/analytics rejects a range longer than 365 days with 400', () => {
    return request(app.getHttpServer())
      .get('/api/patient/1/analytics')
      .query({ from: '2023-01-01T00:00:00Z', to: '2024-06-01T00:00:00Z' })
      .expect(400);
  });

  it('/api/patient/1/analytics rejects from > to with 400', () => {
    return request(app.getHttpServer())
      .get('/api/patient/1/analytics')
      .query({ from: '2024-03-02T00:00:00Z', to: '2024-03-01T00:00:00Z' })
      .expect(400);
  });

  it('/api/patient/1/tracking counter increments after an analytics call', async () => {
    const before = await request(app.getHttpServer()).get('/api/patient/1/tracking').expect(200);

    await request(app.getHttpServer())
      .get('/api/patient/1/analytics')
      .query({ from: '2024-03-01T00:00:00Z', to: '2024-03-02T00:00:00Z' })
      .expect(200);
    await new Promise((r) => setTimeout(r, 200)); // let the async event listener write

    const after = await request(app.getHttpServer()).get('/api/patient/1/tracking').expect(200);
    expect(after.body.requestCount).toBe(before.body.requestCount + 1);
  });
});
