from datetime import datetime, timezone
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class ReportCategory(StrEnum):
    taxi_refusal = "taxi_refusal"
    overpricing = "overpricing"
    broken_pavement = "broken_pavement"
    unsafe_crossing = "unsafe_crossing"
    unclear_signage = "unclear_signage"
    crowding = "crowding"
    harassment = "harassment"
    lost_property = "lost_property"
    other = "other"


class ReportStatus(StrEnum):
    submitted = "submitted"
    reviewing = "reviewing"
    resolved = "resolved"
    rejected = "rejected"


class ReportOut(BaseModel):
    id: str
    category: ReportCategory
    description: str
    latitude: float
    longitude: float
    image_url: str | None = None
    status: ReportStatus
    reporter_name: str | None = None
    contact: str | None = None
    transport_mode: str | None = None
    vehicle_id: str | None = None
    incident_time: datetime | None = None
    location_label: str | None = None
    severity: str | None = None
    ai_category: str | None = None
    ai_confidence: float | None = None
    ai_summary: str | None = None
    created_at: datetime
    updated_at: datetime


class ReportStatusUpdate(BaseModel):
    status: ReportStatus


class AnalyzeResult(BaseModel):
    report_id: str
    enabled: bool = False
    message: str = "AI analysis is not enabled in the MVP build."
    result: dict[str, Any] = Field(default_factory=dict)


class TicketStatus(StrEnum):
    active = "active"
    expired = "expired"
    revoked = "revoked"


class TicketCreate(BaseModel):
    holder_name: str = Field(min_length=1, max_length=120)
    pass_type: str = Field(default="tourist_day_pass", max_length=80)
    origin: str = Field(default="Current location", max_length=160)
    destination: str = Field(default="Tourist landmark", max_length=160)


class TicketOut(BaseModel):
    id: str
    holder_name: str
    pass_type: str
    origin: str
    destination: str
    status: TicketStatus
    fare_cap_thb: int
    accumulated_fare_thb: int
    rides_count: int
    valid_until: datetime
    created_at: datetime
    updated_at: datetime
    qr_payload: str


class TicketTapCreate(BaseModel):
    mode: str = Field(pattern="^(rail|bus|boat|walk)$")
    station_name: str = Field(min_length=1, max_length=160)
    fare_thb: int = Field(ge=0, le=300)


class TicketTapOut(BaseModel):
    id: str
    ticket_id: str
    mode: str
    station_name: str
    fare_thb: int
    charged_thb: int
    tapped_at: datetime


class TicketTapResponse(BaseModel):
    ticket: TicketOut
    tap: TicketTapOut
    saved_thb: int


def utc_now() -> datetime:
    return datetime.now(timezone.utc)
