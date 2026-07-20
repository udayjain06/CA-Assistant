# 🧾 TaxGenie — AI-Powered Tax Assistant for India

> Understand your taxes, file ITR, generate invoices, calculate capital gains — all in one place, powered by AI.

[![Live Demo](https://img.shields.io/badge/Live-ca--assistant--lac.vercel.app-blue?style=flat-square)](https://ca-assistant-lac.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-green?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)

---

## 🎯 What is TaxGenie?

TaxGenie is an AI-powered tax assistance platform that helps individuals and small businesses in India understand and manage their taxes. It simplifies complex tax concepts into plain Hindi/English — so you always know where you stand.

---

## ✨ Features

### 🧑‍💼 Meet Your CA
A conversational AI experience — answer simple questions in Hindi or English, and get a complete tax summary. No jargon, no complicated forms.

### 📋 ITR Filing Assistant
- Old vs New regime comparison with exact ₹ savings
- ITR form recommendation (ITR-1, 2, 3, 4)
- AI-powered personalized tax saving tips
- Save analysis to your dashboard

### 🧾 GST Compliance
- GSTR-1, 3B due date tracker
- AI-powered GST Q&A in Hinglish
- Deadline reminders

### 📈 Capital Gains Calculator
- Stocks, Mutual Funds, Property, Gold
- Automatic STCG/LTCG classification
- Tax loss harvesting suggestions

### ₿ Crypto Tax Calculator
- 30% flat tax (Section 115BBH)
- 1% TDS auto-calculation
- Schedule VDA filing guidance

### 🧾 GST Invoice Generator
- Fully GST-compliant invoices
- Auto CGST/SGST/IGST (inter vs intra state)
- Print/PDF ready

### 💰 Payroll & Form 16
- Add employees, auto-calculate salary
- PF, Professional Tax, TDS calculation
- Printable salary slips

### 📊 TDS Returns
- TDS calculator (Section 192, 194A, 194C, 194J, etc.)
- Rate chart with thresholds
- Deadline tracker with penalty info

### 📉 Financial Statements
- Enter transactions → auto P&L and Balance Sheet
- AI analysis in Hinglish

### 📬 IT Notice Handler
- 8 common income tax notices explained in simple Hindi
- Deadline and penalty information
- AI-assisted response letter drafting

### 🔍 Audit & Advisory
- Compliance checklist with scoring
- Key deadline tracker
- Common red flags to watch out for

### 📂 Document Vault
- Upload salary slips, Form 16, bank statements
- AI extracts and categorizes data automatically

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | FastAPI (Python) |
| Database & Auth | Supabase (PostgreSQL + Row Level Security) |
| AI | Groq API (llama-3.3-70b-versatile) |
| Deployment | Vercel (frontend) + Render (backend) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase account (free at supabase.com)
- Groq API key (free at console.groq.com)

### 1. Clone the repo
```bash
git clone https://github.com/udayjain06/CA-Assistant.git
cd CA-Assistant
```

### 2. Supabase setup
1. Go to [supabase.com](https://supabase.com) → Create new project
2. Go to **SQL Editor** → paste and run `backend/supabase/schema.sql`
3. Go to **Settings → API** → copy your Project URL and anon key

### 3. Environment variables

**Frontend** — create `frontend/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend** — create `backend/.env`:
```env
GROQ_API_KEY=gsk_your_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

### 4. Run backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# Runs at http://localhost:8000
```

### 5. Run frontend
```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:3000
```

---

## 📁 Project Structure

```
CA-Assistant/
├── frontend/
│   ├── app/
│   │   ├── (auth)/login/
│   │   └── (dashboard)/
│   │       ├── dashboard/        # Home with real user stats from Supabase
│   │       ├── ca-session/       # Conversational AI tax assistant
│   │       ├── itr/              # ITR analysis + save to DB
│   │       ├── gst/              # GST compliance
│   │       ├── tds/              # TDS calculator
│   │       ├── capital-gains/    # Capital gains
│   │       ├── crypto/           # Crypto tax
│   │       ├── invoice/          # Invoice generator
│   │       ├── statements/       # Financial statements
│   │       ├── payroll/          # Payroll & Form 16
│   │       ├── docs/             # Document vault
│   │       ├── notices/          # IT notice explainer
│   │       ├── audit/            # Audit & advisory
│   │       └── advisor/          # AI chat
│   ├── components/
│   │   ├── layout/Sidebar.tsx
│   │   └── ui/SaveFilingButton.tsx
│   └── lib/
│       └── supabase/
│           ├── client.ts
│           ├── server.ts
│           └── actions.ts        # Supabase save/fetch functions
│
└── backend/
    ├── main.py                   # CORS, rate limiting, security headers
    ├── routers/
    │   ├── itr.py
    │   ├── gst.py
    │   ├── advisor.py            # Streaming AI chat
    │   ├── statements.py
    │   └── payroll.py
    ├── services/
    │   ├── claude.py             # Groq AI + prompt injection protection
    │   └── tax_engine.py         # Tax calculation logic
    └── supabase/
        └── schema.sql
```

---

## 🔒 Security

- Rate limiting on all AI endpoints
- Prompt injection sanitization
- CORS restricted to specific origins
- Security headers (CSP, X-Frame-Options, XSS protection)
- Input validation with Pydantic
- Supabase Row Level Security on all tables

---

## 🗄️ Database Schema

```
profiles      → User profile (PAN, GSTIN, phone)
filings       → Tax analysis history with JSON data
transactions  → Business transactions
employees     → Payroll employees
documents     → Uploaded documents
```

---

## 🚢 Deployment

### Frontend → Vercel
1. Push to GitHub → Import to [vercel.com](https://vercel.com)
2. Add environment variables in Vercel dashboard
3. Auto-deploys on every push ✅

### Backend → Render
1. Connect GitHub to [render.com](https://render.com)
2. New Web Service → `backend/` folder
3. Build: `pip install -r requirements.txt`
4. Start: `uvicorn main:app --host 0.0.0.0 --port 10000`
5. Add environment variables

---

## 📊 Roadmap

| Module | Status |
|---|---|
| Auth + Dashboard with real data | ✅ Done |
| Conversational AI tax assistant | ✅ Done |
| ITR analysis + save to DB | ✅ Done |
| GST, TDS, Capital Gains, Crypto | ✅ Done |
| Invoice Generator | ✅ Done |
| Payroll & Form 16 | ✅ Done |
| IT Notice Handler | ✅ Done |
| Audit & Advisory | ✅ Done |
| DigiLocker Integration | 🔧 Planned |
| Account Aggregator (AA Framework) | 🔧 Planned |
| MCA / ROC Filings | 🔧 Planned |

---

## ⚠️ Disclaimer

TaxGenie provides general tax information and calculations for educational purposes. It is not a substitute for advice from a qualified Chartered Accountant. For complex tax matters, please consult a professional.

---

## 👨‍💻 Built by

**Uday Jain** — [@udayjain06](https://github.com/udayjain06)

---

*Simplifying tax for every Indian* 🇮🇳