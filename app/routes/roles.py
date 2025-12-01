"""
Role management routes
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.models import User, Role, Department
from app.schemas.schemas import RoleResponse, RoleCreate, RoleUpdate
from app.middleware.auth_middleware import get_current_active_user, require_role

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.get("/", response_model=List[RoleResponse])
async def get_all_roles(
    department_id: Optional[str] = None,
    level: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    ""Get all roles with optional filters""
    query = db.query(Role)
    
    if department_id:
        query = query.filter(Role.department_id == department_id)
    
    if level:
        query = query.filter(Role.level == level)
    
    roles = query.order_by(Role.created_at.desc()).all()
    return roles


@router.get("/{role_id}", response_model=RoleResponse)
async def get_role_by_id(
    role_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    ""Get a specific role by ID""
    role = db.query(Role).filter(Role.id == role_id).first()
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    return role


@router.post("/", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_data: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["hr", "superadmin"]))
):
    ""Create a new role (HR/Admin only)""
    # Check if department exists
    department = db.query(Department).filter(Department.id == role_data.department_id).first()
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    
    # Generate role ID
    role_id = f"ROLE{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    # Create role
    new_role = Role(
        id=role_id,
        **role_data.model_dump()
    )
    
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    
    return new_role


@router.put("/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: str,
    role_data: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["hr", "superadmin"]))
):
    ""Update a role (HR/Admin only)""
    role = db.query(Role).filter(Role.id == role_id).first()
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    # If department_id is being updated, check if new department exists
    if role_data.department_id:
        department = db.query(Department).filter(Department.id == role_data.department_id).first()
        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found"
            )
    
    # Update role
    update_data = role_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(role, field, value)
    
    db.commit()
    db.refresh(role)
    
    return role


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["superadmin"]))
):
    ""Delete a role (Superadmin only)""
    role = db.query(Role).filter(Role.id == role_id).first()
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    db.delete(role)
    db.commit()
    
    return None
