import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_feature
from app.schemas.judge import JudgeInvite, JudgeResponse, RubricCriteriaCreate, RubricCriteriaResponse
from app.schemas.score import ScoreCreate, ScoreResponse
from app.services.judging_service import (
    invite_judge,
    accept_judge_invite,
    create_rubric_criteria,
    get_rubric,
    submit_score,
    get_submission_scores,
)

router = APIRouter(prefix="/judges", tags=["Judges"])


@router.post("/{hackathon_id}/invite", response_model=JudgeResponse, status_code=201)
async def invite(
    hackathon_id: uuid.UUID,
    data: JudgeInvite,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await invite_judge(hackathon_id, data, db)


@router.post("/{hackathon_id}/accept", response_model=JudgeResponse)
async def accept(
    hackathon_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await accept_judge_invite(hackathon_id, current_user, db)


@router.post("/{hackathon_id}/rubric", response_model=RubricCriteriaResponse, status_code=201)
async def add_criteria(
    hackathon_id: uuid.UUID,
    data: RubricCriteriaCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await create_rubric_criteria(hackathon_id, data, db)


@router.get("/{hackathon_id}/rubric", response_model=list[RubricCriteriaResponse])
async def get_rubric_criteria(
    hackathon_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    return await get_rubric(hackathon_id, db)


@router.post("/scores/{submission_id}", response_model=ScoreResponse, status_code=201)
async def score(
    submission_id: uuid.UUID,
    data: ScoreCreate,
    _=Depends(require_feature("judging_enabled")),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await submit_score(submission_id, data, current_user, db)


@router.get("/scores/{submission_id}", response_model=list[ScoreResponse])
async def get_scores(
    submission_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_submission_scores(submission_id, db)