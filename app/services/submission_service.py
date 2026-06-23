import uuid
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.submission import Submission, SubmissionStatus
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.user import User
from app.schemas.submission import SubmissionCreate, SubmissionUpdate


async def _get_user_team_in_hackathon(
    hackathon_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> Team | None:
    result = await db.execute(
        select(Team)
        .join(TeamMember, TeamMember.team_id == Team.id)
        .where(
            Team.hackathon_id == hackathon_id,
            TeamMember.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def create_submission(
    hackathon_id: uuid.UUID,
    data: SubmissionCreate,
    current_user: User,
    db: AsyncSession,
) -> Submission:
    team = await _get_user_team_in_hackathon(hackathon_id, current_user.id, db)
    if not team:
        raise HTTPException(status_code=403, detail="You must be in a team to submit")

    # Only team leader can submit
    if team.leader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only team leader can submit")

    # One submission per team per hackathon
    result = await db.execute(
        select(Submission).where(
            Submission.hackathon_id == hackathon_id,
            Submission.team_id == team.id,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Team already has a submission")

    submission = Submission(
        hackathon_id=hackathon_id,
        team_id=team.id,
        **data.model_dump(),
    )
    db.add(submission)
    await db.flush()
    await db.refresh(submission)
    return submission


async def update_submission(
    submission_id: uuid.UUID,
    data: SubmissionUpdate,
    current_user: User,
    db: AsyncSession,
) -> Submission:
    result = await db.execute(
        select(Submission).where(Submission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Verify user is team leader
    team_result = await db.execute(
        select(Team).where(Team.id == submission.team_id)
    )
    team = team_result.scalar_one_or_none()
    if not team or team.leader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only team leader can update submission")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(submission, field, value)

    await db.flush()
    await db.refresh(submission)
    return submission


async def submit_submission(
    submission_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> Submission:
    result = await db.execute(
        select(Submission).where(Submission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    team_result = await db.execute(
        select(Team).where(Team.id == submission.team_id)
    )
    team = team_result.scalar_one_or_none()
    if not team or team.leader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only team leader can submit")

    submission.status = SubmissionStatus.submitted
    await db.flush()
    await db.refresh(submission)
    return submission


async def get_hackathon_submissions(
    hackathon_id: uuid.UUID,
    db: AsyncSession,
) -> list[Submission]:
    result = await db.execute(
        select(Submission).where(Submission.hackathon_id == hackathon_id)
    )
    return list(result.scalars().all())