'use client'
import { useState } from 'react'

const inr = (n:number) => '₹'+Math.round(n).toLocaleString('en-IN')

const TDS_RATES = [
  { section:'192', nature:'Salary', threshold:250000, rate:0, note:'As per income tax slab' },
  { section:'194A', nature:'FD/Interest (Bank)', threshold:40000, rate:10, note:'Senior citizen: ₹50K limit' },
  { section:'194C', nature:'Contractor payment', threshold:30000, rate:1, note:'Company: 2%, Individual: 1%' },
  { section:'194H', nature:'Commission/Brokerage', threshold:15000, rate:5, note:'5% flat' },
  { section:'194I', nature:'Rent (Property)', threshold:240000, rate:10, note:'Plant/machinery: 2%' },
  { section:'194J', nature:'Professional fees', threshold:30000, rate:10, note:'Technical services: 2%' },
  { section:'194B', nature:'Lottery/Winnings', threshold:10000, rate:30, note:'No basic exemption' },
]

const DEADLINES = [
  { form:'24Q', desc:'TDS on Salary', due:'31st May (Q4), 31st Jul, 31st Oct, 31st Jan' },
  { form:'26Q', desc:'TDS on other payments', due:'31st Jul, 31st Oct, 31st Jan, 31st May' },
  { form:'27Q', desc:'TDS on NRI payments', due:'Same as 26Q' },
]

