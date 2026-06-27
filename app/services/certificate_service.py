import uuid
import secrets
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.certificate import Certificate, CertificateType
from app.models.hackathon import Hackathon
from app.models.user import User
from app.schemas.certificate import CertificateIssue


def _generate_verification_id() -> str:
    return secrets.token_urlsafe(32)


async def issue_certificate(
    hackathon_id: uuid.UUID,
    data: CertificateIssue,
    current_user: User,
    db: AsyncSession,
) -> Certificate:
    # Check hackathon exists
    result = await db.execute(
        select(Hackathon).where(Hackathon.id == hackathon_id)
    )
    hackathon = result.scalar_one_or_none()
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")

    # Only hackathon creator can issue certificates
    if hackathon.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Verify user exists
    user = await db.get(User, data.user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Check if already issued
    result = await db.execute(
        select(Certificate).where(
            Certificate.hackathon_id == hackathon_id,
            Certificate.user_id == data.user_id,
            Certificate.type == data.type,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Certificate already issued")

    certificate = Certificate(
        hackathon_id=hackathon_id,
        user_id=data.user_id,
        type=data.type,
        verification_id=_generate_verification_id(),
    )
    db.add(certificate)
    await db.flush()
    await db.refresh(certificate)
    return certificate


async def get_my_certificates(
    current_user: User,
    db: AsyncSession,
) -> list[Certificate]:
    result = await db.execute(
        select(Certificate).where(Certificate.user_id == current_user.id)
    )
    return list(result.scalars().all())


async def verify_certificate(
    verification_id: str,
    db: AsyncSession,
) -> Certificate:
    result = await db.execute(
        select(Certificate).where(Certificate.verification_id == verification_id)
    )
    certificate = result.scalar_one_or_none()
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found or invalid")
    return certificate


async def get_hackathon_certificates(
    hackathon_id: uuid.UUID,
    db: AsyncSession,
) -> list[Certificate]:

    hackathon = await db.get(Hackathon, hackathon_id)

    if not hackathon:
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found"
        )

    result = await db.execute(
        select(Certificate).where(
            Certificate.hackathon_id == hackathon_id
        )
    )

    return list(result.scalars().all())