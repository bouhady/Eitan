# Patients & Heart Rate Service

Full-stack home assignment: a NestJS + Postgres service managing patients and their
heart rate readings, with a small Angular UI to exercise the API.

## Quick start

```bash
docker compose up
```

| Service  | URL                    |
|----------|------------------------|
| backend  | http://localhost:3000  |
| frontend | http://localhost:4200  |
| postgres | localhost:5432 (`app`/`app`, db `patients`) |

Everything runs in watch mode with source mounted — edit locally, containers reload.
No local Node/Postgres install needed.

To run **all verifications** (backend unit + e2e, frontend tests + production build) in
one command:

```bash
./verify.sh
```

### Quick test — example curl commands

```bash
# health / hello
curl http://localhost:3000

# patients (paginated: { items, limit, offset, hasMore })
curl "http://localhost:3000/patients"
curl "http://localhost:3000/patients?limit=1&offset=1"

# heart rate readings
curl "http://localhost:3000/heart-rate-readings?limit=3"

# 1) high heart rate events (default threshold 100)
curl "http://localhost:3000/api/high-heart-rate-events"
curl "http://localhost:3000/api/high-heart-rate-events?threshold=102"

# 2) analytics per patient in a time range (avg / min / max / count)
curl "http://localhost:3000/api/patient/1/analytics?from=2024-03-01T00:00:00Z&to=2024-03-03T00:00:00Z"

# 3) request tracking (counts analytics requests; run the analytics call above first)
curl "http://localhost:3000/api/patient/1/tracking"

# error handling examples
curl "http://localhost:3000/api/patient/999/analytics?from=2024-03-01T00:00:00Z&to=2024-03-03T00:00:00Z"  # 404 unknown patient
curl "http://localhost:3000/api/patient/1/analytics?from=03/01/2024&to=2024-03-03T00:00:00Z"              # 400 non-ISO date
curl "http://localhost:3000/patients?limit=101"                                                            # 400 limit above max
```

## Backend (NestJS + TypeScript)

```
backend/src/
  main.ts                       bootstrap (CORS enabled for the dev UI)
  app.module.ts                 wiring: controllers, providers, global ValidationPipe, middleware
  controllers/                  thin HTTP layer: DTO in, service call, response out
    app.controller.ts           hello + /ping (mock 2s delay) + list endpoints
    patients.controller.ts      the assignment endpoints (under /api)
  dto/                          query contracts, validated by class-validator
    pagination.dto.ts           limit (1-100, default 25) + offset
    high-heart-rate-events-query.dto.ts   + threshold (int 1-300, default 100)
    patient-analytics-query.dto.ts        from/to as strict ISO 8601
  services/
    app.service.ts
    patients.service.ts         use-case layer: business validation + orchestration
    tracking.service.ts         async event listener for request tracking
  db/
    db.service.ts               data access only: pg Pool + parameterized SQL
  middleware/
    logger.middleware.ts        logs every request with status + latency
  types/
    patient.ts                  shared interfaces (Patient, readings, analytics, tracking)
```

### Assignment endpoints

Full spec with request/response shapes and error codes: [`docs/endpoints.md`](docs/endpoints.md).

1. **High Heart Rate Events** — `GET /api/high-heart-rate-events?threshold=`
   All readings above the threshold (query param, default 100 bpm), filtered and ordered by SQL.
2. **Heart Rate Analytics** — `GET /api/patient/:id/analytics?from=&to=`
   `COUNT/AVG/MIN/MAX` computed by Postgres aggregates, not in JS. Validates dates (`400`),
   unknown patient (`404`), empty range returns `count: 0` with nulls.
3. **Patient Request Tracking** — `GET /api/patient/:id/tracking`
   Counts **analytics requests only** (not other endpoints): every call to
   `/api/patient/:id/analytics` emits a `patient.analytics.requested` event (NestJS EventEmitter);
   `TrackingService` handles it **asynchronously** and upserts a counter row — tracking never
   blocks or fails the request path. This endpoint reads the counter back.

### Design decisions

- **SQL does the work.** Filtering, aggregation, and the atomic tracking counter
  (`INSERT … ON CONFLICT … requestCount + 1`) live in Postgres. The Node layer stays thin
  and there are no read-modify-write races.
- **Raw `pg` over an ORM.** A handful of parameterized queries doesn't justify
  TypeORM/Prisma; `DbService` is the single seam where an ORM could later slot in.
- **Event-driven tracking** decouples the side effect from the request path: the analytics
  handler emits and returns; the listener catches and logs its own failures.
