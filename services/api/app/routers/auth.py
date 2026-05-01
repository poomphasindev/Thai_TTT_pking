from fastapi import APIRouter, HTTPException, Request, Response

from app.auth_repository import SESSION_COOKIE, SESSION_DAYS, auth_repo
from app.models import LoginPayload, UserOut


router = APIRouter()


@router.post("/auth/login", response_model=UserOut)
def login(payload: LoginPayload, response: Response) -> UserOut:
    token, user = auth_repo.login(payload)
    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        max_age=SESSION_DAYS * 24 * 60 * 60,
        httponly=True,
        samesite="lax",
        secure=False,
    )
    return user


@router.get("/auth/me", response_model=UserOut)
def me(request: Request) -> UserOut:
    user = auth_repo.get_user_by_token(request.cookies.get(SESSION_COOKIE))
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in required")
    return user


@router.post("/auth/logout", status_code=204)
def logout(request: Request, response: Response) -> Response:
    auth_repo.logout(request.cookies.get(SESSION_COOKIE))
    response.delete_cookie(SESSION_COOKIE)
    return response
