import uuid
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.judge import Judge, JudgeStatus
from app.models.rubric_criteria import RubricCriteria
from app.models.score import Score
from app.models.user import User
from app.schemas.judge import JudgeInvite, RubricCriteriaCreate
from app.schemas.score import ScoreCreate


async def invite_judge(
    hackathon_id: uuid.UUID,
    data: JudgeInvite,
    db: AsyncSession,
) -> Judge:
    # Verify user exists
    user = await db.get(User, data.user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Check if already invited
    result = await db.execute(
        select(Judge).where(
            Judge.hackathon_id == hackathon_id,
            Judge.user_id == data.user_id,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already invited as judge")

    judge = Judge(hackathon_id=hackathon_id, user_id=data.user_id)
    db.add(judge)
    await db.flush()
    await db.refresh(judge)
    return judge


async def accept_judge_invite(
    hackathon_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> Judge:
    result = await db.execute(
        select(Judge).where(
            Judge.hackathon_id == hackathon_id,
            Judge.user_id == current_user.id,
        )
    )
    judge = result.scalar_one_or_none()
    if not judge:
        raise HTTPException(status_code=404, detail="Judge invite not found")

    if judge.status == JudgeStatus.accepted:
        raise HTTPException(
            status_code=400,
            detail="Judge has already accepted the invitation"
        )

    judge.status = JudgeStatus.accepted
    await db.flush()
    await db.refresh(judge)
    return judge


async def create_rubric_criteria(
    hackathon_id: uuid.UUID,
    data: RubricCriteriaCreate,
    db: AsyncSession,
) -> RubricCriteria:

    existing = await db.execute(
        select(RubricCriteria).where(
            RubricCriteria.hackathon_id == hackathon_id,
            RubricCriteria.name == data.name,
        )
    )

    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Rubric criterion already exists"
        )

    criteria = RubricCriteria(
        hackathon_id=hackathon_id,
        **data.model_dump()
    )

    db.add(criteria)
    await db.flush()
    await db.refresh(criteria)
    return criteria


async def get_rubric(
    hackathon_id: uuid.UUID,
    db: AsyncSession,
) -> list[RubricCriteria]:
    result = await db.execute(
        select(RubricCriteria)
        .where(RubricCriteria.hackathon_id == hackathon_id)
        .order_by(RubricCriteria.sort_order)
    )
    return list(result.scalars().all())


async def submit_score(
    submission_id: uuid.UUID,
    data: ScoreCreate,
    current_user: User,
    db: AsyncSession,
) -> Score:
    # Verify current user is an accepted judge
    judge_result = await db.execute(
        select(Judge).where(
            Judge.user_id == current_user.id,
            Judge.status == JudgeStatus.accepted,
        )
    )

    judge = judge_result.scalar_one_or_none()

    if not judge:
        raise HTTPException(
            status_code=403,
            detail="Only accepted judges can submit scores"
        )

    criteria = await db.get(
        RubricCriteria,
        data.criterion_id,
    )

    if not criteria:
        raise HTTPException(
            status_code=404,
            detail="Rubric criterion not found"
        )

    if data.score > criteria.max_score:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum score allowed is {criteria.max_score}"
        )

    if data.score < 0:
        raise HTTPException(
            status_code=400,
            detail="Score cannot be negative"
        )

    # Check if score already exists — update if so
    result = await db.execute(
        select(Score).where(
            Score.submission_id == submission_id,
            Score.judge_id == current_user.id,
            Score.criterion_id == data.criterion_id,
        )
    )

    existing = result.scalar_one_or_none()

    if existing:
        existing.score = data.score
        existing.comment = data.comment
        await db.flush()
        await db.refresh(existing)
        return existing

    score = Score(
        submission_id=submission_id,
        judge_id=current_user.id,
        criterion_id=data.criterion_id,
        score=data.score,
        comment=data.comment,
    )

    db.add(score)
    await db.flush()
    await db.refresh(score)

    return score


async def get_submission_scores(
    submission_id: uuid.UUID,
    db: AsyncSession,
) -> list[Score]:
    result = await db.execute(
        select(Score).where(Score.submission_id == submission_id)
    )
    return list(result.scalars().all())