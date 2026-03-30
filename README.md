# HRM Platform

Multi-tenant HRM system with a React + Vite frontend and FastAPI backend.

## What It Includes

- Role-based access: `superadmin`, `admin`, `hr`, `employee`
- Employee profile and document management
- Attendance management and device ingestion pipeline
- Leave workflows and approvals
- Import center with dry-run, duplicate strategy, and error export
- Monthly KPI reports with CSV/PDF export
- Notification center with SSE live updates and category preferences
- Session-aware authentication with access + refresh token pair

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

Frontend runs on `http://localhost:5173` by default.

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs on `http://localhost:8000` by default.

## Default Local Login

- Superadmin email: `admin@hrm.com`
- Password: `admin`

## Core Docs

- `ARCHITECTURE.md` - system architecture and module boundaries
- `COMPLETE_FEATURES.md` - feature matrix by role and module
- `RUNBOOK.md` - setup, operations, and release checklist
- `TROUBLESHOOTING.md` - common failures and fixes
- `ERROR_HANDLER_GUIDE.md` - centralized backend error response format

## Current Product Notes

- Payroll frontend is intentionally hidden for now.
- Device ingestion behavior remains unchanged.
- Auth now supports refresh and session revoke flows; ensure frontend and backend are both updated when testing auth behavior.
