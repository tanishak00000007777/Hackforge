import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.announcement import Announcement
from app.models.user import User
from app.schemas.announcement import AnnouncementCreate


async def create_announcement(
    hackathon_id: uuid.UUID,
    data: AnnouncementCreate,
    current_user: User,
    db: AsyncSession,
) -> Announcement:
    announcement = Announcement(
        hackathon_id=hackathon_id,
        author_id=current_user.id,
        title=data.title,
        content=data.content,
    )
    db.add(announcement)
    await db.flush()
    await db.refresh(announcement)
    return announcement


async def get_announcements(
    hackathon_id: uuid.UUID,
    db: AsyncSession,
) -> list[Announcement]:
    result = await db.execute(
        select(Announcement)
        .where(Announcement.hackathon_id == hackathon_id)
        .order_by(Announcement.created_at.desc())
    )
    return list(result.scalars().all())