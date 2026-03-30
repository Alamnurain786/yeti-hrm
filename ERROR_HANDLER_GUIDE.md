# Centralized Error Handler Documentation

## Overview

The backend now uses a **centralized error handling system** that provides consistent error responses across all endpoints. Validation errors are handled server-side and displayed to the user via toast notifications.

**Key Changes:**

- ✅ All validation is performed on the backend (Pydantic schemas)
- ✅ Frontend validation removed from forms (Departments, Company Settings, Settings, etc.)
- ✅ Consistent error response format across all endpoints
- ✅ Field-level validation errors returned in response payload
- ✅ Error messages displayed to users in toast notifications

---

## Error Response Format

All error responses follow a consistent structure:

```json
{
  "success": false,
  "status_code": 422,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Form validation failed. Please check the errors below.",
    "details": {
      "errors": {
        "name": "name is required",
        "code": "Company code must use lowercase letters, numbers, and hyphens only",
        "email": "email must be a valid email"
      }
    },
    "path": "/api/v1/companies"
  }
}
```

### Response Structure

| Field           | Type    | Description                                                                              |
| --------------- | ------- | ---------------------------------------------------------------------------------------- |
| `success`       | boolean | Whether the request was successful (always `false` for errors)                           |
| `status_code`   | integer | HTTP status code                                                                         |
| `error.code`    | string  | Machine-readable error code (e.g., `VALIDATION_ERROR`, `NOT_FOUND`, `PERMISSION_DENIED`) |
| `error.message` | string  | Human-readable error message                                                             |
| `error.details` | object  | Additional error details (validation errors, context, etc.)                              |
| `error.path`    | string  | Request path where the error occurred                                                    |

---

## Error Codes

| Code                    | Status | Description               | Example                                   |
| ----------------------- | ------ | ------------------------- | ----------------------------------------- |
| `VALIDATION_ERROR`      | 422    | Form validation failed    | Field errors, data type mismatch          |
| `NOT_FOUND`             | 404    | Resource not found        | Company/User not found                    |
| `PERMISSION_DENIED`     | 403    | User lacks permissions    | Insufficient access level                 |
| `BUSINESS_LOGIC_ERROR`  | 400    | Business logic violation  | Cannot perform action on inactive company |
| `DATABASE_ERROR`        | 500    | Database operation failed | SQL errors, connection issues             |
| `INTERNAL_SERVER_ERROR` | 500    | Unexpected server error   | Unhandled exceptions                      |

---

## Backend Implementation

### File: `backend/app/core/error_handler.py`

This module contains all error handling logic:

**Exception Classes:**

- `AppException` - Base application exception
- `ValidationException` - Validation errors (422)
- `NotFoundException` - Resource not found (404)
- `PermissionException` - Permission denied (403)
- `BusinessLogicException` - Business logic errors (400)

**Exception Handlers:**

- `app_exception_handler()` - Handles custom app exceptions
- `validation_exception_handler()` - Handles Pydantic validation errors
- `generic_exception_handler()` - Handles unhandled exceptions
- `database_exception_handler()` - Handles database errors

**Helper Functions:**

- `format_error_response()` - Format error into response payload
- `format_validation_errors()` - Convert Pydantic errors to field-level errors
- `raise_validation_error()` - Raise validation exception
- `raise_not_found()` - Raise not found exception
- `raise_permission_denied()` - Raise permission exception
- `raise_business_error()` - Raise business logic exception

### Registration in `main.py`

```python
from app.core.error_handler import register_exception_handlers

app = FastAPI(title=settings.app_name, lifespan=lifespan)

# Register centralized error handlers
register_exception_handlers(app)
```

---

## Using Error Handlers in Endpoints

### Example 1: Validation Error

```python
from app.core.error_handler import raise_validation_error

@router.post("/departments")
def create_department(data: DepartmentCreate, db: Session):
    if db.query(Department).filter(Department.name == data.name).first():
        raise_validation_error(
            "Department name already exists",
            {"name": "This department name is already in use"}
        )
    # ... create department
```

**Frontend Response:**

```json
{
  "success": false,
  "status_code": 422,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Department name already exists",
    "details": {
      "errors": {
        "name": "This department name is already in use"
      }
    }
  }
}
```

