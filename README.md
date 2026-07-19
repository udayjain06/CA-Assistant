# TaxGenie — AI-Powered CA Replacement Platform

> Replace your CA. File ITR, GST, generate financial statements, payroll, MCA — all AI-powered.

## Stack
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database + Auth**: Supabase (PostgreSQL + Row Level Security)
- **AI**: Claude API (Anthropic)

---

## Quick Start

### 1. Clone & setup env files

```bash
# Frontend
cp frontend/.env.example frontend/.env.local

# Backend
cp backend/.env.example backend/.env
```

Fill in your keys (see sections below).

### 2. Supabase setup
1. Go to https://supabase.com → create a new project
2. Go to **SQL Editor** → paste and run `backend/supabase/schema.sql`
3. Go to **Settings → API** → copy your `Project URL` and `anon key`
4. Enable **Google OAuth** under Authentication → Providers (optional)

### 3. Anthropic API key
Get your key from https://console.anthropic.com

### 4. Run backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 5. Run frontend
```bash
cd frontend
npm install
npm run dev
```

App runs at http://localhost:3000
API runs at process.env.NEXT_PUBLIC_API_URL!

---

## Project Structure

```
taxgenie-app/
├── frontend/                  # Next.js app
│   ├── app/
│   │   ├── (auth)/            # Login / signup pages
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   │   ├── dashboard/     # Home dashboard
│   │   │   ├── itr/           # ITR filing module
│   │   │   ├── gst/           # GST compliance module
│   │   │   ├── statements/    # Financial statements
│   │   │   ├── payroll/       # Payroll & Form 16
│   │   │   ├── audit/         # Audit & advisory
│   │   │   └── advisor/       # AI chat advisor
│   │   └── api/               # Next.js API routes (proxy to FastAPI)
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── layout/            # Sidebar, topbar, shell
│   │   └── modules/           # Feature-specific components
│   └── lib/
│       ├── supabase/          # Supabase client + helpers
│       └── utils.ts
│
├── backend/                   # FastAPI app
│   ├── main.py                # Entry point + CORS
│   ├── routers/
│   │   ├── auth.py            # Auth helpers
│   │   ├── itr.py             # ITR filing logic
│   │   ├── gst.py             # GST logic
│   │   ├── statements.py      # Financial statement generation
│   │   ├── payroll.py         # Payroll processing
│   │   └── advisor.py         # Claude AI advisor
│   ├── services/
│   │   ├── claude.py          # Anthropic API wrapper
│   │   ├── tax_engine.py      # Tax calculation logic (ITR)
│   │   └── gst_engine.py      # GST calculation logic
│   ├── models/                # Pydantic models
│   └── supabase/
│       └── schema.sql         # Full DB schema
│
└── README.md
```

---

## Modules Roadmap

| Module | Status | Description |
|--------|--------|-------------|
| Auth + Dashboard | ✅ Built | Supabase auth, dashboard shell |
| ITR Filing | ✅ Built | Form selector, tax calculator, AI advice |
| AI Advisor | ✅ Built | Claude-powered tax chat |
| GST Compliance | 🔧 Scaffold | GSTR-1, 3B generation |
| Financial Statements | 🔧 Scaffold | P&L, balance sheet from transactions |
| Payroll & Form 16 | 🔧 Scaffold | Salary slips, TDS |
| MCA / ROC | 📋 Planned | Annual return filings |
| Audit & Advisory | 📋 Planned | AI compliance scanner |
