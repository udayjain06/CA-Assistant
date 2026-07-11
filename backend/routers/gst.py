from fastapi import APIRouter
from pydantic import BaseModel
from services.claude import ask_claude

router = APIRouter()


class GSTQuery(BaseModel):
    question: str
    turnover: float = 0
    gst_number: str = ""


class InvoiceData(BaseModel):
    invoices: list[dict]   # [{invoice_no, date, buyer_gstin, amount, gst_rate}]
    period: str            # "2025-06"


@router.post("/gstr1-summary")
def gstr1_summary(data: InvoiceData):
    """Summarize invoices into GSTR-1 buckets (B2B, B2C, exports etc)."""
    b2b = [i for i in data.invoices if i.get("buyer_gstin")]
    b2c = [i for i in data.invoices if not i.get("buyer_gstin")]

    b2b_total = sum(i.get("amount", 0) for i in b2b)
    b2c_total = sum(i.get("amount", 0) for i in b2c)
    total_gst  = sum(i.get("amount", 0) * i.get("gst_rate", 18) / 100 for i in data.invoices)

    return {
        "period": data.period,
        "b2b_invoices": len(b2b),
        "b2b_taxable_value": b2b_total,
        "b2c_invoices": len(b2c),
        "b2c_taxable_value": b2c_total,
        "total_gst_liability": round(total_gst, 2),
        "cgst": round(total_gst / 2, 2),
        "sgst": round(total_gst / 2, 2),
        "igst": 0,
    }


@router.post("/ai-query")
def gst_ai_query(req: GSTQuery):
    prompt = f"""
GST question from a business owner:
- Annual turnover: ₹{req.turnover:,.0f}
- GSTIN: {req.gst_number or 'Not provided'}
- Question: {req.question}

Answer with specific GSTR form names, due dates, and penalty clauses.
"""
    return {"answer": ask_claude([{"role": "user", "content": prompt}])}


@router.get("/deadlines")
def gst_deadlines():
    return {
        "GSTR-1 (monthly)": "11th of next month",
        "GSTR-1 (quarterly - QRMP)": "13th of month after quarter",
        "GSTR-3B (monthly)": "20th of next month",
        "GSTR-3B (quarterly)": "22nd/24th of month after quarter",
        "GSTR-9 (annual)": "31st December",
        "GSTR-9C (reconciliation)": "31st December",
    }
