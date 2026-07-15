import uuid

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.datastructures import UploadFile

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_optional_current_user
from app.models.form import FormStatus
from app.schemas.form import (
    FormCreate, FormDetail, FormSummary, FormUpdate, GradeRequest, PublicForm,
    QuestionInput, ResponseDetail, ResponseSummary, SubmissionCreated,
)
from app.services import form_service

router = APIRouter(prefix="/forms", tags=["Forms"])


@router.get("/public/{slug}", response_model=PublicForm)
async def public_form(slug: str, db: AsyncSession = Depends(get_db)):
    return await form_service.get_public_form(slug, db)


@router.post("/public/{slug}/responses", response_model=SubmissionCreated, status_code=201)
async def submit_public_form(
    slug: str,
    request: Request,
    current_user=Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = await request.form()
    raw_answers = data.get("answers")
    files: dict[uuid.UUID, UploadFile] = {}
    for key, value in data.multi_items():
        if key.startswith("file_") and isinstance(value, UploadFile):
            try:
                question_id = uuid.UUID(key.removeprefix("file_"))
            except ValueError:
                continue
            if question_id in files:
                from fastapi import HTTPException
                raise HTTPException(status_code=422, detail="Only one file is allowed per question")
            files[question_id] = value
    response = await form_service.submit_response(slug, raw_answers, files, current_user, db)
    return {"id": response.id, "submitted_at": response.created_at}


@router.post("/hackathons/{hackathon_id}", response_model=FormSummary, status_code=201)
async def create_form(hackathon_id: uuid.UUID, data: FormCreate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await form_service.create_form(hackathon_id, data, current_user, db)


@router.get("/hackathons/{hackathon_id}", response_model=list[FormSummary])
async def list_forms(hackathon_id: uuid.UUID, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await form_service.list_forms(hackathon_id, current_user, db)


@router.get("/manage/{form_id}", response_model=FormDetail)
async def get_form(form_id: uuid.UUID, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await form_service.get_form(form_id, current_user, db)


@router.patch("/manage/{form_id}", response_model=FormDetail)
async def update_form(form_id: uuid.UUID, data: FormUpdate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await form_service.update_form(form_id, data, current_user, db)


@router.put("/manage/{form_id}/questions", response_model=FormDetail)
async def replace_questions(form_id: uuid.UUID, data: list[QuestionInput], current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await form_service.replace_questions(form_id, data, current_user, db)


@router.post("/manage/{form_id}/publish", response_model=FormDetail)
async def publish_form(form_id: uuid.UUID, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await form_service.set_status(form_id, FormStatus.published, current_user, db)


@router.post("/manage/{form_id}/close", response_model=FormDetail)
async def close_form(form_id: uuid.UUID, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await form_service.set_status(form_id, FormStatus.closed, current_user, db)


@router.delete("/manage/{form_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_form(form_id: uuid.UUID, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await form_service.delete_draft(form_id, current_user, db)


@router.get("/manage/{form_id}/responses", response_model=list[ResponseSummary])
async def list_responses(form_id: uuid.UUID, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await form_service.list_responses(form_id, current_user, db)


@router.get("/response-records/{response_id}", response_model=ResponseDetail)
async def get_response(response_id: uuid.UUID, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await form_service.get_response(response_id, current_user, db)


@router.patch("/response-records/{response_id}/grade", response_model=ResponseDetail)
async def grade_response(response_id: uuid.UUID, data: GradeRequest, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await form_service.grade_response(response_id, data, current_user, db)


@router.get("/attachment-files/{attachment_id}/download")
async def download_attachment(attachment_id: uuid.UUID, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    url = await form_service.attachment_url(attachment_id, current_user, db)
    return RedirectResponse(url, status_code=307)
