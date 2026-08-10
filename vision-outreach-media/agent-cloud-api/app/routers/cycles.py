from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.deps import get_current_user
from app.models.entities import AgentRun, User
from app.routers.clients import get_owned_client
from app.schemas import AgentRunOut
from app.services.cycle_engine import run_cycle_for_client

router = APIRouter(prefix="/clients/{client_id}/cycles", tags=["cycles"])


@router.post("/run", response_model=AgentRunOut)
def run_cycle_now(client_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Manual trigger - the same function the scheduler calls automatically.
    Use this to test a client's agent on demand before trusting the schedule."""
    client = get_owned_client(client_id, db, user)
    return run_cycle_for_client(db, client)


@router.get("", response_model=list[AgentRunOut])
def list_cycles(client_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    get_owned_client(client_id, db, user)
    return (
        db.query(AgentRun)
        .filter(AgentRun.client_id == client_id)
        .order_by(AgentRun.ran_at.desc())
        .all()
    )
