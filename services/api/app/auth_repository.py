from __future__ import annotations

import hashlib
import secrets
from datetime import timedelta
from uuid import uuid4

from app.db import get_conn
from app.models import LoginPayload, UserOut, utc_now


SESSION_COOKIE = "st_session"
SESSION_DAYS = 7


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _row_to_user(row) -> UserOut:
    return UserOut(
        id=row["id"],
        email=row["email"],
        display_name=row["display_name"],
        role=row["role"],
        balance_thb=row["balance_thb"],
    )


class AuthRepository:
    def login(self, payload: LoginPayload) -> tuple[str, UserOut]:
        now = utc_now()
        email = payload.email.strip().lower()
        display_name = payload.display_name.strip()

        with get_conn() as conn:
            row = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
            if row:
                user_id = row["id"]
                conn.execute(
                    "UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?",
                    (display_name, now.isoformat(), user_id),
                )
            else:
                user_id = uuid4().hex
                conn.execute(
                    """
                    INSERT INTO users (id, email, display_name, role, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (user_id, email, display_name, "tourist", now.isoformat(), now.isoformat()),
                )

            raw_token = secrets.token_urlsafe(32)
            expires_at = now + timedelta(days=SESSION_DAYS)
            conn.execute(
                """
                INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (uuid4().hex, user_id, _hash_token(raw_token), expires_at.isoformat(), now.isoformat()),
            )
            user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

        return raw_token, _row_to_user(user)

    def get_user_by_token(self, token: str | None) -> UserOut | None:
        if not token:
            return None
        now = utc_now().isoformat()
        with get_conn() as conn:
            row = conn.execute(
                """
                SELECT users.*
                FROM sessions
                JOIN users ON users.id = sessions.user_id
                WHERE sessions.token_hash = ? AND sessions.expires_at > ?
                """,
                (_hash_token(token), now),
            ).fetchone()
        return _row_to_user(row) if row else None

    def logout(self, token: str | None) -> None:
        if not token:
            return
        with get_conn() as conn:
            conn.execute("DELETE FROM sessions WHERE token_hash = ?", (_hash_token(token),))


auth_repo = AuthRepository()
