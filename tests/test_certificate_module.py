from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from app.models.certificate import CertificateType
from app.schemas.certificate import CertificateTemplateInput
from app.services.certificate_service import generate_certificate_pdf


@pytest.mark.parametrize("preset", ["classic", "modern", "bold"])
def test_all_certificate_presets_generate_pdf(preset):
    template = CertificateTemplateInput(
        preset=preset,
        sponsor_names=["Acme Labs", "Northstar Foundation"],
    )
    pdf = generate_certificate_pdf(
        template.model_dump(),
        "Alex Morgan",
        "HackForge Demo",
        CertificateType.winner,
        datetime.now(timezone.utc),
        "VERIFY-123",
    )
    assert pdf.startswith(b"%PDF")
    assert len(pdf) > 1000


def test_template_changes_update_generated_pdf():
    issued_at = datetime.now(timezone.utc)
    original = CertificateTemplateInput(heading="Certificate of Achievement")
    updated = CertificateTemplateInput(heading="Outstanding Builder Award")
    args = ("Alex Morgan", "HackForge Demo", CertificateType.participant, issued_at, "VERIFY-123")
    assert generate_certificate_pdf(original.model_dump(), *args) != generate_certificate_pdf(updated.model_dump(), *args)


@pytest.mark.parametrize("color", ["red", "#12345", "#GG0000", "123456"])
def test_template_rejects_invalid_colors(color):
    with pytest.raises(ValidationError):
        CertificateTemplateInput(primary_color=color)


def test_template_limits_sponsors():
    with pytest.raises(ValidationError):
        CertificateTemplateInput(sponsor_names=[f"Sponsor {index}" for index in range(9)])
