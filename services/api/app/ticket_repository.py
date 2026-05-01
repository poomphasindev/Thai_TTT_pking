from __future__ import annotations

import hashlib
import sqlite3
from datetime import timedelta
from uuid import uuid4

from app.db import get_conn
from app.models import (
    TicketCreate,
    TicketOut,
    TicketStatus,
    TicketTapCreate,
    TicketTapOut,
    TicketTapResponse,
    utc_now,
)


TICKET_COLUMNS = """
id, holder_name, pass_type, origin, destination, qr_payload, status,
fare_cap_thb, accumulated_fare_thb, rides_count, valid_until, created_at, updated_at
"""

TAP_COLUMNS = """
id, ticket_id, mode, station_name, fare_thb, charged_thb, tapped_at
"""


def _row_to_ticket(row: sqlite3.Row) -> TicketOut:
    payload = dict(row)
    for key in ("valid_until", "created_at", "updated_at"):
        payload[key] = payload[key].replace("Z", "+00:00")
    return TicketOut(**payload)


def _row_to_tap(row: sqlite3.Row) -> TicketTapOut:
    payload = dict(row)
    payload["tapped_at"] = payload["tapped_at"].replace("Z", "+00:00")
    return TicketTapOut(**payload)


class TicketRepository:
    def create(self, payload: TicketCreate, user_id: str | None = None) -> TicketOut:
        now = utc_now()
        ticket_id = uuid4().hex
        qr_payload = f"ttm://joint-ticket/{ticket_id}?v=1"
        qr_token_hash = hashlib.sha256(qr_payload.encode("utf-8")).hexdigest()
        valid_until = now + timedelta(hours=24)

        with get_conn() as conn:
            conn.execute(
                """
                INSERT INTO tickets (
                  id, user_id, holder_name, pass_type, origin, destination, qr_token_hash,
                  qr_payload, status, fare_cap_thb, accumulated_fare_thb,
                  rides_count, valid_until, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    ticket_id,
                    user_id,
                    payload.holder_name.strip(),
                    payload.pass_type,
                    payload.origin.strip(),
                    payload.destination.strip(),
                    qr_token_hash,
                    qr_payload,
                    TicketStatus.active.value,
                    45,
                    0,
                    0,
                    valid_until.isoformat(),
                    now.isoformat(),
                    now.isoformat(),
                ),
            )
        ticket = self.get(ticket_id)
        if ticket is None:
            raise RuntimeError("Ticket creation failed")
        return ticket

    def list(self) -> list[TicketOut]:
        with get_conn() as conn:
            rows = conn.execute(
                f"SELECT {TICKET_COLUMNS} FROM tickets ORDER BY created_at DESC LIMIT 50"
            ).fetchall()
        return [_row_to_ticket(row) for row in rows]

    def get(self, ticket_id: str) -> TicketOut | None:
        with get_conn() as conn:
            row = conn.execute(
                f"SELECT {TICKET_COLUMNS} FROM tickets WHERE id = ?",
                (ticket_id,),
            ).fetchone()
        return _row_to_ticket(row) if row else None

    def taps(self, ticket_id: str) -> list[TicketTapOut]:
        with get_conn() as conn:
            rows = conn.execute(
                f"SELECT {TAP_COLUMNS} FROM ticket_taps WHERE ticket_id = ? ORDER BY tapped_at DESC",
                (ticket_id,),
            ).fetchall()
        return [_row_to_tap(row) for row in rows]

    def tap(self, ticket_id: str, payload: TicketTapCreate) -> TicketTapResponse | None:
        ticket = self.get(ticket_id)
        if ticket is None:
            return None

        remaining = max(0, ticket.fare_cap_thb - ticket.accumulated_fare_thb)
        charged = min(payload.fare_thb, remaining)
        now = utc_now()
        tap_id = uuid4().hex

        with get_conn() as conn:
            conn.execute(
                """
                INSERT INTO ticket_taps (
                  id, ticket_id, mode, station_name, fare_thb, charged_thb, tapped_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    tap_id,
                    ticket_id,
                    payload.mode,
                    payload.station_name.strip(),
                    payload.fare_thb,
                    charged,
                    now.isoformat(),
                ),
            )
            conn.execute(
                """
                UPDATE tickets
                SET accumulated_fare_thb = accumulated_fare_thb + ?,
                    rides_count = rides_count + 1,
                    updated_at = ?
                WHERE id = ?
                """,
                (charged, now.isoformat(), ticket_id),
            )

        updated = self.get(ticket_id)
        tap = self.taps(ticket_id)[0]
        if updated is None:
            return None
        return TicketTapResponse(ticket=updated, tap=tap, saved_thb=payload.fare_thb - charged)

    def revoke(self, ticket_id: str) -> TicketOut | None:
        now = utc_now().isoformat()
        with get_conn() as conn:
            conn.execute(
                "UPDATE tickets SET status = ?, updated_at = ? WHERE id = ?",
                (TicketStatus.revoked.value, now, ticket_id),
            )
        return self.get(ticket_id)


tickets_repo = TicketRepository()
