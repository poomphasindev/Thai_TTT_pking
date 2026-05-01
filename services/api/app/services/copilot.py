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
        remaining = max(0, payload.fare_cap_thb - payload.fare_billed_thb)
        text = (
            f"สำหรับ {payload.destination}:\n"
            f"1. เมื่อถึงพื้นที่ปลายทาง ให้ดูป้ายทางออกหรือท่าเรือที่ใกล้ที่สุดก่อน แล้วเทียบกับจุดบนแผนที่ในแอพ\n"
            f"2. สแกน QR ตอนขึ้นระบบแรก และสแกน QR เดิมทุกครั้งที่ต่อรถ รถไฟฟ้า หรือเรือ เพื่อให้ระบบรู้ว่าเป็น trip session เดียว\n"
            f"3. ตอนนี้คุณจ่ายแล้ว {payload.fare_billed_thb}/{payload.fare_cap_thb} บาท ระบบจะคิดเพิ่มได้อีกสูงสุด {remaining} บาทก่อนถึงเพดาน\n"
            "4. ถ้าหลงทางหรือแวะกลางทาง ให้ไม่ต้องออกบัตรใหม่ ให้ถาม AI เพื่อ re-plan จากตำแหน่งปัจจุบันและใช้บัตรเดิมต่อ\n"
            "5. ก่อนเข้าพื้นที่ท่องเที่ยว ให้เช็กมารยาทท้องถิ่น เวลาเปิด-ปิด และจุดปลอดภัย เช่น ทางออกหลักหรือจุดพบเจ้าหน้าที่"
        )
    else:
        remaining = max(0, payload.fare_cap_thb - payload.fare_billed_thb)
        text = (
            f"For {payload.destination}:\n"
            "1. When you arrive near the destination area, first check the recommended exit, pier, or stop and match it with the map pin in the app.\n"
            "2. Scan the QR when entering the first mode, then use the same QR for every transfer so the backend keeps one connected fare session.\n"
            f"3. You have been billed {payload.fare_billed_thb}/{payload.fare_cap_thb} THB today, so the next scans can charge at most {remaining} THB before the cap.\n"
            "4. If you get lost or make a stop midway, do not issue a new pass. Ask AI to re-plan from your current location and keep using the same ticket.\n"
            "5. Before entering the attraction, check local etiquette, opening hints, and safe meeting points such as the main exit or staffed area."
        )

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
- Do not be too short. Thai answers must be at least 450 Thai characters. English answers must be at least 120 words.
- Use exactly 5 compact bullets with these meanings: arrival point, where to scan QR, payment/cap impact, transfer or lost recovery, local tip.
- Be practical and complete. Finish every sentence.
- No markdown table.
- If asked outside scope, politely refuse and redirect.
Question: {payload.question}
"""
    body = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 520},
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
    if is_too_short(cleaned, payload.language):
        fallback = fallback_answer(payload)
        fallback.used_model = f"{GEMINI_MODEL}+structured-fallback"
        return fallback
    return CopilotAnswer(answer=cleaned, used_model=GEMINI_MODEL, fallback=False, suggestions=suggestions(payload.language))


def extract_text(payload: dict) -> str:
    parts = payload.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    return "\n".join(part.get("text", "") for part in parts if part.get("text"))


def is_too_short(text: str, language: str) -> bool:
    if language == "th":
        return len(text) < 360
    return len(text.split()) < 90
