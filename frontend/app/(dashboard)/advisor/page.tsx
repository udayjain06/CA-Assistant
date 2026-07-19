'use client'
import { useState, useRef, useEffect } from 'react'

type Message = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'ITR-1 aur ITR-2 mein kya difference hai?',
  'New regime better hai ya old regime for ₹12L income?',
  'GSTR-3B kab file karni chahiye?',
  'HRA exemption kaise calculate karte hain?',
  'Section 80C investments kaun se hain?',
  'TDS kab katna chahiye?',
]

const API = process.env.NEXT_PUBLIC_API_URL || 'process.env.NEXT_PUBLIC_API_URL!'

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Namaste! Main TaxGenie hoon — aapka AI Chartered Accountant 🧾\n\nMujhse kuch bhi poochho — ITR filing, GST returns, tax saving tips, deductions, payroll — sab kuch. Hindi ya English dono chalega!'
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send(text?: string) {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/advisor/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
      })

      if (!res.body) throw new Error('No stream')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let reply = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') break
          reply += data
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: reply }
            return updated
          })
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Backend connected nahi hai. Pehle `uvicorn main:app --reload` chalao.' }])
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>AI Tax Advisor</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Powered by Claude — India's tax laws, GST, ITR, compliance</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
          <span style={{ fontSize: 12, color: '#22C55E' }}>Online</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role === 'assistant' && (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginRight: 10, flexShrink: 0 }}>🧾</div>
            )}
            <div style={{
              maxWidth: '72%', padding: '12px 16px', borderRadius: m.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
              background: m.role === 'user' ? 'var(--accent)' : 'var(--card)',
              border: m.role === 'user' ? 'none' : '1px solid var(--border)',
              fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text)'
            }}>{m.content}{loading && i === messages.length - 1 && m.role === 'assistant' && <span style={{ opacity: 0.5 }}>▋</span>}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div style={{ padding: '0 28px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)'
            }}>{s}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '16px 28px', background: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'flex', gap: 12 }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Tax ke baare mein kuch bhi poochho..."
          style={{
            flex: 1, background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10,
            padding: '12px 16px', color: 'var(--text)', fontSize: 14, outline: 'none'
          }}
        />
        <button onClick={() => send()} disabled={loading || !input.trim()} style={{
          background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10,
          padding: '0 20px', fontSize: 20, cursor: 'pointer', opacity: loading || !input.trim() ? 0.5 : 1
        }}>↑</button>
      </div>
    </div>
  )
}
