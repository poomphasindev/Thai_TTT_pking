from __future__ import annotations

import os
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = ROOT / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "smoke_test.db"
UPLOAD_DIR = DATA_DIR / "smoke_uploads"

if DB_PATH.exists():
    DB_PATH.unlink()

os.environ["TTM_DATABASE_PATH"] = str(DB_PATH)
os.environ["TTM_UPLOAD_DIR"] = str(UPLOAD_DIR)
sys.path.insert(0, str(ROOT / "services" / "api"))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import create_app  # noqa: E402


def main() -> None:
    client = TestClient(create_app())

    login = client.post(
        "/api/auth/login",
        json={"email": "demo.tourist@example.com", "display_name": "Demo Tourist"},
    )
    assert login.status_code == 200, login.text
    user = login.json()
    assert user["balance_thb"] == 200

    ticket = client.post(
        "/api/tickets",
        json={
            "holder_name": user["display_name"],
            "origin": "Siam",
            "destination": "Wat Arun",
            "pass_type": "tourist_day_pass",
        },
    )
    assert ticket.status_code == 201, ticket.text
    ticket_id = ticket.json()["id"]

    trip = client.post(
        "/api/trips",
        json={
            "ticket_id": ticket_id,
            "origin": "Siam",
            "destination": "Wat Arun",
            "planned_modes": ["rail", "bus", "boat"],
            "estimated_fare_thb": 45,
            "fare_cap_thb": 45,
        },
    )
    assert trip.status_code == 201, trip.text
    trip_id = trip.json()["id"]

    scans = [
        {"mode": "rail", "operator_label": "Rail gate", "vehicle_id": "BTS CEN", "stop_label": "Siam entry", "raw_fare_thb": 32},
        {"mode": "bus", "operator_label": "EV feeder", "vehicle_id": "FDR-ARU-1", "stop_label": "Tha Tien connector", "raw_fare_thb": 16},
        {"mode": "boat", "operator_label": "Pier staff", "vehicle_id": "EV Boat", "stop_label": "Wat Arun pier", "raw_fare_thb": 21},
    ]
    charged_after_each_scan = []
    for payload in scans:
        scan = client.post(f"/api/trips/{trip_id}/scan", json=payload)
        assert scan.status_code == 200, scan.text
        body = scan.json()
        charged_after_each_scan.append(body["total_charged_thb"])
        assert body["total_charged_thb"] <= 45

    payment = client.post(f"/api/trips/{trip_id}/end")
    assert payment.status_code == 200, payment.text
    paid = payment.json()
    assert paid["charged_thb"] == 45
    assert paid["balance_thb"] == 155
    assert paid["trip"]["status"] == "paid"

    report = client.post(
        "/api/reports",
        data={
            "category": "qr_scan_failed",
            "description": "QR validator at pier did not read the tourist pass.",
            "latitude": "13.7437",
            "longitude": "100.4889",
            "transport_mode": "boat",
            "vehicle_id": "Pier validator A",
            "severity": "medium",
            "location_label": "Wat Arun pier",
        },
    )
    assert report.status_code == 201, report.text

    print(
        {
            "user": user["email"],
            "ticket_id": ticket_id,
            "trip_id": trip_id,
            "charged_after_each_scan": charged_after_each_scan,
            "final_balance_thb": paid["balance_thb"],
            "report_id": report.json()["id"],
        }
    )


if __name__ == "__main__":
    main()
