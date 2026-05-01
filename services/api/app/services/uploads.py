from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import get_settings


ALLOWED_CONTENT_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_UPLOAD_BYTES = 8 * 1024 * 1024


async def save_report_image(file: UploadFile | None) -> str | None:
    if file is None:
        return None

    suffix = ALLOWED_CONTENT_TYPES.get(file.content_type or "")
    if suffix is None:
        raise ValueError("Only JPEG, PNG, and WEBP images are supported.")

    settings = get_settings()
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    target = settings.upload_dir / f"{uuid4().hex}{suffix}"

    total = 0
    with target.open("wb") as buffer:
        while chunk := await file.read(1024 * 1024):
            total += len(chunk)
            if total > MAX_UPLOAD_BYTES:
                target.unlink(missing_ok=True)
                raise ValueError("Image must be 8MB or smaller.")
            buffer.write(chunk)

    return f"/uploads/{target.name}"

