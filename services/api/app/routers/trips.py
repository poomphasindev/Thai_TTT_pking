from fastapi import APIRouter, HTTPException, Request

from app.auth_repository import SESSION_COOKIE, auth_repo
from app.models import TripCreate, TripPaymentOut, TripScanCreate, TripSessionOut
from app.trip_repository import trips_repo


router = APIRouter()


def _current_user(request: Request):
    user = auth_repo.get_user_by_token(request.cookies.get(SESSION_COOKIE))
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in before starting a trip session")
    return user


@router.post("/trips", response_model=TripSessionOut, status_code=201)
def create_trip(payload: TripCreate, request: Request) -> TripSessionOut:
    user = _current_user(request)
    return trips_repo.create(user_id=user.id, payload=payload)


@router.get("/trips/active", response_model=TripSessionOut | None)
def active_trip(request: Request) -> TripSessionOut | None:
    user = _current_user(request)
    return trips_repo.active_for_user(user.id)


@router.get("/trips/{trip_id}", response_model=TripSessionOut)
def get_trip(trip_id: str, request: Request) -> TripSessionOut:
    user = _current_user(request)
    trip = trips_repo.get(trip_id, user_id=user.id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.post("/trips/{trip_id}/scan", response_model=TripSessionOut)
def scan_trip(trip_id: str, payload: TripScanCreate, request: Request) -> TripSessionOut:
    user = _current_user(request)
    trip = trips_repo.scan(trip_id, payload, user_id=user.id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Active trip not found")
    return trip


@router.post("/trips/{trip_id}/end", response_model=TripPaymentOut)
def end_trip(trip_id: str, request: Request) -> TripPaymentOut:
    user = _current_user(request)
    try:
        payment = trips_repo.end_and_pay(trip_id, user.id)
    except ValueError as exc:
        raise HTTPException(status_code=402, detail=str(exc)) from exc
    if payment is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    return payment
