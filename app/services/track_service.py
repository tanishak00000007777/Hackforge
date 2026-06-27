import uuid
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.track import Track
from app.schemas.track import TrackCreate


async def create_track(
    hackathon_id: uuid.UUID,
    data: TrackCreate,
    db: AsyncSession,
) -> Track:
    track = Track(hackathon_id=hackathon_id, **data.model_dump())
    db.add(track)
    await db.flush()
    await db.refresh(track)
    return track


async def get_tracks(
    hackathon_id: uuid.UUID,
    db: AsyncSession,
) -> list[Track]:
    result = await db.execute(
        select(Track)
        .where(Track.hackathon_id == hackathon_id)
        .order_by(Track.sort_order)
    )
    return list(result.scalars().all())


async def delete_track(
    track_id: uuid.UUID,
    db: AsyncSession,
) -> None:
    result = await db.execute(
        select(Track).where(Track.id == track_id)
    )
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    await db.delete(track)
    await db.flush()