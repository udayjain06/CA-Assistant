'use client'
import { useState } from 'react'

type Step = 1 | 2 | 3 | 4

// ── TAX CALCULATION (client-side, no backend needed) ─────────────────────────
function calcTax(income: number, regime: 'new' | 'old', age: number, ded: Record<string, number>) {
  let taxable = income
  const deductionsUsed: Record<string, number> = {}

  if (regime === 'old') {
    const sd   = Math.min(50000, income)
    const c80c = Math.min(ded.sec80c || 0, 150000)
    const d80d = Math.min(ded.sec80d || 0, 25000)
    const nps  = Math.min(ded.sec80ccd || 0, 50000)
    const hra  = ded.hra || 0
    const hl   = Math.min(ded.home_loan || 0, 200000)
    const total = sd + c80c + d80d + nps + hra + hl
    taxable = Math.max(0, income - total)
    deductionsUsed['Standard deduction'] = sd
    deductionsUsed['80C'] = c80c
    deductionsUsed['80D'] = d80d
    deductionsUsed['80CCD(1B) NPS'] = nps
    deductionsUsed['HRA'] = hra
    deductionsUsed['Home loan interest'] = hl
  } else {
    const sd = Math.min(75000, income)
    taxable = Math.max(0, income - sd)
    deductionsUsed['Standard deduction'] = sd
  }

  const slabs = regime === 'new'
    ? [[300000,0],[700000,0.05],[1000000,0.10],[1200000,0.15],[1500000,0.20],[Infinity,0.30]]
    : age >= 80
      ? [[500000,0],[1000000,0.20],[Infinity,0.30]]
      : age >= 60
        ? [[300000,0],[500000,0.05],[1000000,0.20],[Infinity,0.30]]
        : [[250000,0],[500000,0.05],[1000000,0.20],[Infinity,0.30]]

  let tax = 0; let prev = 0
  for (const [limit, rate] of slabs) {
    if (taxable <= prev) break
    tax += (Math.min(taxable, limit as number) - prev) * (rate as number)
    prev = limit as number
  }

  // 87A rebate
  const rebateLimit = regime === 'new' ? 700000 : 500000
  if (taxable <= rebateLimit) tax = Math.max(0, tax - 25000)

  const cess = tax * 0.04
  const total = tax + cess
  return {
    taxable, tax: total,
    effectiveRate: income > 0 ? (total / income * 100).toFixed(2) : '0',
    deductionsUsed
  }
}

