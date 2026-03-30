# HRM Platform

Multi-tenant HRM system with a React + Vite frontend and FastAPI backend.

## What It Includes

- Role-based access: superadmin, admin, user (employee)
- Protected route system with role and feature-flag checks
- Employee profile and document/file management
- Attendance dashboards (admin + employee views) with Nepali date filtering and CSV export
- Leave request, cancellation, approval workflow, balance, and audit trail views
- Employee CSV import from UI (template download + result feedback)
- Monthly KPI reports with CSV export and browser print-to-PDF flow
- Notification center with SSE live updates, category tabs, and mark-read actions
- Company and platform settings (preferences, notification preferences, security/session controls)
- Session-aware authentication with access + refresh token pair and token refresh retry handling

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, axios
- Backend: FastAPI, SQLAlchemy, Pydantic
- Database: MySQL-compatible relational database
- Realtime: Server-Sent Events (SSE)

## Quick Start

### Frontend

```bash
npm install
npm run dev
```

Frontend runs on http://localhost:5173 by default.

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs on http://localhost:8000 by default.

## Frontend Modules

- Dashboard
  - Role-aware cards and widgets for admin, user, and superadmin
  - Company metrics and widget visibility controlled by platform settings
- People and Organization
  - Employees (admin): list/create/edit/view + CSV import
  - Departments, Sections, Designations
- Attendance
  - Admin: attendance reporting, status summary, device recovery sync trigger, CSV export
  - User: personal attendance management view, monthly/daily filters, CSV export
- Leave
  - User: request leave, half-day logic, cancellation request flow, leave balance
  - Admin/superadmin/manager: leave approvals with status transitions and remarks
- Reports
  - Monthly KPI report loader with CSV download and print-friendly PDF export flow
- Notifications
  - In-app notifications with SSE stream + periodic refresh fallback
- Settings
  - User preferences and notification preferences
  - Session/security actions (including session revoke/logout-all when available)
  - Attendance rules, leave policy, and opening balance import sections (permission-based)
- Superadmin
  - Companies registry and onboarding
  - Company alerts and email templates
  - Dashboard/widget configuration matrix
  - Superadmin settings and optional company/device modules via feature toggles

## Route Notes

- Hidden/redirected routes in current frontend:
  - /payroll
  - /superadmin/users
  - /superadmin/create-hr
  - /roles (redirects to /designations)
- Access is enforced in route guards and sidebar menus by role plus platform flags.

## Core Docs

- ARCHITECTURE.md - system architecture and module boundaries
- COMPLETE_FEATURES.md - feature matrix by role and module
- RUNBOOK.md - setup, operations, and release checklist
- TROUBLESHOOTING.md - common failures and fixes
- ERROR_HANDLER_GUIDE.md - centralized backend error response format

## Current Product Notes

- Payroll frontend is intentionally hidden for now.
- Device ingestion and live sync tooling are managed from the Devices module.
- Auth supports refresh tokens, automatic retry after 401, and strict session clear on server-unreachable network errors.
- Some superadmin modules are dynamically enabled/disabled via platform settings.
