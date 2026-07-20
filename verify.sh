#!/usr/bin/env bash
# One command to run the stack and every verification. Usage: ./verify.sh
set -euo pipefail
cd "$(dirname "$0")"

docker compose up -d

echo "waiting for backend..."
until curl -sf http://localhost:3000 >/dev/null 2>&1; do sleep 2; done

echo "--- backend unit tests ---"
docker compose exec -T backend npx jest

echo "--- backend e2e tests ---"
docker compose exec -T backend npm run test:e2e

echo "--- frontend unit tests ---"
docker compose exec -T frontend sh -c "CI=true npm test"

echo "--- frontend production build ---"
docker compose exec -T frontend npm run build

echo "ALL VERIFICATIONS PASSED"
