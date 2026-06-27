import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.team import TeamCreate, TeamJoin, TeamResponse
from app.services.team_service import create_team, join_team, get_my_team

router = APIRouter(prefix="/teams", tags=["Teams"])


@router.post("/{hackathon_id}", response_model=TeamResponse, status_code=201)
async def create(
    hackathon_id: uuid.UUID,
    data: TeamCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await create_team(hackathon_id, data, current_user, db)


@router.post("/{hackathon_id}/join", response_model=TeamResponse)
async def join(
    hackathon_id: uuid.UUID,
    data: TeamJoin,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await join_team(hackathon_id, data.invite_code, current_user, db)


@router.get("/{hackathon_id}/my-team", response_model=TeamResponse)
async def my_team(
    hackathon_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_my_team(hackathon_id, current_user, db)


@router.delete("/{hackathon_id}/leave")
async def leave(
    hackathon_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.services.team_service import leave_team
    return await leave_team(hackathon_id, current_user, db)

