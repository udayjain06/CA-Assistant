'use client'
import { useState } from 'react'
import { saveITRFiling } from '@/lib/supabase/actions'

type Step = 1|2|3|4

function calcTax(income: number, regime: 'new'|'old', age: number, ded: Record<string,number>) {
  let taxable = income
  const used: Record<string,number> = {}
  if (regime === 'old') {
    const sd   = Math.min(50000, income)
    const c80c = Math.min(ded.sec80c||0, 150000)
    const d80d = Math.min(ded.sec80d||0, 25000)
    const nps  = Math.min(ded.sec80ccd||0, 50000)
    const hra  = ded.hra||0
    const hl   = Math.min(ded.home_loan||0, 200000)
    taxable = Math.max(0, income - sd - c80c - d80d - nps - hra - hl)
    Object.assign(used, { 'Standard deduction':sd, '80C':c80c, '80D':d80d, 'NPS':nps, 'HRA':hra, 'Home loan':hl })
  } else {
    const sd = Math.min(75000, income)
    taxable = Math.max(0, income - sd)
    used['Standard deduction'] = sd
  }
  const slabs = regime==='new'
    ? [[300000,0],[700000,.05],[1000000,.10],[1200000,.15],[1500000,.20],[Infinity,.30]]
    : age>=80 ? [[500000,0],[1000000,.20],[Infinity,.30]]
    : age>=60 ? [[300000,0],[500000,.05],[1000000,.20],[Infinity,.30]]
    : [[250000,0],[500000,.05],[1000000,.20],[Infinity,.30]]
  let tax=0, prev=0
  for (const [lim,rate] of slabs) {
    if (taxable<=prev) break
    tax += (Math.min(taxable,lim as number)-prev)*(rate as number); prev=lim as number
  }
  if (taxable<=(regime==='new'?700000:500000)) tax=Math.max(0,tax-25000)
  return { taxable, tax:Math.round(tax*1.04), deductionsUsed:used }
}

const inr = (n:number) => '₹'+Math.round(n).toLocaleString('en-IN')

