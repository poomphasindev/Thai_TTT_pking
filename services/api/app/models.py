from datetime import datetime, timezone
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class ReportCategory(StrEnum):
    qr_scan_failed = "qr_scan_failed"
    wrong_vehicle_guidance = "wrong_vehicle_guidance"
    missed_transfer = "missed_transfer"
    service_delay = "service_delay"
    vehicle_crowding = "vehicle_crowding"
    fare_charge_dispute = "fare_charge_dispute"
    staff_validation_issue = "staff_validation_issue"
    app_route_mismatch = "app_route_mismatch"
    accessibility_issue = "accessibility_issue"
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


class CopilotAsk(BaseModel):
    question: str = Field(min_length=1, max_length=600)
    language: str = Field(default="en", pattern="^(en|th)$")
    destination: str = Field(default="Wat Arun", max_length=120)
    mode: str = Field(default="rail", max_length=40)
    fare_billed_thb: int = Field(default=0, ge=0, le=45)
    fare_cap_thb: int = Field(default=45, ge=1, le=300)


class CopilotAnswer(BaseModel):
    answer: str
    used_model: str
    fallback: bool = False
    suggestions: list[str] = Field(default_factory=list)


class TicketStatus(StrEnum):
    active = "active"
    expired = "expired"
    revoked = "revoked"


class TicketCreate(BaseModel):
    holder_name: str = Field(min_length=1, max_length=120)
    pass_type: str = Field(default="tourist_day_pass", max_length=80)
    origin: str = Field(default="Current location", max_length=160)
    destination: str = Field(default="Tourist landmark", max_length=160)


class LoginPayload(BaseModel):
    email: str = Field(min_length=3, max_length=160)
    display_name: str = Field(min_length=1, max_length=120)


class UserOut(BaseModel):
    id: str
    email: str
    display_name: str
    role: str = "tourist"
    balance_thb: int = 0


class WalletCreditPayload(BaseModel):
    email: str = Field(min_length=3, max_length=160)
    amount_thb: int = Field(gt=0, le=10000)
    reason: str | None = Field(default=None, max_length=160)


class PlaceOut(BaseModel):
    id: str
    name: str
    category: str
    kind: str | None = None
    latitude: float
    longitude: float
    source: str = "OpenStreetMap"
    rating: float | None = None
    address: str | None = None
    distance_m: int | None = None


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


class TripStatus(StrEnum):
    in_progress = "in_progress"
    paid = "paid"
    cancelled = "cancelled"


class TripCreate(BaseModel):
    ticket_id: str | None = Field(default=None, max_length=80)
    origin: str = Field(min_length=1, max_length=160)
    destination: str = Field(min_length=1, max_length=160)
    planned_modes: list[str] = Field(default_factory=lambda: ["rail", "bus", "boat"], min_length=1, max_length=6)
    estimated_fare_thb: int = Field(default=45, ge=0, le=300)
    fare_cap_thb: int = Field(default=45, ge=1, le=300)


class TripScanCreate(BaseModel):
    mode: str = Field(pattern="^(rail|bus|boat|walk)$")
    operator_label: str = Field(min_length=1, max_length=160)
    vehicle_id: str | None = Field(default=None, max_length=80)
    stop_label: str = Field(min_length=1, max_length=160)
    raw_fare_thb: int = Field(ge=0, le=300)


class TripScanOut(BaseModel):
    id: str
    trip_id: str
    sequence_no: int
    mode: str
    operator_label: str
    vehicle_id: str | None = None
    stop_label: str
    raw_fare_thb: int
    charged_thb: int
    is_expected: bool
    anomaly_reason: str | None = None
    scanned_at: datetime


class TripSessionOut(BaseModel):
    id: str
    user_id: str
    ticket_id: str | None = None
    origin: str
    destination: str
    planned_modes: list[str]
    status: TripStatus
    fare_cap_thb: int
    estimated_fare_thb: int
    total_charged_thb: int
    anomaly_flags: int
    started_at: datetime
    ended_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    scans: list[TripScanOut] = Field(default_factory=list)


class TripPaymentOut(BaseModel):
    trip: TripSessionOut
    balance_thb: int
    charged_thb: int


def utc_now() -> datetime:
    return datetime.now(timezone.utc)
