import json
import re
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.form import (
    CustomForm, FormAccess, FormAnswer, FormAttachment, FormPurpose,
    FormQuestion, FormResponse, FormStatus, QuestionType,
)
from app.models.hackathon import Hackathon
from app.schemas.form import FormCreate, FormUpdate, GradeRequest, QuestionInput
from app.services import cloudinary_service


def _slug(title: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or "form"
    return f"{base[:165]}-{uuid.uuid4().hex[:8]}"


async def _owned_form(form_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession, *, load_questions=False) -> CustomForm:
    query = select(CustomForm).join(Hackathon).where(CustomForm.id == form_id, Hackathon.created_by == user_id)
    if load_questions:
        query = query.options(selectinload(CustomForm.questions))
    form = (await db.execute(query)).scalar_one_or_none()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    form.response_count = (await db.execute(select(func.count(FormResponse.id)).where(FormResponse.form_id == form.id))).scalar_one()
    return form


async def create_form(hackathon_id: uuid.UUID, data: FormCreate, current_user, db: AsyncSession) -> CustomForm:
    hackathon = (await db.execute(select(Hackathon).where(Hackathon.id == hackathon_id))).scalar_one_or_none()
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    if hackathon.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    form = CustomForm(hackathon_id=hackathon_id, created_by=current_user.id, slug=_slug(data.title), **data.model_dump())
    db.add(form)
    await db.flush()
    await db.refresh(form)
    return form


async def list_forms(hackathon_id: uuid.UUID, current_user, db: AsyncSession) -> list[dict]:
    hackathon = (await db.execute(select(Hackathon).where(Hackathon.id == hackathon_id))).scalar_one_or_none()
    if not hackathon or hackathon.created_by != current_user.id:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    count = select(func.count(FormResponse.id)).where(FormResponse.form_id == CustomForm.id).correlate(CustomForm).scalar_subquery()
    rows = (await db.execute(select(CustomForm, count.label("response_count")).where(CustomForm.hackathon_id == hackathon_id).order_by(CustomForm.created_at.desc()))).all()
    return [{**form.__dict__, "response_count": response_count} for form, response_count in rows]


async def get_form(form_id: uuid.UUID, current_user, db: AsyncSession) -> CustomForm:
    return await _owned_form(form_id, current_user.id, db, load_questions=True)


async def update_form(form_id: uuid.UUID, data: FormUpdate, current_user, db: AsyncSession) -> CustomForm:
    form = await _owned_form(form_id, current_user.id, db, load_questions=True)
    changes = data.model_dump(exclude_unset=True)
    if "slug" in changes:
        duplicate = (await db.execute(select(CustomForm.id).where(CustomForm.slug == changes["slug"], CustomForm.id != form.id))).scalar_one_or_none()
        if duplicate:
            raise HTTPException(status_code=409, detail="Form slug already exists")
    for key, value in changes.items():
        setattr(form, key, value)
    await db.flush()
    return form


async def replace_questions(form_id: uuid.UUID, questions: list[QuestionInput], current_user, db: AsyncSession) -> CustomForm:
    form = await _owned_form(form_id, current_user.id, db, load_questions=True)
    has_responses = (await db.execute(select(FormResponse.id).where(FormResponse.form_id == form.id).limit(1))).scalar_one_or_none()
    if has_responses:
        raise HTTPException(status_code=409, detail="Questions cannot be changed after responses exist")
    if len(questions) > 100:
        raise HTTPException(status_code=422, detail="A form may contain at most 100 questions")

    new_questions = []
    for position, item in enumerate(questions):
        if item.type in (QuestionType.multiple_choice, QuestionType.checkboxes) and len(item.options) < 2:
            raise HTTPException(status_code=422, detail=f"{item.title}: choice questions need at least two options")
        if item.type not in (QuestionType.multiple_choice, QuestionType.checkboxes) and item.options:
            raise HTTPException(status_code=422, detail=f"{item.title}: this question type cannot have options")
        new_questions.append(FormQuestion(
            id=item.id or uuid.uuid4(), form_id=form.id, position=position,
            title=item.title, description=item.description, type=item.type,
            required=item.required, options=item.options,
            max_points=item.max_points if form.purpose == FormPurpose.quiz else 0,
        ))
    form.questions.clear()
    await db.flush()
    form.questions.extend(new_questions)
    await db.flush()
    return form


async def set_status(form_id: uuid.UUID, status: FormStatus, current_user, db: AsyncSession) -> CustomForm:
    form = await _owned_form(form_id, current_user.id, db, load_questions=True)
    if status == FormStatus.published and not form.questions:
        raise HTTPException(status_code=422, detail="Add at least one question before publishing")
    if status == FormStatus.draft:
        raise HTTPException(status_code=422, detail="Published forms cannot return to draft")
    form.status = status
    await db.flush()
    return form


async def delete_draft(form_id: uuid.UUID, current_user, db: AsyncSession) -> None:
    form = await _owned_form(form_id, current_user.id, db)
    has_responses = (await db.execute(select(FormResponse.id).where(FormResponse.form_id == form.id).limit(1))).scalar_one_or_none()
    if form.status != FormStatus.draft or has_responses:
        raise HTTPException(status_code=409, detail="Only empty draft forms can be deleted")
    await db.delete(form)


async def get_public_form(slug: str, db: AsyncSession) -> CustomForm:
    form = (await db.execute(select(CustomForm).where(CustomForm.slug == slug).options(selectinload(CustomForm.questions)))).scalar_one_or_none()
    if not form or form.status == FormStatus.draft:
        raise HTTPException(status_code=404, detail="Form not found")
    return form


def _validate_answer(question: FormQuestion, value):
    if question.type in (QuestionType.short_answer, QuestionType.paragraph):
        if value is not None and not isinstance(value, str):
            raise HTTPException(status_code=422, detail=f"{question.title}: expected text")
        return value.strip() if isinstance(value, str) else value
    if question.type == QuestionType.multiple_choice:
        if value is not None and value not in question.options:
            raise HTTPException(status_code=422, detail=f"{question.title}: invalid option")
        return value
    if question.type == QuestionType.checkboxes:
        if value is not None and (not isinstance(value, list) or any(v not in question.options for v in value)):
            raise HTTPException(status_code=422, detail=f"{question.title}: invalid options")
        return list(dict.fromkeys(value or []))
    return None


async def submit_response(slug: str, raw_answers: str, files: dict[uuid.UUID, UploadFile], current_user, db: AsyncSession) -> FormResponse:
    form = await get_public_form(slug, db)
    if form.status != FormStatus.published:
        raise HTTPException(status_code=409, detail="This form is closed")
    if form.access == FormAccess.authenticated and current_user is None:
        raise HTTPException(status_code=401, detail="Sign in to submit this form")
    try:
        payload = json.loads(raw_answers)
    except (TypeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=422, detail="Answers must be valid JSON") from exc
    if not isinstance(payload, dict):
        raise HTTPException(status_code=422, detail="Answers must be an object keyed by question ID")

    question_ids = {q.id for q in form.questions}
    if set(files) - question_ids or any(key not in {str(qid) for qid in question_ids} for key in payload):
        raise HTTPException(status_code=422, detail="Response contains an unknown question")

    prepared_files = {}
    total_bytes = 0
    for question_id, upload in files.items():
        question = next(q for q in form.questions if q.id == question_id)
        if question.type != QuestionType.file:
            raise HTTPException(status_code=422, detail=f"{question.title}: does not accept files")
        content = await cloudinary_service.read_upload(upload)
        total_bytes += len(content)
        if total_bytes > cloudinary_service.MAX_RESPONSE_BYTES:
            raise HTTPException(status_code=413, detail="Combined uploads exceed the 50 MB response limit")
        prepared_files[question_id] = (upload, content)

    response = FormResponse(form_id=form.id, submitter_user_id=current_user.id if current_user else None)
    db.add(response)
    await db.flush()
    uploaded_assets = []
    try:
        for question in form.questions:
            supplied = payload.get(str(question.id))
            upload_data = prepared_files.get(question.id)
            is_missing = upload_data is None if question.type == QuestionType.file else supplied in (None, "", [])
            if question.required and is_missing:
                raise HTTPException(status_code=422, detail=f"{question.title} is required")

            answer = FormAnswer(response_id=response.id, question_id=question.id, value=_validate_answer(question, supplied))
            db.add(answer)
            await db.flush()
            if upload_data:
                upload, content = upload_data
                result = await cloudinary_service.upload_private(
                    content, folder=f"hackforge/forms/{form.id}/{response.id}", filename=upload.filename or "upload"
                )
                uploaded_assets.append(result)
                db.add(FormAttachment(
                    answer_id=answer.id, asset_id=result["asset_id"], public_id=result["public_id"],
                    resource_type=result["resource_type"], delivery_type=result.get("type", "private"),
                    format=result.get("format"), original_filename=upload.filename or "upload",
                    mime_type=upload.content_type, byte_size=result.get("bytes", len(content)),
                ))
        await db.commit()
        await db.refresh(response)
        return response
    except Exception:
        await db.rollback()
        for asset in uploaded_assets:
            try:
                await cloudinary_service.destroy_asset(asset)
            except Exception:
                pass
        raise


async def list_responses(form_id: uuid.UUID, current_user, db: AsyncSession) -> list[FormResponse]:
    await _owned_form(form_id, current_user.id, db)
    return list((await db.execute(select(FormResponse).where(FormResponse.form_id == form_id).order_by(FormResponse.created_at.desc()))).scalars().all())


async def get_response(response_id: uuid.UUID, current_user, db: AsyncSession) -> FormResponse:
    query = (select(FormResponse).join(CustomForm).join(Hackathon)
             .where(FormResponse.id == response_id, Hackathon.created_by == current_user.id)
             .options(selectinload(FormResponse.answers).selectinload(FormAnswer.attachment)))
    response = (await db.execute(query)).scalar_one_or_none()
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")
    return response


async def grade_response(response_id: uuid.UUID, data: GradeRequest, current_user, db: AsyncSession) -> FormResponse:
    response = await get_response(response_id, current_user, db)
    form = (await db.execute(select(CustomForm).where(CustomForm.id == response.form_id))).scalar_one()
    if form.purpose != FormPurpose.quiz:
        raise HTTPException(status_code=422, detail="Only quizzes can be graded")
    answers = {answer.id: answer for answer in response.answers}
    questions = {q.id: q for q in (await db.execute(select(FormQuestion).where(FormQuestion.form_id == form.id))).scalars()}
    for grade in data.answers:
        answer = answers.get(grade.answer_id)
        if not answer:
            raise HTTPException(status_code=422, detail="Grade contains an unknown answer")
        if grade.awarded_points > questions[answer.question_id].max_points:
            raise HTTPException(status_code=422, detail="Awarded points exceed the question maximum")
        answer.awarded_points = grade.awarded_points
        answer.feedback = grade.feedback
    response.total_score = sum(answer.awarded_points or 0 for answer in response.answers)
    response.feedback = data.feedback
    response.graded_at = datetime.now(timezone.utc)
    response.graded_by = current_user.id
    await db.flush()
    return response


async def attachment_url(attachment_id: uuid.UUID, current_user, db: AsyncSession) -> str:
    query = (select(FormAttachment).join(FormAnswer).join(FormResponse).join(CustomForm).join(Hackathon)
             .where(FormAttachment.id == attachment_id, Hackathon.created_by == current_user.id))
    attachment = (await db.execute(query)).scalar_one_or_none()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    return cloudinary_service.private_download_url(attachment)
