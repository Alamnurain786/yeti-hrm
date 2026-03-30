# Feature Matrix

## By Module

### Authentication and Security

- Access + refresh token flow
- Session creation per login and selective session revoke
- Login attempt throttling
- Password policy validation
- Password rotation metadata (`password_changed_at`, `password_expires_at`)

### Employee and Profile

- Employee CRUD and profile lifecycle
- Profile completeness and progress UI
- Document upload and preview utilities
- Validation utilities and autosave helpers

### Attendance

- Attendance records and status tracking
- Attendance management pages
- Device integration endpoints and live stream support

### Leave Management

- Leave request submission
- Approval/rejection workflows
- Leave dashboard and approvals page

### Notifications

- Notification center listing and state updates
- SSE live notification stream
- Category-level preferences (`profile`, `leave`, `payroll`)
- Digest preview and send-now endpoint support

### Imports

- Employee and leave opening import flows
- Dry-run validation mode
- Duplicate handling strategy (`skip`, `update`, `fail`)
- Row-level result tracking
- Import job history and detail views
- Structured error CSV export

### Reports

- Monthly KPI endpoint
- Department comparison summary
- Section comparison summary
- CSV export endpoint
- Frontend reports page + print-friendly PDF flow

## By Role

### Superadmin

- Cross-tenant administration
- Company-level settings and governance
- Access to reports and operations modules

### Admin / HR

- Tenant-scoped employee and org management
- Attendance and leave operations
- Imports and reporting
- Notification preferences and session controls

### Employee

- Self profile management
- Leave requests and personal notifications
- Session and password actions applicable to own account

## Product Flags / Temporary Decisions

- Payroll UI is hidden on frontend for current phase.
- Device behavior remains unchanged.
