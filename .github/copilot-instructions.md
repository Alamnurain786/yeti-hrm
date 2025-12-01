# HRM Backend API - AI Coding Agent Instructions

## Architecture Overview

This is a FastAPI-based REST API for a Human Resource Management (HRM) system with MySQL backend. The architecture follows a clean separation:

- **FastAPI** with SQLAlchemy ORM and Pydantic validation
- **JWT-based auth** with role-based access control (RBAC): `superadmin`, `hr`, `employee`
- **MySQL database** using PyMySQL connector
- **RESTful endpoints** under `/api/v1` prefix

## Critical Project Setup

**Environment Setup (Windows PowerShell)**:

```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**Database Initialization**:

```powershell
# Create MySQL database and user (see SETUP.md for SQL commands)
# Then seed the database with initial data:
python seed_db.py
```

**Run Server**:

```powershell
# Development mode with auto-reload:
python main.py
# OR: uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Test Credentials** (created by `seed_db.py`):

- Superadmin: `admin@hrm.com` / `admin`
- HR: `hr@hrm.com` / `password123`

## Project-Specific Conventions

### 1. Database Models & Schemas Pattern

**Models** (`app/models/models.py`) define SQLAlchemy ORM classes. **Schemas** (`app/schemas/schemas.py`) define Pydantic validation models. ALWAYS maintain BOTH:

```python
# Model: SQLAlchemy (database representation)
class User(Base):
    __tablename__ = "users"
    id = Column(String(50), primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    role = Column(Enum(UserRole), nullable=False)

# Schema: Pydantic (API validation/serialization)
class UserCreate(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.EMPLOYEE

class UserResponse(BaseModel):
    id: str
    email: str
    role: UserRole
    class Config:
        from_attributes = True  # Enable ORM mode
```

**Key Pattern**: Enums are defined in BOTH `models.py` and `schemas.py` to match exactly (e.g., `UserRole`, `AttendanceStatus`, `LeaveStatus`).

### 2. Authentication & Authorization Pattern

**Three-tier auth dependency chain** in `app/middleware/auth_middleware.py`:

1. `get_current_user()` - Extracts JWT token, decodes, returns User object
2. `get_current_active_user()` - Verifies user status is "Active"
3. `require_role(["hr", "superadmin"])` - Role-based access control

**Usage in routes**:

```python
# All authenticated users:
current_user: User = Depends(get_current_active_user)

# Specific roles only:
current_user: User = Depends(require_role(["hr", "superadmin"]))
```

**Password Hashing**: Use `get_password_hash()` and `verify_password()` from `app/utils/auth.py`. NEVER store plain passwords.

### 3. Route Authorization Patterns

**Employees** can only access their own data:

```python
if current_user.role == "employee":
    query = query.filter(Model.user_id == current_user.id)
```

**HR/Superadmin** can access all data but with explicit checks:

```python
if current_user.role not in ["hr", "superadmin"]:
    raise HTTPException(status_code=403, detail="Not authorized")
```

See `app/routes/attendance.py` for reference implementation.

### 4. User ID Generation Pattern

User IDs are string-based with role prefixes:

- Superadmin: `ADMIN001`, `ADMIN002`, ...
- HR: `HR001`, `HR002`, ...
- Employees: `EMP` + timestamp (e.g., `EMP123456`)

```python
import time
user_id = f"EMP{str(int(time.time()))[-6:]}"
```

### 5. Database Session Management

**Always use dependency injection**:

```python
def my_endpoint(db: Session = Depends(get_db)):
    # Session automatically closed after request
    users = db.query(User).all()
```

**Never manually create sessions** unless in scripts like `seed_db.py`.

### 6. CORS Configuration

CORS origins are configured via `.env` file:

```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

Parsed in `app/config/settings.py` as `origins_list` property. Frontend runs on port 5173 (Vite) or 3000 (React/Next.js).

### 7. Date Handling: AD and BS (Nepali Calendar)

Models support BOTH Gregorian (AD) and Nepali Bikram Sambat (BS) dates:

```python
dob_ad = Column(Date)  # Python date object
dob_bs = Column(String(20))  # String format "YYYY-MM-DD"
```

Use `nepali-date-converter` package for conversions when needed.

## Key Files & Responsibilities

- **`main.py`**: Application entry point, router registration, startup event
- **`app/config/settings.py`**: Environment variables loaded via Pydantic Settings
- **`app/config/database.py`**: SQLAlchemy engine, session factory, `create_tables()`
- **`app/models/models.py`**: All SQLAlchemy ORM models (User, Department, Attendance, Leave)
- **`app/schemas/schemas.py`**: All Pydantic schemas for request/response validation
- **`app/utils/auth.py`**: JWT token creation/decoding, password hashing
- **`app/middleware/auth_middleware.py`**: Auth dependencies (get_current_user, require_role)
- **`app/routes/*.py`**: API endpoints grouped by resource (auth, users, attendance, leaves, departments)
- **`seed_db.py`**: Database seeding script for dev/testing

## Common Tasks

**Add New Endpoint**:

1. Define Pydantic schemas in `schemas.py` (Request/Response models)
2. Add route in appropriate `app/routes/*.py` file
3. Use `Depends(get_current_active_user)` or `Depends(require_role([...]))` for auth
4. Follow pattern: query DB → validate permissions → return Pydantic model

**Add New Model**:

1. Define SQLAlchemy model in `models.py` with relationships
2. Define Pydantic schemas (Create, Update, Response) in `schemas.py`
3. Import model in `seed_db.py` if needed for seeding
4. Tables auto-created on server startup via `create_tables()`

**Testing API**:

- Swagger UI: http://localhost:8000/docs
- Use "Authorize" button with credentials to test protected endpoints
- Or use PowerShell: `Invoke-RestMethod` (see SETUP.md for examples)

## Integration Points

**Frontend API Integration**: Frontend expects:

- Base URL: `http://localhost:8000/api/v1`
- Auth header: `Authorization: Bearer <token>`
- Token stored in `localStorage.getItem("access_token")`

**Database**: MySQL 8.0+ with `utf8mb4` charset for proper string handling.

## Common Gotchas

1. **Login endpoint has TWO versions**: `/auth/login` (form-data) and `/auth/login/json` (JSON body). Use JSON version for frontend.
2. **Enum matching**: Enums in models.py MUST match schemas.py exactly (case-sensitive).
3. **Foreign key cascades**: Relationships use `cascade="all, delete-orphan"` to auto-delete child records.
4. **Token expiration**: Default 30 minutes (`ACCESS_TOKEN_EXPIRE_MINUTES`). Configurable via `.env`.
5. **Database auto-creation**: Tables created on startup via `@app.on_event("startup")` in `main.py`.

## Debugging & Development

**Check database connection**:

```powershell
# In PowerShell:
Get-Service MySQL*
# If not running:
Start-Service MySQL80
```

**Reset database**:

```powershell
# In MySQL:
DROP DATABASE hrm_db;
CREATE DATABASE hrm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
# Then:
python seed_db.py
```

**View logs**: Server runs with `echo=settings.DEBUG` in database.py, logging all SQL queries when `DEBUG=True`.
