"""Version history for the website studio.

`hackathons.website_config` remains the live draft, overwritten by autosave.
This module keeps the immutable history beside it so a publish can be rolled
back without disturbing the draft an organizer is still editing.

Every function goes through `get_owned_hackathon`, so ownership is enforced on
each call rather than trusted from the caller.
"""

import uuid

from fastapi import HTTPException
from sqlalchemy import func, select, update

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hackathon import Hackathon, HackathonStatus
from app.models.user import User
from app.models.website_version import WebsiteVersion
from app.services.hackathon_service import get_owned_hackathon

# A version is a full copy of the project document, so keeping every autosave
# would grow without bound. Checkpoints are explicit (publish, restore, or a
# named save) and trimmed to the most recent N per hackathon.
MAX_VERSIONS_PER_HACKATHON = 50

VALID_SOURCES = {"manual", "ai", "publish", "restore"}


async def _next_version_number(hackathon_id: uuid.UUID, db: AsyncSession) -> int:
    result = await db.execute(
        select(func.max(WebsiteVersion.version)).where(
            WebsiteVersion.hackathon_id == hackathon_id
        )
    )
    return (result.scalar() or 0) + 1


async def _trim_history(hackathon_id: uuid.UUID, db: AsyncSession) -> None:
    """Drop the oldest versions past the cap, never the published one."""
    result = await db.execute(
        select(WebsiteVersion.id)
        .where(
            WebsiteVersion.hackathon_id == hackathon_id,
            WebsiteVersion.is_published.is_(False),
        )
        .order_by(WebsiteVersion.version.desc())
        .offset(MAX_VERSIONS_PER_HACKATHON)
    )
    stale = list(result.scalars().all())
    for version_id in stale:
        obj = await db.get(WebsiteVersion, version_id)
        if obj is not None:
            await db.delete(obj)


async def create_version(
    hackathon_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
    *,
    project: dict | None = None,
    label: str,
    source: str = "manual",
    summary: str | None = None,
    is_published: bool = False,
) -> WebsiteVersion:
    if source not in VALID_SOURCES:
        raise HTTPException(status_code=422, detail=f"Unknown version source '{source}'")

    hackathon = await get_owned_hackathon(
        hackathon_id,
        current_user,
        db,
        for_update=True,
    )

    # Default to whatever the draft currently holds, so a checkpoint never
    # depends on the client re-uploading the document it just saved.
    document = project if project is not None else (hackathon.website_config or {})
    if not document:
        raise HTTPException(
            status_code=422,
            detail="There is nothing to snapshot yet. Save the website first.",
        )

    if is_published:
        # Exactly one live version per hackathon. Demoting the previous one in
        # the same transaction is what keeps rollback unambiguous.
        await db.execute(
            update(WebsiteVersion)
            .where(
                WebsiteVersion.hackathon_id == hackathon_id,
                WebsiteVersion.is_published.is_(True),
            )
            .values(is_published=False)
        )

    version = WebsiteVersion(
        hackathon_id=hackathon_id,
        author_id=current_user.id,
        version=await _next_version_number(hackathon_id, db),
        label=label[:120],
        source=source,
        summary=summary[:500] if summary else None,
        project=document,
        is_published=is_published,
    )
    db.add(version)
    await db.flush()
    await _trim_history(hackathon_id, db)
    await db.refresh(version)
    return version


async def list_versions(
    hackathon_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> list[WebsiteVersion]:
    await get_owned_hackathon(hackathon_id, current_user, db)
    result = await db.execute(
        select(WebsiteVersion)
        .where(WebsiteVersion.hackathon_id == hackathon_id)
        .order_by(WebsiteVersion.version.desc())
    )
    return list(result.scalars().all())


async def get_version(
    hackathon_id: uuid.UUID,
    version_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> WebsiteVersion:
    await get_owned_hackathon(hackathon_id, current_user, db)
    result = await db.execute(
        select(WebsiteVersion).where(
            WebsiteVersion.id == version_id,
            # Scoped by hackathon so a valid id from another event is a 404.
            WebsiteVersion.hackathon_id == hackathon_id,
        )
    )
    version = result.scalar_one_or_none()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    return version


async def restore_version(
    hackathon_id: uuid.UUID,
    version_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> WebsiteVersion:
    """Copy an old version back onto the draft.

    Restoring moves history forward instead of rewinding it: the pre-restore
    draft is checkpointed first, so a restore is itself undoable and nothing
    later in the timeline is destroyed.
    """
    hackathon = await get_owned_hackathon(
        hackathon_id,
        current_user,
        db,
        for_update=True,
    )
    target = await get_version(hackathon_id, version_id, current_user, db)

    if hackathon.website_config:
        await create_version(
            hackathon_id,
            current_user,
            db,
            project=hackathon.website_config,
            label="Before restore",
            source="restore",
            summary=f"Draft as it was before restoring v{target.version}",
        )

    hackathon.website_config = target.project
    await db.flush()

    return await create_version(
        hackathon_id,
        current_user,
        db,
        project=target.project,
        label=f"Restored v{target.version}",
        source="restore",
        summary=target.label,
    )


async def publish_website(
    hackathon_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> WebsiteVersion:
    """Promote the current draft to live, keeping the previous snapshot."""
    hackathon = await get_owned_hackathon(
        hackathon_id,
        current_user,
        db,
        for_update=True,
    )
    if not hackathon.website_config:
        raise HTTPException(
            status_code=422,
            detail="This website has no content yet. Add a section before publishing.",
        )

    version = await create_version(
        hackathon_id,
        current_user,
        db,
        project=hackathon.website_config,
        label="Published",
        source="publish",
        summary="Live version",
        is_published=True,
    )
    hackathon.status = HackathonStatus.published
    await db.flush()
    return version


async def get_published_version(
    hackathon_id: uuid.UUID,
    db: AsyncSession,
) -> WebsiteVersion | None:
    """The live snapshot. Public: serves the published site, no ownership check."""
    result = await db.execute(
        select(WebsiteVersion).where(
            WebsiteVersion.hackathon_id == hackathon_id,
            WebsiteVersion.is_published.is_(True),
        )
    )
    return result.scalar_one_or_none()


async def get_public_website(hackathon_id: uuid.UUID, db: AsyncSession) -> dict:
    """Return only the immutable live snapshot; the mutable draft is never read."""
    version = await get_published_version(hackathon_id, db)
    if not version:
        raise HTTPException(status_code=404, detail="Published website not found")

    hackathon = await db.get(Hackathon, hackathon_id)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Published website not found")

    return {
        "hackathon_id": hackathon.id,
        "title": hackathon.title,
        "slug": hackathon.slug,
        "project": version.project,
        "published_at": version.created_at,
    }


async def unpublish_website(
    hackathon_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> None:
    hackathon = await get_owned_hackathon(
        hackathon_id,
        current_user,
        db,
        for_update=True,
    )
    await db.execute(
        update(WebsiteVersion)
        .where(
            WebsiteVersion.hackathon_id == hackathon_id,
            WebsiteVersion.is_published.is_(True),
        )
        .values(is_published=False)
    )
    hackathon.status = HackathonStatus.draft
    await db.flush()
