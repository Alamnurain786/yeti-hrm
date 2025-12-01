"""
Attendance management routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.config.database import get_db
from app.models.models import User, Attendance
from app.schemas.schemas import AttendanceResponse, AttendanceCreate, AttendanceUpdate
from app.middleware.auth_middleware import get_current_active_user, require_role

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.get("/", response_model=List[AttendanceResponse])
async def get_attendance_records(
    user_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get attendance records with optional filters
    Employees can only see their own records
    HR/Superadmin can see all records
    """
    query = db.query(Attendance)
    
    # Filter by user
    if current_user.role == "employee":
        # Employees can only see their own attendance
        query = query.filter(Attendance.user_id == current_user.id)
    elif user_id:
        # HR/Superadmin can filter by user_id
        query = query.filter(Attendance.user_id == user_id)
    
    # Filter by date range
    if start_date:
        query = query.filter(Attendance.date >= start_date)
    if end_date:
        query = query.filter(Attendance.date <= end_date)
    
    records = query.order_by(Attendance.date.desc()).all()
    return records


@router.get("/my", response_model=List[AttendanceResponse])
async def get_my_attendance(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's attendance records"""
    query = db.query(Attendance).filter(Attendance.user_id == current_user.id)
    
    if start_date:
        query = query.filter(Attendance.date >= start_date)
    if end_date:
        query = query.filter(Attendance.date <= end_date)
    
    records = query.order_by(Attendance.date.desc()).all()
    return records


@router.post("/", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
async def create_attendance(
    attendance_data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["hr", "superadmin"]))
):
    """Create attendance record (HR/Superadmin only)"""
    # Check if attendance already exists for this user on this date
    existing = db.query(Attendance).filter(
        Attendance.user_id == attendance_data.user_id,
        Attendance.date == attendance_data.date
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance record already exists for this date"
        )
    
    # Verify user exists
    user = db.query(User).filter(User.id == attendance_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db_attendance = Attendance(**attendance_data.model_dump())
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance


@router.put("/{attendance_id}", response_model=AttendanceResponse)
async def update_attendance(
    attendance_id: int,
    attendance_update: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["hr", "superadmin"]))
):
    """Update attendance record (HR/Superadmin only)"""
    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found"
        )
    
    update_data = attendance_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(attendance, field, value)
    
    db.commit()
    db.refresh(attendance)
    return attendance


@router.delete("/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["superadmin"]))
):
    """Delete attendance record (Superadmin only)"""
    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found"
        )
    
    db.delete(attendance)
    db.commit()
    return None
