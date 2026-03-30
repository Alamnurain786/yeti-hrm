# Backend Validation Module Guide

## Overview

The centralized validation module (`backend/app/core/validators.py`) provides reusable validators and normalization utilities for all form validation across the backend.

**Key Benefits:**

- ✅ Single source of truth for validation rules
- ✅ Consistent validation across all endpoints
- ✅ Easy to maintain and update rules
- ✅ Type-safe with clear docstrings
- ✅ Reusable in both Pydantic schemas and endpoint logic

---

## How It Works

### 1. **String Normalization**

```python
from app.core.validators import clean_optional_string, strip_optional_string

# Remove whitespace and return None if empty
result = clean_optional_string("  hello  ")  # Returns "hello"
result = clean_optional_string("   ")       # Returns None

# Just strip whitespace
result = strip_optional_string("  hello  ")  # Returns "hello"
```

### 2. **Phone & Tax Number Validation**

```python
from app.core.validators import validate_phone_number, validate_tax_number

# Phone validation (returns cleaned value or None)
phone = validate_phone_number("+977 9841234567")  # Valid
phone = validate_phone_number("invalid")          # Raises ValueError

# Tax validation (returns uppercase or None)
tax = validate_tax_number("101-234-567-89")   # Valid - returns "101-234-567-89"
tax = validate_tax_number("invalid-tax")      # Raises ValueError
```

### 3. **Company-Specific Validation**

```python
from app.core.validators import (
    validate_company_code,
    validate_website_url
)

# Company code (lowercase-hyphenated)
code = validate_company_code("my-company")     # Valid
code = validate_company_code("My-Company")     # Raises ValueError (uppercase)

# Website URL
url = validate_website_url("https://example.com")  # Valid
url = validate_website_url("example.com")          # Raises ValueError (no protocol)
```

### 4. **User Status & Role Normalization**

```python
from app.core.validators import (
    normalize_role,
    normalize_status,
    normalize_verification_status
)

# Role normalization (frontend → database)
role = normalize_role("hr")          # Returns "admin"
role = normalize_role("employee")    # Returns "user"
role = normalize_role("superadmin")  # Returns "superadmin"

# Status normalization
status = normalize_status("ACTIVE")     # Returns "ACTIVE"
status = normalize_status("inactive")   # Returns "DEACTIVE"
status = normalize_status("resigned")   # Returns "RESIGNED"

# Verification status
verification = normalize_verification_status("approved")  # Returns "Approved"
verification = normalize_verification_status("unknown")   # Returns "Pending"
```

### 5. **Password Strength Validation**

```python
from app.core.validators import validate_password_strength

# Raises ValueError if requirements not met
try:
    validate_password_strength("Weak123")  # Missing special char
except ValueError as e:
    print(e)  # "Password must contain at least one special character..."

# Valid password
validate_password_strength("Strong@Pass123")  # OK - all requirements met
```

---

## Using in Pydantic Schemas

### Example: Company Schema

**Before (duplicated validators):**

```python
# backend/app/schemas/company.py
import re
from pydantic import BaseModel, field_validator

PHONE_REGEX = re.compile(r"^\+?[0-9][0-9\s-]{6,19}$")
COMPANY_CODE_REGEX = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

class CompanyCreate(BaseModel):
    code: str
    contact_number: str | None = None

    @field_validator("code")
    def validate_code(cls, value):
        if not COMPANY_CODE_REGEX.match(value):
            raise ValueError("Invalid code")
        return value
```

**After (centralized validators):**

```python
# backend/app/schemas/company.py
from pydantic import BaseModel, field_validator
from app.core.validators import (
    validate_company_code,
    validate_phone_number
)

class CompanyCreate(BaseModel):
    code: str
    contact_number: str | None = None

    @field_validator("code")
    def validate_code(cls, value):
        return validate_company_code(value) or value

    @field_validator("contact_number")
    def validate_phone(cls, value):
        return validate_phone_number(value)
```

---

## Using in Endpoints

### Example: User Status Update

**Before (scattered normalization):**

```python
# backend/app/api/v1/endpoints/users.py
def normalize_status_for_db(status: str) -> str:
    upper = status.upper()
    if upper == "ACTIVE":
        return "ACTIVE"
    if upper in {"INACTIVE", "DEACTIVE"}:
        return "DEACTIVE"
    return upper

@router.patch("/{user_id}")
def update_user(user_id: str, data: UserUpdate, db: Session):
    user = db.query(User).filter(User.id == user_id).first()
    if data.status:
        user.status = normalize_status_for_db(data.status)
    # ...
```

**After (centralized validators):**

```python
# backend/app/api/v1/endpoints/users.py
from app.core.validators import normalize_status

@router.patch("/{user_id}")
def update_user(user_id: str, data: UserUpdate, db: Session):
    user = db.query(User).filter(User.id == user_id).first()
    if data.status:
        user.status = normalize_status(data.status)
    # ...
```

---

## Adding New Validators

### Step 1: Define Regex Pattern (if needed)

```python
# In backend/app/core/validators.py
MY_PATTERN = re.compile(r"^pattern-here$")
```

### Step 2: Create Validator Function

```python
def validate_my_field(value: str | None) -> str | None:
    """
    Validate my custom field format.

    Args:
        value: Field value

    Returns:
        Validated value or None

    Raises:
        ValueError: If validation fails
    """
    value = clean_optional_string(value)
    if value and not MY_PATTERN.match(value):
        raise ValueError("My field format is invalid")
    return value
```

