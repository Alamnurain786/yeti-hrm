"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


class UserRole(str, Enum):
    SUPERADMIN = "superadmin"
    HR = "hr"
    EMPLOYEE = "employee"


class UserStatus(str, Enum):
    ACTIVE = "Active"
    DEACTIVE = "Deactive"
    RESIGNED = "Resigned"


class AttendanceStatus(str, Enum):
    PRESENT = "Present"
    LATE = "Late"
    ABSENT = "Absent"


class LeaveStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"


# ============= User Schemas =============
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole = UserRole.EMPLOYEE
    phone: Optional[str] = None
    address: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    salary: Optional[float] = None
    dob_ad: Optional[date] = None
    dob_bs: Optional[str] = None
    join_date: Optional[date] = None
    status: UserStatus = UserStatus.ACTIVE


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    salary: Optional[float] = None
    status: Optional[UserStatus] = None
    resignation_date: Optional[date] = None


class UserResponse(UserBase):
    id: str
    profile_image: Optional[str] = None
    resignation_date: Optional[date] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ============= Department Schemas =============
class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    head_of_department: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    head_of_department: Optional[str] = None


class DepartmentResponse(DepartmentBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============= Attendance Schemas =============
class AttendanceBase(BaseModel):
    user_id: str
    date: date
    check_in: str
    check_out: Optional[str] = None
    status: AttendanceStatus
    late_reason: Optional[str] = None


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    check_out: Optional[str] = None
    status: Optional[AttendanceStatus] = None
    late_reason: Optional[str] = None


class AttendanceResponse(AttendanceBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============= Leave Schemas =============
class LeaveBase(BaseModel):
    type: str
    start_date: date
    end_date: date
    start_date_bs: Optional[str] = None
    end_date_bs: Optional[str] = None
    reason: str
    half_day: bool = False


class LeaveCreate(LeaveBase):
    pass


class LeaveUpdate(BaseModel):
    status: LeaveStatus
    approved_by: Optional[str] = None


class LeaveResponse(LeaveBase):
    id: str
    user_id: str
    status: LeaveStatus
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============= Payroll Schemas =============
class PayrollBase(BaseModel):
    user_id: str
    month: str
    basic_salary: float
    allowances: float = 0
    deductions: float = 0
    net_salary: float


class PayrollCreate(PayrollBase):
    pass


class PayrollUpdate(BaseModel):
    basic_salary: Optional[float] = None
    allowances: Optional[float] = None
    deductions: Optional[float] = None
    net_salary: Optional[float] = None
    paid_date: Optional[date] = None
    status: Optional[str] = None


class PayrollResponse(PayrollBase):
    id: int
    paid_date: Optional[date] = None
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============= Dashboard Config Schemas =============
class DashboardConfigBase(BaseModel):
    role: str
    config: str  # JSON string


class DashboardConfigCreate(DashboardConfigBase):
    pass


class DashboardConfigResponse(DashboardConfigBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============= Role Schemas =============
class RoleBase(BaseModel):
    title: str
    department_id: str
    level: str
    min_salary: float
    max_salary: float
    description: Optional[str] = None


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    title: Optional[str] = None
    department_id: Optional[str] = None
    level: Optional[str] = None
    min_salary: Optional[float] = None
    max_salary: Optional[float] = None
    description: Optional[str] = None


class RoleResponse(RoleBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True
