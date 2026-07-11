from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import itr, gst, statements, payroll, advisor

app = FastAPI(title="TaxGenie API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(itr.router,        prefix="/api/itr",        tags=["ITR"])
app.include_router(gst.router,        prefix="/api/gst",        tags=["GST"])
app.include_router(statements.router, prefix="/api/statements", tags=["Statements"])
app.include_router(payroll.router,    prefix="/api/payroll",    tags=["Payroll"])
app.include_router(advisor.router,    prefix="/api/advisor",    tags=["Advisor"])

@app.get("/")
def root():
    return {"status": "TaxGenie API running"}
