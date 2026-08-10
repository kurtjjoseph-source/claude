from sqlalchemy.orm import Session
from app.models.entities import AgentRun, Client, Ticket
from app.services.agent_ai import AgentAI

ai = AgentAI()


def _client_memory(client: Client) -> dict:
    return {"name": client.name, "niche": client.niche, "profile": client.profile or {}}


def _recent_runs(db: Session, client_id: int, limit: int = 5) -> list[dict]:
    runs = (
        db.query(AgentRun)
        .filter(AgentRun.client_id == client_id)
        .order_by(AgentRun.ran_at.desc())
        .limit(limit)
        .all()
    )
    return [{"ran_at": r.ran_at.isoformat(), "summary": r.summary} for r in reversed(runs)]


def _open_tickets(db: Session, client_id: int) -> list[dict]:
    tickets = (
        db.query(Ticket)
        .filter(Ticket.client_id == client_id, Ticket.status.in_(["backlog", "proposed", "approved"]))
        .order_by(Ticket.created_at.desc())
        .all()
    )
    return [
        {"id": t.id, "title": t.title, "status": t.status, "risk": t.risk, "decision_note": t.decision_note}
        for t in tickets
    ]


def run_cycle_for_client(db: Session, client: Client) -> AgentRun:
    """The one function both the manual '/cycles/run' endpoint and the
    scheduler call. Runs exactly one check-in cycle end to end."""
    result = ai.run_cycle(
        niche=client.niche,
        client_profile=_client_memory(client),
        recent_runs=_recent_runs(db, client.id),
        open_tickets=_open_tickets(db, client.id),
    )

    tickets_created = 0
    for t in result.get("tickets", []):
        title = (t.get("title") or "Untitled")[:255]
        db.add(Ticket(
            client_id=client.id,
            title=title,
            rationale=t.get("rationale"),
            risk=t.get("risk", "low"),
            status="proposed",
            payload=t.get("payload"),
        ))
        tickets_created += 1

    run = AgentRun(
        client_id=client.id,
        summary=result.get("summary", ""),
        tickets_created=tickets_created,
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run
