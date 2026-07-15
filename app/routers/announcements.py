import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_feature
from app.schemas.announcement import AnnouncementCreate, AnnouncementResponse
from app.services.announcement_service import create_announcement, get_announcements

router = APIRouter(prefix="/announcements", tags=["Announcements"])


@router.post("/{hackathon_id}", response_model=AnnouncementResponse, status_code=201)
async def create(
    hackathon_id: uuid.UUID,
    data: AnnouncementCreate,
    _=Depends(require_feature("announcements_enabled")),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await create_announcement(hackathon_id, data, current_user, db)


@router.get("/{hackathon_id}", response_model=list[AnnouncementResponse])
async def list_announcements(
    hackathon_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    return await get_announcements(hackathon_id, db)