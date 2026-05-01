from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi import Response

from app.models import AnalyzeResult, ReportCategory, ReportOut, ReportStatusUpdate
from app.repositories import reports_repo
from app.services.uploads import save_report_image

router = APIRouter()


@router.post("/reports", response_model=ReportOut, status_code=201)
async def create_report(
    category: ReportCategory = Form(...),
    description: str = Form(..., min_length=5, max_length=2000),
    latitude: float = Form(..., ge=-90, le=90),
    longitude: float = Form(..., ge=-180, le=180),
    reporter_name: str | None = Form(None, max_length=120),
    contact: str | None = Form(None, max_length=160),
    transport_mode: str | None = Form(None, max_length=40),
    vehicle_id: str | None = Form(None, max_length=80),
    incident_time: str | None = Form(None, max_length=80),
    location_label: str | None = Form(None, max_length=180),
    severity: str | None = Form(None, max_length=40),
    image: UploadFile | None = File(None),
) -> ReportOut:
    try:
        image_url = await save_report_image(image)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return reports_repo.create(
        report_id=uuid4().hex,
        category=category.value,
        description=description.strip(),
        latitude=latitude,
        longitude=longitude,
        image_url=image_url,
        reporter_name=reporter_name.strip() if reporter_name else None,
        contact=contact.strip() if contact else None,
        transport_mode=transport_mode.strip() if transport_mode else None,
        vehicle_id=vehicle_id.strip() if vehicle_id else None,
        incident_time=incident_time.strip() if incident_time else None,
        location_label=location_label.strip() if location_label else None,
        severity=severity.strip() if severity else None,
    )


@router.get("/reports", response_model=list[ReportOut])
def list_reports(status: str | None = None, category: str | None = None) -> list[ReportOut]:
    return reports_repo.list(status=status, category=category)


@router.get("/reports/{report_id}", response_model=ReportOut)
def get_report(report_id: str) -> ReportOut:
    report = reports_repo.get(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.patch("/reports/{report_id}/status", response_model=ReportOut)
def update_report_status(report_id: str, payload: ReportStatusUpdate) -> ReportOut:
    report = reports_repo.update_status(report_id, payload.status.value)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.post("/reports/{report_id}/analyze", response_model=AnalyzeResult)
def analyze_report(report_id: str) -> AnalyzeResult:
    report = reports_repo.get(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return AnalyzeResult(report_id=report_id)


@router.delete("/reports/{report_id}", status_code=204)
def delete_report(report_id: str) -> Response:
    deleted = reports_repo.delete(report_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Report not found")
    return Response(status_code=204)