### Example 2: Not Found Error

```python
from app.core.error_handler import raise_not_found

@router.get("/users/{user_id}")
def get_user(user_id: str, db: Session):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise_not_found("User", user_id)
    # ... return user
```

**Response:**

```json
{
  "success": false,
  "status_code": 404,
  "error": {
    "code": "NOT_FOUND",
    "message": "User with ID abc123 not found",
    "details": {
      "resource": "User"
    }
  }
}
```

### Example 3: Permission Error

```python
from app.core.error_handler import raise_permission_denied

@router.delete("/users/{user_id}")
def delete_user(user_id: str, current_user: User, db: Session):
    if current_user.role != "admin":
        raise_permission_denied("Only admins can delete users")
    # ... delete user
```

### Example 4: Business Logic Error

```python
from app.core.error_handler import raise_business_error

@router.post("/companies/{id}/activate")
def activate_company(id: str, db: Session):
    company = db.query(Company).filter(Company.id == id).first()
    if company.status == "ARCHIVED":
        raise_business_error(
            "Cannot activate archived company",
            {"status": "Company is archived and must be restored first"}
        )
    # ... activate company
```

---

## Frontend Implementation

### Handling Error Responses

All frontend API calls should handle errors by extracting from the new response format:

**Pattern:**

```javascript
try {
  const response = await API.create(data);
  showToast("success", "Created successfully");
} catch (error) {
  const errorMsg =
    error?.response?.data?.error?.message ||
    error?.response?.data?.detail ||
    "Operation failed";
  showToast("error", errorMsg, { title: "Error" });
}
```

**With Validation Errors:**

```javascript
try {
  await API.create(data);
} catch (error) {
  const backendErrors = error?.response?.data?.error?.details?.errors || {};

  if (Object.keys(backendErrors).length > 0) {
    // Display validation errors
    for (const [field, message] of Object.entries(backendErrors)) {
      showToast("error", `${field}: ${message}`);
    }
  } else {
    // Display generic error
    showToast(
      "error",
      error?.response?.data?.error?.message || "Operation failed",
    );
  }
}
```

### Updated Pages

**Pages with frontend validation removed:**

- ✅ `src/pages/Departments.jsx` - Removed name validation
- ✅ `src/pages/Settings.jsx` - Removed password validation
- ✅ `src/pages/CompanySettings.jsx` - Removed company form validation

**All validation now happens on the backend** and errors are displayed via toast messages.

---

## Pydantic Schema Validation

Validation in Pydantic schemas is automatically handled by the error handler:

```python
from pydantic import BaseModel, field_validator

class CompanyCreate(BaseModel):
    name: str
    code: str
    email: EmailStr

    @field_validator("code")
    def validate_code(cls, value):
        if not value.startswith("C"):
            raise ValueError("Code must start with 'C'")
        return value
```

**Request:**

```json
{
  "name": "Acme Corp",
  "code": "invalid-code",
  "email": "contact@acme.com"
}
```

**Response (422):**

```json
{
  "success": false,
  "status_code": 422,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Form validation failed. Please check the errors below.",
    "details": {
      "errors": {
        "code": "Code must start with 'C'"
      }
    }
  }
}
```

---

## Migration Guide

### Backend: Adding Error Handling to Endpoints

**Before:**

```python
@router.post("/departments")
def create_department(data: DepartmentCreate, db: Session):
    dept = Department(name=data.name)
    db.add(dept)
    db.commit()
    return dept
```

**After (with validation):**

```python
from app.core.error_handler import raise_validation_error, raise_not_found

@router.post("/departments")
def create_department(data: DepartmentCreate, db: Session):
    # Check for duplicates
    existing = db.query(Department).filter(Department.name == data.name).first()
    if existing:
        raise_validation_error(
            "Department already exists",
            {"name": "This name is already in use"}
        )

    dept = Department(name=data.name)
    db.add(dept)
    db.commit()
    return dept

@router.get("/departments/{dept_id}")
def get_department(dept_id: str, db: Session):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise_not_found("Department", dept_id)
    return dept
```