### Step 3: Use in Schema or Endpoint

```python
# In a schema file
from app.core.validators import validate_my_field

class MySchema(BaseModel):
    my_field: str | None = None

    @field_validator("my_field")
    def validate_field(cls, value):
        return validate_my_field(value)

# Or in an endpoint
from app.core.validators import validate_my_field

if request_data.my_field:
    request_data.my_field = validate_my_field(request_data.my_field)
```

---

## Available Validators

### String Normalization

- `clean_optional_string(value)` - Strip + return None if empty
- `strip_string(value)` - Strip whitespace from string
- `strip_optional_string(value)` - Strip if string, else return original

### Validation Functions

| Function                               | Input           | Output                | Raises     |
| -------------------------------------- | --------------- | --------------------- | ---------- |
| `validate_phone_number(value)`         | Phone string    | Cleaned phone or None | ValueError |
| `validate_tax_number(value)`           | Tax string      | Uppercase tax or None | ValueError |
| `validate_company_code(value)`         | Code string     | Cleaned code or None  | ValueError |
| `validate_website_url(value)`          | URL string      | Cleaned URL or None   | ValueError |
| `validate_password_strength(value)`    | Password string | None (OK)             | ValueError |
| `validate_username(value)`             | Username string | Cleaned user or None  | ValueError |
| `validate_min_length(value, min_len)`  | String          | Validated string      | ValueError |
| `validate_max_length(value, max_len)`  | String          | Validated string      | ValueError |
| `validate_regex_match(value, pattern)` | String          | Validated string      | ValueError |

### Normalization Functions

| Function                                | Usage                                                        |
| --------------------------------------- | ------------------------------------------------------------ |
| `normalize_role(role)`                  | Convert frontend role to DB format (hr→admin, employee→user) |
| `normalize_status(status)`              | Normalize user status (ACTIVE/INACTIVE/RESIGNED)             |
| `normalize_verification_status(status)` | Normalize approval status (Approved/Rejected/Pending)        |
| `normalize_device_field(value)`         | Strip device field values                                    |
| `normalize_format_field(value)`         | Convert format fields to string                              |

### Regex Patterns

- `PHONE_REGEX` - Phone numbers: `+?[0-9][0-9\s-]{6,19}`
- `TAX_REGEX` - Tax numbers: `[A-Z0-9][A-Z0-9/-]{5,19}`
- `COMPANY_CODE_REGEX` - Company codes: `[a-z0-9]+(?:-[a-z0-9]+)*`
- `EMAIL_REGEX` - Email pattern (use Pydantic's EmailStr instead)
- `USERNAME_REGEX` - Usernames: `[a-zA-Z0-9_-]{3,20}`

---

## Constants

```python
PASSWORD_MIN_LENGTH = 8  # Minimum password length
```

---

## Migration from Old Patterns

### Old → New Mapping

| Old                                              | New                                       |
| ------------------------------------------------ | ----------------------------------------- |
| `_clean_optional_string()` (in schemas)          | `clean_optional_string()` from validators |
| `PHONE_REGEX` (in schemas)                       | Import from validators                    |
| `TAX_REGEX` (in schemas)                         | Import from validators                    |
| `COMPANY_CODE_REGEX` (in schemas)                | Import from validators                    |
| `normalize_role()` (in endpoints)                | Import from validators                    |
| `normalize_status_for_db()` (in endpoints)       | `normalize_status()` from validators      |
| `normalize_verification_status()` (in endpoints) | Import from validators                    |
| Inline validators                                | Use validator functions                   |

---

## Best Practices

1. **Always import from `app.core.validators`** - Never redefine validation logic
2. **Use schema validators for Pydantic models** - Keep logic in field_validator
3. **Use endpoint validators for business logic** - For conditional validation based on DB state
4. **Return early from validators** - Check for None first to avoid TypeErrors
5. **Provide clear error messages** - Use meaningful messages for HTTP responses
6. **Test validators independently** - Add unit tests for complex validators

---

## File Structure

```
backend/
├── app/
│   ├── core/
│   │   ├── validators.py          ← Centralized validation module (NEW)
│   │   ├── security.py
│   │   ├── deps.py
│   │   └── timezone.py
│   ├── schemas/
│   │   ├── company.py             ← Updated to use validators
│   │   ├── device.py              ← Updated to use validators
│   │   ├── user.py
│   │   └── ...
│   └── api/
│       └── v1/
│           └── endpoints/
│               ├── users.py       ← Updated to use validators
│               ├── companies.py
│               └── ...
```

---

## Testing

Example unit test for validators:

```python
# backend/tests/test_validators.py
import pytest
from app.core.validators import validate_company_code, validate_phone_number

def test_validate_company_code_valid():
    assert validate_company_code("my-company") == "my-company"
    assert validate_company_code("  company-1  ") == "company-1"

def test_validate_company_code_invalid():
    with pytest.raises(ValueError):
        validate_company_code("My-Company")  # Uppercase not allowed

def test_validate_phone_number_valid():
    assert validate_phone_number("+977 9841234567") == "+977 9841234567"
    assert validate_phone_number(None) is None

def test_validate_phone_number_invalid():
    with pytest.raises(ValueError):
        validate_phone_number("invalid-phone")
```

---

## Questions?

Refer to the validators module docstrings for detailed documentation on each function:

```bash
cd backend
python -c "from app.core.validators import validate_company_code; help(validate_company_code)"
```
