from __future__ import annotations

import re

import httpx

from app.core.config import get_settings
from app.models import CopilotAnswer, CopilotAsk


GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

DOMAIN_KEYWORDS = {
    "route",
    "fare",
    "ticket",
    "qr",
    "scan",
    "bus",
    "boat",
    "rail",
    "mrt",
    "bts",
    "pier",
    "station",
    "landmark",
    "tourist",
    "temple",
    "restaurant",
    "market",
    "incident",
    "safety",
    "lost",
    "payment",
    "จ่าย",
    "บัตร",
    "ค่าโดยสาร",
    "รถเมล์",
    "เรือ",
    "รถไฟฟ้า",
    "สถานี",
    "ท่าเรือ",
    "หลง",
    "เที่ยว",
    "วัด",
    "ทาง",
}

DESTINATION_FACTS = {
    "Wat Arun": "Riverside temple. Use Tha Tien/Sanam Chai access, dress modestly, best late afternoon.",
    "Grand Palace": "Major royal landmark. Use Sanam Chai/Tha Chang area, strict dress code, daytime visit.",
    "Wat Mangkon / Yaowarat": "Chinatown food district. Use MRT Wat Mangkon, best evening, crowded footpaths.",
    "ICONSIAM": "Riverfront mall. Use Gold Line/Charoen Nakhon or river pier, strong indoor fallback in rain.",
    "Siam": "Central interchange and shopping area. Use BTS Siam, walkable malls and arts district.",
    "Chatuchak Weekend Market": "Large weekend market. Use BTS Mo Chit or MRT Chatuchak Park/Kamphaeng Phet.",
}


def is_in_domain(question: str) -> bool:
    lowered = question.lower()
    return any(keyword in lowered for keyword in DOMAIN_KEYWORDS)


def build_context(payload: CopilotAsk) -> str:
    fact = DESTINATION_FACTS.get(payload.destination, "Bangkok tourist destination. Use verified route steps and map pins.")
    remaining = max(0, payload.fare_cap_thb - payload.fare_billed_thb)
    return f"""
Product: Sawasdee Transit, a Bangkok tourist mobility assistant.
Scope: answer only about Bangkok tourist transit, routes, fare cap, QR scanning, destination arrival, safety, incident reporting, and nearby POIs.
Do not answer unrelated general knowledge. Politely redirect to route, fare, or destination help.
Destination: {payload.destination}
Destination facts: {fact}
Selected mode: {payload.mode}
Fare state: billed {payload.fare_billed_thb}/{payload.fare_cap_thb} THB, remaining charge before cap {remaining} THB.
Journey model:
1. Choose destination landmark.
2. Walk to the recommended station, pier, or feeder stop.
3. Scan QR to start one fare session.
4. Transfer by scanning the same QR. The backend records mode, stop, time, and charged fare.
5. If lost, ask for re-plan from current location and keep the same fare session.
6. At arrival, the app explains exit, walking direction, local etiquette, and next payment impact.
Data sources used by the prototype: curated landmarks, OpenStreetMap POIs, BMA/BMTA/Transit Bangkok as planned route-source integrations.
"""


def fallback_answer(payload: CopilotAsk) -> CopilotAnswer:
    if not is_in_domain(payload.question):
        text = (
            "ขอโทษครับ ฉันตอบเฉพาะเรื่องการเดินทางท่องเที่ยวในกรุงเทพฯ ค่าโดยสาร บัตร QR จุดต่อรถ และความปลอดภัยระหว่างทางเท่านั้น"
            if payload.language == "th"
            else "Sorry, I can only help with Bangkok tourist transit, fares, QR ticketing, transfers, safety, and destination guidance."
        )
    elif payload.language == "th":
        text = f"สำหรับ {payload.destination}: ไปตามจุดขึ้นรถ/สถานีที่แนะนำ สแกน QR เพื่อเปิด fare session เดียว ถ้าต่อรถหรือเรือให้ใช้ QR เดิม ระบบจะคิดเงินเพิ่มเฉพาะส่วนที่ยังไม่เกิน {payload.fare_cap_thb} บาท ถ้าหลงทางให้กดถาม AI เพื่อ re-plan จากตำแหน่งปัจจุบัน"
    else:
        text = f"For {payload.destination}: follow the recommended station, pier, or feeder stop, scan the QR once to start one fare session, and use the same QR when transferring. You will only be charged up to the {payload.fare_cap_thb} THB cap. If lost, ask AI to re-plan from your current location."

    return CopilotAnswer(answer=text, used_model="fallback", fallback=True, suggestions=suggestions(payload.language))


def suggestions(language: str) -> list[str]:
    if language == "th":
        return [
            "ฉันต้องสแกน QR ตรงไหน?",
            "ถ้าหลงทางระหว่างต่อรถทำยังไง?",
            "ถึงจุดหมายแล้วต้องออกทางไหน?",
        ]
    return [
        "Where do I scan the QR?",
        "What if I get lost during transfer?",
        "What should I do after arrival?",
    ]


async def ask_copilot(payload: CopilotAsk) -> CopilotAnswer:
    settings = get_settings()
    api_key = settings.gemini_api_key or settings.google_api_key
    if not is_in_domain(payload.question) or not api_key:
        return fallback_answer(payload)

    language_rule = "Answer in Thai." if payload.language == "th" else "Answer in concise, tourist-friendly English."
    prompt = f"""
{build_context(payload)}
Instruction:
- {language_rule}
- Keep the answer under 90 words.
- Use 2-4 short bullet-like sentences, no markdown table.
- Be practical: next action, where to scan, payment/cap impact, what to do if lost.
- If asked outside scope, politely refuse and redirect.
Question: {payload.question}
"""
    body = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.25, "maxOutputTokens": 180},
    }

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.post(
                GEMINI_URL,
                headers={"x-goog-api-key": api_key, "Content-Type": "application/json"},
                json=body,
            )
            response.raise_for_status()
            text = extract_text(response.json())
    except Exception:
        return fallback_answer(payload)

    cleaned = re.sub(r"\n{3,}", "\n\n", text).strip()
    if not cleaned:
        return fallback_answer(payload)
    return CopilotAnswer(answer=cleaned, used_model=GEMINI_MODEL, fallback=False, suggestions=suggestions(payload.language))


def extract_text(payload: dict) -> str:
    parts = payload.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    return "\n".join(part.get("text", "") for part in parts if part.get("text"))
