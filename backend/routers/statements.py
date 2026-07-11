from fastapi import APIRouter
from pydantic import BaseModel
from services.claude import ask_claude

router = APIRouter()


class Transaction(BaseModel):
    date: str
    description: str
    amount: float
    type: str   # "income" or "expense"
    category: str = ""


class StatementRequest(BaseModel):
    transactions: list[Transaction]
    period: str   # e.g. "FY 2025-26"
    company_name: str


@router.post("/generate")
def generate_statements(req: StatementRequest):
    income_items = [t for t in req.transactions if t.type == "income"]
    expense_items = [t for t in req.transactions if t.type == "expense"]

    total_income = sum(t.amount for t in income_items)
    total_expenses = sum(t.amount for t in expense_items)
    net_profit = total_income - total_expenses

    # Group by category
    income_by_cat: dict[str, float] = {}
    expense_by_cat: dict[str, float] = {}
    for t in income_items:
        income_by_cat[t.category or "Revenue"] = income_by_cat.get(t.category or "Revenue", 0) + t.amount
    for t in expense_items:
        expense_by_cat[t.category or "Expenses"] = expense_by_cat.get(t.category or "Expenses", 0) + t.amount

    return {
        "period": req.period,
        "company": req.company_name,
        "profit_loss": {
            "income": income_by_cat,
            "total_income": total_income,
            "expenses": expense_by_cat,
            "total_expenses": total_expenses,
            "net_profit_loss": net_profit,
            "profitable": net_profit > 0,
        },
        "summary": {
            "total_transactions": len(req.transactions),
            "income_transactions": len(income_items),
            "expense_transactions": len(expense_items),
        }
    }


@router.post("/ai-analyze")
def ai_analyze(req: StatementRequest):
    summary = f"""
Company: {req.company_name}
Period: {req.period}
Transactions: {len(req.transactions)}
Total income: ₹{sum(t.amount for t in req.transactions if t.type == 'income'):,.0f}
Total expenses: ₹{sum(t.amount for t in req.transactions if t.type == 'expense'):,.0f}
"""
    prompt = f"""
Analyze these financial statements and give insights:
{summary}

Provide:
1. Key observations about the financial health
2. Unusual patterns or red flags
3. Tax implications
4. Recommendations for next quarter
Be specific with numbers.
"""
    return {"analysis": ask_claude([{"role": "user", "content": prompt}])}
