'use client'
import { useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const deadlines = [
  { form: 'GSTR-1 (monthly)', due: '11th of next month' },
  { form: 'GSTR-3B (monthly)', due: '20th of next month' },
  { form: 'GSTR-9 (annual)', due: '31st December' },
]

export default function GSTPage() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer]     = useState('')
  const [loading, setLoading]   = useState(false)

  async function askGST() {
    if (!question.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/gst/ai-query`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })
      const data = await res.json()
      setAnswer(data.answer)
    } catch { setAnswer('Backend connect karo aur dobara try karo!') }
    setLoading(false)
  }

  const card: React.CSSProperties = { background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:20 }

  return (
    <div className="page-container" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <h1>GST Compliance</h1>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16 }}>
        {deadlines.map(d => (
          <div key={d.form} style={card}>
            <div style={{ fontSize:13,fontWeight:600,marginBottom:6,letterSpacing:'-0.01em' }}>{d.form}</div>
            <div style={{ fontSize:12,color:'var(--muted)' }}>Due: {d.due}</div>
          </div>
        ))}
      </div>
      <div style={card}>
        <div style={{ fontSize:15,fontWeight:600,marginBottom:16,letterSpacing:'-0.01em' }}>🤖 Ask GST questions</div>
        <div style={{ display:'flex',gap:12,marginBottom:16,flexWrap:'wrap' }}>
          <input value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>e.key==='Enter'&&askGST()}
            placeholder="e.g. GSTR-1 quarterly file karni chahiye ya monthly?"
            style={{ flex:1,minWidth:240,background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:8,padding:'10px 14px',color:'var(--text)',fontSize:14,outline:'none' }}/>
          <button className="pressable" onClick={askGST} disabled={loading} style={{ background:'var(--accent)',color:'#fff',border:'none',borderRadius:8,padding:'10px 24px',cursor:'pointer',opacity:loading?0.6:1,fontSize:14,fontWeight:500 }}>{loading?'…':'Ask'}</button>
        </div>
        {answer && <div style={{ background:'var(--surface)',borderRadius:8,padding:16,fontSize:14,lineHeight:1.7,whiteSpace:'pre-wrap' }}>{answer}</div>}
      </div>
    </div>
  )
}
