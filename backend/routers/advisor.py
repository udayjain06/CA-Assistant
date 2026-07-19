from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address
from services.claude import ask_claude, ask_claude_stream

router  = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class ChatRequest(BaseModel):
    messages: list[dict] = Field(..., max_length=20)  # Max 20 messages


@router.post("/chat")
@limiter.limit("20/minute")
def chat(request: Request, req: ChatRequest):
    # Only allow last 10 messages to prevent context stuffing
    recent = req.messages[-10:]
    reply  = ask_claude(recent)
    return {"reply": reply}


@router.post("/chat/stream")
@limiter.limit("15/minute")
def chat_stream(request: Request, req: ChatRequest):
    recent = req.messages[-10:]

    def generate():
        try:
            for chunk in ask_claude_stream(recent):
                yield f"data: {chunk}\n\n"
        except Exception:
            yield "data: Sorry, kuch problem aayi. Dobara try karo.\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
