# Runbook

## Local Development

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Pre-Release Checklist

1. Run frontend lint and confirm no new warnings/errors.
2. Start backend and verify migration/column ensure logic completes.
3. Verify login, refresh token, and logout flows.
4. Verify session list and selective session revoke.
5. Verify notification stream connection and reconnect behavior.
6. Verify imports in dry-run and commit modes.
7. Verify reports page loads KPI data and CSV export.

## Operational Checks

### Authentication

- Confirm access token expiration triggers refresh flow.
- Confirm revoked session cannot refresh.
- Confirm failed login attempts are throttled.

### Notifications

- Confirm `/notifications/stream` opens with valid auth token.
- Confirm category preferences are saved and respected.

### Imports

- Confirm import job history endpoint returns latest jobs.
- Confirm row error export returns CSV for failed rows.

### Reports

- Confirm monthly KPI endpoint handles selected month format `YYYY-MM`.
- Confirm CSV endpoint output is parseable and complete.

## Safe Reset Guidance

- Frontend mock/local state can be reset by clearing localStorage `hrm_*` keys when running mock mode.
- For backend DB, use standard migration/seed flow for your environment; do not use destructive resets on shared environments.

## Incident Triage Priority

1. Auth/session failures (login blocked, refresh loop)
2. Attendance/device ingestion disruption
3. Leave approval workflow regressions
4. Import data corruption risk
5. Reporting or notification degradation
