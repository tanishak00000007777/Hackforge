import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.track import TrackCreate, TrackResponse
from app.services.track_service import create_track, get_tracks, delete_track

router = APIRouter(prefix="/tracks", tags=["Tracks"])


@router.post("/{hackathon_id}", response_model=TrackResponse, status_code=201)
async def create(
    hackathon_id: uuid.UUID,
    data: TrackCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await create_track(hackathon_id, data, db)


@router.get("/{hackathon_id}", response_model=list[TrackResponse])
async def list_tracks(
    hackathon_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    return await get_tracks(hackathon_id, db)


@router.delete("/{track_id}", status_code=204)
async def delete(
    track_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await delete_track(track_id, db)