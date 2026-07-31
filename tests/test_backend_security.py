import asyncio
import uuid
from datetime import datetime, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.core import dependencies
from app.models.user import UserRole
from app.schemas.hackathon import HackathonCreate, PublicHackathonResponse
from app.services import hackathon_service, website_version_service


def test_get_current_user_rejects_refresh_token_before_database_lookup(monkeypatch):
    monkeypatch.setattr(
        dependencies,
        "decode_token",
        lambda _token: {"sub": str(uuid.uuid4()), "type": "refresh"},
    )

    class Db:
        async def execute(self, _query):
            raise AssertionError("refresh tokens must not reach the user lookup")

    with pytest.raises(HTTPException) as exc:
        asyncio.run(dependencies.get_current_user(
            HTTPAuthorizationCredentials(scheme="Bearer", credentials="refresh"),
            Db(),
        ))

    assert exc.value.status_code == 401


def test_create_hackathon_requires_organizer_or_admin():
    with pytest.raises(HTTPException) as exc:
        asyncio.run(hackathon_service.create_hackathon(
            HackathonCreate(title="Test", slug="test"),
            uuid.uuid4(),
            SimpleNamespace(id=uuid.uuid4(), role=UserRole.participant),
            object(),
        ))

    assert exc.value.status_code == 403


def test_create_hackathon_checks_organization_ownership():
    user_id = uuid.uuid4()

    class Db:
        async def get(self, _model, organization_id):
            return SimpleNamespace(id=organization_id, owner_id=uuid.uuid4())

    with pytest.raises(HTTPException) as exc:
        asyncio.run(hackathon_service.create_hackathon(
            HackathonCreate(title="Test", slug="test"),
            uuid.uuid4(),
            SimpleNamespace(id=user_id, role=UserRole.organizer),
            Db(),
        ))

    assert exc.value.status_code == 403


def test_admin_can_create_for_any_organization(monkeypatch):
    admin_id = uuid.uuid4()
    created = []

    class Result:
        def scalar_one_or_none(self):
            return None

    class Db:
        async def get(self, _model, organization_id):
            return SimpleNamespace(id=organization_id, owner_id=uuid.uuid4())

        async def execute(self, _query):
            return Result()

        def add(self, item):
            created.append(item)

        async def flush(self):
            pass

        async def refresh(self, _item):
            pass

    async def no_features(*_args):
        pass

    monkeypatch.setattr(hackathon_service, "create_default_features", no_features)
    hackathon = asyncio.run(hackathon_service.create_hackathon(
        HackathonCreate(title="Admin Event", slug="admin-event"),
        uuid.uuid4(),
        SimpleNamespace(id=admin_id, role=UserRole.admin),
        Db(),
    ))

    assert hackathon is created[0]
    assert hackathon.created_by == admin_id


def test_public_hackathon_schema_never_serializes_website_config():
    public = PublicHackathonResponse.model_validate(SimpleNamespace(
        id=uuid.uuid4(),
        organization_id=uuid.uuid4(),
        title="Published",
        slug="published",
        tagline=None,
        description=None,
        mode="online",
        status="published",
        max_participants=200,
        max_team_size=4,
        min_team_size=1,
        registration_mode="open",
        website_config={"secretDraft": True},
        banner_url=None,
        logo_url=None,
        prize_pool=None,
        contact_email=None,
        created_at=datetime.now(timezone.utc),
    ))

    assert "website_config" not in public.model_dump()


def test_unpublished_slug_is_filtered_out():
    class Result:
        def scalar_one_or_none(self):
            return None

    class Db:
        async def execute(self, query):
            assert "hackathons.status" in str(query)
            return Result()

    with pytest.raises(HTTPException) as exc:
        asyncio.run(hackathon_service.get_hackathon_by_slug("draft", Db()))

    assert exc.value.status_code == 404


