from fastapi import APIRouter, Request
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address
from services.tax_engine import compare_regimes, pick_itr_form
from services.claude import ask_claude

router  = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class TaxCompareRequest(BaseModel):
    gross_income: float = Field(..., ge=0, le=100_000_000)
    age: int            = Field(28, ge=18, le=100)
    deductions: dict    = Field(default_factory=dict)


class SalarySlipTextRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=8000)  # Hard limit
    age: int  = Field(28, ge=18, le=100)


class SmartITRRequest(BaseModel):
    answers: dict = Field(default_factory=dict)


class AIAdviceRequest(BaseModel):
    gross_income: float = Field(..., ge=0, le=100_000_000)
    age: int            = Field(28, ge=18, le=100)
    regime: str         = Field("new", pattern="^(new|old)$")
    deductions: dict    = Field(default_factory=dict)


@router.post("/compare-regimes")
@limiter.limit("30/minute")
def compare_tax_regimes(request: Request, req: TaxCompareRequest):
    return compare_regimes(req.gross_income, req.age, req.deductions)


@router.post("/pick-form")
@limiter.limit("30/minute")
def pick_form(request: Request, income_sources: list[str], gross_income: float):
    return pick_itr_form(income_sources, gross_income)


@router.post("/extract-salary-slip")
@limiter.limit("10/minute")   # Strict — AI call
def extract_from_salary_slip(request: Request, req: SalarySlipTextRequest):
    prompt = (
        "Extract income tax data from this salary slip. "
        "Return ONLY a JSON object with: employee_name, annual_gross, basic_monthly, "
        "hra_monthly, pf_annual, tds_annual, deductions_found (sec80c, sec80d, hra_exemption), "
        "itr_form_suggested, summary (one line in Hinglish).\n\n"
        "SALARY SLIP TEXT:\n"
    )
    # User text is passed separately — NOT interpolated into system-level prompt
    response = ask_claude([
        {"role": "user", "content": prompt + req.text}
    ])

    import json, re
    try:
        clean = re.sub(r'```json|```', '', response).strip()
        return json.loads(clean)
    except Exception:
        # Never return raw AI response — return safe error
        return {"error": "Could not parse salary slip. Please try again or enter details manually."}


@router.post("/smart-extract")
@limiter.limit("10/minute")
def smart_extract(request: Request, req: SmartITRRequest):
    # Limit answers size
    safe_answers = {k[:50]: str(v)[:200] for k, v in list(req.answers.items())[:20]}
    prompt = (
        "Based on these user answers about their finances, extract tax data. "
        "Return ONLY a JSON with: gross_income, sec80c, sec80d, sec80ccd_amount, "
        "hra_exemption, home_loan_interest, income_sources (list), summary (Hinglish).\n\n"
        f"USER ANSWERS: {safe_answers}"
    )
    response = ask_claude([{"role": "user", "content": prompt}])
    import json, re
    try:
        clean = re.sub(r'```json|```', '', response).strip()
        return json.loads(clean)
    except Exception:
        return {"error": "Could not process. Please try again."}


@router.post("/ai-advice")
@limiter.limit("10/minute")
def get_ai_tax_advice(request: Request, req: AIAdviceRequest):
    prompt = (
        f"User profile: Income ₹{req.gross_income:,.0f}, Age {req.age}, "
        f"Regime: {req.regime}, Deductions: {req.deductions}.\n"
        "Give 3 specific tax saving opportunities with exact ₹ amounts and section numbers. "
        "Keep it under 200 words. Simple Hinglish."
    )
    response = ask_claude([{"role": "user", "content": prompt}])
    return {"advice": response}
