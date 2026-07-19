from fastapi import APIRouter, Request
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address
from services.claude import ask_claude

router  = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class GSTQuery(BaseModel):
    question: str  = Field(..., min_length=5, max_length=500)
    turnover: float = Field(0, ge=0, le=10_000_000_000)
    gst_number: str = Field("", max_length=20)


@router.post("/ai-query")
@limiter.limit("15/minute")
def gst_ai_query(request: Request, req: GSTQuery):
    prompt = (
        f"GST question (turnover: ₹{req.turnover:,.0f}): {req.question}\n"
        "Answer with GSTR form names, due dates, and penalty clauses. Under 150 words."
    )
    return {"answer": ask_claude([{"role": "user", "content": prompt}])}


@router.get("/deadlines")
def gst_deadlines():
    return {
        "GSTR-1 (monthly)": "11th of next month",
        "GSTR-1 (quarterly QRMP)": "13th of month after quarter",
        "GSTR-3B (monthly)": "20th of next month",
        "GSTR-9 (annual)": "31st December",
    }
