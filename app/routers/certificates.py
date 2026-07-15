import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_feature
from app.schemas.certificate import CertificateIssue, CertificateResponse
from app.services.certificate_service import (
    issue_certificate,
    get_my_certificates,
    verify_certificate,
    get_hackathon_certificates,
)

router = APIRouter(prefix="/certificates", tags=["Certificates"])


@router.post("/{hackathon_id}/issue", response_model=CertificateResponse, status_code=201)
async def issue(
    hackathon_id: uuid.UUID,
    data: CertificateIssue,
    _=Depends(require_feature("certificates_enabled")),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await issue_certificate(hackathon_id, data, current_user, db)


@router.get("/me", response_model=list[CertificateResponse])
async def my_certificates(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_my_certificates(current_user, db)


@router.get("/verify/{verification_id}", response_model=CertificateResponse)
async def verify(
    verification_id: str,
    db: AsyncSession = Depends(get_db),
):
    return await verify_certificate(verification_id, db)


@router.get("/{hackathon_id}", response_model=list[CertificateResponse])
async def hackathon_certificates(
    hackathon_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_hackathon_certificates(hackathon_id, db)