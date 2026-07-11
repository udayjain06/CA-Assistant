'use client'
import { useState } from 'react'

const API = 'http://localhost:8000'

const SAMPLE = [
  { desc:'Client payment - ABC Corp', amount:'150000', type:'income', category:'Revenue' },
  { desc:'Office rent', amount:'25000', type:'expense', category:'Rent' },
  { desc:'Staff salary', amount:'45000', type:'expense', category:'Salaries' },
  { desc:'GST payment', amount:'12000', type:'expense', category:'Taxes' },
  { desc:'Freelance project', amount:'35000', type:'income', category:'Revenue' },
  { desc:'Software subscription', amount:'3000', type:'expense', category:'Software' },
]

const inr = (n:number) => '₹'+Math.round(n).toLocaleString('en-IN')

export default function StatementsPage() {
  const [rows, setRows] = useState(SAMPLE.map((r,i)=>({...r,id:i})))
  const [company, setCompany] = useState('My Business')
  const [period, setPeriod] = useState('FY 2025-26')
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'input'|'results'>('input')

  const income   = rows.filter(r=>r.type==='income').reduce((s,r)=>s+Number(r.amount),0)
  const expenses = rows.filter(r=>r.type==='expense').reduce((s,r)=>s+Number(r.amount),0)
  const profit   = income - expenses

  const byCategory = (type:string) => {
    const map: Record<string,number> = {}
    rows.filter(r=>r.type===type).forEach(r=>{
      map[r.category||'Other'] = (map[r.category||'Other']||0)+Number(r.amount)
    })
    return map
  }

  function addRow() {
    setRows(r=>[...r,{id:Date.now(),desc:'',amount:'',type:'expense',category:''}])
  }
  function updateRow(id:number, field:string, val:string) {
    setRows(r=>r.map(row=>row.id===id?{...row,[field]:val}:row))
  }
  function removeRow(id:number) { setRows(r=>r.filter(row=>row.id!==id)) }

  async function getAnalysis() {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/statements/ai-analyze`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({transactions:rows.map(r=>({...r,amount:Number(r.amount)})),period,company_name:company})
      })
      const data = await res.json()
      setAnalysis(data.analysis)
    } catch {
      setAnalysis(`📊 Analysis (offline mode):\n\n• Total Revenue: ${inr(income)}\n• Total Expenses: ${inr(expenses)}\n• Net ${profit>=0?'Profit':'Loss'}: ${inr(Math.abs(profit))}\n• Profit Margin: ${income>0?((profit/income)*100).toFixed(1):'0'}%\n\nConnect backend for detailed AI analysis.`)
    }
    setView('results')
    setLoading(false)
  }

  const S = {
    card: {background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:20} as React.CSSProperties,
    btn:  {background:'var(--accent)',color:'#fff',border:'none',borderRadius:8,padding:'10px 20px',fontSize:14,fontWeight:500,cursor:'pointer'} as React.CSSProperties,
    ghost:{background:'transparent',color:'var(--muted)',border:'1px solid var(--border2)',borderRadius:8,padding:'9px 16px',fontSize:13,cursor:'pointer'} as React.CSSProperties,
    inp:  {background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:6,padding:'7px 10px',color:'var(--text)',fontSize:13,outline:'none'} as React.CSSProperties,
  }

  if (view==='results') return (
    <div style={{padding:28}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
        <button style={S.ghost} onClick={()=>setView('input')}>← Back</button>
        <h1 style={{fontSize:22,fontWeight:600}}>{company} — {period}</h1>
      </div>

      {/* Summary cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
        {[
          {label:'Total Revenue',val:inr(income),color:'#22C55E'},
          {label:'Total Expenses',val:inr(expenses),color:'#EF4444'},
          {label:profit>=0?'Net Profit':'Net Loss',val:inr(Math.abs(profit)),color:profit>=0?'#22C55E':'#EF4444'},
        ].map(c=>(
          <div key={c.label} style={{...S.card}}>
            <div style={{fontSize:12,color:'var(--muted)',marginBottom:6}}>{c.label}</div>
            <div style={{fontSize:28,fontWeight:700,color:c.color}}>{c.val}</div>
            {c.label.includes('Profit')&&<div style={{fontSize:12,color:'var(--muted)',marginTop:4}}>Margin: {income>0?((profit/income)*100).toFixed(1):0}%</div>}
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
        {/* P&L */}
        <div style={S.card}>
          <div style={{fontSize:15,fontWeight:600,marginBottom:16}}>📈 Profit & Loss Statement</div>
          <div style={{fontSize:12,fontWeight:600,color:'#22C55E',marginBottom:8,textTransform:'uppercase'}}>Income</div>
          {Object.entries(byCategory('income')).map(([k,v])=>(
            <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
              <span style={{fontSize:13,color:'var(--muted)'}}>{k}</span>
              <span style={{fontSize:13,fontWeight:500}}>{inr(v)}</span>
            </div>
          ))}
          <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'2px solid var(--border)',marginTop:4}}>
            <span style={{fontSize:14,fontWeight:600}}>Total Income</span>
            <span style={{fontSize:14,fontWeight:700,color:'#22C55E'}}>{inr(income)}</span>
          </div>
          <div style={{fontSize:12,fontWeight:600,color:'#EF4444',margin:'16px 0 8px',textTransform:'uppercase'}}>Expenses</div>
          {Object.entries(byCategory('expense')).map(([k,v])=>(
            <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
              <span style={{fontSize:13,color:'var(--muted)'}}>{k}</span>
              <span style={{fontSize:13,fontWeight:500}}>{inr(v)}</span>
            </div>
          ))}
          <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'2px solid var(--border)',marginTop:4}}>
            <span style={{fontSize:14,fontWeight:600}}>Total Expenses</span>
            <span style={{fontSize:14,fontWeight:700,color:'#EF4444'}}>{inr(expenses)}</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',padding:'12px 0',marginTop:4,background:profit>=0?'rgba(34,197,94,.1)':'rgba(239,68,68,.1)',borderRadius:8,paddingLeft:12,paddingRight:12}}>
            <span style={{fontSize:15,fontWeight:700}}>Net {profit>=0?'Profit':'Loss'}</span>
            <span style={{fontSize:15,fontWeight:700,color:profit>=0?'#22C55E':'#EF4444'}}>{inr(Math.abs(profit))}</span>
          </div>
        </div>

        {/* AI Analysis */}
        <div style={S.card}>
          <div style={{fontSize:15,fontWeight:600,marginBottom:16}}>🤖 AI Analysis</div>
          <div style={{whiteSpace:'pre-wrap',fontSize:13,lineHeight:1.8,color:'var(--text)',background:'var(--surface)',borderRadius:8,padding:14,minHeight:200}}>
            {analysis||'Click "Get AI Analysis" below'}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{padding:28}}>
      <h1 style={{fontSize:22,fontWeight:600,marginBottom:24}}>Financial Statements</h1>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20,maxWidth:600}}>
        <div>
          <label style={{fontSize:13,color:'var(--muted)',display:'block',marginBottom:6}}>Business name</label>
          <input style={{...S.inp,width:'100%'}} value={company} onChange={e=>setCompany(e.target.value)}/>
        </div>
        <div>
          <label style={{fontSize:13,color:'var(--muted)',display:'block',marginBottom:6}}>Period</label>
          <input style={{...S.inp,width:'100%'}} value={period} onChange={e=>setPeriod(e.target.value)}/>
        </div>
      </div>

      <div style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:600}}>Transactions</div>
          <button style={S.ghost} onClick={addRow}>+ Add row</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr auto',gap:8,marginBottom:8}}>
          {['Description','Amount (₹)','Type','Category',''].map(h=>(
            <div key={h} style={{fontSize:11,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.5px'}}>{h}</div>
          ))}
        </div>
        {rows.map(row=>(
          <div key={row.id} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr auto',gap:8,marginBottom:8}}>
            <input style={{...S.inp}} value={row.desc} onChange={e=>updateRow(row.id,'desc',e.target.value)} placeholder="Description"/>
            <input style={{...S.inp}} type="number" value={row.amount} onChange={e=>updateRow(row.id,'amount',e.target.value)} placeholder="0"/>
            <select style={{...S.inp}} value={row.type} onChange={e=>updateRow(row.id,'type',e.target.value)}>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <input style={{...S.inp}} value={row.category} onChange={e=>updateRow(row.id,'category',e.target.value)} placeholder="e.g. Rent"/>
            <button onClick={()=>removeRow(row.id)} style={{background:'none',border:'none',color:'var(--red)',cursor:'pointer',fontSize:18}}>×</button>
          </div>
        ))}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:16,paddingTop:16,borderTop:'1px solid var(--border)'}}>
          <div style={{display:'flex',gap:16,fontSize:14}}>
            <span style={{color:'#22C55E'}}>Income: {inr(income)}</span>
            <span style={{color:'#EF4444'}}>Expenses: {inr(expenses)}</span>
            <span style={{color:profit>=0?'#22C55E':'#EF4444',fontWeight:600}}>Net: {inr(profit)}</span>
          </div>
          <button style={{...S.btn,opacity:loading?.6:1}} onClick={getAnalysis} disabled={loading}>
            {loading?'🤖 Analyzing...':'📊 Generate Statements'}
          </button>
        </div>
      </div>
    </div>
  )
}
