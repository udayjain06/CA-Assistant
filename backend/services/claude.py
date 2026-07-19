import os
import re
from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL  = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """You are TaxGenie, an expert AI Chartered Accountant for India.
You have deep knowledge of Income Tax Act 2025, GST, ITR forms, TDS, financial statements, payroll, MCA filings.
Respond in simple Hinglish or English based on how the user writes.
Give direct, specific, actionable advice with exact ₹ amounts, section numbers, and deadlines.
Never make up facts. If unsure, say so."""


def _sanitize(text: str, max_len: int = 5000) -> str:
    """Strip any prompt injection attempts and limit length."""
    # Remove common injection patterns
    dangerous = [
        r'ignore (previous|prior|all) instructions?',
        r'system\s*prompt',
        r'you are now',
        r'new instruction',
        r'disregard',
        r'forget everything',
    ]
    cleaned = text[:max_len]
    for pattern in dangerous:
        cleaned = re.sub(pattern, '[removed]', cleaned, flags=re.IGNORECASE)
    return cleaned


def ask_claude(messages: list[dict], system: str = SYSTEM_PROMPT) -> str:
    # Sanitize all user messages
    safe_messages = []
    for msg in messages:
        if msg["role"] == "user":
            safe_messages.append({"role": "user", "content": _sanitize(msg["content"])})
        else:
            safe_messages.append({"role": "assistant", "content": msg["content"][:5000]})

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "system", "content": system}] + safe_messages,
        max_tokens=2048,
        temperature=0.3,
    )
    return response.choices[0].message.content


def ask_claude_stream(messages: list[dict], system: str = SYSTEM_PROMPT):
    safe_messages = []
    for msg in messages:
        if msg["role"] == "user":
            safe_messages.append({"role": "user", "content": _sanitize(msg["content"])})
        else:
            safe_messages.append({"role": "assistant", "content": msg["content"][:5000]})

    stream = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "system", "content": system}] + safe_messages,
        max_tokens=2048,
        temperature=0.3,
        stream=True,
    )
    for chunk in stream:
        text = chunk.choices[0].delta.content
        if text:
            yield text
