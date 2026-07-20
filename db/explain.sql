-- Query plans for the two main queries. Run with:
--   docker compose exec -T db psql -U app -d patients < db/explain.sql
-- Expect: index scans on idx_hrr_* and partition pruning on the analytics range.

EXPLAIN ANALYZE
SELECT COUNT(*), AVG("heartRate")::float, MIN("heartRate"), MAX("heartRate")
FROM "heartRateReadings"
WHERE "patientId" = 1 AND timestamp BETWEEN '2024-03-01' AND '2024-03-02';

EXPLAIN ANALYZE
SELECT id, "patientId", timestamp, "heartRate"
FROM "heartRateReadings"
WHERE "heartRate" > 100
ORDER BY timestamp, id
LIMIT 25;
