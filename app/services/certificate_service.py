import io
import secrets
import uuid
from datetime import datetime, timezone
from urllib.parse import urlparse

import httpx
from fastapi import HTTPException
from reportlab.graphics import renderPDF
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.utils import ImageReader, simpleSplit
from reportlab.pdfgen import canvas
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import get_settings
from app.models.certificate import Certificate, CertificateTemplate, CertificateType
from app.models.hackathon import Hackathon
from app.models.judge import Judge, JudgeStatus
from app.models.registration import Registration, RegistrationStatus
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.user import User, UserRole
from app.schemas.certificate import CertificateBulkIssue, CertificateTemplateInput


DEFAULT_TEMPLATE = CertificateTemplateInput()


def _generate_verification_id() -> str:
    return secrets.token_urlsafe(32)


def _is_owner(hackathon: Hackathon, user: User) -> bool:
    return hackathon.created_by == user.id or user.role == UserRole.admin


async def _owned_hackathon(hackathon_id: uuid.UUID, user: User, db: AsyncSession) -> Hackathon:
    hackathon = await db.get(Hackathon, hackathon_id)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    if not _is_owner(hackathon, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    return hackathon


def _template_values(template: CertificateTemplate | CertificateTemplateInput | None) -> dict:
    source = template or DEFAULT_TEMPLATE
    return {
        "preset": source.preset,
        "primary_color": source.primary_color,
        "secondary_color": source.secondary_color,
        "heading": source.heading,
        "body_text": source.body_text,
        "signatory_name": source.signatory_name,
        "signatory_title": source.signatory_title,
        "sponsor_names": list(source.sponsor_names),
    }


async def get_certificate_template(
    hackathon_id: uuid.UUID, current_user: User, db: AsyncSession
) -> dict:
    await _owned_hackathon(hackathon_id, current_user, db)
    result = await db.execute(
        select(CertificateTemplate).where(CertificateTemplate.hackathon_id == hackathon_id)
    )
    template = result.scalar_one_or_none()
    return {"id": template.id if template else None, "hackathon_id": hackathon_id, **_template_values(template)}


async def save_certificate_template(
    hackathon_id: uuid.UUID,
    data: CertificateTemplateInput,
    current_user: User,
    db: AsyncSession,
) -> CertificateTemplate:
    await _owned_hackathon(hackathon_id, current_user, db)
    result = await db.execute(
        select(CertificateTemplate).where(CertificateTemplate.hackathon_id == hackathon_id)
    )
    template = result.scalar_one_or_none()
    if template is None:
        template = CertificateTemplate(hackathon_id=hackathon_id)
        db.add(template)
    for key, value in data.model_dump().items():
        setattr(template, key, value)
    await db.flush()
    await db.refresh(template)
    return template


async def bulk_issue_certificates(
    hackathon_id: uuid.UUID,
    data: CertificateBulkIssue,
    current_user: User,
    db: AsyncSession,
) -> dict:
    await _owned_hackathon(hackathon_id, current_user, db)

    if data.type == CertificateType.participant:
        if data.team_ids:
            raise HTTPException(status_code=400, detail="Team selection is only valid for award certificates")
        result = await db.execute(
            select(Registration.user_id).where(
                Registration.hackathon_id == hackathon_id,
                Registration.status == RegistrationStatus.approved,
            )
        )
        recipient_ids = set(result.scalars().all())
    elif data.type == CertificateType.judge:
        if data.team_ids:
            raise HTTPException(status_code=400, detail="Team selection is only valid for award certificates")
        result = await db.execute(
            select(Judge.user_id).where(
                Judge.hackathon_id == hackathon_id,
                Judge.status == JudgeStatus.accepted,
            )
        )
        recipient_ids = set(result.scalars().all())
    else:
        if not data.team_ids:
            raise HTTPException(status_code=400, detail="Select at least one team")
        teams = list((await db.execute(select(Team).where(Team.id.in_(data.team_ids)))).scalars().all())
        if len(teams) != len(set(data.team_ids)) or any(team.hackathon_id != hackathon_id for team in teams):
            raise HTTPException(status_code=400, detail="One or more teams do not belong to this hackathon")
        result = await db.execute(select(TeamMember.user_id).where(TeamMember.team_id.in_(data.team_ids)))
        recipient_ids = set(result.scalars().all())

    if not recipient_ids:
        raise HTTPException(status_code=400, detail="No eligible recipients found")

    result = await db.execute(
        select(Certificate.user_id).where(
            Certificate.hackathon_id == hackathon_id,
            Certificate.type == data.type,
            Certificate.user_id.in_(recipient_ids),
        )
    )
    existing = set(result.scalars().all())
    for user_id in recipient_ids - existing:
        db.add(Certificate(
            hackathon_id=hackathon_id,
            user_id=user_id,
            type=data.type,
            verification_id=_generate_verification_id(),
        ))
    await db.flush()
    return {"issued": len(recipient_ids - existing), "skipped": len(existing), "total": len(recipient_ids)}


def _certificate_payload(certificate: Certificate, user: User, hackathon: Hackathon) -> dict:
    return {
        "id": certificate.id,
        "hackathon_id": certificate.hackathon_id,
        "user_id": certificate.user_id,
        "type": certificate.type,
        "verification_id": certificate.verification_id,
        "recipient_name": user.full_name,
        "event_title": hackathon.title,
        "created_at": certificate.created_at,
    }


async def _certificate_rows(statement, db: AsyncSession) -> list[dict]:
    result = await db.execute(
        statement.join(User, User.id == Certificate.user_id).join(Hackathon, Hackathon.id == Certificate.hackathon_id)
    )
    return [_certificate_payload(certificate, user, hackathon) for certificate, user, hackathon in result.all()]


async def get_my_certificates(current_user: User, db: AsyncSession) -> list[dict]:
    return await _certificate_rows(
        select(Certificate, User, Hackathon)
        .where(Certificate.user_id == current_user.id)
        .order_by(Certificate.created_at.desc()),
        db,
    )


async def get_hackathon_certificates(
    hackathon_id: uuid.UUID, current_user: User, db: AsyncSession
) -> list[dict]:
    await _owned_hackathon(hackathon_id, current_user, db)
    return await _certificate_rows(
        select(Certificate, User, Hackathon)
        .where(Certificate.hackathon_id == hackathon_id)
        .order_by(Certificate.created_at.desc()),
        db,
    )


async def verify_certificate(verification_id: str, db: AsyncSession) -> dict:
    result = await db.execute(
        select(Certificate, User, Hackathon)
        .join(User, User.id == Certificate.user_id)
        .join(Hackathon, Hackathon.id == Certificate.hackathon_id)
        .where(Certificate.verification_id == verification_id)
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Certificate not found or invalid")
    certificate, user, hackathon = row
    return {
        "verification_id": certificate.verification_id,
        "recipient_name": user.full_name,
        "event_title": hackathon.title,
        "type": certificate.type,
        "issued_at": certificate.created_at,
        "valid": True,
    }


async def _load_logo(url: str | None) -> bytes | None:
    if not url or urlparse(url).scheme != "https":
        return None
    try:
        chunks = bytearray()
        async with httpx.AsyncClient(timeout=4, follow_redirects=False) as client:
            async with client.stream("GET", url) as response:
                if response.status_code != 200 or not response.headers.get("content-type", "").startswith("image/"):
                    return None
                async for chunk in response.aiter_bytes():
                    chunks.extend(chunk)
                    if len(chunks) > 2 * 1024 * 1024:
                        return None
        return bytes(chunks)
    except (httpx.HTTPError, ValueError):
        return None


def _draw_qr(pdf: canvas.Canvas, url: str, x: float, y: float, size: float = 55) -> None:
    qr = QrCodeWidget(url)
    x1, y1, x2, y2 = qr.getBounds()
    drawing = Drawing(size, size, transform=[size / (x2 - x1), 0, 0, size / (y2 - y1), 0, 0])
    drawing.add(qr)
    renderPDF.draw(drawing, pdf, x, y)


def _draw_centered_fit(pdf: canvas.Canvas, text: str, font: str, size: int, y: float, max_width: float) -> None:
    while size > 10 and pdf.stringWidth(text, font, size) > max_width:
        size -= 1
    pdf.setFont(font, size)
    pdf.drawCentredString(landscape(A4)[0] / 2, y, text)


def generate_certificate_pdf(
    template_data: dict,
    recipient_name: str,
    event_title: str,
    certificate_type: CertificateType,
    issued_at: datetime,
    verification_id: str,
    logo: bytes | None = None,
) -> bytes:
    output = io.BytesIO()
    page = landscape(A4)
    width, height = page
    pdf = canvas.Canvas(output, pagesize=page)
    primary = colors.HexColor(template_data["primary_color"])
    secondary = colors.HexColor(template_data["secondary_color"])
    preset = template_data["preset"]

    if preset == "classic":
        pdf.setStrokeColor(primary)
        pdf.setLineWidth(4)
        pdf.rect(22, 22, width - 44, height - 44)
        pdf.setLineWidth(1)
        pdf.rect(31, 31, width - 62, height - 62)
        title_font, name_font = "Times-Bold", "Times-BoldItalic"
    elif preset == "modern":
        pdf.setFillColor(primary)
        pdf.rect(0, 0, 75, height, fill=1, stroke=0)
        pdf.setFillColor(secondary)
        pdf.rect(75, height - 16, width - 75, 16, fill=1, stroke=0)
        title_font, name_font = "Helvetica-Bold", "Helvetica-Bold"
    else:
        pdf.setFillColor(primary)
        pdf.rect(0, height - 130, width, 130, fill=1, stroke=0)
        pdf.setFillColor(secondary)
        pdf.circle(width - 55, 55, 110, fill=1, stroke=0)
        title_font, name_font = "Helvetica-Bold", "Helvetica-Bold"

    if logo:
        try:
            pdf.drawImage(ImageReader(io.BytesIO(logo)), 50, height - 96, 70, 48, preserveAspectRatio=True, anchor="c", mask="auto")
        except Exception:
            pass

    title_color = colors.white if preset == "bold" else primary
    pdf.setFillColor(title_color)
    _draw_centered_fit(pdf, template_data["heading"], title_font, 28, height - 82, width - 190)

    pdf.setFillColor(colors.HexColor("#3F3A46"))
    pdf.setFont("Helvetica", 11)
    for index, line in enumerate(simpleSplit(template_data["body_text"], "Helvetica", 11, width - 190)[:4]):
        pdf.drawCentredString(width / 2, height - 142 - (index * 14), line)
    pdf.setFillColor(primary)
    _draw_centered_fit(pdf, recipient_name, name_font, 30, height - 210, width - 190)

    award_text = {
        CertificateType.participant: "for successfully participating in",
        CertificateType.judge: "in recognition of serving as a judge at",
        CertificateType.winner: "for winning",
        CertificateType.runner_up: "for earning runner-up honors at",
    }[certificate_type]
    pdf.setFillColor(colors.HexColor("#3F3A46"))
    pdf.setFont("Helvetica", 12)
    pdf.drawCentredString(width / 2, height - 250, award_text)
    _draw_centered_fit(pdf, event_title, "Helvetica-Bold", 20, height - 282, width - 190)

    pdf.setStrokeColor(secondary)
    pdf.line(width / 2 - 100, 128, width / 2 + 100, 128)
    pdf.setFillColor(colors.HexColor("#3F3A46"))
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawCentredString(width / 2, 110, template_data["signatory_name"])
    pdf.setFont("Helvetica", 9)
    pdf.drawCentredString(width / 2, 96, template_data["signatory_title"])

    sponsors = template_data["sponsor_names"]
    if sponsors:
        pdf.setFont("Helvetica", 8)
        sponsor_text = "Supported by: " + " • ".join(sponsors)
        for index, line in enumerate(simpleSplit(sponsor_text, "Helvetica", 8, width - 300)[:2]):
            pdf.drawCentredString(width / 2, 68 - (index * 10), line)

    verify_url = f"{get_settings().frontend_url.rstrip('/')}/certificates/verify/{verification_id}"
    _draw_qr(pdf, verify_url, width - 92, 34)
    pdf.setFont("Helvetica", 7)
    pdf.setFillColor(colors.HexColor("#55515B"))
    pdf.drawString(45, 48, f"Issued {issued_at.strftime('%d %B %Y')}")
    pdf.drawString(45, 36, f"Verification ID: {verification_id}")
    pdf.save()
    return output.getvalue()


async def preview_certificate_pdf(
    hackathon_id: uuid.UUID,
    data: CertificateTemplateInput,
    current_user: User,
    db: AsyncSession,
) -> bytes:
    hackathon = await _owned_hackathon(hackathon_id, current_user, db)
    return generate_certificate_pdf(
        data.model_dump(),
        "Alex Morgan",
        hackathon.title,
        CertificateType.participant,
        datetime.now(timezone.utc),
        "PREVIEW-CERTIFICATE",
        await _load_logo(hackathon.logo_url),
    )


async def download_certificate_pdf(
    certificate_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> tuple[bytes, str]:
    result = await db.execute(
        select(Certificate, User, Hackathon)
        .join(User, User.id == Certificate.user_id)
        .join(Hackathon, Hackathon.id == Certificate.hackathon_id)
        .where(Certificate.id == certificate_id)
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Certificate not found")
    certificate, recipient, hackathon = row
    if current_user.id != certificate.user_id and not _is_owner(hackathon, current_user):
        raise HTTPException(status_code=403, detail="Not authorized")
    template_result = await db.execute(
        select(CertificateTemplate).where(CertificateTemplate.hackathon_id == hackathon.id)
    )
    template = template_result.scalar_one_or_none()
    pdf = generate_certificate_pdf(
        _template_values(template),
        recipient.full_name,
        hackathon.title,
        certificate.type,
        certificate.created_at,
        certificate.verification_id,
        await _load_logo(hackathon.logo_url),
    )
    filename = f"{hackathon.slug}-{certificate.type.value}-certificate.pdf"
    return pdf, filename
