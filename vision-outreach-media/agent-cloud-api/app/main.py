from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.session import Base, engine
from app.routers import auth, clients, cycles, tickets
from app.services.scheduler import start_scheduler

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(clients.router)
app.include_router(tickets.router)
app.include_router(cycles.router)


@app.on_event("startup")
def on_startup():
    if settings.enable_scheduler:
        start_scheduler(settings.cycle_interval_hours)


@app.get("/")
def root():
    return {
        "name": settings.app_name,
        "status": "online",
        "message": "Autonomous business agent, checking in on schedule.",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
