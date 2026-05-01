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
    "open",
    "close",
    "hour",
    "hours",
    "etiquette",
    "dress",
    "photo",
    "food",
    "tip",
    "app",
    "pass",
    "wrong",
    "reroute",
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
    "ปิด",
    "เปิด",
    "กี่โมง",
    "เวลา",
    "มารยาท",
    "แต่งตัว",
    "ถ่ายรูป",
    "กิน",
    "ร้าน",
    "แอพ",
    "ผิดคัน",
    "ขึ้นผิด",
    "ต่อรถ",
}

DESTINATION_FACTS = {
    "Wat Arun": "Riverside temple. Use Tha Tien/Sanam Chai access, dress modestly, best late afternoon. Prototype opening hint: usually daytime, verify official hours before final visit.",
    "Grand Palace": "Major royal landmark. Use Sanam Chai/Tha Chang area, strict dress code, daytime visit. Prototype opening hint: daytime only, verify official hours.",
    "Wat Mangkon / Yaowarat": "Chinatown food district. Use MRT Wat Mangkon, best evening, crowded footpaths. Food area is strongest after late afternoon.",
    "ICONSIAM": "Riverfront mall. Use Gold Line/Charoen Nakhon or river pier, strong indoor fallback in rain. Mall hours are usually later than temples; verify live hours.",
    "Siam": "Central interchange and shopping area. Use BTS Siam, walkable malls and arts district. Good all-weather interchange.",
    "Chatuchak Weekend Market": "Large weekend market. Use BTS Mo Chit or MRT Chatuchak Park/Kamphaeng Phet. Best on weekends; verify market day and hours.",
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
Allowed tourist topics: opening/closing hints, etiquette, dress code, food nearby, photo tips, how the app works, what to do after arrival, wrong bus/train/boat recovery.
Do not answer unrelated general knowledge. Politely redirect to route, fare, destination, app workflow, or tourist help.
Destination: {payload.destination}
Destination facts: {fact}
Selected mode: {payload.mode}
Fare state: billed {payload.fare_billed_thb}/{payload.fare_cap_thb} THB, remaining charge before cap {remaining} THB.
Journey model:
1. Choose destination landmark.
2. Walk to the recommended station, pier, or feeder stop.
3. Scan QR at the vehicle/gate/pier validator to start one fare session.
4. For rail, scan/tap at entry and exit; charge is finalized at exit. For bus/boat, scan when boarding; the operator validator records route, stop, and time.
5. Transfer by scanning the same QR. The backend links each scan into the same fare session and caps total charge.
6. If the passenger boards the wrong vehicle, misses a stop, or detours, the app should not create a new pass. It should re-plan from current location and show the remaining cap.
7. At arrival, the app explains exit, walking direction, local etiquette, opening-hour hints, safety, and next payment impact.
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
        text = thai_fallback(payload)
    else:
        text = english_fallback(payload)

    return CopilotAnswer(answer=text, used_model="fallback", fallback=True, suggestions=suggestions(payload.language))


def suggestions(language: str) -> list[str]:
    if language == "th":
        return [
            "ฉันต้องสแกน QR ตรงไหน?",
            "ถ้าหลงทางระหว่างต่อรถทำยังไง?",
            "ที่นี่ปิดกี่โมงและควรแต่งตัวยังไง?",
        ]
    return [
        "Where do I scan the QR?",
        "What if I get lost during transfer?",
        "What are the opening hours and etiquette?",
    ]


def thai_fallback(payload: CopilotAsk) -> str:
    q = payload.question.lower()
    remaining = max(0, payload.fare_cap_thb - payload.fare_billed_thb)
    if any(word in q for word in ["ปิด", "เปิด", "กี่โมง", "เวลา"]):
        return (
            f"สำหรับ {payload.destination}: ตอนนี้ prototype ใช้ข้อมูลเวลาแบบคำแนะนำ ไม่ใช่ live official feed จึงควรให้ผู้ใช้กดตรวจสอบแหล่งทางการก่อนออกเดินทางจริง "
            "ถ้าเป็นวัดหรือสถานที่ราชการ ให้ถือว่าเหมาะกับช่วงกลางวันและควรไปก่อนเย็น หากเป็นย่านอาหาร/ห้างมักเหมาะช่วงบ่ายถึงค่ำ "
            "ระบบควรแสดงเวลาแบบ “แนะนำ + ต้องยืนยันอีกครั้ง” และให้ AI ช่วยบอกทางไปทางออก/ท่าเรือ/ป้ายรถที่ใกล้สุดเมื่อถึงพื้นที่"
        )
    if any(word in q for word in ["มารยาท", "แต่งตัว", "dress", "etiquette"]):
        return (
            f"มารยาทสำหรับ {payload.destination}: แต่งกายสุภาพ โดยเฉพาะวัดและพื้นที่ราชการ ควรคลุมไหล่และเข่า พูดเบา ไม่ปีนหรือแตะต้องพื้นที่ศักดิ์สิทธิ์ "
            "ถ่ายรูปได้เฉพาะจุดที่อนุญาต และถ้ามีเจ้าหน้าที่ให้ยื่น QR/บัตรในแอพเมื่อจำเป็น "
            "แอพควรช่วยด้วยการเตือน dress code ก่อนถึงปลายทาง พร้อมบอกจุดทางเข้า ทางออก และพื้นที่ปลอดภัยสำหรับนัดพบ"
        )
    if any(word in q for word in ["สแกน", "qr", "บัตร"]):
        return (
            f"ให้สแกน QR ตอนเริ่มใช้ระบบแรก เช่น ประตูรถไฟฟ้า เครื่องสแกนบนรถเมล์ หรือจุดตรวจที่ท่าเรือ จากนั้นใช้ QR เดิมทุกครั้งที่ต่อรถหรือเรือ "
            f"ระบบหลังบ้านจะรู้ว่าเป็น fare session เดียว จึงคิดเงินตามการใช้งานจริงแต่ไม่เกิน {payload.fare_cap_thb} บาท ตอนนี้จ่ายแล้ว {payload.fare_billed_thb} บาท เหลือเพดานอีก {remaining} บาท "
            "ถ้าขึ้นผิดคัน ให้ไม่ต้องออกบัตรใหม่ ให้กดให้ AI re-plan จากตำแหน่งปัจจุบัน แล้ว scan ต่อเมื่อขึ้นคัน/เรือ/สถานีถัดไป"
        )
    if any(word in q for word in ["หลง", "ผิดคัน", "ขึ้นผิด", "แวะ"]):
        return (
            "ถ้าหลงทางหรือขึ้นผิดคัน ระบบไม่ควรลงโทษด้วยการบังคับซื้อบัตรใหม่ ให้ใช้บัตรเดิมต่อเพราะ QR ผูกกับ user และ fare session เดียว "
            "ขั้นตอนคือกด “ฉันหลงทาง” ให้ AI อ่านจุดหมาย ปัจจุบัน mode และยอดจ่าย แล้วแนะนำจุดกลับเข้าสายที่ถูกต้อง เช่น ป้ายรถ ท่าเรือ หรือสถานีใกล้ที่สุด "
            f"ถ้ามีการ scan เพิ่ม ระบบคิดเงินเฉพาะส่วนที่เหลือก่อนถึงเพดาน {payload.fare_cap_thb} บาท"
        )
    return (
        f"สำหรับ {payload.destination}: เริ่มจากเลือกแลนด์มาร์ก แล้วเดินไปสถานี/ท่าเรือ/ป้ายที่แอพแนะนำ สแกน QR เพื่อเปิด fare session เดียว "
        "ทุกครั้งที่ต่อรถ รถไฟฟ้า หรือเรือ ให้ใช้ QR เดิมเพื่อให้ backend ตรวจว่าเป็นการเดินทางต่อเนื่อง "
        f"ตอนนี้จ่ายแล้ว {payload.fare_billed_thb}/{payload.fare_cap_thb} บาท จึงจ่ายเพิ่มได้ไม่เกิน {remaining} บาท หากแวะหรือหลงทางให้ re-plan จากตำแหน่งปัจจุบันโดยไม่ต้องออกบัตรใหม่"
    )


def english_fallback(payload: CopilotAsk) -> str:
    q = payload.question.lower()
    remaining = max(0, payload.fare_cap_thb - payload.fare_billed_thb)
    if any(word in q for word in ["open", "close", "hour"]):
        return (
            f"For {payload.destination}: the prototype should show opening hours as guidance, not a live official guarantee. "
            "For temples and civic landmarks, recommend daytime arrival and verify official hours before the final visit. "
            "For food districts and malls, afternoon to evening is usually safer for the pitch flow. The app should pair this with the nearest exit, pier, or stop."
        )
    if any(word in q for word in ["etiquette", "dress", "photo"]):
        return (
            f"Etiquette for {payload.destination}: dress modestly for temples and civic sites, keep shoulders/knees covered where required, speak quietly, and avoid restricted photo areas. "
            "The app should warn the tourist before arrival, then show the correct gate, safe meeting point, and staffed area. If staff asks for validation, show the live QR."
        )
    if any(word in q for word in ["scan", "qr", "pass", "ticket"]):
        return (
            f"Scan the QR at the first validator: rail gate, bus validator, boat pier, or staff scanner. Use the same QR at every transfer so the backend keeps one fare session. "
            f"You have paid {payload.fare_billed_thb}/{payload.fare_cap_thb} THB, so remaining charge before the cap is {remaining} THB. If you board the wrong vehicle, re-plan and keep the same pass."
        )
    return (
        f"For {payload.destination}: choose the landmark first, follow the recommended station, pier, or feeder stop, and scan the QR to start one connected fare session. "
        f"Each transfer uses the same QR; the backend records mode, route, stop, and fare while keeping total charge within {payload.fare_cap_thb} THB. If lost, re-plan from current location."
    )


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
- Answer the user's actual intent. Be flexible: if they ask opening hours, answer opening-hours guidance; if etiquette, answer etiquette; if QR, answer QR workflow; if app logic, explain the app.
- Thai answers should usually be 220-520 Thai characters. English answers should usually be 70-140 words.
- Use compact bullets only when helpful. Do not force every answer into the same template.
- Include route/fare/QR context only when relevant to the question.
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
        return len(text) < 160
    return len(text.split()) < 45
