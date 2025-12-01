# """
# Department management routes
# """
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.config.database import get_db
from app.models.models import User, Department
from app.schemas.schemas import DepartmentResponse, DepartmentCreate, DepartmentUpdate
from app.middleware.auth_middleware import get_current_active_user, require_role

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get("/", response_model=List[DepartmentResponse])
async def get_all_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all departments"""
    departments = db.query(Department).all()
    return departments


@router.get("/{dept_id}", response_model=DepartmentResponse)
async def get_department(
    dept_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get department by ID"""
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    return dept


@router.post("/", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(
    dept_data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["hr", "superadmin"]))
):
    """Create new department (HR/Superadmin only)"""
    # Check if department name already exists
    existing = db.query(Department).filter(Department.name == dept_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department name already exists"
        )
    
    import time
    dept_id = f"DEPT{str(int(time.time()))[-4:]}"
    
    db_dept = Department(
        id=dept_id,
        **dept_data.model_dump()
    )
    
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept


@router.put("/{dept_id}", response_model=DepartmentResponse)
async def update_department(
    dept_id: str,
    dept_update: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["hr", "superadmin"]))
):
    """Update department (HR/Superadmin only)"""
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    
    update_data = dept_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(dept, field, value)
    
    db.commit()
    db.refresh(dept)
    return dept


@router.delete("/{dept_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(
    dept_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["superadmin"]))
):
    """Delete department (Superadmin only)"""
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    
    # Check if any users are assigned to this department
    users_count = db.query(User).filter(User.department == dept.name).count()
    if users_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete department. {users_count} employees are assigned to it."
        )
    
    db.delete(dept)
    db.commit()
    return None
