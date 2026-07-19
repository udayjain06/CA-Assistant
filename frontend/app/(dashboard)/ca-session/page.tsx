'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function calcTax(income: number, regime: 'new'|'old', ded: Record<string,number>) {
  let taxable = income
  if (regime === 'old') {
    taxable = Math.max(0, income
      - Math.min(50000, income)
      - Math.min(ded.sec80c||0, 150000)
      - Math.min(ded.sec80d||0, 25000)
      - Math.min(ded.nps||0, 50000)
      - (ded.hra||0)
      - Math.min(ded.home_loan||0, 200000))
  } else {
    taxable = Math.max(0, income - Math.min(75000, income))
  }
  const slabs = regime === 'new'
    ? [[300000,0],[700000,.05],[1000000,.10],[1200000,.15],[1500000,.20],[Infinity,.30]]
    : [[250000,0],[500000,.05],[1000000,.20],[Infinity,.30]]
  let tax=0, prev=0
  for (const [lim,rate] of slabs) {
    if (taxable<=prev) break
    tax += (Math.min(taxable,lim as number)-prev)*(rate as number); prev=lim as number
  }
  if (taxable<=(regime==='new'?700000:500000)) tax=Math.max(0,tax-25000)
  return { taxable, tax:Math.round(tax*1.04) }
}

const inr = (n:number) => '₹'+Math.round(n).toLocaleString('en-IN')

type UserData = Record<string, string|number|boolean>
type FlowStep = 'welcome'|'identify'|'collect'|'results'

type Message = {
  id: number
  from: 'ca'|'user'
  text: string
  options?: string[]
  input?: { placeholder:string; key:string; type?:string }
  result?: Record<string, unknown>
}

const QUESTIONS = [
  { key:'income',           text:'Poore saal ki gross salary kitni hai? (Offer letter mein dekho)', placeholder:'e.g. 1200000', type:'number' },
  { key:'rent',             text:'Ghar ka rent dete ho? Mahine ka kitna? (Nahi dete toh 0)', placeholder:'e.g. 15000', type:'number' },
  { key:'hra',              text:'Company se HRA milta hai? Mahine ka kitna? (Nahi milta toh 0)', placeholder:'e.g. 20000', type:'number' },
  { key:'pf',               text:'PF kata hai? Mahine mein kitna? (Nahi kata toh 0)', placeholder:'e.g. 2400', type:'number' },
  { key:'health_insurance', text:'Health insurance premium saal mein kitna? (Nahi hai toh 0)', placeholder:'e.g. 15000', type:'number' },
  { key:'nps',              text:'NPS mein daala hai? Saal mein kitna? (Nahi toh 0)', placeholder:'e.g. 50000', type:'number' },
  { key:'lic',              text:'LIC, PPF, ELSS ya koi tax saving investment? Saal mein total? (Nahi toh 0)', placeholder:'e.g. 100000', type:'number' },
  { key:'home_loan',        text:'Ghar ka loan hai? Saal mein interest kitna? (Nahi hai toh 0)', placeholder:'e.g. 200000', type:'number' },
]