export default function ITRPage() {
  const [step, setStep]     = useState<Step>(1)
  const [income, setIncome] = useState('')
  const [age, setAge]       = useState('28')
  const [sources, setSources] = useState<string[]>(['salary'])
  const [ded, setDed] = useState({ sec80c:'', sec80d:'', sec80ccd:'', hra:'', home_loan:'' })
  const [result, setResult] = useState<any>(null)
  const [advice, setAdvice] = useState('')
  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle')
  const [incomeError, setIncomeError] = useState('')

  const inc = Number(income)||0
  const ag  = Number(age)||28
  const dedNums = Object.fromEntries(Object.entries(ded).map(([k,v])=>[k,Number(v)||0]))
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  function compare() {
    if (!income) { setIncomeError('Income daalo pehle!'); return }
    setIncomeError('')
    const oldR = calcTax(inc,'old',ag,dedNums)
    const newR = calcTax(inc,'new',ag,dedNums)
    const rec  = oldR.tax < newR.tax ? 'old' : 'new'
    const savings = Math.abs(oldR.tax-newR.tax)
    const itrForm = sources.includes('business') ? 'ITR-3' : sources.includes('capital_gains') ? 'ITR-2' : inc>5000000 ? 'ITR-2' : 'ITR-1'
    setResult({ old:oldR, new:newR, recommended:rec, savings, itrForm })
    setStep(3)
  }

  async function getAdvice() {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/itr/ai-advice`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ gross_income:inc, age:ag, regime:result.recommended, deductions:dedNums })
      })
      const data = await res.json()
      setAdvice(data.advice)
    } catch {
      setAdvice(`${result.recommended==='new'?'New':'Old'} regime better hai — ${inr(result.savings)} bachoge.\n\n• 80C mein ₹${Math.max(0,150000-dedNums.sec80c).toLocaleString('en-IN')} aur invest kar sakte ho\n• NPS mein ₹50,000 daalo (80CCD 1B)\n• Deadline: 31 July 2026`)
    }
    setStep(4)
    setLoading(false)
  }

  async function handleSave() {
    if (!result) return
    setSaveStatus('saving')
    const res = await saveITRFiling({
      itr_form:        result.itrForm,
      assessment_year: 'AY 2025-26',
      gross_income:    inc,
      regime:          result.recommended,
      tax_amount:      result[result.recommended].tax,
      tax_savings:     result.savings,
      deductions:      dedNums,
      ai_advice:       advice,
    })
    setSaveStatus(res.error ? 'error' : 'saved')
  }

  const S = {
    card:  { background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:24, maxWidth:760 } as React.CSSProperties,
    btn:   { background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, padding:'10px 20px', fontSize:14, fontWeight:500 as const, cursor:'pointer' } as React.CSSProperties,
    ghost: { background:'transparent', color:'var(--muted)', border:'1px solid var(--border2)', borderRadius:8, padding:'10px 20px', fontSize:14, cursor:'pointer' } as React.CSSProperties,
    inp:   { background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:8, padding:'10px 14px', color:'var(--text)', fontSize:14, outline:'none', width:'100%' } as React.CSSProperties,
  }

  const steps = ['Basic details','Deductions','Tax comparison','AI advice']

  return (
    <div className="page-container">
      <h1 style={{ marginBottom:20 }}>ITR Filing</h1>

      {/* Stepper */}
      <div className="scrollable-tabs" style={{ display:'flex', marginBottom:24, maxWidth:760, borderBottom:'1px solid var(--border)' }}>
        {steps.map((s,i) => {
          const n=(i+1) as Step
          const state = n<step?'done':n===step?'active':'idle'
          return (
            <div key={s} style={{ flex:'1 0 auto', minWidth:130, padding:'12px 10px', fontSize:13, fontWeight:500,
              color:state==='active'?'var(--accent)':state==='done'?'#22C55E':'var(--muted)',
              borderBottom:`2px solid ${state==='active'?'var(--accent)':state==='done'?'#22C55E':'transparent'}`}}>
              <span style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',width:20,height:20,borderRadius:'50%',fontSize:11,marginRight:6,
                background:state==='active'?'var(--accent)':state==='done'?'#22C55E':'var(--border2)',color:state==='idle'?'var(--muted)':'#fff'}}>
                {state==='done'?'✓':n}
              </span>{s}
            </div>
          )
        })}
      </div>

      {/* Step 1 */}
      {step===1 && (
        <div style={S.card}>
          <h2 style={{ fontSize:16, fontWeight:600, marginBottom:16 }}>Basic details</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16, marginBottom:16 }}>
            <div>
              <label style={{ fontSize:13, color:'var(--muted)', display:'block', marginBottom:6 }}>Gross annual income (₹)</label>
              <input style={S.inp} type="number" placeholder="e.g. 1200000" value={income} onChange={e=>setIncome(e.target.value)}/>
            </div>
            <div>
              <label style={{ fontSize:13, color:'var(--muted)', display:'block', marginBottom:6 }}>Age</label>
              <input style={S.inp} type="number" placeholder="28" value={age} onChange={e=>setAge(e.target.value)}/>
            </div>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:13, color:'var(--muted)', display:'block', marginBottom:8 }}>Income sources</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {['salary','business','capital_gains','house_property','interest'].map(s=>(
                <button key={s} type="button" onClick={()=>setSources(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s])} className="pressable" style={{
                  padding:'6px 14px',borderRadius:20,fontSize:13,cursor:'pointer',border:'none',
                  background:sources.includes(s)?'rgba(79,110,247,.2)':'var(--surface)',
                  outline:`1px solid ${sources.includes(s)?'var(--accent)':'var(--border2)'}`,
                  color:sources.includes(s)?'var(--accent)':'var(--muted)'
                }}>{s.replace('_',' ')}</button>
              ))}
            </div>
          </div>
          {inc>0 && (
            <div style={{ background:'rgba(79,110,247,.1)',border:'1px solid rgba(79,110,247,.3)',borderRadius:8,padding:'10px 14px',fontSize:13,marginBottom:16 }}>
              📋 Recommended form: <strong>{sources.includes('business')?'ITR-3':sources.includes('capital_gains')?'ITR-2':inc>5000000?'ITR-2':'ITR-1 (Sahaj)'}</strong>
            </div>
          )}
          {incomeError && (
            <div role="alert" style={{ color:'var(--red)', fontSize:13, marginBottom:8, padding:'8px 12px', background:'#1a0505', borderRadius:7, border:'1px solid #3d1010' }}>{incomeError}</div>
          )}
          <button className="pressable" style={S.btn} onClick={()=>{ if(!income){ setIncomeError('Income daalo pehle!'); return } setIncomeError(''); setStep(2)}}>Continue →</button>
        </div>
      )}

      {/* Step 2 */}
      {step===2 && (
        <div style={S.card}>
          <h2 style={{ fontSize:16, fontWeight:600, marginBottom:4 }}>Deductions (old regime ke liye)</h2>
          <p style={{ fontSize:13, color:'var(--muted)', marginBottom:20 }}>Yaad na ho toh 0 likhna bilkul theek hai</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16, marginBottom:20 }}>
            {[
              {key:'sec80c', label:'80C — PF, LIC, ELSS (max ₹1.5L)'},
              {key:'sec80d', label:'80D — Health insurance (max ₹25K)'},
              {key:'sec80ccd', label:'80CCD(1B) — NPS (max ₹50K)'},
              {key:'hra', label:'HRA exemption'},
              {key:'home_loan', label:'Home loan interest (24b, max ₹2L)'},
            ].map(({key,label})=>(
              <div key={key}>
                <label style={{ fontSize:13, color:'var(--muted)', display:'block', marginBottom:6 }}>{label}</label>
                <input style={S.inp} type="number" placeholder="₹0" value={ded[key as keyof typeof ded]}
                  onChange={e=>setDed(d=>({...d,[key]:e.target.value}))}/>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="pressable" style={S.ghost} onClick={()=>setStep(1)}>← Back</button>
            <button className="pressable" style={S.btn} onClick={compare}>Compare regimes →</button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step===3 && result && (
        <div style={{ maxWidth:760, display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:16 }}>
            {(['new','old'] as const).map(r=>(
              <div key={r} style={{ ...S.card, maxWidth:'100%', border:result.recommended===r?'2px solid var(--accent)':'1px solid var(--border)' }}>
                {result.recommended===r && <div style={{ fontSize:12,fontWeight:600,color:'var(--accent)',marginBottom:10 }}>⭐ TUMHARE LIYE BEST</div>}
                <div style={{ fontSize:16,fontWeight:600,marginBottom:14 }}>{r==='new'?'New Regime':'Old Regime'}</div>
                {[
                  {label:'Gross income',val:inr(inc)},
                  {label:'Taxable income',val:inr(result[r].taxable)},
                  {label:'Total tax + cess',val:inr(result[r].tax),h:true},
                  {label:'Effective rate',val:`${inc>0?((result[r].tax/inc)*100).toFixed(1):0}%`},
                ].map(({label,val,h})=>(
                  <div key={label} style={{ display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontSize:13,color:'var(--muted)' }}>{label}</span>
                    <span style={{ fontSize:14,fontWeight:h?700:500,color:h?'var(--accent)':'var(--text)' }}>{val}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ background:'#052713',border:'1px solid #0a4020',borderRadius:12,padding:20 }}>
            <div style={{ fontSize:15,fontWeight:600,color:'#22C55E',marginBottom:4 }}>
              💰 {result.recommended==='new'?'New':'Old'} regime se {inr(result.savings)} bachoge!
            </div>
            <div style={{ fontSize:13,color:'#4ade80' }}>
              {result.recommended==='old'?'Teri deductions zyada hain — old regime better hai':'Teri deductions kam hain — new regime ke lower slabs fayda dete hain'}
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="pressable" style={S.ghost} onClick={()=>setStep(2)}>← Back</button>
            <button className="pressable" style={{...S.btn,opacity:loading?0.6:1}} onClick={getAdvice} disabled={loading}>
              {loading?'🤖 AI soch raha hai...':'🤖 AI tax advice lo →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4 */}
      {step===4 && result && (
        <div style={{ maxWidth:760, display:'flex', flexDirection:'column', gap:16 }}>
          <div style={S.card}>
            <div style={{ fontSize:15,fontWeight:600,marginBottom:16 }}>🤖 Personalized Tax Advice</div>
            <div style={{ whiteSpace:'pre-wrap',fontSize:14,lineHeight:1.8,background:'var(--surface)',borderRadius:8,padding:16 }}>{advice}</div>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button className="pressable" style={S.ghost} onClick={()=>setStep(3)}>← Back</button>

            {/* Save to dashboard button */}
            {saveStatus==='saved' ? (
              <div style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'10px 20px',borderRadius:8,background:'#052713',border:'1px solid #0a4020',fontSize:14,color:'var(--green)',fontWeight:500 }}>
                ✅ Dashboard pe save ho gaya!
              </div>
            ) : (
              <button className="pressable" onClick={handleSave} disabled={saveStatus==='saving'} style={{
                background:saveStatus==='error'?'#1a0505':'#1D9E75',
                color:saveStatus==='error'?'var(--red)':'#fff',
                border:'none',borderRadius:8,padding:'10px 20px',fontSize:14,fontWeight:500,cursor:'pointer',
                opacity:saveStatus==='saving'?0.7:1
              }}>
                {saveStatus==='saving'?'💾 Saving...':saveStatus==='error'?'❌ Retry':'💾 Dashboard mein save karo'}
              </button>
            )}

            <button className="pressable" style={S.btn} onClick={()=>{setStep(1);setResult(null);setAdvice('');setIncome('');setSaveStatus('idle')}}>
              🔄 Naya calculation
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
