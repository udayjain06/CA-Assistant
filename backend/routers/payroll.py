from fastapi import APIRouter
from pydantic import BaseModel
from services.claude import ask_claude

router = APIRouter()


class Employee(BaseModel):
    name: str
    pan: str
    basic: float
    hra: float = 0
    special_allowance: float = 0
    pf_employee: float = 0
    professional_tax: float = 0
    tds: float = 0


class PayrollRequest(BaseModel):
    employees: list[Employee]
    month: str   # e.g. "June 2026"
    company_name: str


@router.post("/generate-slips")
def generate_salary_slips(req: PayrollRequest):
    slips = []
    for emp in req.employees:
        gross = emp.basic + emp.hra + emp.special_allowance
        deductions = emp.pf_employee + emp.professional_tax + emp.tds
        net = gross - deductions
        slips.append({
            "employee_name": emp.name,
            "pan": emp.pan,
            "month": req.month,
            "company": req.company_name,
            "earnings": {
                "Basic": emp.basic,
                "HRA": emp.hra,
                "Special Allowance": emp.special_allowance,
                "Gross": gross,
            },
            "deductions": {
                "PF (Employee)": emp.pf_employee,
                "Professional Tax": emp.professional_tax,
                "TDS": emp.tds,
                "Total Deductions": deductions,
            },
            "net_pay": net,
        })
    return {"slips": slips}


@router.post("/ai-advice")
def payroll_advice(question: str):
    prompt = f"Payroll compliance question: {question}\nAnswer with exact amounts, sections, and due dates."
    return {"answer": ask_claude([{"role": "user", "content": prompt}])}
