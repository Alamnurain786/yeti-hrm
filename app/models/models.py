"""
Database models matching frontend schema
"""
from sqlalchemy import Column, String, Integer, Float, Date, DateTime, Boolean, Enum, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.config.database import Base
import enum


class UserRole(str, enum.Enum):
    SUPERADMIN = "superadmin"
    HR = "hr"
    EMPLOYEE = "employee"


class UserStatus(str, enum.Enum):
    ACTIVE = "Active"
    DEACTIVE = "Deactive"
    RESIGNED = "Resigned"


class AttendanceStatus(str, enum.Enum):
    PRESENT = "Present"
    LATE = "Late"
    ABSENT = "Absent"


class LeaveStatus(str, enum.Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"


class User(Base):
    __tablename__ = "users"
    
    id = Column(String(50), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)  # Hashed password
    name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.EMPLOYEE)
    phone = Column(String(20))
    address = Column(Text)
    department = Column(String(100))
    position = Column(String(100))
    salary = Column(Float)
    dob_ad = Column(Date)  # Date of birth in AD
    dob_bs = Column(String(20))  # Date of birth in BS (Nepali)
    join_date = Column(Date)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE)
    resignation_date = Column(Date, nullable=True)
    profile_image = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    attendance_records = relationship("Attendance", back_populates="user", cascade="all, delete-orphan")
    leave_requests = relationship("Leave", back_populates="user", cascade="all, delete-orphan")


class Department(Base):
    __tablename__ = "departments"
    
    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    head_of_department = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    check_in = Column(String(10))  # Time format: HH:MM AM/PM
    check_out = Column(String(10))
    status = Column(Enum(AttendanceStatus), nullable=False)
    late_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    user = relationship("User", back_populates="attendance_records")
    
    class Config:
        # Composite unique constraint
        __table_args__ = (
            {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4'},
        )


class Leave(Base):
    __tablename__ = "leaves"
    
    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)  # Sick, Casual, Annual, etc.
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    start_date_bs = Column(String(20))  # Nepali date
    end_date_bs = Column(String(20))
    reason = Column(Text, nullable=False)
    status = Column(Enum(LeaveStatus), default=LeaveStatus.PENDING)
    half_day = Column(Boolean, default=False)
    approved_by = Column(String(255), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship
    user = relationship("User", back_populates="leave_requests")


class Payroll(Base):
    __tablename__ = "payroll"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    month = Column(String(20), nullable=False)  # Format: YYYY-MM
    basic_salary = Column(Float, nullable=False)
    allowances = Column(Float, default=0)
    deductions = Column(Float, default=0)
    net_salary = Column(Float, nullable=False)
    paid_date = Column(Date, nullable=True)
    status = Column(String(20), default="Pending")  # Pending, Paid
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class DashboardConfig(Base):
    __tablename__ = "dashboard_config"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    role = Column(String(20), unique=True, nullable=False)
    config = Column(Text, nullable=False)  # JSON string of card configuration
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

