'use client'
import { useState } from 'react'

const API = 'http://localhost:8000'

const COMPLIANCE_CHECKS = [
  { id:'itr', label:'ITR filed for AY 2025-26?', category:'Income Tax' },
  { id:'gstr1', label:'GSTR-1 filed for last month?', category:'GST' },
  { id:'gstr3b', label:'GSTR-3B filed for last month?', category:'GST' },
  { id:'tds_deposit', label:'TDS deposited by 7th of this month?', category:'TDS' },
  { id:'tds_return', label:'TDS return (26Q/24Q) filed this quarter?', category:'TDS' },
  { id:'advance_tax', label:'Advance tax paid (if liability > ₹10,000)?', category:'Income Tax' },
  { id:'audit', label:'Tax audit done (if turnover > ₹1Cr)?', category:'Audit' },
  { id:'mca', label:'MCA annual return filed (if company)?', category:'MCA' },
]

type CheckStatus = 'yes'|'no'|'na'|'unknown'

export default function AuditPage() {
  const [checks, setChecks]   = useState<Record<string,CheckStatus>>({})
  const [question, setQuestion] = useState('')
  const [answer, setAnswer]   = useState('')
  const [loading, setLoading] = useState(false)
  const [scanned, setScanned] = useState(false)

  const yesCount = Object.values(checks).filter(v=>v==='yes').length
  const noCount  = Object.values(checks).filter(v=>v==='no').length
  const total    = COMPLIANCE_CHECKS.length
  const score    = Math.round((yesCount/(total-Object.values(checks).filter(v=>v==='na').length||total))*100)

  const statusColor = (s:CheckStatus) => s==='yes'?'#22C55E':s==='no'?'#EF4444':s==='na'?'var(--muted)':'var(--border2)'
  const statusBg    = (s:CheckStatus) => s==='yes'?'#052713':s==='no'?'#1a0505':s==='na'?'var(--surface)':'var(--surface)'

  async function askAudit() {
    if (!question.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/gst/ai-query`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({question:`Audit & compliance question: ${question}`,turnover:0})
      })
      const data = await res.json()
      setAnswer(data.answer)
    } catch {
      setAnswer(`Compliance tip:\n\n${question.toLowerCase().includes('gst')?'GST compliance ke liye: GSTR-1 11th tak, GSTR-3B 20th tak file karo. Late fee ₹50/day CGST + ₹50/day SGST.':question.toLowerCase().includes('tds')?'TDS compliance: 7th of next month tak deposit karo. Late = 1.5%/month interest.':'Backend connect karo for detailed AI compliance advice!'}`)
    }
    setLoading(false)
  }

  const S = {
    card:  {background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:20} as React.CSSProperties,
    btn:   {background:'var(--accent)',color:'#fff',border:'none',borderRadius:8,padding:'10px 20px',fontSize:14,fontWeight:500,cursor:'pointer'} as React.CSSProperties,
    ghost: {background:'transparent',color:'var(--muted)',border:'1px solid var(--border2)',borderRadius:8,padding:'9px 16px',fontSize:13,cursor:'pointer'} as React.CSSProperties,
    inp:   {background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:8,padding:'10px 14px',color:'var(--text)',fontSize:14,outline:'none',flex:1} as React.CSSProperties,
  }

  return (
    <div style={{padding:28}}>
      <h1 style={{fontSize:22,fontWeight:600,marginBottom:24}}>Audit & Advisory</h1>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>

        {/* Compliance checker */}
        <div style={S.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={{fontSize:15,fontWeight:600}}>Compliance Checker</div>
            {scanned && (
              <div style={{fontSize:13,fontWeight:600,color:score>=80?'#22C55E':score>=50?'#F59E0B':'#EF4444'}}>
                Score: {score}%
              </div>
            )}
          </div>

          {scanned && (
            <div style={{
              marginBottom:16, padding:'12px 16px', borderRadius:10,
              background:score>=80?'#052713':score>=50?'#1f1500':'#1a0505',
              border:`1px solid ${score>=80?'#0a4020':score>=50?'#3d2a00':'#3d1010'}`
            }}>
              <div style={{fontSize:14,fontWeight:600,color:score>=80?'#22C55E':score>=50?'#F59E0B':'#EF4444',marginBottom:4}}>
                {score>=80?'✅ Compliance sahi hai!':score>=50?'⚠️ Kuch cheezein pending hain':'🚨 Compliance issues hain — fix karo!'}
              </div>
              <div style={{fontSize:13,color:'var(--muted)'}}>
                {yesCount} compliant · {noCount} issues · {Object.values(checks).filter(v=>v==='na').length} N/A
              </div>
            </div>
          )}

          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {COMPLIANCE_CHECKS.map(c=>(
              <div key={c.id} style={{background:'var(--surface)',borderRadius:8,padding:'10px 12px',border:`1px solid ${statusColor(checks[c.id]||'unknown')}40`}}>
                <div style={{fontSize:11,color:'var(--muted)',marginBottom:4}}>{c.category}</div>
                <div style={{fontSize:13,marginBottom:8}}>{c.label}</div>
                <div style={{display:'flex',gap:6}}>
                  {(['yes','no','na'] as CheckStatus[]).map(s=>(
                    <button key={s} onClick={()=>setChecks(p=>({...p,[c.id]:s}))} style={{
                      padding:'3px 12px',borderRadius:6,fontSize:12,fontWeight:500,cursor:'pointer',border:'none',
                      background:checks[c.id]===s?statusBg(s):'var(--card)',
                      color:checks[c.id]===s?statusColor(s):'var(--muted)',
                      outline:checks[c.id]===s?`1px solid ${statusColor(s)}`:'1px solid var(--border)'
                    }}>{s==='yes'?'✅ Haan':s==='no'?'❌ Nahi':'⬜ N/A'}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button style={{...S.btn,width:'100%',marginTop:16}} onClick={()=>setScanned(true)}>
            🔍 Check Compliance Score
          </button>
        </div>

        {/* AI Advisory */}
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={S.card}>
            <div style={{fontSize:15,fontWeight:600,marginBottom:16}}>🤖 AI Compliance Advisor</div>
            <div style={{display:'flex',gap:10,marginBottom:12}}>
              <input style={S.inp} value={question} onChange={e=>setQuestion(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&askAudit()}
                placeholder="Koi bhi compliance sawaal poochho..."/>
              <button style={{...S.btn,opacity:loading?.6:1}} disabled={loading} onClick={askAudit}>
                {loading?'...':'Ask'}
              </button>
            </div>
            {/* Quick questions */}
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12}}>
              {['GST late fee kitni hogi?','TDS nahi diya toh kya hoga?','Tax audit kab mandatory hai?','Penalty se kaise bacho?'].map(q=>(
                <button key={q} onClick={()=>setQuestion(q)} style={{
                  padding:'4px 10px',borderRadius:16,fontSize:12,cursor:'pointer',
                  background:'var(--surface)',border:'1px solid var(--border)',color:'var(--muted)'
                }}>{q}</button>
              ))}
            </div>
            {answer && (
              <div style={{background:'var(--surface)',borderRadius:8,padding:14,fontSize:13,lineHeight:1.8,whiteSpace:'pre-wrap'}}>
                {answer}
              </div>
            )}
          </div>

          {/* Key deadlines */}
          <div style={S.card}>
            <div style={{fontSize:15,fontWeight:600,marginBottom:12}}>📅 Key Deadlines — July 2026</div>
            {[
              {d:'7 July',t:'TDS deposit for June 2026',u:'urgent'},
              {d:'11 July',t:'GSTR-1 for June 2026',u:'urgent'},
              {d:'20 July',t:'GSTR-3B for June 2026',u:'urgent'},
              {d:'31 July',t:'ITR filing (AY 2025-26)',u:'urgent'},
              {d:'31 July',t:'TDS return Q1 (26Q/24Q)',u:'soon'},
            ].map(({d,t,u})=>(
              <div key={d+t} style={{display:'flex',gap:12,alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                <div style={{
                  fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:6,flexShrink:0,
                  background:u==='urgent'?'#1a0505':'#1f1500',
                  color:u==='urgent'?'#EF4444':'#F59E0B'
                }}>{d}</div>
                <div style={{fontSize:13}}>{t}</div>
              </div>
            ))}
          </div>

          {/* Red flags */}
          <div style={S.card}>
            <div style={{fontSize:15,fontWeight:600,marginBottom:12}}>🚨 Common Red Flags</div>
            {[
              'GST turnover aur ITR income mismatch',
              'TDS deducted but deposit nahi hua',
              'Cash transactions > ₹2L without PAN',
              'Foreign payments without TCS/TDS',
              'Directors ka loan from company without compliance',
            ].map(f=>(
              <div key={f} style={{display:'flex',gap:8,padding:'7px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                <span style={{color:'#EF4444',flexShrink:0}}>⚠</span>
                <span style={{color:'var(--muted)'}}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
