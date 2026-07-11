'use client'
import { useState } from 'react'
import { apiGet, apiPost } from '@/lib/utils'

const deadlines = [
  { form: 'GSTR-1 (monthly)', due: '11th of next month' },
  { form: 'GSTR-3B (monthly)', due: '20th of next month' },
  { form: 'GSTR-9 (annual)', due: '31st December' },
]

export default function GSTPage() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)

  async function askGST() {
    setLoading(true)
    try {
      const res = await apiPost<{ answer: string }>('/api/gst/ai-query', { question })
      setAnswer(res.answer)
    } catch { setAnswer('Backend not connected. Run FastAPI first!') }
    setLoading(false)
  }

  const C = { card: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 } }

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600 }}>GST Compliance</h1>

      {/* Deadline cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {deadlines.map(d => (
          <div key={d.form} style={C.card}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{d.form}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Due: {d.due}</div>
          </div>
        ))}
      </div>

      {/* AI Q&A */}
      <div style={C.card}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>🤖 Ask GST questions</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <input value={question} onChange={e => setQuestion(e.target.value)}
            placeholder="e.g. Mujhe GSTR-1 quarterly file karni chahiye ya monthly?"
            style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none' }} />
          <button onClick={askGST} disabled={loading} style={{
            background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '0 20px', cursor: 'pointer', opacity: loading ? 0.6 : 1
          }}>{loading ? '...' : 'Ask'}</button>
        </div>
        {answer && <div style={{ background: 'var(--surface)', borderRadius: 8, padding: 16, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{answer}</div>}
      </div>

      {/* Placeholders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {['GSTR-1 Auto-generation', 'GSTR-3B Auto-generation', 'ITC Reconciliation', 'E-way bill management'].map(m => (
          <div key={m} style={{ ...C.card, textAlign: 'center' as const, padding: 40, opacity: 0.6 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🔧</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{m}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Coming soon</div>
          </div>
        ))}
      </div>
    </div>
  )
}