- **Layered: controller → service → data access.** Controllers are a thin HTTP layer;
  `PatientsService` owns each use case (business rules, existence checks, event emission,
  response shaping); `DbService` is SQL only.
- **Two kinds of validation, two places.** Shape validation (types, ranges, ISO format)
  lives in DTOs enforced by a global `ValidationPipe`; business validation (`from <= to`,
  the 365-day cap, patient existence) lives in the service.
- **Observability**: every request logged with status + latency; queries slower than
  200ms warned app-side and logged db-side (`log_min_duration_statement`); 5s
  `statement_timeout` on the pool; `db/explain.sql` for checking plans.

## Database (Postgres 16)

`db/init.sql` runs automatically on first container start (mounted into
`/docker-entrypoint-initdb.d`) and creates + seeds:

| Table                      | Purpose                                          |
|----------------------------|--------------------------------------------------|
| `patients`                 | profile data (seeded from `db/patients.json`)    |
| `heartRateReadings`        | timestamped readings, FK → patients — **partitioned by time range** (yearly + DEFAULT catch-all), `NOT NULL` + `CHECK (0 < heartRate <= 300)` constraints |
| `patientRequestsAnalytics` | per-patient `BIGINT` request counter + last-requested-at |

Data persists in the named `pgdata` volume; `docker compose down -v` resets to a fresh seed.

## Frontend (Angular + Material)

A minimal dev UI: one card per endpoint (patients, readings, high-heart-rate events,
analytics with id/date inputs, request tracking), each showing loading, data, and error
states. Structured as `components/`, `services/` (one typed `ApiService`), `types/`.

## Thought process

How this project was built, in the order it actually happened:

1. **Walking skeleton first.** Three folders — `frontend/` (Angular), `backend/` (NestJS),
   `db/` (the provided seed JSON) — plus a docker-compose that runs everything with one
   command. Before writing any feature, the whole stack had to run.
2. **Prove the wire.** A `/ping` endpoint and a single frontend button with a loading
   spinner and snackbar — the smallest possible end-to-end round trip (plus a mock 2s
   delay to make the loading state real). Angular Material came in here for consistent UI.
3. **Real data layer.** Postgres joined the compose stack, `init.sql` seeds the two core
   tables from the provided JSON, and a thin `DbService` (raw `pg`, parameterized SQL)
   exposed `SELECT`s — first as plain `/patients` and `/heart-rate-readings` endpoints,
   each with a UI card to exercise it.
4. **Structure before features.** With working plumbing, both projects were reorganized
   into intention-revealing folders (`controllers/`, `services/`, `db/`, `types/`,
   `middleware/` — mirrored by `components/`, `services/`, `types/` in the frontend) so
   the actual assignment features would land in clean places.
5. **Assignment endpoints.** High-heart-rate events and per-patient analytics — SQL does
   the filtering/aggregation, controllers only validate and map errors (`400`/`404`).
   Spec written down in `docs/endpoints.md` before implementing.
6. **Event-driven tracking.** The third requirement was deliberately decoupled: analytics
   emits an event, an async listener upserts the counter — a tracking failure can never
   break the request path.
7. **Tests, then CI.** Unit tests around the branching logic (validation, error mapping,
   the emit contract, the listener's never-throw guarantee) with mocked dependencies;
   e2e against a real seeded Postgres; GitHub Actions running both plus the production
   build on every push. The e2e suite caught a real bug (`BIGINT` arriving as a string).
8. **Hardening pass.** A structured self-review produced a prioritized fix list, applied
   in waves: pagination with limits, parametric threshold, range validation, indexes,
   explicit columns; then time-partitioning, schema constraints, bigint-safe counts, a
   365-day range cap; finally observability (latency logs, slow-query logs, statement
   timeout). Cursor pagination was implemented, evaluated, and consciously rolled back —
   for this dataset offset is sufficient, so it lives below as a suggested improvement
   rather than as unneeded complexity.

The guiding rule throughout: smallest thing that works, verified end-to-end at every
step, structure and hardening added when there was something real to protect.

## Suggested improvements (given more time)

- Config via `.env` (DB credentials) instead of hardcoded compose values
- Cursor (keyset) pagination for deep paging on large tables — offset pagination scans
  past all skipped rows, while `WHERE (timestamp, id) > (last row)` stays O(limit) at
  any depth on the existing indexes
- Migrations (e.g. node-pg-migrate) instead of a single init.sql
- Partition automation (pg_partman) instead of the manual yearly partition;
  a real queue (Redis/Kafka) instead of in-process events for tracking under load
- Metrics/tracing (Prometheus, OpenTelemetry) beyond the current log-based observability
- Production Dockerfiles (multi-stage build, nginx for the frontend)