function inr(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export default function ITRPage() {
  const [step, setStep] = useState<Step>(1)
  const [income, setIncome]   = useState('')
  const [age, setAge]         = useState('28')
  const [sources, setSources] = useState<string[]>(['salary'])
  const [ded, setDed] = useState({ sec80c:'', sec80d:'', sec80ccd:'', hra:'', home_loan:'' })
  const [result, setResult]   = useState<any>(null)
  const [advice, setAdvice]   = useState('')
  const [loading, setLoading] = useState(false)

  const inc = Number(income) || 0
  const ag  = Number(age)    || 28
  const dedNums = Object.fromEntries(Object.entries(ded).map(([k,v]) => [k, Number(v)||0]))

  function compare() {
    if (!income) { alert('Pehle income enter karo!'); return }
    const oldR = calcTax(inc, 'old', ag, dedNums)
    const newR = calcTax(inc, 'new', ag, dedNums)
    const recommended = oldR.tax < newR.tax ? 'old' : 'new'
    const savings = Math.abs(oldR.tax - newR.tax)
    setResult({ old: oldR, new: newR, recommended, savings })
    setStep(3)
  }

  async function getAdvice() {
    setLoading(true)
    try {
      const res = await fetch('process.env.NEXT_PUBLIC_API_URL!/api/itr/ai-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gross_income: inc, age: ag,
          regime: result?.recommended || 'new',
          deductions: dedNums
        })
      })
      if (!res.ok) throw new Error('Backend error')
      const data = await res.json()
      setAdvice(data.advice)
    } catch {
      setAdvice('⚠️ AI advice ke liye backend connect karo (uvicorn main:app --reload) aur Groq API key daalo.\n\nManual tip: New regime mein ₹75,000 standard deduction milti hai. Old regime mein 80C (₹1.5L), 80D (₹25K), NPS (₹50K) se tax bachao.')
    }
    setStep(4)
    setLoading(false)
  }

  const S = {
    card:  { background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:24, maxWidth:760 } as React.CSSProperties,
    btn:   { background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, padding:'10px 20px', fontSize:14, fontWeight:500, cursor:'pointer' } as React.CSSProperties,
    ghost: { background:'transparent', color:'var(--muted)', border:'1px solid var(--border2)', borderRadius:8, padding:'10px 20px', fontSize:14, cursor:'pointer' } as React.CSSProperties,
    inp:   { background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:8, padding:'10px 14px', color:'var(--text)', fontSize:14, outline:'none', width:'100%' } as React.CSSProperties,
  }

  const steps = ['Basic details','Deductions','Tax comparison','AI advice']

  return (
    <div style={{ padding:28 }}>
      <h1 style={{ fontSize:22, fontWeight:600, marginBottom:24 }}>ITR Filing</h1>

      {/* Stepper */}
      <div style={{ display:'flex', marginBottom:28, maxWidth:760 }}>
        {steps.map((s,i) => {
          const n = (i+1) as Step
          const state = n < step ? 'done' : n === step ? 'active' : 'idle'
          return (
            <div key={s} style={{
              flex:1, padding:'12px 8px', fontSize:13, fontWeight:500,
              color: state==='active' ? 'var(--accent)' : state==='done' ? '#22C55E' : 'var(--muted)',
              borderBottom:`2px solid ${state==='active' ? 'var(--accent)' : state==='done' ? '#22C55E' : 'var(--border)'}`
            }}>
              <span style={{
                display:'inline-flex', alignItems:'center', justifyContent:'center',
                width:20, height:20, borderRadius:'50%', fontSize:11, marginRight:6,
                background: state==='active' ? 'var(--accent)' : state==='done' ? '#22C55E' : 'var(--border2)',
                color: state==='idle' ? 'var(--muted)' : '#fff'
              }}>{state==='done' ? '✓' : n}</span>
              {s}
            </div>
          )
        })}
      </div>

      {/* STEP 1 */}
      {step===1 && (
        <div style={S.card}>
          <h2 style={{ fontSize:16, fontWeight:600, marginBottom:4 }}>Basic details</h2>
          <p style={{ fontSize:13, color:'var(--muted)', marginBottom:20 }}>Hum sahi ITR form pick karenge</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <div>
              <label style={{ fontSize:13, color:'var(--muted)', display:'block', marginBottom:6 }}>Gross annual income (₹)</label>
              <input style={S.inp} type="number" placeholder="e.g. 1200000"
                value={income} onChange={e => setIncome(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize:13, color:'var(--muted)', display:'block', marginBottom:6 }}>Aapki age</label>
              <input style={S.inp} type="number" placeholder="e.g. 28"
                value={age} onChange={e => setAge(e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:13, color:'var(--muted)', display:'block', marginBottom:8 }}>Income sources</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {['salary','business','capital_gains','house_property','interest'].map(s => (
                <button key={s} type="button"
                  onClick={() => setSources(p => p.includes(s) ? p.filter(x=>x!==s) : [...p,s])}
                  style={{
                    padding:'6px 14px', borderRadius:20, fontSize:13, cursor:'pointer', border:'none',
                    background: sources.includes(s) ? 'rgba(79,110,247,.2)' : 'var(--surface)',
                    outline: `1px solid ${sources.includes(s) ? 'var(--accent)' : 'var(--border2)'}`,
                    color: sources.includes(s) ? 'var(--accent)' : 'var(--muted)'
                  }}>{s.replace('_',' ')}</button>
              ))}
            </div>
          </div>
          {inc > 0 && (
            <div style={{ background:'rgba(79,110,247,.1)', border:'1px solid rgba(79,110,247,.3)', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:16 }}>
              📋 Recommended form: <strong>{
                sources.includes('business') ? 'ITR-3' :
                sources.includes('capital_gains') ? 'ITR-2' :
                inc > 5000000 ? 'ITR-2' : 'ITR-1 (Sahaj)'
              }</strong>
            </div>
          )}
          <button style={S.btn} type="button" onClick={() => { if(!income){alert('Income daalo pehle!'); return} setStep(2) }}>
            Continue →
          </button>
        </div>
      )}

      {/* STEP 2 */}
      {step===2 && (
        <div style={S.card}>
          <h2 style={{ fontSize:16, fontWeight:600, marginBottom:4 }}>Deductions (old regime ke liye)</h2>
          <p style={{ fontSize:13, color:'var(--muted)', marginBottom:20 }}>Khali chhod sakte ho agar nahi hain</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
            {[
              { key:'sec80c', label:'80C — PF, LIC, ELSS (max ₹1.5L)' },
              { key:'sec80d', label:'80D — Health insurance (max ₹25K)' },
              { key:'sec80ccd', label:'80CCD(1B) — NPS (max ₹50K)' },
              { key:'hra', label:'HRA exemption amount' },
              { key:'home_loan', label:'Home loan interest (24b, max ₹2L)' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label style={{ fontSize:13, color:'var(--muted)', display:'block', marginBottom:6 }}>{label}</label>
                <input style={S.inp} type="number" placeholder="₹0"
                  value={ded[key as keyof typeof ded]}
                  onChange={e => setDed(d => ({ ...d, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button style={S.ghost} type="button" onClick={() => setStep(1)}>← Back</button>
            <button style={S.btn} type="button" onClick={compare}>Compare regimes →</button>
          </div>
        </div>
      )}

      {/* STEP 3 — Results */}
      {step===3 && result && (
        <div style={{ maxWidth:760, display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {(['new','old'] as const).map(r => (
              <div key={r} style={{
                ...S.card, maxWidth:'100%',
                border: result.recommended===r ? '2px solid var(--accent)' : '1px solid var(--border)'
              }}>
                {result.recommended===r && <div style={{ fontSize:12, fontWeight:600, color:'var(--accent)', marginBottom:10 }}>⭐ RECOMMENDED</div>}
                <div style={{ fontSize:16, fontWeight:600, marginBottom:14 }}>{r==='new' ? 'New Regime' : 'Old Regime'}</div>
                {[
                  { label:'Gross income', val: inr(inc) },
                  { label:'Total deductions', val: inr(inc - result[r].taxable) },
                  { label:'Taxable income', val: inr(result[r].taxable) },
                  { label:'Total tax (incl. cess)', val: inr(result[r].tax), highlight:true },
                  { label:'Effective rate', val: result[r].effectiveRate + '%' },
                ].map(({ label, val, highlight }) => (
                  <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontSize:13, color:'var(--muted)' }}>{label}</span>
                    <span style={{ fontSize:14, fontWeight: highlight?700:500, color: highlight?'var(--accent)':'var(--text)' }}>{val}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ background:'#052713', border:'1px solid #0a4020', borderRadius:12, padding:20 }}>
            <div style={{ fontSize:15, fontWeight:600, color:'#22C55E', marginBottom:6 }}>
              💰 {result.recommended === 'new' ? 'New' : 'Old'} regime se {inr(result.savings)} bachoge
            </div>
            <div style={{ fontSize:13, color:'#4ade80' }}>
              {result.recommended==='old'
                ? `Teri deductions (${inr(inc - result.old.taxable)}) itni zyada hain ki old regime better hai`
                : `Teri deductions kam hain — new regime ke lower slabs better hain`}
            </div>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button style={S.ghost} type="button" onClick={() => setStep(2)}>← Back</button>
            <button style={{ ...S.btn, opacity: loading ? 0.6 : 1 }} type="button" onClick={getAdvice} disabled={loading}>
              {loading ? '🤖 AI soch raha hai...' : '🤖 AI tax advice lo →'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 — AI Advice */}
      {step===4 && (
        <div style={{ maxWidth:760, display:'flex', flexDirection:'column', gap:16 }}>
          <div style={S.card}>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>🤖 Personalized Tax Advice</div>
            <div style={{ whiteSpace:'pre-wrap', fontSize:14, lineHeight:1.8, background:'var(--surface)', borderRadius:8, padding:16 }}>
              {advice}
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button style={S.ghost} type="button" onClick={() => setStep(3)}>← Back</button>
            <button style={S.btn} type="button" onClick={() => { setStep(1); setResult(null); setAdvice(''); setIncome(''); }}>
              🔄 Naya calculation
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
