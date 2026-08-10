from apscheduler.schedulers.background import BackgroundScheduler
from app.db.session import SessionLocal
from app.models.entities import Client
from app.services.cycle_engine import run_cycle_for_client

# In-process scheduler, not Celery/Redis - one fewer moving part to operate
# given the low-maintenance hosting goal (see ARCHITECTURE.md).
scheduler = BackgroundScheduler()


def run_all_active_clients() -> None:
    db = SessionLocal()
    try:
        clients = db.query(Client).filter(Client.is_active.is_(True)).all()
        for client in clients:
            run_cycle_for_client(db, client)
    finally:
        db.close()


def start_scheduler(interval_hours: int) -> None:
    scheduler.add_job(run_all_active_clients, "interval", hours=interval_hours, id="agent_cycle", replace_existing=True)
    scheduler.start()
