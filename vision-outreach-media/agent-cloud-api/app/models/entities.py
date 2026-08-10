from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    clients = relationship("Client", back_populates="owner")


class Client(Base):
    """One business the agent works on. 'niche' selects which prompt/tooling
    the cycle engine uses (see services/agent_ai.py NICHE_PROMPTS). Kurt is
    the first row here, testing the youtube_channel niche on himself before
    this is ever sold to someone else."""

    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(255))
    niche: Mapped[str] = mapped_column(String(100), default="youtube_channel")
    profile: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="clients")
    tickets = relationship("Ticket", back_populates="client")
    agent_runs = relationship("AgentRun", back_populates="client")


class Ticket(Base):
    """One proposed or completed unit of work. status flow:
    backlog -> proposed -> approved | rejected  (redirect sends it back to backlog with a note)
    risk is metadata for now (mostly 'low' until a real publish/spend tool
    exists) - 'high' means the agent found an action it cannot execute
    automatically and is surfacing it for manual action instead."""

    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    title: Mapped[str] = mapped_column(String(255))
    rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    risk: Mapped[str] = mapped_column(String(20), default="low")
    status: Mapped[str] = mapped_column(String(20), default="proposed", index=True)
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    decision_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    client = relationship("Client", back_populates="tickets")


class AgentRun(Base):
    """Log of one check-in cycle. summary is the agent's own short report of
    what changed - shown in the digest and fed back as context next cycle."""

    __tablename__ = "agent_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    tickets_created: Mapped[int] = mapped_column(Integer, default=0)
    ran_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    client = relationship("Client", back_populates="agent_runs")
