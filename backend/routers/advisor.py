from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.claude import ask_claude, ask_claude_stream

router = APIRouter()


class ChatRequest(BaseModel):
    messages: list[dict]   # [{"role": "user"/"assistant", "content": "..."}]


@router.post("/chat")
def chat(req: ChatRequest):
    reply = ask_claude(req.messages)
    return {"reply": reply}


@router.post("/chat/stream")
def chat_stream(req: ChatRequest):
    def generate():
        for chunk in ask_claude_stream(req.messages):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
