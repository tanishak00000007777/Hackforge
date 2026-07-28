import asyncio
import uuid
from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from app.schemas.hackathon import WebsiteConfigUpdate
from app.services.hackathon_service import update_website_config


def test_website_config_accepts_studio_project():
    config = WebsiteConfigUpdate(
        components=[{"id": "hero-1", "type": "hero"}],
        pages=[{"id": "page-home", "name": "Home", "path": "/"}],
        currentPageId="page-home",
        globalTheme={"colors": {"primary": "#130225"}},
        assets=[],
    )

    assert config.schemaVersion == 1
    assert config.currentPageId == "page-home"


def test_website_config_rejects_unknown_fields():
    with pytest.raises(ValidationError):
        WebsiteConfigUpdate(
            pages=[],
            currentPageId="page-home",
            globalTheme={},
            accessToken="must-not-be-persisted",
        )


def test_studio_save_preserves_separately_managed_media():
    owner_id = uuid.uuid4()
    hackathon = SimpleNamespace(
        id=uuid.uuid4(),
        created_by=owner_id,
        website_config={},
        banner_url="https://cdn.example.com/banner.png",
        logo_url="https://cdn.example.com/logo.png",
    )

    class Result:
        def scalar_one_or_none(self):
            return hackathon

    class Db:
        async def execute(self, _query):
            return Result()

        async def flush(self):
            pass

        async def refresh(self, _item):
            pass

    asyncio.run(update_website_config(
        hackathon.id,
        {"schemaVersion": 1, "currentPageId": "page-home"},
        SimpleNamespace(id=owner_id),
        Db(),
    ))

    assert hackathon.banner_url == "https://cdn.example.com/banner.png"
    assert hackathon.logo_url == "https://cdn.example.com/logo.png"