### Frontend: Removing Client-Side Validation

**Before:**

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();

  // Frontend validation
  if (!formData.name.trim()) {
    showToast("error", "Name is required", { title: "Validation Error" });
    return;
  }

  try {
    await API.create(formData);
  } catch (error) {
    showToast("error", error.message);
  }
};
```

**After:**

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    await API.create(formData);
    showToast("success", "Created successfully");
  } catch (error) {
    const errorMsg =
      error?.response?.data?.error?.message ||
      error?.response?.data?.detail ||
      "Operation failed";
    showToast("error", errorMsg, { title: "Error" });
  }
};
```

---

## Best Practices

### Backend

1. **Validate in Schemas** - Use Pydantic validators for most validation
2. **Use Helper Functions** - Call `raise_validation_error()`, `raise_not_found()`, etc.
3. **Provide Context** - Include helpful error details for debugging
4. **Log Errors** - Error handler automatically logs to Python logger
5. **Don't Expose Internals** - Database errors are sanitized before returning to client

### Frontend

1. **Remove Client-Side Validation** - Rely on backend validation
2. **Handle Backend Errors** - Extract from `error.response.data.error`
3. **Show User-Friendly Messages** - Display error messages from backend
4. **Handle Network Errors** - Check for `error?.response` before accessing response data
5. **Use Consistent Error Display** - Always use toast notifications for errors

---

## Testing Error Responses

### Test Validation Error

```bash
curl -X POST http://localhost:8000/api/v1/departments \
  -H "Content-Type: application/json" \
  -d '{"name": ""}'
```

Response:

```json
{
  "success": false,
  "status_code": 422,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Form validation failed. Please check the errors below.",
    "details": {
      "errors": {
        "name": "Field required"
      }
    }
  }
}
```

### Test Not Found Error

```bash
curl http://localhost:8000/api/v1/users/nonexistent-id
```

Response:

```json
{
  "success": false,
  "status_code": 404,
  "error": {
    "code": "NOT_FOUND",
    "message": "User with ID nonexistent-id not found",
    "details": {
      "resource": "User"
    }
  }
}
```

---

## Common Error Scenarios

### Scenario 1: Email Already Exists

**Backend:**

```python
if db.query(User).filter(User.email == data.email).first():
    raise_validation_error(
        "Email is already registered",
        {"email": "This email is already in use"}
    )
```

**Frontend Toast:**

```
Error: Email is already registered
```

### Scenario 2: Insufficient Permissions

**Backend:**

```python
if user.role != "admin":
    raise_permission_denied("Only admins can edit users")
```

**Frontend Toast:**

```
Error: Only admins can edit users
```

### Scenario 3: Multiple Field Errors

**Backend:**

```python
errors = {}
if not data.name.strip():
    errors["name"] = "Name is required"
if len(data.password) < 8:
    errors["password"] = "Password must be at least 8 characters"

if errors:
    raise_validation_error("Form has errors", errors)
```

**Frontend Toast:**

```
Error: Form has errors
```

---

## Files Modified/Created

| File                                | Type     | Change                                                         |
| ----------------------------------- | -------- | -------------------------------------------------------------- |
| `backend/app/core/error_handler.py` | Created  | Centralized error handling module                              |
| `backend/app/main.py`               | Modified | Registered error handlers                                      |
| `src/pages/Departments.jsx`         | Modified | Removed frontend validation                                    |
| `src/pages/Settings.jsx`            | Modified | Removed frontend validation                                    |
| `src/pages/CompanySettings.jsx`     | Modified | Removed frontend validation, removed companyValidation imports |

---

## Next Steps

1. **Update remaining forms** - Apply same pattern to all form submissions
2. **Add unit tests** - Test error handler with various scenarios
3. **Monitor logs** - Watch for patterns in error messages
4. **Document API errors** - Add to API documentation which endpoints can return which errors
5. **Enhance frontend UI** - Consider field-level error displays if backend returns field errors

---

## Support

For questions or issues with the error handling system:

1. Check this documentation
2. Review examples in `backend/app/core/error_handler.py`
3. Check existing endpoint implementations for patterns
4. Test with curl/Postman to understand response format
