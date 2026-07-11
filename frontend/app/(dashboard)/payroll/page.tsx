'use client'
import { useState } from 'react'

const inr = (n:number) => '₹'+Math.round(n).toLocaleString('en-IN')

type Emp = { id:number; name:string; pan:string; basic:number; hra:number; special:number; pf:number; pt:number }

const defaultEmp = ():Emp => ({id:Date.now(),name:'',pan:'',basic:0,hra:0,special:0,pf:0,pt:200})

function calcSlip(e:Emp) {
  const gross    = e.basic + e.hra + e.special
  const pf_emp   = e.pf || Math.round(e.basic*0.12)
  const pt       = e.pt || 200
  // TDS estimate (simplified)
  const annual   = gross*12
  const stdDed   = 75000
  const taxable  = Math.max(0,annual-stdDed-pf_emp*12)
  let tax = 0
  if(taxable>1500000) tax=(taxable-1500000)*.3+150000*.2+200000*.15+200000*.1+400000*.05
  else if(taxable>1200000) tax=(taxable-1200000)*.2+200000*.15+200000*.1+400000*.05
  else if(taxable>1000000) tax=(taxable-1000000)*.15+200000*.1+400000*.05
  else if(taxable>700000) tax=(taxable-700000)*.1+400000*.05
  else if(taxable>300000) tax=(taxable-300000)*.05
  if(taxable<=700000) tax=0
  const tds_monthly = Math.max(0,Math.round((tax*1.04)/12))
  const net = gross - pf_emp - pt - tds_monthly
  return {gross,pf_emp,pt,tds_monthly,net,taxable}
}

