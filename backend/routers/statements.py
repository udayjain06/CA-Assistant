from fastapi import APIRouter, Request  # type: ignore[import]
from pydantic import BaseModel, Field  # type: ignore[import]
from slowapi import Limiter  # type: ignore[import]
from slowapi.util import get_remote_address  # type: ignore[import]
from services.claude import ask_claude

router  = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class Transaction(BaseModel):
    date: str        = Field(..., max_length=20)
    description: str = Field(..., max_length=200)
    amount: float    = Field(..., ge=0, le=1_000_000_000)
    type: str        = Field(..., pattern="^(income|expense)$")
    category: str    = Field("", max_length=50)


class StatementRequest(BaseModel):
    transactions: list[Transaction] = Field(..., max_length=500)
    period: str       = Field(..., max_length=20)
    company_name: str = Field(..., max_length=100)


@router.post("/generate")
@limiter.limit("20/minute")
def generate_statements(request: Request, req: StatementRequest):
    income   = sum(t.amount for t in req.transactions if t.type == "income")
    expenses = sum(t.amount for t in req.transactions if t.type == "expense")
    by_cat: dict = {}
    for t in req.transactions:
        key = f"{t.type}:{t.category or 'Other'}"
        by_cat[key] = by_cat.get(key, 0) + t.amount
    return {
        "period": req.period,
        "company": req.company_name,
        "total_income": income,
        "total_expenses": expenses,
        "net_profit": income - expenses,
        "by_category": by_cat,
    }


@router.post("/ai-analyze")
@limiter.limit("10/minute")
def ai_analyze(request: Request, req: StatementRequest):
    income   = sum(t.amount for t in req.transactions if t.type == "income")
    expenses = sum(t.amount for t in req.transactions if t.type == "expense")
    prompt = (
        f"Analyze financials for {req.company_name} ({req.period}): "
        f"Revenue ₹{income:,.0f}, Expenses ₹{expenses:,.0f}, "
        f"Net {'Profit' if income > expenses else 'Loss'} ₹{abs(income-expenses):,.0f}. "
        "Give 3 key insights and tax implications. Under 150 words. Simple Hinglish."
    )
    return {"analysis": ask_claude([{"role": "user", "content": prompt}])}
