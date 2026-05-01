from fastapi import APIRouter, HTTPException, Request

from app.auth_repository import SESSION_COOKIE, auth_repo
from app.models import UserOut, WalletCreditPayload
from app.trip_repository import trips_repo


router = APIRouter()


@router.get("/wallet/me", response_model=UserOut)
def wallet_me(request: Request) -> UserOut:
    user = auth_repo.get_user_by_token(request.cookies.get(SESSION_COOKIE))
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in required")
    return user


@router.post("/wallet/admin-credit", response_model=UserOut)
def admin_credit(payload: WalletCreditPayload) -> UserOut:
    user = trips_repo.add_wallet_credit(payload)
    if user is None:
        raise HTTPException(status_code=404, detail="User email not found")
    return user
