# """
# Leave management routes
# """
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.config.database import get_db
from app.models.models import User, Leave
from app.schemas.schemas import LeaveResponse, LeaveCreate, LeaveUpdate
from app.middleware.auth_middleware import get_current_active_user, require_role

router = APIRouter(prefix="/leaves", tags=["Leaves"])


@router.get("/", response_model=List[LeaveResponse])
async def get_leave_requests(
    status_filter: Optional[str] = None,
    user_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # """
    # Get leave requests
    # Employees see only their own requests
    # HR/Superadmin see all requests
    # """
    query = db.query(Leave)
    
    # Filter by user role
    if current_user.role == "employee":
        query = query.filter(Leave.user_id == current_user.id)
    elif user_id:
        query = query.filter(Leave.user_id == user_id)
    
    # Filter by status
    if status_filter:
        query = query.filter(Leave.status == status_filter)
    
    leaves = query.order_by(Leave.created_at.desc()).all()
    return leaves


@router.get("/my", response_model=List[LeaveResponse])
async def get_my_leaves(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's leave requests"""
    leaves = db.query(Leave).filter(Leave.user_id == current_user.id).order_by(Leave.created_at.desc()).all()
    return leaves


@router.post("/", response_model=LeaveResponse, status_code=status.HTTP_201_CREATED)
async def create_leave_request(
    leave_data: LeaveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create leave request"""
    import time
    leave_id = f"LV{str(int(time.time()))[-6:]}"
    
    db_leave = Leave(
        id=leave_id,
        user_id=current_user.id,
        **leave_data.model_dump()
    )
    
    db.add(db_leave)
    db.commit()
    db.refresh(db_leave)
    return db_leave


@router.put("/{leave_id}", response_model=LeaveResponse)
async def update_leave_status(
    leave_id: str,
    leave_update: LeaveUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["hr", "superadmin"]))
):
    """Update leave request status (Approve/Reject) - HR/Superadmin only"""
    leave = db.query(Leave).filter(Leave.id == leave_id).first()
    if not leave:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found"
        )
    
    # Update status
    leave.status = leave_update.status
    leave.approved_by = current_user.name
    leave.approved_at = datetime.utcnow()
    
    db.commit()
    db.refresh(leave)
    return leave


@router.delete("/{leave_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_leave_request(
    leave_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete leave request (own requests or HR/Superadmin)"""
    leave = db.query(Leave).filter(Leave.id == leave_id).first()
    if not leave:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found"
        )
    
    # Only owner or HR/Superadmin can delete
    if leave.user_id != current_user.id and current_user.role not in ["hr", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this leave request"
        )
    
    db.delete(leave)
    db.commit()
    return None