export default function TDSPage() {
  const [amount, setAmount] = useState('')
  const [section, setSection] = useState('194J')
  const [isCompany, setIsCompany] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [tab, setTab] = useState<'calc'|'rates'|'deadlines'>('calc')

  function calculate() {
    const amt = Number(amount)
    const sel = TDS_RATES.find(r=>r.section===section)
    if (!sel || !amt) return
    let rate = sel.rate
    if (section==='194C' && isCompany) rate = 2
    const tds = Math.round(amt * rate / 100)
    const net = amt - tds
    setResult({ amt, rate, tds, net, section: sel.section, nature: sel.nature, threshold: sel.threshold, aboveThreshold: amt > sel.threshold })
  }

  const S = {
    card: {background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:20} as React.CSSProperties,
    btn:  {background:'var(--accent)',color:'#fff',border:'none',borderRadius:8,padding:'10px 20px',fontSize:14,fontWeight:500,cursor:'pointer'} as React.CSSProperties,
    inp:  {background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:8,padding:'10px 14px',color:'var(--text)',fontSize:14,outline:'none',width:'100%'} as React.CSSProperties,
    tab:  (active:boolean) => ({padding:'8px 20px',fontSize:14,fontWeight:500,background:'none',border:'none',borderBottom:`2px solid ${active?'var(--accent)':'transparent'}`,color:active?'var(--accent)':'var(--muted)',cursor:'pointer'}) as React.CSSProperties,
  }

  return (
    <div style={{padding:28}}>
      <h1 style={{fontSize:22,fontWeight:600,marginBottom:24}}>TDS Returns</h1>

      <div style={{display:'flex',borderBottom:'1px solid var(--border)',marginBottom:24}}>
        <button style={S.tab(tab==='calc')} onClick={()=>setTab('calc')}>🧮 TDS Calculator</button>
        <button style={S.tab(tab==='rates')} onClick={()=>setTab('rates')}>📋 TDS Rates</button>
        <button style={S.tab(tab==='deadlines')} onClick={()=>setTab('deadlines')}>📅 Deadlines</button>
      </div>

      {tab==='calc' && (
        <div style={{maxWidth:600}}>
          <div style={S.card}>
            <div style={{fontSize:15,fontWeight:600,marginBottom:20}}>TDS Calculator</div>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <label style={{fontSize:13,color:'var(--muted)',display:'block',marginBottom:6}}>Payment type (Section)</label>
                <select style={S.inp} value={section} onChange={e=>setSection(e.target.value)}>
                  {TDS_RATES.map(r=><option key={r.section} value={r.section}>Sec {r.section} — {r.nature}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:13,color:'var(--muted)',display:'block',marginBottom:6}}>Payment amount (₹)</label>
                <input style={S.inp} type="number" placeholder="e.g. 50000" value={amount} onChange={e=>setAmount(e.target.value)}/>
              </div>
              {section==='194C' && (
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <input type="checkbox" id="company" checked={isCompany} onChange={e=>setIsCompany(e.target.checked)}/>
                  <label htmlFor="company" style={{fontSize:13,color:'var(--muted)'}}>Payee is a company (2% rate applies)</label>
                </div>
              )}
              <button style={S.btn} onClick={calculate}>Calculate TDS</button>
            </div>
          </div>

          {result && (
            <div style={{...S.card,marginTop:16}}>
              {!result.aboveThreshold ? (
                <div style={{background:'#052713',border:'1px solid #0a4020',borderRadius:8,padding:14,color:'#22C55E',fontSize:14}}>
                  ✅ TDS nahi katna — Amount (₹{result.amt.toLocaleString('en-IN')}) threshold (₹{result.threshold.toLocaleString('en-IN')}) se kam hai!
                </div>
              ) : (
                <>
                  {[
                    {l:'Payment amount',v:inr(result.amt)},
                    {l:`TDS rate (Section ${result.section})`,v:`${result.rate}%`},
                    {l:'TDS amount to deduct',v:inr(result.tds),h:true},
                    {l:'Net payment to party',v:inr(result.net)},
                  ].map(({l,v,h})=>(
                    <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid var(--border)'}}>
                      <span style={{fontSize:13,color:'var(--muted)'}}>{l}</span>
                      <span style={{fontSize:14,fontWeight:h?700:500,color:h?'var(--red)':'var(--text)'}}>{v}</span>
                    </div>
                  ))}
                  <div style={{marginTop:14,background:'rgba(79,110,247,.1)',border:'1px solid rgba(79,110,247,.3)',borderRadius:8,padding:12,fontSize:13}}>
                    📌 Yeh TDS TRACES portal pe deposit karna hoga — 7th of next month tak. Form 26Q ya 24Q mein report karo.
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {tab==='rates' && (
        <div style={S.card}>
          <div style={{fontSize:15,fontWeight:600,marginBottom:16}}>TDS Rate Chart (FY 2025-26)</div>
          <div style={{display:'grid',gridTemplateColumns:'auto 2fr 1fr 1fr 2fr',gap:0}}>
            {['Section','Nature of Payment','Threshold','Rate','Note'].map(h=>(
              <div key={h} style={{fontSize:11,color:'var(--muted)',textTransform:'uppercase',padding:'8px 12px',background:'var(--surface)',borderBottom:'1px solid var(--border)'}}>{h}</div>
            ))}
            {TDS_RATES.map(r=>[
              <div key={r.section+'s'} style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',fontSize:13,fontWeight:600,color:'var(--accent)'}}>{r.section}</div>,
              <div key={r.section+'n'} style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',fontSize:13}}>{r.nature}</div>,
              <div key={r.section+'t'} style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',fontSize:13}}>{inr(r.threshold)}</div>,
              <div key={r.section+'r'} style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',fontSize:13,fontWeight:600,color:'#EF4444'}}>{r.rate}%</div>,
              <div key={r.section+'no'} style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',fontSize:12,color:'var(--muted)'}}>{r.note}</div>,
            ])}
          </div>
        </div>
      )}

      {tab==='deadlines' && (
        <div style={{display:'flex',flexDirection:'column',gap:16,maxWidth:700}}>
          <div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',borderRadius:10,padding:'12px 16px',fontSize:14}}>
            ⚠️ TDS deposit deadline: <b>7th of every next month</b> (March: 30th April). Late fee: ₹200/day under Sec 234E
          </div>
          {DEADLINES.map(d=>(
            <div key={d.form} style={S.card}>
              <div style={{display:'flex',gap:16,alignItems:'flex-start'}}>
                <div style={{background:'var(--accent)',color:'#fff',borderRadius:8,padding:'6px 12px',fontWeight:700,fontSize:14,flexShrink:0}}>{d.form}</div>
                <div>
                  <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>{d.desc}</div>
                  <div style={{fontSize:13,color:'var(--muted)'}}>Quarterly deadline: {d.due}</div>
                </div>
              </div>
            </div>
          ))}
          <div style={S.card}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>Penalties for late filing</div>
            {[
              {l:'Late deposit (Sec 201)',v:'Interest: 1.5% per month'},
              {l:'Late filing fee (Sec 234E)',v:'₹200 per day (max = TDS amount)'},
              {l:'Non-filing penalty (Sec 271H)',v:'₹10,000 to ₹1,00,000'},
            ].map(({l,v})=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                <span style={{fontSize:13,color:'var(--muted)'}}>{l}</span>
                <span style={{fontSize:13,fontWeight:500,color:'#EF4444'}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
