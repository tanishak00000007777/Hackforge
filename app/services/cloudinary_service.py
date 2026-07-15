import asyncio
import io
import time

import cloudinary
import cloudinary.uploader
import cloudinary.utils
from fastapi import HTTPException, UploadFile

from app.config.settings import get_settings

settings = get_settings()
cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
    secure=True,
)

MAX_FILE_BYTES = 10 * 1024 * 1024
MAX_RESPONSE_BYTES = 50 * 1024 * 1024


def ensure_configured() -> None:
    if not all((settings.cloudinary_cloud_name, settings.cloudinary_api_key, settings.cloudinary_api_secret)):
        raise HTTPException(status_code=503, detail="File uploads are not configured")


async def read_upload(upload: UploadFile) -> bytes:
    content = await upload.read(MAX_FILE_BYTES + 1)
    if len(content) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail=f"{upload.filename or 'File'} exceeds the 10 MB limit")
    return content


async def upload_private(content: bytes, *, folder: str, filename: str) -> dict:
    ensure_configured()

    def _upload():
        return cloudinary.uploader.upload(
            io.BytesIO(content),
            resource_type="auto",
            type="private",
            folder=folder,
            public_id=None,
            use_filename=False,
            unique_filename=True,
            overwrite=False,
            filename_override=filename,
        )

    try:
        return await asyncio.to_thread(_upload)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="File storage upload failed") from exc


async def destroy_asset(asset: dict) -> None:
    def _destroy():
        return cloudinary.uploader.destroy(
            asset["public_id"],
            resource_type=asset.get("resource_type", "image"),
            type=asset.get("type", "private"),
            invalidate=True,
        )

    await asyncio.to_thread(_destroy)


def private_download_url(attachment) -> str:
    ensure_configured()
    return cloudinary.utils.private_download_url(
        attachment.public_id,
        attachment.format or "",
        resource_type=attachment.resource_type,
        type=attachment.delivery_type,
        expires_at=int(time.time()) + 300,
        attachment=attachment.original_filename,
    )
