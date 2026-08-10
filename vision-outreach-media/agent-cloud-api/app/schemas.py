from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ClientCreate(BaseModel):
    name: str
    niche: str = "youtube_channel"
    profile: dict | None = None


class ClientOut(ClientCreate):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


class TicketOut(BaseModel):
    id: int
    title: str
    rationale: str | None
    risk: str
    status: str
    payload: dict | None
    decision_note: str | None
    created_at: datetime
    decided_at: datetime | None

    class Config:
        from_attributes = True


class TicketDecision(BaseModel):
    decision: str = Field(description="approve | reject | redirect")
    note: str | None = None


class AgentRunOut(BaseModel):
    id: int
    summary: str | None
    tickets_created: int
    ran_at: datetime

    class Config:
        from_attributes = True
