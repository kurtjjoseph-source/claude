from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.deps import get_current_user
from app.models.entities import Ticket, User
from app.routers.clients import get_owned_client
from app.schemas import TicketDecision, TicketOut

router = APIRouter(prefix="/clients/{client_id}/tickets", tags=["tickets"])


@router.get("", response_model=list[TicketOut])
def list_tickets(
    client_id: int,
    status: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    get_owned_client(client_id, db, user)
    query = db.query(Ticket).filter(Ticket.client_id == client_id)
    if status:
        query = query.filter(Ticket.status == status)
    return query.order_by(Ticket.created_at.desc()).all()


@router.post("/{ticket_id}/decision", response_model=TicketOut)
def decide_ticket(
    client_id: int,
    ticket_id: int,
    payload: TicketDecision,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    get_owned_client(client_id, db, user)
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id, Ticket.client_id == client_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if payload.decision == "approve":
        ticket.status = "approved"
    elif payload.decision == "reject":
        ticket.status = "rejected"
    elif payload.decision == "redirect":
        ticket.status = "backlog"
    else:
        raise HTTPException(status_code=400, detail="decision must be 'approve', 'reject', or 'redirect'")

    ticket.decision_note = payload.note
    ticket.decided_at = datetime.utcnow()
    db.commit()
    db.refresh(ticket)
    return ticket