def test_public_website_returns_published_snapshot_not_draft(monkeypatch):
    hackathon_id = uuid.uuid4()
    published_at = datetime.now(timezone.utc)
    published_project = {"components": [{"id": "live"}]}
    version = SimpleNamespace(project=published_project, created_at=published_at)
    hackathon = SimpleNamespace(
        id=hackathon_id,
        title="Live Event",
        slug="live-event",
        website_config={"components": [{"id": "draft"}]},
    )

    async def published_only(_hackathon_id, _db):
        return version

    class Db:
        async def get(self, _model, _id):
            return hackathon

    monkeypatch.setattr(website_version_service, "get_published_version", published_only)
    response = asyncio.run(website_version_service.get_public_website(hackathon_id, Db()))

    assert response["project"] is published_project
    assert response["project"] != hackathon.website_config
    assert response["published_at"] == published_at


def test_public_website_404s_without_published_version(monkeypatch):
    async def no_published_version(_hackathon_id, _db):
        return None

    monkeypatch.setattr(
        website_version_service,
        "get_published_version",
        no_published_version,
    )

    with pytest.raises(HTTPException) as exc:
        asyncio.run(website_version_service.get_public_website(uuid.uuid4(), object()))

    assert exc.value.status_code == 404


def test_owned_hackathon_for_update_locks_and_refreshes_row():
    owner_id = uuid.uuid4()
    hackathon = SimpleNamespace(id=uuid.uuid4(), created_by=owner_id)
    queries = []

    class Result:
        def scalar_one_or_none(self):
            return hackathon

    class Db:
        async def execute(self, query):
            queries.append(query)
            return Result()

    result = asyncio.run(hackathon_service.get_owned_hackathon(
        hackathon.id,
        SimpleNamespace(id=owner_id),
        Db(),
        for_update=True,
    ))

    assert result is hackathon
    assert "FOR UPDATE" in str(queries[0])
    assert queries[0].get_execution_options()["populate_existing"] is True


def test_create_version_uses_parent_row_lock(monkeypatch):
    owner_id = uuid.uuid4()
    hackathon = SimpleNamespace(
        id=uuid.uuid4(),
        website_config={"components": [{"id": "hero"}]},
    )
    lock_requests = []

    async def owned(_hackathon_id, _user, _db, *, for_update=False):
        lock_requests.append(for_update)
        return hackathon

    async def next_version(*_args):
        return 1

    async def no_trim(*_args):
        pass

    class Db:
        def add(self, _item):
            pass

        async def flush(self):
            pass

        async def refresh(self, _item):
            pass

    monkeypatch.setattr(website_version_service, "get_owned_hackathon", owned)
    monkeypatch.setattr(website_version_service, "_next_version_number", next_version)
    monkeypatch.setattr(website_version_service, "_trim_history", no_trim)

    asyncio.run(website_version_service.create_version(
        hackathon.id,
        SimpleNamespace(id=owner_id),
        Db(),
        label="Checkpoint",
    ))

    assert lock_requests == [True]


def test_publish_locks_before_reading_draft(monkeypatch):
    hackathon = SimpleNamespace(
        id=uuid.uuid4(),
        website_config={"components": [{"id": "live"}]},
        status=None,
    )
    events = []

    async def owned(_hackathon_id, _user, _db, *, for_update=False):
        events.append(("lock", for_update))
        return hackathon

    async def create(*_args, **kwargs):
        events.append(("snapshot", kwargs["project"]))
        return SimpleNamespace()

    class Db:
        async def flush(self):
            pass

    monkeypatch.setattr(website_version_service, "get_owned_hackathon", owned)
    monkeypatch.setattr(website_version_service, "create_version", create)

    asyncio.run(website_version_service.publish_website(
        hackathon.id,
        SimpleNamespace(id=uuid.uuid4()),
        Db(),
    ))

    assert events == [
        ("lock", True),
        ("snapshot", hackathon.website_config),
    ]