export default function PayrollPage() {
  const [emps, setEmps]     = useState<Emp[]>([])
  const [month, setMonth]   = useState('June 2026')
  const [company, setCompany] = useState('My Company')
  const [slip, setSlip]     = useState<Emp|null>(null)

  const add  = () => setEmps(e=>[...e,defaultEmp()])
  const upd  = (id:number,f:string,v:string) => setEmps(e=>e.map(x=>x.id===id?{...x,[f]:f==='name'||f==='pan'?v:Number(v)}:x))
  const del  = (id:number) => setEmps(e=>e.filter(x=>x.id!==id))

  const S = {
    card: {background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:20} as React.CSSProperties,
    btn:  {background:'var(--accent)',color:'#fff',border:'none',borderRadius:8,padding:'10px 20px',fontSize:14,fontWeight:500,cursor:'pointer'} as React.CSSProperties,
    ghost:{background:'transparent',color:'var(--muted)',border:'1px solid var(--border2)',borderRadius:8,padding:'9px 16px',fontSize:13,cursor:'pointer'} as React.CSSProperties,
    inp:  {background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:6,padding:'7px 10px',color:'var(--text)',fontSize:13,outline:'none',width:'100%'} as React.CSSProperties,
  }

  if (slip) {
    const calc = calcSlip(slip)
    return (
      <div style={{padding:28}}>
        <button style={{...S.ghost,marginBottom:20}} onClick={()=>setSlip(null)}>← Back</button>
        <div style={{...S.card,maxWidth:480}}>
          <div style={{textAlign:'center',borderBottom:'2px dashed var(--border)',paddingBottom:16,marginBottom:16}}>
            <div style={{fontSize:18,fontWeight:700}}>{company}</div>
            <div style={{fontSize:13,color:'var(--muted)'}}>Salary Slip — {month}</div>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:600}}>{slip.name}</div>
            {slip.pan && <div style={{fontSize:12,color:'var(--muted)'}}>PAN: {slip.pan}</div>}
          </div>
          <div style={{fontSize:12,fontWeight:600,color:'#22C55E',marginBottom:8,textTransform:'uppercase'}}>Earnings</div>
          {[['Basic Salary',slip.basic],['HRA',slip.hra],['Special Allowance',slip.special]].map(([l,v])=>(
            <div key={l as string} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid var(--border)'}}>
              <span style={{fontSize:13,color:'var(--muted)'}}>{l}</span>
              <span style={{fontSize:13}}>{inr(Number(v))}</span>
            </div>
          ))}
          <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'2px solid var(--border)',fontWeight:600}}>
            <span>Gross Salary</span><span style={{color:'#22C55E'}}>{inr(calc.gross)}</span>
          </div>
          <div style={{fontSize:12,fontWeight:600,color:'#EF4444',margin:'12px 0 8px',textTransform:'uppercase'}}>Deductions</div>
          {[['PF (Employee 12%)',calc.pf_emp],['Professional Tax',calc.pt],['TDS (estimated)',calc.tds_monthly]].map(([l,v])=>(
            <div key={l as string} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid var(--border)'}}>
              <span style={{fontSize:13,color:'var(--muted)'}}>{l}</span>
              <span style={{fontSize:13}}>{inr(Number(v))}</span>
            </div>
          ))}
          <div style={{display:'flex',justifyContent:'space-between',padding:'12px',marginTop:12,background:'rgba(34,197,94,.1)',borderRadius:8,fontSize:16,fontWeight:700}}>
            <span>Net Take Home</span><span style={{color:'#22C55E'}}>{inr(calc.net)}</span>
          </div>
          <div style={{fontSize:12,color:'var(--muted)',marginTop:12,textAlign:'center'}}>
            Annual CTC: {inr(calc.gross*12)} | Annual TDS: {inr(calc.tds_monthly*12)}
          </div>
          <button style={{...S.btn,width:'100%',marginTop:16}} onClick={()=>window.print()}>🖨️ Print Salary Slip</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{padding:28}}>
      <h1 style={{fontSize:22,fontWeight:600,marginBottom:24}}>Payroll & Form 16</h1>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20,maxWidth:500}}>
        <div>
          <label style={{fontSize:13,color:'var(--muted)',display:'block',marginBottom:6}}>Company name</label>
          <input style={S.inp} value={company} onChange={e=>setCompany(e.target.value)}/>
        </div>
        <div>
          <label style={{fontSize:13,color:'var(--muted)',display:'block',marginBottom:6}}>Month</label>
          <input style={S.inp} value={month} onChange={e=>setMonth(e.target.value)}/>
        </div>
      </div>

      <div style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:600}}>Employees ({emps.length})</div>
          <button style={S.ghost} onClick={add}>+ Add employee</button>
        </div>

        {emps.length===0 && (
          <div style={{textAlign:'center',padding:40,color:'var(--muted)'}}>
            <div style={{fontSize:40,marginBottom:12}}>👤</div>
            <div>Koi employee nahi — "Add employee" click karo</div>
          </div>
        )}

        {emps.map(emp=>{
          const c = calcSlip(emp)
          return (
            <div key={emp.id} style={{background:'var(--surface)',borderRadius:10,padding:16,marginBottom:12,border:'1px solid var(--border)'}}>
              <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr',gap:10,marginBottom:10}}>
                <div>
                  <label style={{fontSize:11,color:'var(--muted)',display:'block',marginBottom:4}}>Name</label>
                  <input style={S.inp} value={emp.name} onChange={e=>upd(emp.id,'name',e.target.value)} placeholder="Employee name"/>
                </div>
                <div>
                  <label style={{fontSize:11,color:'var(--muted)',display:'block',marginBottom:4}}>Basic (₹/mo)</label>
                  <input style={S.inp} type="number" value={emp.basic||''} onChange={e=>upd(emp.id,'basic',e.target.value)} placeholder="50000"/>
                </div>
                <div>
                  <label style={{fontSize:11,color:'var(--muted)',display:'block',marginBottom:4}}>HRA (₹/mo)</label>
                  <input style={S.inp} type="number" value={emp.hra||''} onChange={e=>upd(emp.id,'hra',e.target.value)} placeholder="20000"/>
                </div>
                <div>
                  <label style={{fontSize:11,color:'var(--muted)',display:'block',marginBottom:4}}>Special Allow.</label>
                  <input style={S.inp} type="number" value={emp.special||''} onChange={e=>upd(emp.id,'special',e.target.value)} placeholder="15000"/>
                </div>
                <div>
                  <label style={{fontSize:11,color:'var(--muted)',display:'block',marginBottom:4}}>PAN</label>
                  <input style={S.inp} value={emp.pan} onChange={e=>upd(emp.id,'pan',e.target.value.toUpperCase())} placeholder="ABCDE1234F"/>
                </div>
                <div style={{display:'flex',alignItems:'flex-end'}}>
                  <button onClick={()=>del(emp.id)} style={{background:'none',border:'none',color:'var(--red)',cursor:'pointer',fontSize:20}}>×</button>
                </div>
              </div>
              {emp.basic>0 && (
                <div style={{display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}>
                  <span style={{fontSize:12,color:'var(--muted)'}}>Gross: <b style={{color:'var(--text)'}}>{inr(c.gross)}</b></span>
                  <span style={{fontSize:12,color:'var(--muted)'}}>PF: <b style={{color:'var(--text)'}}>{inr(c.pf_emp)}</b></span>
                  <span style={{fontSize:12,color:'var(--muted)'}}>TDS: <b style={{color:'var(--text)'}}>{inr(c.tds_monthly)}</b></span>
                  <span style={{fontSize:12,color:'#22C55E',fontWeight:600}}>Net: {inr(c.net)}</span>
                  <button style={{...S.ghost,fontSize:12,padding:'4px 12px',marginLeft:'auto'}} onClick={()=>setSlip(emp)}>
                    📄 View Slip
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {emps.length>0 && (
          <div style={{borderTop:'1px solid var(--border)',paddingTop:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:14}}>
              Total payroll: <b style={{color:'var(--accent)'}}>{inr(emps.reduce((s,e)=>s+calcSlip(e).gross,0))}</b> &nbsp;|&nbsp;
              Net payout: <b style={{color:'#22C55E'}}>{inr(emps.reduce((s,e)=>s+calcSlip(e).net,0))}</b>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
