from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.deps import get_current_user
from app.models.entities import Client, User
from app.schemas import ClientCreate, ClientOut

router = APIRouter(prefix="/clients", tags=["clients"])


def get_owned_client(client_id: int, db: Session, user: User) -> Client:
    client = db.query(Client).filter(Client.id == client_id, Client.owner_id == user.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.post("", response_model=ClientOut)
def create_client(payload: ClientCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    client = Client(owner_id=user.id, name=payload.name, niche=payload.niche, profile=payload.profile)
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@router.get("", response_model=list[ClientOut])
def list_clients(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Client).filter(Client.owner_id == user.id).all()


@router.get("/{client_id}", response_model=ClientOut)
def get_client(client_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return get_owned_client(client_id, db, user)


@router.patch("/{client_id}/profile", response_model=ClientOut)
def update_profile(client_id: int, profile: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    client = get_owned_client(client_id, db, user)
    client.profile = {**(client.profile or {}), **profile}
    db.commit()
    db.refresh(client)
    return client
