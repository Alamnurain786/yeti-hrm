# Troubleshooting

## Login Succeeds but API Calls Fail

Symptoms:

- User lands in app but requests return 401

Checks:

1. Verify access token is present in frontend storage.
2. Verify refresh token exists and `/auth/refresh` succeeds.
3. Verify backend session is not revoked.

Fixes:

- Re-login to create a new session pair.
- Inspect session list and revoke stale sessions.

## Refresh Loop or Repeated 401s

Symptoms:

- Frontend keeps retrying after token expiry

Checks:

1. Confirm refresh endpoint returns both new access and refresh tokens.
2. Confirm interceptor updates stored tokens after refresh.
3. Confirm token payload `type` and `sid` are present.

Fixes:

- Clear invalid stored tokens and re-authenticate.
- Confirm backend and frontend versions are aligned.

## Notification Stream Not Receiving Events

Symptoms:

- Notification page/header does not receive live events

Checks:

1. Confirm `/notifications/stream` is reachable.
2. Confirm auth token is sent to SSE request.
3. Confirm user preference category is enabled.

Fixes:

- Reconnect stream from page reload.
- Re-enable category flags in settings.

## Import Completes with Unexpected Skips

Symptoms:

- Many rows are skipped during import

Checks:

1. Verify selected duplicate strategy.
2. Download row-level error CSV and inspect `code` + `field`.
3. Re-run as dry-run first to preview outcomes.

Fixes:

- Switch strategy to `update` where appropriate.
- Correct source CSV formatting and rerun.

## Reports Page Empty for a Month

Symptoms:

- KPI cards show zeros unexpectedly

Checks:

1. Verify month format is `YYYY-MM`.
2. Confirm attendance and leave data exists in selected month.
3. Confirm tenant scope (superadmin vs tenant user).

Fixes:

- Test with month that has known data.
- Verify seeded/imported attendance and leave rows.

## Password Change Rejected

Symptoms:

- Password update returns validation error

Checks:

1. Confirm password satisfies policy rules in backend.
2. Confirm new password is different from old password.

Fixes:

- Use compliant password length and character classes.
- Retry and verify `password_changed_at` is updated.

## Where to Look for Error Format

- Structured API error format and helper usage are documented in `ERROR_HANDLER_GUIDE.md`.
