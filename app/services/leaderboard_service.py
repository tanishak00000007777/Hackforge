import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.score import Score
from app.models.submission import Submission, SubmissionStatus
from app.models.team import Team
from app.models.rubric_criteria import RubricCriteria


async def get_leaderboard(
    hackathon_id: uuid.UUID,
    db: AsyncSession,
) -> list[dict]:
    # Get all submitted submissions for this hackathon
    submissions_result = await db.execute(
        select(Submission).where(
            Submission.hackathon_id == hackathon_id,
            Submission.status == SubmissionStatus.submitted,
        )
    )
    submissions = submissions_result.scalars().all()

    if not submissions:
        return []

    submission_ids = [s.id for s in submissions]

    # Get weighted scores per submission
    # weighted_score = sum(score.score * criteria.weight)
    scores_result = await db.execute(
        select(
            Score.submission_id,
            func.sum(Score.score * RubricCriteria.weight).label("total_score"),
            func.count(Score.id).label("score_count"),
        )
        .join(RubricCriteria, RubricCriteria.id == Score.criterion_id)
        .where(Score.submission_id.in_(submission_ids))
        .group_by(Score.submission_id)
    )
    scores_map = {
        row.submission_id: {
            "total_score": float(row.total_score or 0),
            "score_count": row.score_count,
        }
        for row in scores_result
    }

    # Build leaderboard entries
    leaderboard = []
    for submission in submissions:
        team_result = await db.execute(
            select(Team).where(Team.id == submission.team_id)
        )
        team = team_result.scalar_one_or_none()

        score_data = scores_map.get(submission.id, {"total_score": 0, "score_count": 0})

        leaderboard.append({
            "submission_id": str(submission.id),
            "team_id": str(submission.team_id),
            "team_name": team.name if team else "Unknown",
            "submission_title": submission.title,
            "total_score": score_data["total_score"],
            "score_count": score_data["score_count"],
        })

    # Sort by total_score descending
    leaderboard.sort(key=lambda x: x["total_score"], reverse=True)

    # Add rank
    for i, entry in enumerate(leaderboard):
        entry["rank"] = i + 1

    return leaderboard