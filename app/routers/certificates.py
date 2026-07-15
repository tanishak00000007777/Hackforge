import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_feature
from app.schemas.certificate import (
    CertificateBulkIssue,
    CertificateBulkResult,
    CertificateResponse,
    CertificateTemplateInput,
    CertificateTemplateResponse,
    CertificateVerificationResponse,
)
from app.services.certificate_service import (
    bulk_issue_certificates,
    download_certificate_pdf,
    get_certificate_template,
    get_hackathon_certificates,
    get_my_certificates,
    preview_certificate_pdf,
    save_certificate_template,
    verify_certificate,
)

router = APIRouter(prefix="/certificates", tags=["Certificates"])


@router.get("/hackathons/{hackathon_id}/template", response_model=CertificateTemplateResponse)
async def template(
    hackathon_id: uuid.UUID,
    _=Depends(require_feature("certificates_enabled")),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_certificate_template(hackathon_id, current_user, db)


@router.put("/hackathons/{hackathon_id}/template", response_model=CertificateTemplateResponse)
async def update_template(
    hackathon_id: uuid.UUID,
    data: CertificateTemplateInput,
    _=Depends(require_feature("certificates_enabled")),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await save_certificate_template(hackathon_id, data, current_user, db)


@router.post("/hackathons/{hackathon_id}/template/preview")
async def preview_template(
    hackathon_id: uuid.UUID,
    data: CertificateTemplateInput,
    _=Depends(require_feature("certificates_enabled")),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    pdf = await preview_certificate_pdf(hackathon_id, data, current_user, db)
    return Response(pdf, media_type="application/pdf")


@router.post("/hackathons/{hackathon_id}/issue-bulk", response_model=CertificateBulkResult)
async def issue_bulk(
    hackathon_id: uuid.UUID,
    data: CertificateBulkIssue,
    _=Depends(require_feature("certificates_enabled")),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await bulk_issue_certificates(hackathon_id, data, current_user, db)


@router.get("/hackathons/{hackathon_id}/issued", response_model=list[CertificateResponse])
async def issued_certificates(
    hackathon_id: uuid.UUID,
    _=Depends(require_feature("certificates_enabled")),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_hackathon_certificates(hackathon_id, current_user, db)


@router.get("/me", response_model=list[CertificateResponse])
async def my_certificates(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_my_certificates(current_user, db)


@router.get("/verify/{verification_id}", response_model=CertificateVerificationResponse)
async def verify(verification_id: str, db: AsyncSession = Depends(get_db)):
    return await verify_certificate(verification_id, db)


@router.get("/{certificate_id}/pdf")
async def download_pdf(
    certificate_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    pdf, filename = await download_certificate_pdf(certificate_id, current_user, db)
    return Response(
        pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
