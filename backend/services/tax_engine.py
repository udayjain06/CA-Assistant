"""
Core tax calculation engine — India Income Tax Act 2025
AY 2026-27 (FY 2025-26)
"""

from dataclasses import dataclass


@dataclass
class TaxResult:
    gross_income: float
    taxable_income: float
    tax_before_cess: float
    cess: float
    total_tax: float
    effective_rate: float
    regime: str
    deductions_used: dict
    recommended_regime: str
    savings_vs_other: float


# ── NEW REGIME SLABS (default from AY 2024-25 onwards) ─────────────────
NEW_REGIME_SLABS = [
    (300_000,   0.00),
    (700_000,   0.05),
    (1_000_000, 0.10),
    (1_200_000, 0.15),
    (1_500_000, 0.20),
    (float("inf"), 0.30),
]

# ── OLD REGIME SLABS ────────────────────────────────────────────────────
OLD_REGIME_SLABS_BELOW_60 = [
    (250_000,   0.00),
    (500_000,   0.05),
    (1_000_000, 0.20),
    (float("inf"), 0.30),
]

OLD_REGIME_SLABS_SENIOR = [   # 60–80 years
    (300_000,   0.00),
    (500_000,   0.05),
    (1_000_000, 0.20),
    (float("inf"), 0.30),
]

OLD_REGIME_SLABS_SUPER_SENIOR = [  # 80+ years
    (500_000,   0.00),
    (1_000_000, 0.20),
    (float("inf"), 0.30),
]


def _slab_tax(income: float, slabs: list) -> float:
    tax = 0.0
    prev = 0.0
    for limit, rate in slabs:
        if income <= prev:
            break
        taxable = min(income, limit) - prev
        tax += taxable * rate
        prev = limit
    return tax


def _rebate_87a(taxable_income: float, tax: float, regime: str) -> float:
    """Section 87A rebate."""
    limit = 700_000 if regime == "new" else 500_000
    if taxable_income <= limit:
        max_rebate = 25_000
        return min(tax, max_rebate)
    return 0.0


def calculate_tax(
    gross_income: float,
    regime: str = "new",
    age: int = 30,
    deductions: dict | None = None,
) -> TaxResult:
    deductions = deductions or {}

    # ── Old regime deductions ───────────────────────────────────────────
    deductions_used = {}
    taxable_income = gross_income

    if regime == "old":
        standard_deduction = min(50_000, gross_income)
        deductions_used["Standard deduction (16ia)"] = standard_deduction

        sec80c = min(deductions.get("sec80c", 0), 150_000)
        sec80d = min(deductions.get("sec80d", 0), 25_000)
        sec80ccd = min(deductions.get("sec80ccd_1b", 0), 50_000)
        hra     = deductions.get("hra", 0)
        home_loan = deductions.get("home_loan_interest", 0)

        deductions_used["80C (PF, LIC, ELSS etc)"] = sec80c
        deductions_used["80D (Health insurance)"]   = sec80d
        deductions_used["80CCD(1B) NPS"]            = sec80ccd
        deductions_used["HRA exemption"]            = hra
        deductions_used["Home loan interest (24b)"] = min(home_loan, 200_000)

        total_deductions = (
            standard_deduction + sec80c + sec80d +
            sec80ccd + hra + min(home_loan, 200_000)
        )
        taxable_income = max(0, gross_income - total_deductions)

        if age >= 80:
            slabs = OLD_REGIME_SLABS_SUPER_SENIOR
        elif age >= 60:
            slabs = OLD_REGIME_SLABS_SENIOR
        else:
            slabs = OLD_REGIME_SLABS_BELOW_60

    else:
        # New regime: only standard deduction of ₹75,000 from FY 2024-25
        standard_deduction = min(75_000, gross_income)
        deductions_used["Standard deduction"] = standard_deduction
        taxable_income = max(0, gross_income - standard_deduction)
        slabs = NEW_REGIME_SLABS

    tax_before_rebate = _slab_tax(taxable_income, slabs)

    # Surcharge
    surcharge = 0.0
    if taxable_income > 5_000_000:
        surcharge_rate = (
            0.10 if taxable_income <= 10_000_000
            else 0.15 if taxable_income <= 20_000_000
            else 0.25 if taxable_income <= 50_000_000
            else 0.37
        )
        if regime == "new" and surcharge_rate > 0.25:
            surcharge_rate = 0.25  # capped at 25% for new regime
        surcharge = tax_before_rebate * surcharge_rate

    tax_after_surcharge = tax_before_rebate + surcharge
    rebate = _rebate_87a(taxable_income, tax_after_surcharge, regime)
    tax_after_rebate = max(0, tax_after_surcharge - rebate)

    # Health & Education Cess: 4%
    cess = tax_after_rebate * 0.04
    total_tax = tax_after_rebate + cess

    effective_rate = (total_tax / gross_income * 100) if gross_income > 0 else 0

    return TaxResult(
        gross_income=gross_income,
        taxable_income=taxable_income,
        tax_before_cess=tax_after_rebate,
        cess=cess,
        total_tax=total_tax,
        effective_rate=effective_rate,
        regime=regime,
        deductions_used=deductions_used,
        recommended_regime="",
        savings_vs_other=0.0,
    )


def compare_regimes(gross_income: float, age: int = 30, deductions: dict | None = None) -> dict:
    """Compare old vs new regime and recommend the better one."""
    old = calculate_tax(gross_income, "old", age, deductions)
    new = calculate_tax(gross_income, "new", age, deductions)

    recommended = "old" if old.total_tax < new.total_tax else "new"
    savings = abs(old.total_tax - new.total_tax)

    return {
        "old_regime": {
            "taxable_income": old.taxable_income,
            "tax": old.total_tax,
            "effective_rate": round(old.effective_rate, 2),
            "deductions_used": old.deductions_used,
        },
        "new_regime": {
            "taxable_income": new.taxable_income,
            "tax": new.total_tax,
            "effective_rate": round(new.effective_rate, 2),
            "deductions_used": new.deductions_used,
        },
        "recommended": recommended,
        "savings": round(savings),
        "recommendation_reason": (
            f"Old regime saves ₹{round(savings):,} because your deductions "
            f"(₹{round(gross_income - old.taxable_income):,}) reduce taxable income significantly."
            if recommended == "old"
            else f"New regime saves ₹{round(savings):,} — your deductions are not high enough "
            f"to offset the lower slab rates in the new regime."
        ),
    }


def pick_itr_form(income_sources: list[str], gross_income: float) -> dict:
    """Pick the right ITR form based on income sources."""
    sources = set(income_sources)

    if "business" in sources or "profession" in sources:
        form = "ITR-3" if "capital_gains" in sources or "salary" in sources else "ITR-3"
        reason = "You have business/profession income — ITR-3 is required."
    elif "capital_gains" in sources:
        form = "ITR-2"
        reason = "You have capital gains — ITR-2 is required."
    elif sources == {"salary"} or sources == {"salary", "interest"} or sources == {"salary", "interest", "house_property"}:
        form = "ITR-1" if gross_income <= 5_000_000 else "ITR-2"
        reason = (
            "Salary + interest/house property only — ITR-1 (Sahaj) works."
            if gross_income <= 5_000_000
            else "Income > ₹50L — ITR-2 required even for salary."
        )
    else:
        form = "ITR-2"
        reason = "Multiple income sources — ITR-2 is the safe choice."

    return {"form": form, "reason": reason}
