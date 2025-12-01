# """
# Database seeding script - Create initial admin user and sample data
# """
import sys
from datetime import date, datetime, timedelta
from app.config.database import SessionLocal, create_tables
from app.models.models import User, Department, Attendance, Leave
from app.utils.auth import get_password_hash


def seed_database():
    # Seed database with initial data
    db = SessionLocal()
    
    try:
        print("🌱 Starting database seeding...")
        
        # Create tables
        create_tables()
        print("✅ Tables created")
        
        # Check if admin exists
        existing_admin = db.query(User).filter(User.email == "admin@hrm.com").first()
        if existing_admin:
            print("⚠️  Admin user already exists, skipping seed")
            return
        
        # Create superadmin
        admin = User(
            id="ADMIN001",
            email="admin@hrm.com",
            password=get_password_hash("admin"),
            name="System Administrator",
            role="superadmin",
            phone="+977-9800000000",
            address="Kathmandu, Nepal",
            department="IT",
            position="System Administrator",
            salary=100000,
            dob_ad=date(1990, 1, 1),
            dob_bs="2046-09-17",
            join_date=date(2020, 1, 1),
            status="Active"
        )
        db.add(admin)
        print("✅ Created superadmin account (admin@hrm.com / admin)")
        
        # Create HR account
        hr_user = User(
            id="HR001",
            email="hr@hrm.com",
            password=get_password_hash("password123"),
            name="HR Manager",
            role="hr",
            phone="+977-9800000001",
            address="Lalitpur, Nepal",
            department="Human Resources",
            position="HR Manager",
            salary=80000,
            dob_ad=date(1985, 5, 15),
            dob_bs="2042-02-02",
            join_date=date(2020, 6, 1),
            status="Active"
        )
        db.add(hr_user)
        print("✅ Created HR account (hr@hrm.com / password123)")
        
        # Create sample departments
        departments = [
            Department(id="DEPT001", name="IT", description="Information Technology", head_of_department="John Doe"),
            Department(id="DEPT002", name="HR", description="Human Resources", head_of_department="Jane Smith"),
            Department(id="DEPT003", name="Finance", description="Finance and Accounting", head_of_department="Bob Johnson"),
            Department(id="DEPT004", name="Sales", description="Sales and Marketing", head_of_department="Alice Brown"),
        ]
        for dept in departments:
            db.add(dept)
        print(f"✅ Created {len(departments)} departments")
        
        # Create sample employees
        employees = [
            {
                "id": "EMP001",
                "email": "john.doe@hrm.com",
                "name": "John Doe",
                "department": "IT",
                "position": "Software Engineer",
                "salary": 60000
            },
            {
                "id": "EMP002",
                "email": "jane.smith@hrm.com",
                "name": "Jane Smith",
                "department": "HR",
                "position": "HR Specialist",
                "salary": 55000
            },
            {
                "id": "EMP003",
                "email": "bob.johnson@hrm.com",
                "name": "Bob Johnson",
                "department": "Finance",
                "position": "Accountant",
                "salary": 58000
            },
        ]
        
        for emp_data in employees:
            employee = User(
                **emp_data,
                password=get_password_hash("password123"),
                role="employee",
                phone="+977-98000000XX",
                address="Kathmandu, Nepal",
                dob_ad=date(1995, 1, 1),
                dob_bs="2051-09-17",
                join_date=date(2021, 1, 1),
                status="Active"
            )
            db.add(employee)
        print(f"✅ Created {len(employees)} sample employees (password123)")
        
        # Create sample attendance records for last 7 days
        today = date.today()
        for i in range(7):
            att_date = today - timedelta(days=i)
            for emp_data in employees:
                attendance = Attendance(
                    user_id=emp_data["id"],
                    date=att_date,
                    check_in="09:00 AM",
                    check_out="06:00 PM",
                    status="Present" if i < 6 else "Late",
                    late_reason="Traffic" if i == 6 else None
                )
                db.add(attendance)
        print("✅ Created sample attendance records")
        
        # Create sample leave request
        leave = Leave(
            id="LV001",
            user_id="EMP001",
            type="Casual Leave",
            start_date=today + timedelta(days=5),
            end_date=today + timedelta(days=7),
            start_date_bs="2081-08-20",
            end_date_bs="2081-08-22",
            reason="Family function",
            status="Pending",
            half_day=False
        )
        db.add(leave)
        print("✅ Created sample leave request")
        
        # Commit all changes
        db.commit()
        print("\n✨ Database seeding completed successfully!")
        print("\n📝 Login Credentials:")
        print("   Superadmin: admin@hrm.com / admin")
        print("   HR: hr@hrm.com / password123")
        print("   Employee: john.doe@hrm.com / password123")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
