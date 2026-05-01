import sqlite3
from datetime import datetime

from app.db import get_conn
from app.models import ReportOut, ReportStatus, utc_now


REPORT_COLUMNS = """
id, category, description, latitude, longitude, image_url, status,
reporter_name, contact, ai_category, ai_confidence, ai_summary,
created_at, updated_at
"""


def _row_to_report(row: sqlite3.Row) -> ReportOut:
    payload = dict(row)
    payload["created_at"] = datetime.fromisoformat(payload["created_at"])
    payload["updated_at"] = datetime.fromisoformat(payload["updated_at"])
    return ReportOut(**payload)


class ReportRepository:
    def create(
        self,
        *,
        report_id: str,
        category: str,
        description: str,
        latitude: float,
        longitude: float,
        image_url: str | None,
        reporter_name: str | None,
        contact: str | None,
    ) -> ReportOut:
        now = utc_now().isoformat()
        with get_conn() as conn:
            conn.execute(
                """
                INSERT INTO reports (
                  id, category, description, latitude, longitude, image_url,
                  status, reporter_name, contact, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    report_id,
                    category,
                    description,
                    latitude,
                    longitude,
                    image_url,
                    ReportStatus.submitted.value,
                    reporter_name,
                    contact,
                    now,
                    now,
                ),
            )
        report = self.get(report_id)
        if report is None:
            raise RuntimeError("Report creation failed")
        return report

    def list(self, *, status: str | None = None, category: str | None = None) -> list[ReportOut]:
        clauses: list[str] = []
        params: list[str] = []
        if status:
            clauses.append("status = ?")
            params.append(status)
        if category:
            clauses.append("category = ?")
            params.append(category)

        where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        with get_conn() as conn:
            rows = conn.execute(
                f"SELECT {REPORT_COLUMNS} FROM reports {where} ORDER BY created_at DESC",
                params,
            ).fetchall()
        return [_row_to_report(row) for row in rows]

    def get(self, report_id: str) -> ReportOut | None:
        with get_conn() as conn:
            row = conn.execute(
                f"SELECT {REPORT_COLUMNS} FROM reports WHERE id = ?",
                (report_id,),
            ).fetchone()
        return _row_to_report(row) if row else None

    def update_status(self, report_id: str, status: str) -> ReportOut | None:
        now = utc_now().isoformat()
        with get_conn() as conn:
            conn.execute(
                "UPDATE reports SET status = ?, updated_at = ? WHERE id = ?",
                (status, now, report_id),
            )
        return self.get(report_id)


reports_repo = ReportRepository()

