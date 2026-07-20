# API Endpoints

Assignment endpoints, implemented in `backend/src/controllers/patients.controller.ts`
with SQL in `backend/src/db/db.service.ts` (Postgres does the filtering/aggregation).

## 1. High Heart Rate Events

All heart rate readings exceeding **100 bpm**, across all patients, ordered by timestamp.

```
GET /api/high-heart-rate-events
```

**Response `200`**

```json
[
  { "patientId": 1, "timestamp": "2024-03-01T10:30:00.000Z", "heartRate": 101 },
  { "patientId": 2, "timestamp": "2024-03-02T11:00:00.000Z", "heartRate": 105 }
]
```

The threshold is the `HIGH_HEART_RATE_THRESHOLD` constant (100) in `db.service.ts`.

## 2. Heart Rate Analytics

Average, minimum, and maximum heart rate for one patient within a time range (inclusive).

```
GET /api/patient/:id/analytics?from=<ISO date>&to=<ISO date>
```

| Param  | In    | Description                     |
|--------|-------|---------------------------------|
| `id`   | path  | Patient id (integer)            |
| `from` | query | Range start, ISO 8601, required |
| `to`   | query | Range end, ISO 8601, required   |

**Response `200`**

```json
{
  "patientId": 1,
  "from": "2024-03-01T00:00:00Z",
  "to": "2024-03-02T00:00:00Z",
  "count": 3,
  "avg": 94.33,
  "min": 85,
  "max": 101
}
```

No readings in range → `count: 0` and `avg`/`min`/`max` are `null`.

**Errors**

| Status | When                                        |
|--------|---------------------------------------------|
| `400`  | Non-numeric `id`, missing or invalid `from`/`to` |
| `404`  | Patient id does not exist                   |

## 3. Patient Request Tracking

How many times a patient's analytics data has been requested. Every successful call to
`/api/patient/:id/analytics` emits a `patient.analytics.requested` event (NestJS EventEmitter);
an async listener (`TrackingService`) upserts the `"patientRequestsAnalytics"` table —
tracking never blocks or fails the analytics request itself.

```
GET /api/patient/:id/tracking
```

**Response `200`**

```json
{
  "patientId": 1,
  "requestCount": 2,
  "lastRequestedAt": "2026-07-20T15:10:00.000Z"
}
```

Never requested → `requestCount: 0`, `lastRequestedAt: null`.

**Errors**

| Status | When                      |
|--------|---------------------------|
| `400`  | Non-numeric `id`          |
| `404`  | Patient id does not exist |

## Example calls

```bash
curl http://localhost:3000/api/high-heart-rate-events
curl "http://localhost:3000/api/patient/1/analytics?from=2024-03-01T00:00:00Z&to=2024-03-02T00:00:00Z"
```
