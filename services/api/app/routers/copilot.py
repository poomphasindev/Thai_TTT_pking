from fastapi import APIRouter

from app.models import CopilotAnswer, CopilotAsk
from app.services.copilot import ask_copilot


router = APIRouter()


@router.post("/copilot/ask", response_model=CopilotAnswer)
async def ask(payload: CopilotAsk) -> CopilotAnswer:
    return await ask_copilot(payload)
