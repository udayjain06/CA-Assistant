from fastapi import APIRouter, Request
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address

router  = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class Employee(BaseModel):
    name: str              = Field(..., min_length=1, max_length=100)
    pan: str               = Field("", max_length=10, pattern="^([A-Z]{5}[0-9]{4}[A-Z])?$")
    basic: float           = Field(..., ge=0, le=10_000_000)
    hra: float             = Field(0, ge=0, le=10_000_000)
    special_allowance: float = Field(0, ge=0, le=10_000_000)
    tds: float             = Field(0, ge=0)


class PayrollRequest(BaseModel):
    employees: list[Employee] = Field(..., max_length=100)
    month: str                = Field(..., max_length=20)
    company_name: str         = Field(..., max_length=100)


@router.post("/generate-slips")
@limiter.limit("20/minute")
def generate_salary_slips(request: Request, req: PayrollRequest):
    slips = []
    for emp in req.employees:
        gross = emp.basic + emp.hra + emp.special_allowance
        pf    = round(emp.basic * 0.12)
        pt    = 200
        net   = gross - pf - pt - emp.tds
        slips.append({
            "employee_name": emp.name,
            "pan": f"{emp.pan[:5]}****{emp.pan[-1]}" if len(emp.pan) == 10 else "",  # Mask PAN
            "month": req.month,
            "gross": gross,
            "pf_employee": pf,
            "professional_tax": pt,
            "tds": emp.tds,
            "net_pay": net,
        })
    return {"slips": slips}
