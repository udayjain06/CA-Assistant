'use client'
import { useState, useRef, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
type Message = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'ITR-1 aur ITR-2 mein kya difference hai?',
  'New regime better hai ya old regime for ₹12L income?',
  'GSTR-3B kab file karni chahiye?',
  'Section 80C investments kaun se hain?',
]

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Namaste! Main TaxGenie hoon — aapka AI CA 🧾\nMujhse kuch bhi poochho — ITR, GST, tax saving. Hindi ya English dono chalega!'
  }])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send(text?: string) {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    const newMsgs: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(newMsgs)
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/advisor/chat/stream`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs }),
      })
      if (!res.body) throw new Error('no stream')
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = ''
      setMessages(p => [...p, { role: 'assistant', content: '' }])
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of dec.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          const d = line.slice(6)
          if (d === '[DONE]') break
          buf += d
          const snap = buf
          setMessages(p => { const u = [...p]; u[u.length-1] = { role:'assistant', content:snap }; return u })
        }
      }
    } catch {
      setMessages(p => [...p, { role:'assistant', content:'Backend connect nahi hua. Pehle uvicorn chalao.' }])
    }
    setLoading(false)
  }

  const B: React.CSSProperties = { background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 16px', fontSize:14, lineHeight:1.6, whiteSpace:'pre-wrap', color:'var(--text)' }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100dvh - 56px)', minHeight:0, flex:1 }}>
      <div className="glass-header" style={{ padding:'12px 16px',display:'flex',alignItems:'center',gap:12,position:'sticky',top:0,zIndex:10,flexShrink:0 }}>
        <div style={{ width:34,height:34,borderRadius:8,background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17 }}>🤖</div>
        <div><div style={{ fontSize:15,fontWeight:600 }}>AI Tax Advisor</div><div style={{ fontSize:11,color:'var(--muted)' }}>India GST, ITR, compliance</div></div>
        <div style={{ marginLeft:'auto',display:'flex',alignItems:'center',gap:6 }}><div style={{ width:8,height:8,borderRadius:'50%',background:'#22C55E' }}/><span style={{ fontSize:12,color:'#22C55E' }}>Online</span></div>
      </div>
      <div style={{ flex:1,overflowY:'auto',padding:'16px 14px',display:'flex',flexDirection:'column',gap:14 }}>
        {messages.map((m,i) => (
          <div key={i} className="msg-in" style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
            {m.role==='assistant' && <div style={{ width:30,height:30,borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,marginRight:8,flexShrink:0 }}>🧾</div>}
            <div style={{ ...B, maxWidth:'85%', padding:'10px 14px', borderRadius:m.role==='user'?'12px 12px 0 12px':'12px 12px 12px 0', background:m.role==='user'?'var(--accent)':B.background, border:m.role==='user'?'none':B.border }}>
              {m.content}{loading && i===messages.length-1 && m.role==='assistant' && <span style={{ opacity:0.5 }}>▋</span>}
            </div>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>
      {messages.length <= 2 && (
        <div style={{ padding:'0 14px 10px',display:'flex',gap:6,flexWrap:'wrap' }}>
          {SUGGESTIONS.map(s => <button key={s} onClick={() => send(s)} className="pressable" style={{ padding:'6px 12px',borderRadius:20,fontSize:12,cursor:'pointer',background:'var(--card)',border:'1px solid var(--border)',color:'var(--muted)' }}>{s}</button>)}
        </div>
      )}
      <div className="glass-header" style={{ padding:'12px 14px',borderTop:'1px solid rgba(255, 255, 255, 0.08)',borderBottom:'none',display:'flex',gap:10,flexShrink:0 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()} }}
          placeholder="Tax ke baare mein kuch bhi poochho..." style={{ flex:1,background:'var(--card)',border:'1px solid var(--border2)',borderRadius:10,padding:'10px 14px',color:'var(--text)',fontSize:14,outline:'none' }}/>
        <button className="pressable" onClick={()=>send()} disabled={loading||!input.trim()} aria-label="Send message" style={{ background:'var(--accent)',color:'#fff',border:'none',borderRadius:10,padding:'0 18px',fontSize:18,cursor:'pointer',opacity:loading||!input.trim()?0.5:1 }}>↑</button>
      </div>
    </div>
  )
}
