# HRM System - Backend API

Python FastAPI backend for the Human Resource Management System with MySQL database.

## 🚀 Features

- **Authentication**: JWT-based authentication with role-based access control
- **User Management**: CRUD operations for employees, HR, and superadmin
- **Attendance Tracking**: Daily attendance records with check-in/check-out times
- **Leave Management**: Leave requests with approval workflow
- **Department Management**: Organization structure management
- **Payroll Processing**: Salary calculation and payment tracking
- **Role-Based Access**: Superadmin, HR, and Employee roles with different permissions

## 📋 Prerequisites

- Python 3.8+
- MySQL 8.0+
- pip (Python package manager)

## 🛠️ Installation

### 1. Clone the repository

```bash
cd hrm-backend
```

### 2. Create virtual environment

```bash
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure MySQL Database

Create a MySQL database:

```sql
CREATE DATABASE hrm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Configure Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env` file:

```env
DATABASE_URL=mysql+pymysql://root:your_password@localhost:3306/hrm_db
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hrm_db

SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 6. Initialize Database

The database tables will be created automatically when you start the server for the first time.

### 7. Run the application

```bash
# Development mode with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or use Python directly
python main.py
```

The API will be available at:

- **API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📁 Project Structure

```
hrm-backend/
├── app/
│   ├── config/
│   │   ├── database.py      # Database connection
│   │   └── settings.py      # App settings
│   ├── models/
│   │   └── models.py        # SQLAlchemy models
│   ├── schemas/
│   │   └── schemas.py       # Pydantic schemas
│   ├── routes/
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── users.py         # User management
│   │   ├── attendance.py    # Attendance tracking
│   │   ├── leaves.py        # Leave management
│   │   └── departments.py   # Department management
│   ├── middleware/
│   │   └── auth_middleware.py  # JWT authentication
│   └── utils/
│       └── auth.py          # Password hashing, JWT utils
├── main.py                  # FastAPI application
├── requirements.txt         # Python dependencies
├── .env.example             # Environment variables template
├── .gitignore
└── README.md
```

## 🔐 API Authentication

### Login

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin@hrm.com",
  "password": "admin"
}
```

Response:

```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "ADMIN001",
    "email": "admin@hrm.com",
    "name": "System Admin",
    "role": "superadmin"
  }
}
```

### Use Token in Requests

```bash
Authorization: Bearer <access_token>
```

## 📚 API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login (form-data)
- `POST /api/v1/auth/login/json` - Login (JSON)

### Users

- `GET /api/v1/users/` - Get all users (HR/Admin)
- `GET /api/v1/users/me` - Get current user profile
- `GET /api/v1/users/{user_id}` - Get user by ID
- `PUT /api/v1/users/{user_id}` - Update user
- `DELETE /api/v1/users/{user_id}` - Delete user (HR/Admin)

### Attendance

- `GET /api/v1/attendance/` - Get attendance records
- `GET /api/v1/attendance/my` - Get my attendance
- `POST /api/v1/attendance/` - Create attendance (HR/Admin)
- `PUT /api/v1/attendance/{id}` - Update attendance (HR/Admin)
- `DELETE /api/v1/attendance/{id}` - Delete attendance (Admin)

### Leaves

- `GET /api/v1/leaves/` - Get leave requests
- `GET /api/v1/leaves/my` - Get my leaves
- `POST /api/v1/leaves/` - Create leave request
- `PUT /api/v1/leaves/{id}` - Update leave status (HR/Admin)
- `DELETE /api/v1/leaves/{id}` - Delete leave request

### Departments

- `GET /api/v1/departments/` - Get all departments
- `GET /api/v1/departments/{id}` - Get department by ID
- `POST /api/v1/departments/` - Create department (HR/Admin)
- `PUT /api/v1/departments/{id}` - Update department (HR/Admin)
- `DELETE /api/v1/departments/{id}` - Delete department (Admin)

## 👤 Default Admin Account

After first run, create a superadmin account:

```bash
# You'll need to manually insert the first admin or use the register endpoint
# with role "superadmin" for the first time
```

Default credentials (if seeded):

- **Email**: admin@hrm.com
- **Password**: admin

## 🔧 Database Models

### User

- id, email, password, name, role, phone, address
- department, position, salary
- dob_ad, dob_bs, join_date, status, resignation_date
- profile_image, created_at, updated_at

### Attendance

- id, user_id, date, check_in, check_out
- status, late_reason, created_at

### Leave

- id, user_id, type, start_date, end_date
- start_date_bs, end_date_bs, reason
- status, half_day, approved_by, approved_at
- created_at, updated_at

### Department

- id, name, description
- head_of_department
- created_at, updated_at

## 🧪 Testing

Use the Swagger UI at http://localhost:8000/docs to test all endpoints interactively.

## 🚀 Deployment

### Using Gunicorn (Production)

```bash
pip install gunicorn
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Using Docker

```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📝 License

MIT License

## 👥 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📧 Support

For issues and questions, please create an issue in the GitHub repository.