export default function CASessionPage() {
  const [messages, setMessages]   = useState<Message[]>([])
  const [step, setStep]           = useState<FlowStep>('welcome')
  const [userData, setUserData]   = useState<UserData>({})
  const [currentQ, setCurrentQ]   = useState(0)
  const [inputVal, setInputVal]   = useState('')
  const [currentKey, setCurrentKey] = useState('name')
  const [initialized, setInitialized] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  const addCA = useCallback((text: string, options?: string[], input?: Message['input'], delay=0) => {
    setTimeout(() => {
      setMessages(m => [...m, { id:Date.now()+Math.random(), from:'ca', text, options, input }])
      if (input) { setCurrentKey(input.key); setTimeout(()=>inputRef.current?.focus(),100) }
    }, delay)
  }, [])

  useEffect(() => {
    if (initialized) return
    setInitialized(true)
    // Use setTimeout to avoid setState in effect body
    setTimeout(() => {
      addCA("Namaste! 🙏 Main aapka personal AI CA hoon.")
      addCA("Aap bas mere sawaalon ka jawab do — main baaki sab sambhal lunga.", undefined, undefined, 1000)
      addCA("Chalo shuru karte hain! Aapka naam kya hai?", undefined, { placeholder:'Apna naam likho', key:'name' }, 1800)
    }, 100)
  }, [initialized, addCA])

  function addUser(text: string) {
    setMessages(m => [...m, { id:Date.now(), from:'user', text }])
  }

  function handleOption(option: string) {
    addUser(option)
    if (currentKey === 'userType') {
      startQuestionnaire(option)
    }
  }

  function askUserType(name: string) {
    const firstName = name.split(' ')[0]
    addCA(`Bahut achha ${firstName}! 😊 Aap kya karte ho?`,
      ['💼 Job/Naukri karta hoon', '🏪 Khud ka business hai', '🔄 Dono hain'], undefined, 800)
    setCurrentKey('userType')
  }

  function startQuestionnaire(choice: string) {
    setUserData(d => ({ ...d, userType: choice }))
    setCurrentQ(0)
    setStep('collect')
    addCA("Perfect! Ab ek ek karke basic info lunga — bilkul waise jaise CA poochta hai. Yaad na ho toh 0 likhna bilkul theek hai. 👍", undefined, undefined, 600)
    addCA(QUESTIONS[0].text, undefined, { placeholder:QUESTIONS[0].placeholder, key:QUESTIONS[0].key, type:QUESTIONS[0].type }, 1600)
  }

  async function handleInput() {
    if (!inputVal.trim()) return
    const val = inputVal.trim()
    addUser(val)
    setInputVal('')

    if (currentKey === 'name') {
      setUserData(d => ({ ...d, name: val }))
      askUserType(val)
      return
    }

    const numVal = Number(val.replace(/[^0-9.]/g,''))
    const saved  = isNaN(numVal) ? val : (['rent','hra','pf'].includes(currentKey) ? numVal*12 : numVal)
    const newData = { ...userData, [currentKey]: saved }
    setUserData(newData)

    const nextQ = currentQ + 1
    if (nextQ < QUESTIONS.length) {
      setCurrentQ(nextQ)
      addCA(QUESTIONS[nextQ].text, undefined, { placeholder:QUESTIONS[nextQ].placeholder, key:QUESTIONS[nextQ].key, type:QUESTIONS[nextQ].type }, 600)
    } else {
      await analyzeAndShowResults(newData)
    }
  }

  async function analyzeAndShowResults(data: UserData) {
    setStep('results')
    addCA("Shukriya! Aapka poora analysis kar raha hoon... ⚙️")
    addCA("Tax calculation ho rahi hai...", undefined, undefined, 1000)

    await new Promise(r => setTimeout(r, 2500))

    const income = Number(data.income) || 0
    const ded = {
      sec80c:    Math.min((Number(data.pf)||0)+(Number(data.lic)||0), 150000),
      sec80d:    Math.min(Number(data.health_insurance)||0, 25000),
      nps:       Math.min(Number(data.nps)||0, 50000),
      hra:       Number(data.hra)||0,
      home_loan: Math.min(Number(data.home_loan)||0, 200000),
    }
    const oldR = calcTax(income,'old',ded)
    const newR = calcTax(income,'new',ded)
    const rec  = oldR.tax < newR.tax ? 'old' : 'new'
    const savings = Math.abs(oldR.tax - newR.tax)
    const itrForm = income > 5000000 ? 'ITR-2' : 'ITR-1'

    let aiAdvice = ''
    try {
      const res = await fetch(`${API}/api/itr/ai-advice`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ gross_income:income, age:28, regime:rec, deductions:ded })
      })
      const d = await res.json()
      aiAdvice = d.advice
    } catch {
      aiAdvice = `${rec==='new'?'New':'Old'} regime better hai — ${inr(savings)} bachenge.\n\n• 80C mein aur invest karo\n• NPS mein ₹50,000 daalo\n• Deadline: 31 July 2026`
    }

    const result = { oldR, newR, rec, savings, itrForm, aiAdvice }

    addCA(`✅ Ho gaya! ${rec==='new'?'New':'Old'} Regime best hai — ${inr(savings)} bachenge tax mein!`, undefined, undefined, 500)
    setMessages(m => [...m, { id:Date.now(), from:'ca', text:'', result }])
  }

  const S = {
    btn:   { background:'var(--accent)',color:'#fff',border:'none',borderRadius:8,padding:'10px 20px',fontSize:14,fontWeight:500 as const,cursor:'pointer' } as React.CSSProperties,
    ghost: { background:'var(--surface)',color:'var(--muted)',border:'1px solid var(--border2)',borderRadius:8,padding:'8px 16px',fontSize:13,cursor:'pointer' } as React.CSSProperties,
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh' }}>
      <div style={{ background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:'14px 24px',display:'flex',alignItems:'center',gap:12,flexShrink:0 }}>
        <div style={{ position:'relative' }}>
          <div style={{ width:40,height:40,borderRadius:'50%',background:'linear-gradient(135deg,#4F6EF7,#7C3AED)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 }}>🧑‍💼</div>
          <div style={{ position:'absolute',bottom:1,right:1,width:10,height:10,borderRadius:'50%',background:'#22C55E',border:'2px solid var(--surface)' }}/>
        </div>
        <div>
          <div style={{ fontSize:15,fontWeight:600 }}>TaxGenie CA</div>
          <div style={{ fontSize:12,color:'#22C55E' }}>● Online — aapka personal AI Chartered Accountant</div>
        </div>
        {step==='results' && (
          <button style={{ ...S.ghost,marginLeft:'auto' }} onClick={()=>{ setMessages([]); setUserData({}); setCurrentQ(0); setInitialized(false) }}>🔄 Naya session</button>
        )}
      </div>

      <div style={{ flex:1,overflowY:'auto',padding:'20px 24px',display:'flex',flexDirection:'column',gap:12 }}>
        {messages.map(msg => (
          <div key={msg.id}>
            {msg.from==='ca' && msg.text && (
              <div style={{ display:'flex',gap:10,alignItems:'flex-start',maxWidth:'75%' }}>
                <div style={{ width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#4F6EF7,#7C3AED)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0 }}>🧑‍💼</div>
                <div style={{ background:'var(--card)',border:'1px solid var(--border)',borderRadius:'12px 12px 12px 0',padding:'12px 16px',fontSize:14,lineHeight:1.6 }}>{msg.text}</div>
              </div>
            )}
            {msg.options && (
              <div style={{ display:'flex',flexWrap:'wrap',gap:8,marginLeft:42,marginTop:8 }}>
                {msg.options.map(opt => (
                  <button key={opt} onClick={()=>handleOption(opt)} style={{ padding:'8px 16px',borderRadius:20,fontSize:13,cursor:'pointer',background:'var(--card)',border:'1px solid var(--accent)',color:'var(--accent)',fontWeight:500 }}>{opt}</button>
                ))}
              </div>
            )}
            {msg.result && (
              <div style={{ marginLeft:42,marginTop:12,display:'flex',flexDirection:'column',gap:12,maxWidth:600 }}>
                <div style={{ background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:20 }}>
                  <div style={{ fontSize:14,fontWeight:600,marginBottom:14 }}>📊 Tax Summary</div>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12 }}>
                    {(['new','old'] as const).map(r => {
                      const res = msg.result as Record<string,unknown>
                      const regime = (res[`${r}R`] as Record<string,number>)
                      const isRec  = res.rec === r
                      return (
                        <div key={r} style={{ padding:14,borderRadius:10,background:isRec?'rgba(79,110,247,.1)':'var(--surface)',border:`1px solid ${isRec?'var(--accent)':'var(--border)'}` }}>
                          {isRec && <div style={{ fontSize:11,color:'var(--accent)',fontWeight:600,marginBottom:6 }}>⭐ BEST FOR YOU</div>}
                          <div style={{ fontSize:13,fontWeight:600,marginBottom:6 }}>{r==='new'?'New Regime':'Old Regime'}</div>
                          <div style={{ fontSize:12,color:'var(--muted)',marginBottom:4 }}>Taxable: {inr(regime.taxable)}</div>
                          <div style={{ fontSize:18,fontWeight:700,color:isRec?'var(--accent)':'var(--text)' }}>{inr(regime.tax)}</div>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ background:'#052713',border:'1px solid #0a4020',borderRadius:8,padding:12 }}>
                    <div style={{ fontSize:14,fontWeight:600,color:'#22C55E' }}>💰 {inr((msg.result as Record<string,number>).savings)} bachenge!</div>
                  </div>
                </div>
                <div style={{ background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:20 }}>
                  <div style={{ fontSize:14,fontWeight:600,marginBottom:12 }}>✅ Aapko yeh karna hai</div>
                  {[
                    { icon:'📋',text:`${msg.result.itrForm as string} file karo`,sub:'Deadline: 31 July 2026',href:'/itr' },
                    { icon:'🤖',text:'AI se aur tips lo',sub:'Tax saving opportunities',href:'/advisor' },
                    { icon:'🔍',text:'Compliance check karo',sub:'Koi deadline toh nahi?',href:'/audit' },
                  ].map(a => (
                    <a key={a.text} href={a.href} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:8,textDecoration:'none',marginBottom:8,background:'var(--surface)',border:'1px solid var(--border)' }}>
                      <span style={{ fontSize:22 }}>{a.icon}</span>
                      <div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:500,color:'var(--text)' }}>{a.text}</div><div style={{ fontSize:12,color:'var(--muted)' }}>{a.sub}</div></div>
                      <span style={{ color:'var(--accent)',fontSize:16 }}>→</span>
                    </a>
                  ))}
                </div>
                {msg.result.aiAdvice && (
                  <div style={{ background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:20 }}>
                    <div style={{ fontSize:14,fontWeight:600,marginBottom:10 }}>🤖 Personalized Tips</div>
                    <div style={{ fontSize:13,lineHeight:1.8,color:'var(--muted)',whiteSpace:'pre-wrap',background:'var(--surface)',borderRadius:8,padding:12 }}>{msg.result.aiAdvice as string}</div>
                  </div>
                )}
              </div>
            )}
            {msg.from==='user' && (
              <div style={{ display:'flex',justifyContent:'flex-end',marginTop:4 }}>
                <div style={{ background:'var(--accent)',color:'#fff',borderRadius:'12px 12px 0 12px',padding:'10px 16px',fontSize:14,maxWidth:'60%' }}>{msg.text}</div>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>

      {(step==='welcome'||step==='identify'||step==='collect') && (
        <div style={{ padding:'14px 24px',background:'var(--surface)',borderTop:'1px solid var(--border)',display:'flex',gap:10,flexShrink:0 }}>
          <input ref={inputRef} value={inputVal} onChange={e=>setInputVal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleInput()}
            placeholder="Jawab likho..." style={{ flex:1,background:'var(--card)',border:'1px solid var(--border2)',borderRadius:10,padding:'12px 16px',color:'var(--text)',fontSize:14,outline:'none' }}/>
          <button onClick={handleInput} disabled={!inputVal.trim()} style={{ ...S.btn,opacity:inputVal.trim()?1:0.5,padding:'0 20px',fontSize:20 }}>↑</button>
        </div>
      )}
    </div>
  )
}
