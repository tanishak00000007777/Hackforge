import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.hackathon import HackathonCreate, HackathonResponse, WebsiteConfigUpdate
from app.schemas.website_version import VersionCreate, VersionDetail, VersionSummary
from app.services.hackathon_service import (
    create_hackathon,
    get_hackathon_by_slug,
    get_owned_hackathon,
    update_website_config,
)
from app.services import website_version_service as versions

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


@router.get("/manage/{hackathon_id}", response_model=HackathonResponse)
async def get_for_management(
    hackathon_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_owned_hackathon(hackathon_id, current_user, db)


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
    # Publishing snapshots the draft first, so the previous live version stays
    # intact and rollback is a restore rather than a re-edit.
    await versions.publish_website(hackathon_id, current_user, db)
    return await get_owned_hackathon(hackathon_id, current_user, db)


@router.post("/{hackathon_id}/unpublish", response_model=HackathonResponse)
async def unpublish(
    hackathon_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await versions.unpublish_website(hackathon_id, current_user, db)
    return await get_owned_hackathon(hackathon_id, current_user, db)


@router.get("/{hackathon_id}/versions", response_model=list[VersionSummary])
async def list_versions(
    hackathon_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await versions.list_versions(hackathon_id, current_user, db)


@router.post("/{hackathon_id}/versions", response_model=VersionSummary, status_code=201)
async def create_version(
    hackathon_id: uuid.UUID,
    data: VersionCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await versions.create_version(
        hackathon_id,
        current_user,
        db,
        project=data.project,
        label=data.label,
        source=data.source,
        summary=data.summary,
    )


@router.get("/{hackathon_id}/versions/{version_id}", response_model=VersionDetail)
async def get_version(
    hackathon_id: uuid.UUID,
    version_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await versions.get_version(hackathon_id, version_id, current_user, db)


@router.post("/{hackathon_id}/versions/{version_id}/restore", response_model=VersionDetail)
async def restore_version(
    hackathon_id: uuid.UUID,
    version_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await versions.restore_version(hackathon_id, version_id, current_user, db)


@router.patch("/{hackathon_id}/website-config", response_model=HackathonResponse)
async def update_config(
    hackathon_id: uuid.UUID,
    config: WebsiteConfigUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await update_website_config(
        hackathon_id,
        config.model_dump(exclude_none=True),
        current_user,
        db,
    )


@router.get("/", response_model=list[HackathonResponse])
async def list_published(db: AsyncSession = Depends(get_db)):
    from app.services.hackathon_service import get_all_hackathons
    return await get_all_hackathons(db)
