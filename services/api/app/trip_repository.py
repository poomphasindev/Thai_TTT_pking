from __future__ import annotations

import json
from sqlite3 import Row
from uuid import uuid4

from app.db import get_conn
from app.models import (
    TripCreate,
    TripPaymentOut,
    TripScanCreate,
    TripScanOut,
    TripSessionOut,
    UserOut,
    WalletCreditPayload,
    utc_now,
)


def _loads_modes(raw: str) -> list[str]:
    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        return ["rail", "bus", "boat"]
    return [str(item) for item in value if str(item) in {"rail", "bus", "boat", "walk"}] or ["rail"]


def _scan_from_row(row: Row) -> TripScanOut:
    return TripScanOut(
        id=row["id"],
        trip_id=row["trip_id"],
        sequence_no=row["sequence_no"],
        mode=row["mode"],
        operator_label=row["operator_label"],
        vehicle_id=row["vehicle_id"],
        stop_label=row["stop_label"],
        raw_fare_thb=row["raw_fare_thb"],
        charged_thb=row["charged_thb"],
        is_expected=bool(row["is_expected"]),
        anomaly_reason=row["anomaly_reason"],
        scanned_at=row["scanned_at"],
    )


def _trip_from_row(row: Row, scans: list[TripScanOut] | None = None) -> TripSessionOut:
    return TripSessionOut(
        id=row["id"],
        user_id=row["user_id"],
        ticket_id=row["ticket_id"],
        origin=row["origin"],
        destination=row["destination"],
        planned_modes=_loads_modes(row["planned_modes"]),
        status=row["status"],
        fare_cap_thb=row["fare_cap_thb"],
        estimated_fare_thb=row["estimated_fare_thb"],
        total_charged_thb=row["total_charged_thb"],
        anomaly_flags=row["anomaly_flags"],
        started_at=row["started_at"],
        ended_at=row["ended_at"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        scans=scans or [],
    )


def _user_from_row(row: Row) -> UserOut:
    return UserOut(
        id=row["id"],
        email=row["email"],
        display_name=row["display_name"],
        role=row["role"],
        balance_thb=row["balance_thb"],
    )


class TripRepository:
    def create(self, user_id: str, payload: TripCreate) -> TripSessionOut:
        now = utc_now().isoformat()
        trip_id = uuid4().hex
        modes = [mode for mode in payload.planned_modes if mode in {"rail", "bus", "boat", "walk"}] or ["rail"]
        with get_conn() as conn:
            conn.execute(
                """
                INSERT INTO trip_sessions (
                  id, user_id, ticket_id, origin, destination, planned_modes, status,
                  fare_cap_thb, estimated_fare_thb, total_charged_thb, anomaly_flags,
                  started_at, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, 'in_progress', ?, ?, 0, 0, ?, ?, ?)
                """,
                (
                    trip_id,
                    user_id,
                    payload.ticket_id,
                    payload.origin,
                    payload.destination,
                    json.dumps(modes),
                    payload.fare_cap_thb,
                    payload.estimated_fare_thb,
                    now,
                    now,
                    now,
                ),
            )
            row = conn.execute("SELECT * FROM trip_sessions WHERE id = ?", (trip_id,)).fetchone()
        return _trip_from_row(row)

    def active_for_user(self, user_id: str) -> TripSessionOut | None:
        with get_conn() as conn:
            row = conn.execute(
                """
                SELECT * FROM trip_sessions
                WHERE user_id = ? AND status = 'in_progress'
                ORDER BY created_at DESC
                LIMIT 1
                """,
                (user_id,),
            ).fetchone()
            if row is None:
                return None
            scans = self._scans(conn, row["id"])
        return _trip_from_row(row, scans=scans)

    def get(self, trip_id: str, user_id: str | None = None) -> TripSessionOut | None:
        query = "SELECT * FROM trip_sessions WHERE id = ?"
        params: tuple[str, ...] = (trip_id,)
        if user_id is not None:
            query += " AND user_id = ?"
            params = (trip_id, user_id)
        with get_conn() as conn:
            row = conn.execute(query, params).fetchone()
            if row is None:
                return None
            scans = self._scans(conn, trip_id)
        return _trip_from_row(row, scans=scans)

    def scan(self, trip_id: str, payload: TripScanCreate, user_id: str | None = None) -> TripSessionOut | None:
        now = utc_now().isoformat()
        with get_conn() as conn:
            trip = conn.execute("SELECT * FROM trip_sessions WHERE id = ?", (trip_id,)).fetchone()
            if trip is None or trip["status"] != "in_progress" or (user_id and trip["user_id"] != user_id):
                return None

            scans = self._scans(conn, trip_id)
            sequence_no = len(scans) + 1
            planned_modes = _loads_modes(trip["planned_modes"])
            expected_mode = planned_modes[min(sequence_no - 1, len(planned_modes) - 1)]
            is_expected = payload.mode == expected_mode
            anomaly_reason = None if is_expected else f"Expected {expected_mode}, got {payload.mode}. Re-plan before continuing."
            remaining_cap = max(0, trip["fare_cap_thb"] - trip["total_charged_thb"])
            charged = min(payload.raw_fare_thb, remaining_cap)

            conn.execute(
                """
                INSERT INTO trip_scans (
                  id, trip_id, sequence_no, mode, operator_label, vehicle_id, stop_label,
                  raw_fare_thb, charged_thb, is_expected, anomaly_reason, scanned_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    uuid4().hex,
                    trip_id,
                    sequence_no,
                    payload.mode,
                    payload.operator_label,
                    payload.vehicle_id,
                    payload.stop_label,
                    payload.raw_fare_thb,
                    charged,
                    1 if is_expected else 0,
                    anomaly_reason,
                    now,
                ),
            )
            conn.execute(
                """
                UPDATE trip_sessions
                SET total_charged_thb = total_charged_thb + ?,
                    anomaly_flags = anomaly_flags + ?,
                    updated_at = ?
                WHERE id = ?
                """,
                (charged, 0 if is_expected else 1, now, trip_id),
            )
            row = conn.execute("SELECT * FROM trip_sessions WHERE id = ?", (trip_id,)).fetchone()
            updated_scans = self._scans(conn, trip_id)
        return _trip_from_row(row, scans=updated_scans)

    def end_and_pay(self, trip_id: str, user_id: str) -> TripPaymentOut | None:
        now = utc_now().isoformat()
        with get_conn() as conn:
            trip = conn.execute(
                "SELECT * FROM trip_sessions WHERE id = ? AND user_id = ?",
                (trip_id, user_id),
            ).fetchone()
            if trip is None:
                return None
            scans = self._scans(conn, trip_id)
            if trip["status"] == "paid":
                user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
                return TripPaymentOut(trip=_trip_from_row(trip, scans=scans), balance_thb=user["balance_thb"], charged_thb=0)

            charged = trip["total_charged_thb"]
            user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            if user["balance_thb"] < charged:
                raise ValueError("Insufficient wallet balance. Ask admin to top up this demo account.")
            conn.execute(
                "UPDATE users SET balance_thb = balance_thb - ?, updated_at = ? WHERE id = ?",
                (charged, now, user_id),
            )
            conn.execute(
                """
                UPDATE trip_sessions
                SET status = 'paid', ended_at = ?, updated_at = ?
                WHERE id = ?
                """,
                (now, now, trip_id),
            )
            updated_trip = conn.execute("SELECT * FROM trip_sessions WHERE id = ?", (trip_id,)).fetchone()
            updated_user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            updated_scans = self._scans(conn, trip_id)
        return TripPaymentOut(
            trip=_trip_from_row(updated_trip, scans=updated_scans),
            balance_thb=updated_user["balance_thb"],
            charged_thb=charged,
        )

    def add_wallet_credit(self, payload: WalletCreditPayload) -> UserOut | None:
        now = utc_now().isoformat()
        email = payload.email.strip().lower()
        with get_conn() as conn:
            row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
            if row is None:
                return None
            conn.execute(
                "UPDATE users SET balance_thb = balance_thb + ?, updated_at = ? WHERE email = ?",
                (payload.amount_thb, now, email),
            )
            updated = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        return _user_from_row(updated)

    def _scans(self, conn, trip_id: str) -> list[TripScanOut]:
        rows = conn.execute(
            "SELECT * FROM trip_scans WHERE trip_id = ? ORDER BY sequence_no ASC",
            (trip_id,),
        ).fetchall()
        return [_scan_from_row(row) for row in rows]


trips_repo = TripRepository()
