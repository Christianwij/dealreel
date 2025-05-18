from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.monitoring import init_monitoring
import os
import time

app = FastAPI(title="DealReel API")

# Initialize Sentry monitoring
init_monitoring(dsn=os.getenv("SENTRY_DSN"))

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add performance monitoring middleware
@app.middleware("http")
async def add_performance_headers(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Import and include routers
from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.documents import router as documents_router
from app.api.qa import router as qa_router

app.include_router(health_router, tags=["health"])
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(documents_router, prefix="/documents", tags=["documents"])
app.include_router(qa_router, prefix="/qa", tags=["qa"])

@app.on_event("startup")
async def startup_event():
    # Initialize any startup tasks here
    pass

@app.on_event("shutdown")
async def shutdown_event():
    # Clean up any resources here
    pass 