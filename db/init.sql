-- Runs once on first postgres init (mounted into /docker-entrypoint-initdb.d).
-- Seeded from db/patients.json.

CREATE TABLE patients (
  id     INT PRIMARY KEY,
  name   TEXT NOT NULL,
  age    INT,
  gender TEXT
);

CREATE TABLE "heartRateReadings" (
  id          SERIAL PRIMARY KEY,
  "patientId" INT REFERENCES patients(id),
  timestamp   TIMESTAMPTZ,
  "heartRate" INT
);

-- request tracking (assignment endpoint 3), updated async via NestJS EventEmitter
CREATE TABLE "patientRequestsAnalytics" (
  "patientId"       INT PRIMARY KEY REFERENCES patients(id),
  "requestCount"    INT NOT NULL DEFAULT 0,
  "lastRequestedAt" TIMESTAMPTZ
);

INSERT INTO patients (id, name, age, gender) VALUES
  (1, 'Alice Johnson', 34, 'female'),
  (2, 'Bob Smith', 45, 'male');

INSERT INTO "heartRateReadings" ("patientId", timestamp, "heartRate") VALUES
  (1, '2024-03-01T08:00:00Z', 85),
  (1, '2024-03-01T10:30:00Z', 101),
  (1, '2024-03-01T13:45:00Z', 97),
  (2, '2024-03-02T09:15:00Z', 88),
  (2, '2024-03-02T11:00:00Z', 105),
  (2, '2024-03-02T14:20:00Z', 93);
