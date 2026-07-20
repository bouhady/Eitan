-- Runs once on first postgres init (mounted into /docker-entrypoint-initdb.d).
-- Seeded from db/patients.json.

CREATE TABLE patients (
  id     INT PRIMARY KEY,
  name   TEXT NOT NULL,
  age    INT,
  gender TEXT
);

-- Partitioned by time: analytics queries prune to the relevant partitions,
-- and old data can be archived/dropped per-partition.
-- The partition key (timestamp) must be part of the primary key.
CREATE TABLE "heartRateReadings" (
  id          BIGINT GENERATED ALWAYS AS IDENTITY,
  "patientId" INT NOT NULL REFERENCES patients(id),
  timestamp   TIMESTAMPTZ NOT NULL,
  "heartRate" INT NOT NULL CHECK ("heartRate" > 0 AND "heartRate" <= 300),
  PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- ponytail: one yearly partition + a DEFAULT catch-all; real ops would create
-- monthly/quarterly partitions on a schedule (e.g. pg_partman)
CREATE TABLE "heartRateReadings_2024" PARTITION OF "heartRateReadings"
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE "heartRateReadings_default" PARTITION OF "heartRateReadings" DEFAULT;

-- covers analytics (patient + time range) and high-heart-rate (threshold + order) queries;
-- created on the parent, so they propagate to every partition
CREATE INDEX idx_hrr_patient_timestamp ON "heartRateReadings" ("patientId", timestamp);
CREATE INDEX idx_hrr_rate_timestamp ON "heartRateReadings" ("heartRate", timestamp);

-- request tracking (assignment endpoint 3), updated async via NestJS EventEmitter
CREATE TABLE "patientRequestsAnalytics" (
  "patientId"       INT PRIMARY KEY REFERENCES patients(id),
  "requestCount"    BIGINT NOT NULL DEFAULT 0,
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
