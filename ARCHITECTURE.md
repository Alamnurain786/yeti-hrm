# HRM System Architecture

## High-Level Overview

The platform is split into two applications:

- Frontend app in `src/` (React + Vite)
- Backend app in `backend/app/` (FastAPI + SQLAlchemy)

The frontend talks to backend REST APIs under `/api/v1/*` and consumes realtime notifications from SSE endpoints.

## Frontend Architecture

### Composition

- App bootstrap: `src/main.jsx`
- Routing: `src/App.jsx`
- Shared layout: `src/layouts/MainLayout.jsx`
- Route protection: `src/components/ProtectedRoute.jsx`

### State and Context

- Authentication: `src/context/AuthContext.jsx`
- Toast/alerts: `src/context/ToastContext.jsx`
- Platform settings: `src/context/PlatformSettingsContext.jsx`

### Service Layer

- API client and interceptors: `src/services/backendApi.js`
- Access token storage and refresh retry flow
- Service groups: auth, users, leaves, attendance, imports, reports, notifications

### Main Functional Pages

- Workforce: `Employees`, `Departments`, `Sections`, `Roles`
- Time and leave: `Attendance*`, `LeaveManagement`, `LeaveApprovals`, `LeaveRequest`
- System: `Settings`, `CompanySettings`, `Notifications`, `Reports`

## Backend Architecture

### App Entry

- FastAPI startup and schema guard logic: `backend/app/main.py`
- API router mount: `backend/app/api/v1/api.py`

### API Modules

- Auth/session: `backend/app/api/v1/endpoints/auth.py`
- Users/security settings: `backend/app/api/v1/endpoints/users.py`
- Notifications/realtime: `backend/app/api/v1/endpoints/notifications.py`
- Imports: `backend/app/api/v1/endpoints/imports.py`
- Reports: `backend/app/api/v1/endpoints/reports.py`
- Device endpoints: `backend/app/api/v1/endpoints/devices.py`

### Security Model

- Access token + refresh token pair
- Token payload includes token `type` and session `sid`
- Session-backed validation in `backend/app/core/deps.py`
- Login attempt throttling and audit rows via auth endpoint + login attempt model
- Password policy validation in `backend/app/core/security.py`

### Data Layer

Core models in `backend/app/models/models.py` include:

- Identity and org: `User`, `Department`, `Section`, `Role`, `Company`
- Time/leave: `Attendance`, `LeaveRequest`, leave-related entities
- Security/session: `UserSession`, `AuthLoginAttempt`
- Import audit: `ImportJob`, `ImportJobRow`
- User preferences: `UserSettings` with notification category + digest flags

## Realtime and Notifications

- Notification stream endpoint: `/api/v1/notifications/stream`
- Device live stream remains independent and unchanged
- Preferences are category-based (`profile`, `leave`, `payroll`) plus digest settings

## Reporting Flow

- API endpoint computes monthly KPI and comparison aggregates
- Frontend reports page pulls JSON summary and supports CSV/PDF export
- CSV is generated from backend endpoint; PDF uses browser print path from frontend report view

## Import Flow

1. User uploads CSV and selects strategy
2. Backend parses rows and validates with optional dry-run
3. Duplicate strategy applied (`skip`, `update`, `fail`)
4. Import job + row-level outcomes persisted
5. Error CSV can be downloaded for failed rows

## Authorization Rules (Summary)

- `superadmin`: global access, tenant administration
- `admin`/`hr`: tenant-scoped workforce and ops actions
- `employee`: self-service visibility and request flows

Payroll features are currently hidden on the frontend by product decision.
