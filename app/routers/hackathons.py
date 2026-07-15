import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.hackathon import HackathonCreate, HackathonResponse
from app.services.hackathon_service import create_hackathon, get_hackathon_by_slug, publish_hackathon

router = APIRouter(prefix="/hackathons", tags=["Hackathons"])


@router.get("/mine/owned", response_model=list[HackathonResponse])
async def list_owned(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.services.hackathon_service import get_owned_hackathons
    return await get_owned_hackathons(current_user, db)


@router.post("/{org_id}", response_model=HackathonResponse, status_code=201)
async def create(
    org_id: uuid.UUID,
    data: HackathonCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await create_hackathon(data, org_id, current_user, db)


@router.get("/{slug}", response_model=HackathonResponse)
async def get_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    return await get_hackathon_by_slug(slug, db)


@router.post("/{hackathon_id}/publish", response_model=HackathonResponse)
async def publish(
    hackathon_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await publish_hackathon(hackathon_id, current_user, db)


@router.patch("/{hackathon_id}/website-config", response_model=HackathonResponse)
async def update_config(
    hackathon_id: uuid.UUID,
    config: dict,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.services.hackathon_service import update_website_config
    return await update_website_config(hackathon_id, config, current_user, db)


@router.get("/", response_model=list[HackathonResponse])
async def list_published(db: AsyncSession = Depends(get_db)):
    from app.services.hackathon_service import get_all_hackathons
    return await get_all_hackathons(db)
