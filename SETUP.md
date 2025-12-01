# Backend Setup Guide

## Quick Start

### 1. Install Python Dependencies

```powershell
cd "d:\Frontend class\LFB\hrm-backend"
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Setup MySQL Database

Open MySQL Workbench or command line:

```sql
CREATE DATABASE hrm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hrm_user'@'localhost' IDENTIFIED BY 'hrm_password';
GRANT ALL PRIVILEGES ON hrm_db.* TO 'hrm_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```powershell
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Database Configuration
DATABASE_URL=mysql+pymysql://hrm_user:hrm_password@localhost:3306/hrm_db
DB_HOST=localhost
DB_PORT=3306
DB_USER=hrm_user
DB_PASSWORD=hrm_password
DB_NAME=hrm_db

# JWT Configuration
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Default Admin
ADMIN_EMAIL=admin@hrm.com
ADMIN_PASSWORD=admin
```

**Important**: Generate a secure `SECRET_KEY`:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 4. Seed Database with Initial Data

```powershell
python seed_db.py
```

This creates:

- Superadmin account: `admin@hrm.com` / `admin`
- HR account: `hr@hrm.com` / `password123`
- Sample employees with attendance and leave records
- Initial departments

### 5. Run the Backend Server

**Development Mode** (auto-reload on changes):

```powershell
python main.py
```

**Production Mode**:

```powershell
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 6. Test the API

Open your browser:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

### 7. Test Authentication

**Using Swagger UI**:

1. Go to http://localhost:8000/docs
2. Click "Authorize" button
3. Enter credentials: `admin@hrm.com` / `admin`
4. Click "Authorize"
5. Test any protected endpoint

**Using curl**:

```powershell
# Login
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login/json" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@hrm.com","password":"admin"}'

$token = $response.access_token

# Get current user
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/users/me" `
  -Headers @{"Authorization" = "Bearer $token"}
```

## Verification Checklist

- [ ] Python dependencies installed
- [ ] MySQL database created
- [ ] `.env` file configured
- [ ] Database seeded with initial data
- [ ] Server running on http://localhost:8000
- [ ] Swagger UI accessible
- [ ] Can login with admin credentials
- [ ] Protected endpoints require authentication

## Troubleshooting

### Module Import Errors

If you see "Import X could not be resolved":

```powershell
# Make sure virtual environment is activated
venv\Scripts\activate

# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

### MySQL Connection Error

```
sqlalchemy.exc.OperationalError: (pymysql.err.OperationalError) (2003, "Can't connect to MySQL server")
```

**Solution**: Check MySQL service is running:

```powershell
# Check if MySQL is running
Get-Service MySQL*

# Start MySQL service
Start-Service MySQL80
```

### Database Already Exists Error

If `seed_db.py` fails because tables already exist:

```powershell
# Drop and recreate database
mysql -u root -p
DROP DATABASE hrm_db;
CREATE DATABASE hrm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit

# Run seed again
python seed_db.py
```

### CORS Errors from Frontend

If frontend shows CORS errors:

1. Verify `ALLOWED_ORIGINS` in `.env` includes your frontend URL
2. Restart backend server after changing `.env`

## Next Steps

### Connect Frontend to Backend

1. **Install axios in frontend**:

   ```powershell
   cd "d:\Frontend class\LFB\hrm"
   npm install axios
   ```

2. **Create API service** (`src/services/backendApi.js`):

   ```javascript
   import axios from "axios";

   const api = axios.create({
     baseURL: "http://localhost:8000/api/v1",
     headers: {
       "Content-Type": "application/json",
     },
   });

   // Add token to requests
   api.interceptors.request.use((config) => {
     const token = localStorage.getItem("access_token");
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });

   export default api;
   ```

3. **Update AuthContext** to use backend API instead of MockData

4. **Replace localStorage calls** with API calls in all components

## Production Deployment

For production deployment with Gunicorn:

```powershell
pip install gunicorn

gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

For Docker deployment, see `README.md`.
