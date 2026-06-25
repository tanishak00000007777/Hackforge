import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.registration import Registration, RegistrationStatus
from app.models.team import Team
from app.models.submission import Submission, SubmissionStatus
from app.models.score import Score
from app.models.judge import Judge, JudgeStatus


async def get_analytics(
    hackathon_id: uuid.UUID,
    db: AsyncSession,
) -> dict:

    # Total registrations
    total_reg = await db.execute(
        select(func.count()).select_from(Registration)
        .where(Registration.hackathon_id == hackathon_id)
    )

    # Approved registrations
    approved_reg = await db.execute(
        select(func.count()).select_from(Registration)
        .where(
            Registration.hackathon_id == hackathon_id,
            Registration.status == RegistrationStatus.approved,
        )
    )

    # Pending registrations
    pending_reg = await db.execute(
        select(func.count()).select_from(Registration)
        .where(
            Registration.hackathon_id == hackathon_id,
            Registration.status == RegistrationStatus.pending,
        )
    )

    # Total teams
    total_teams = await db.execute(
        select(func.count()).select_from(Team)
        .where(Team.hackathon_id == hackathon_id)
    )

    # Total submissions
    total_submissions = await db.execute(
        select(func.count()).select_from(Submission)
        .where(Submission.hackathon_id == hackathon_id)
    )

    # Submitted submissions
    submitted = await db.execute(
        select(func.count()).select_from(Submission)
        .where(
            Submission.hackathon_id == hackathon_id,
            Submission.status == SubmissionStatus.submitted,
        )
    )

    # Total judges
    total_judges = await db.execute(
        select(func.count()).select_from(Judge)
        .where(Judge.hackathon_id == hackathon_id)
    )

    # Accepted judges
    accepted_judges = await db.execute(
        select(func.count()).select_from(Judge)
        .where(
            Judge.hackathon_id == hackathon_id,
            Judge.status == JudgeStatus.accepted,
        )
    )

    # Total scores submitted
    total_scores = await db.execute(
        select(func.count()).select_from(Score)
        .join(Submission, Submission.id == Score.submission_id)
        .where(Submission.hackathon_id == hackathon_id)
    )

    return {
        "registrations": {
            "total": total_reg.scalar(),
            "approved": approved_reg.scalar(),
            "pending": pending_reg.scalar(),
        },
        "teams": {
            "total": total_teams.scalar(),
        },
        "submissions": {
            "total": total_submissions.scalar(),
            "submitted": submitted.scalar(),
            "draft": total_submissions.scalar() - submitted.scalar(),
        },
        "judging": {
            "total_judges": total_judges.scalar(),
            "accepted_judges": accepted_judges.scalar(),
            "total_scores_given": total_scores.scalar(),
        },
    }