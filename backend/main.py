import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler  # type: ignore[import]
from slowapi.errors import RateLimitExceeded  # type: ignore[import]
from dotenv import load_dotenv

load_dotenv()

def get_remote_address(request: Request) -> str:
    return request.client.host if request.client else "unknown"

from routers import itr, gst, statements, payroll, advisor

# ── Rate limiter ───────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

app = FastAPI(
    title="TaxGenie API",
    version="1.0.0",
    # Disable docs in production
    docs_url="/docs" if os.getenv("ENV") != "production" else None,
    redoc_url="/redoc" if os.getenv("ENV") != "production" else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS — only allow your actual domains ──────────────────────────────────────
allowed_origins = [
    "http://localhost:3000",
    "https://localhost:3000",
]
# Add production domain from env
if os.getenv("FRONTEND_URL"):
    allowed_origins.append(os.getenv("FRONTEND_URL"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],   # Only what we need
    allow_headers=["Content-Type", "Authorization"],
)

# ── Security headers middleware ────────────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# ── Global error handler — never leak internals ────────────────────────────────
@app.exception_handler(Exception)
async def global_error_handler(request: Request, exc: Exception):
    # Log internally but never expose to client
    print(f"[ERROR] {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Something went wrong. Please try again."}
    )

app.include_router(itr.router,        prefix="/api/itr",        tags=["ITR"])
app.include_router(gst.router,        prefix="/api/gst",        tags=["GST"])
app.include_router(statements.router, prefix="/api/statements", tags=["Statements"])
app.include_router(payroll.router,    prefix="/api/payroll",    tags=["Payroll"])
app.include_router(advisor.router,    prefix="/api/advisor",    tags=["Advisor"])

@app.get("/")
def root():
    return {"status": "TaxGenie API running", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}
