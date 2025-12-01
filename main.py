# """
# FastAPI main application
# """
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.config.database import create_tables
from app.routes import auth, users, attendance, leaves, departments, roles

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Human Resource Management System API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(users.router, prefix=settings.API_PREFIX)
app.include_router(attendance.router, prefix=settings.API_PREFIX)
app.include_router(leaves.router, prefix=settings.API_PREFIX)
app.include_router(departments.router, prefix=settings.API_PREFIX)
app.include_router(roles.router, prefix=settings.API_PREFIX)


@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup"""
    create_tables()
    print("✅ Database tables created successfully")
    print(f"✅ Server running on http://localhost:8000")
    print(f"✅ API Documentation: http://localhost:8000/docs")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "HRM System API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

