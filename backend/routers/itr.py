from fastapi import APIRouter
from pydantic import BaseModel
from services.tax_engine import compare_regimes, pick_itr_form
from services.claude import ask_claude

router = APIRouter()


class TaxCompareRequest(BaseModel):
    gross_income: float
    age: int = 30
    deductions: dict = {}


class ITRFormRequest(BaseModel):
    income_sources: list[str]
    gross_income: float


class TaxAdviceRequest(BaseModel):
    gross_income: float
    age: int
    deductions: dict
    regime: str
    user_question: str = ""


@router.post("/compare-regimes")
def compare_tax_regimes(req: TaxCompareRequest):
    result = compare_regimes(req.gross_income, req.age, req.deductions)
    return result


@router.post("/pick-form")
def pick_form(req: ITRFormRequest):
    return pick_itr_form(req.income_sources, req.gross_income)


@router.post("/ai-advice")
def get_ai_tax_advice(req: TaxAdviceRequest):
    prompt = f"""
User's tax profile:
- Gross Income: ₹{req.gross_income:,.0f}
- Age: {req.age}
- Regime: {req.regime}
- Deductions claimed: {req.deductions}

{"User question: " + req.user_question if req.user_question else "Give a personalized tax-saving advice summary."}

Give specific, actionable advice with:
1. Top 3 tax saving opportunities they might be missing
2. Exact sections and amounts
3. What to do before March 31st
Be concise, use bullet points, mention exact ₹ amounts.
"""
    response = ask_claude([{"role": "user", "content": prompt}])
    return {"advice": response}
