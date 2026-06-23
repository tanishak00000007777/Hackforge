import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.submission import SubmissionCreate, SubmissionUpdate, SubmissionResponse
from app.services.submission_service import (
    create_submission,
    update_submission,
    submit_submission,
    get_hackathon_submissions,
)

router = APIRouter(prefix="/submissions", tags=["Submissions"])


@router.post("/{hackathon_id}", response_model=SubmissionResponse, status_code=201)
async def create(
    hackathon_id: uuid.UUID,
    data: SubmissionCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await create_submission(hackathon_id, data, current_user, db)


@router.patch("/{submission_id}", response_model=SubmissionResponse)
async def update(
    submission_id: uuid.UUID,
    data: SubmissionUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await update_submission(submission_id, data, current_user, db)


@router.post("/{submission_id}/submit", response_model=SubmissionResponse)
async def submit(
    submission_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await submit_submission(submission_id, current_user, db)


@router.get("/{hackathon_id}/all", response_model=list[SubmissionResponse])
async def list_submissions(
    hackathon_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_hackathon_submissions(hackathon_id, db)