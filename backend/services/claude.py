import os
from groq import Groq

client = Groq(api_key=os.getenv("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"))

SYSTEM_PROMPT = """You are TaxGenie, an expert AI Chartered Accountant for India.
You have deep knowledge of Income Tax Act 2025, GST laws, ITR forms, TDS, 
Financial statements, MCA/ROC filings, Payroll compliance, EPF, ESI.
Always respond in simple Hinglish or English depending on how the user writes.
Be direct and give exact numbers, slabs, and deadlines."""

def ask_claude(messages: list[dict], system: str = SYSTEM_PROMPT) -> str:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "system", "content": system}] + messages,
        max_tokens=2048,
    )
    return response.choices[0].message.content

def ask_claude_stream(messages: list[dict], system: str = SYSTEM_PROMPT):
    stream = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "system", "content": system}] + messages,
        max_tokens=2048,
        stream=True,
    )
    for chunk in stream:
        text = chunk.choices[0].delta.content
        if text:
            yield text