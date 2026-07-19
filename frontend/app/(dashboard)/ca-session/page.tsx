'use client'
import { useState, useRef, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ── Tax calc (client side) ────────────────────────────────────────────────────
function calcTax(income: number, regime: 'new' | 'old', ded: Record<string, number>) {
  let taxable = income
  if (regime === 'old') {
    taxable = Math.max(0, income - Math.min(50000, income)
      - Math.min(ded.sec80c || 0, 150000)
      - Math.min(ded.sec80d || 0, 25000)
      - Math.min(ded.nps || 0, 50000)
      - (ded.hra || 0)
      - Math.min(ded.home_loan || 0, 200000))
  } else {
    taxable = Math.max(0, income - Math.min(75000, income))
  }
  const slabs = regime === 'new'
    ? [[300000, 0], [700000, .05], [1000000, .10], [1200000, .15], [1500000, .20], [Infinity, .30]]
    : [[250000, 0], [500000, .05], [1000000, .20], [Infinity, .30]]
  let tax = 0, prev = 0
  for (const [lim, rate] of slabs) {
    if (taxable <= prev) break
    tax += (Math.min(taxable, lim as number) - prev) * (rate as number)
    prev = lim as number
  }
  if (taxable <= (regime === 'new' ? 700000 : 500000)) tax = Math.max(0, tax - 25000)
  return { taxable, tax: Math.round(tax * 1.04), regime }
}

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

// ── Types ─────────────────────────────────────────────────────────────────────
type UserType = 'salaried' | 'business' | 'both' | null
type FlowStep = 'welcome' | 'identify' | 'collect' | 'analyzing' | 'results' | 'done'

type Message = {
  id: number
  from: 'ca' | 'user'
  text: string
  options?: string[]
  input?: { placeholder: string; key: string; type?: string }
  result?: any
}

type UserData = {
  name: string
  userType: UserType
  income: number
  city: string
  pf: number
  rent: number
  hra: number
  health_insurance: number
  nps: number
  home_loan: number
  lic: number
  gst_registered: boolean
  business_turnover: number
  [key: string]: any
}

// ── CA conversation flows ─────────────────────────────────────────────────────
const SALARIED_QUESTIONS = [
  { key: 'income', text: 'Apni salary batao — poore saal ki gross salary kitni hai? (Offer letter ya Form 16 mein likha hoga)', placeholder: 'e.g. 1200000', type: 'number' },
  { key: 'city', text: 'Kaunse city mein rehte ho?', placeholder: 'e.g. Delhi, Mumbai, Pune' },
  { key: 'rent', text: 'Kya ghar ka rent dete ho? Mahine ka kitna? (Nahi dete toh 0 likho)', placeholder: 'e.g. 15000 (per month)', type: 'number' },
  { key: 'hra', text: 'Company se HRA milta hai? Mahine ka kitna? (Nahi milta toh 0)', placeholder: 'e.g. 20000 (per month)', type: 'number' },
  { key: 'pf', text: 'PF (Provident Fund) kata hai? Mahine mein kitna? (Nahi kata toh 0)', placeholder: 'e.g. 2400 (per month)', type: 'number' },
  { key: 'health_insurance', text: 'Health insurance hai? Agar haan toh saal mein premium kitna hai? (Nahi hai toh 0)', placeholder: 'e.g. 15000 (per year)', type: 'number' },
  { key: 'nps', text: 'NPS (National Pension System) mein paisa daala hai? Saal mein kitna? (Nahi daala toh 0)', placeholder: 'e.g. 50000 (per year)', type: 'number' },
  { key: 'lic', text: 'LIC, PPF, ELSS, ya koi tax saving investment? Saal mein total kitna? (Nahi hai toh 0)', placeholder: 'e.g. 100000 (per year)', type: 'number' },
  { key: 'home_loan', text: 'Ghar ka loan hai? Agar haan toh saal mein interest kitna dete ho bank ko? (Nahi hai toh 0)', placeholder: 'e.g. 200000 (per year)', type: 'number' },
]

const BUSINESS_QUESTIONS = [
  { key: 'business_turnover', text: 'Aapka business turnover kitna hai is financial year mein? (Approximate bhi chalega)', placeholder: 'e.g. 5000000', type: 'number' },
  { key: 'gst_registered', text: 'GST registration hai aapka?', placeholder: 'Haan / Nahi' },
  { key: 'income', text: 'Business se net income kitni hai (expenses ke baad)?', placeholder: 'e.g. 1500000', type: 'number' },
  { key: 'city', text: 'Business kahan hai?', placeholder: 'e.g. Delhi, Mumbai' },
  { key: 'health_insurance', text: 'Health insurance premium saal mein kitna? (0 agar nahi)', placeholder: 'e.g. 25000', type: 'number' },
  { key: 'nps', text: 'NPS investment saal mein? (0 agar nahi)', placeholder: 'e.g. 50000', type: 'number' },
]

export default function CASessionPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [step, setStep] = useState<FlowStep>('welcome')
  const [userData, setUserData] = useState<Partial<UserData>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [inputVal, setInputVal] = useState('')
  const [currentKey, setCurrentKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => {
    if (step === 'welcome') {
      setTimeout(() => addCA("Namaste! 🙏 Main aapka personal AI CA hoon.", undefined, undefined, 800), 300)
      setTimeout(() => addCA("Bilkul waise jaise aap apne CA ke paas jaate ho — aap bas mere sawaalon ka jawab do, main baaki sab sambhal lunga.", undefined, undefined, 1800), 1200)
      setTimeout(() => addCA("Chalo shuru karte hain! Aapka naam kya hai?", undefined, { placeholder: 'Apna naam likho', key: 'name' }, 2800), 2200)
      setStep('identify')
    }
  }, [])

  function addCA(text: string, options?: string[], input?: Message['input'], delay = 0) {
    setTimeout(() => {
      setMessages(m => [...m, { id: Date.now() + Math.random(), from: 'ca', text, options, input }])
      if (input) setCurrentKey(input.key)
      if (input) setTimeout(() => inputRef.current?.focus(), 100)
    }, delay)
  }

  function addUser(text: string) {
    setMessages(m => [...m, { id: Date.now(), from: 'user', text }])
  }

  function handleOption(option: string) {
    addUser(option)
    if (step === 'identify' && currentKey === 'name') {
      setUserData(d => ({ ...d, name: option }))
      askUserType(option)
    } else if (currentKey === 'userType') {
      const type = option.includes('Job') || option.includes('salary') ? 'salaried'
        : option.includes('business') ? 'business' : 'both'
      setUserData(d => ({ ...d, userType: type }))
      startQuestionnaire(type, option.split(' ')[0])
    }
  }

  function handleInput() {
    if (!inputVal.trim()) return
    const val = inputVal.trim()
    addUser(val)
    setInputVal('')

    if (currentKey === 'name') {
      setUserData(d => ({ ...d, name: val }))
      askUserType(val)
      return
    }

    if (currentKey === 'userType') {
      const type = val.toLowerCase().includes('job') || val.toLowerCase().includes('salary') ? 'salaried'
        : val.toLowerCase().includes('business') ? 'business' : 'both'
      setUserData(d => ({ ...d, userType: type }))
      startQuestionnaire(type, val)
      return
    }

    // Collecting questionnaire answers
    const numVal = Number(val.replace(/[^0-9.]/g, ''))
    const savedVal = currentKey === 'gst_registered'
      ? val.toLowerCase().includes('haan') || val.toLowerCase().includes('yes')
      : isNaN(numVal) ? val : (currentKey === 'rent' || currentKey === 'hra' || currentKey === 'pf' ? numVal * 12 : numVal)

    setUserData(d => ({ ...d, [currentKey]: savedVal }))

    const questions = userData.userType === 'business' ? BUSINESS_QUESTIONS
      : userData.userType === 'both' ? [...SALARIED_QUESTIONS, ...BUSINESS_QUESTIONS]
      : SALARIED_QUESTIONS

    const nextQ = currentQ + 1
    if (nextQ < questions.length) {
      setCurrentQ(nextQ)
      setTimeout(() => {
        addCA(questions[nextQ].text, undefined, { placeholder: questions[nextQ].placeholder, key: questions[nextQ].key, type: questions[nextQ].type })
      }, 600)
    } else {
      // All questions answered — analyze
      analyzeAndShowResults({ ...userData, [currentKey]: savedVal })
    }
  }

  function askUserType(name: string) {
    setTimeout(() => {
      addCA(`Bahut achha ${name.split(' ')[0]}! 😊 Ab batao — aap kya karte ho?`, ['💼 Job/Naukri karta/karti hoon', '🏪 Khud ka business hai', '🔄 Dono hain mere paas'], undefined)
      setCurrentKey('userType')
    }, 800)
  }

  function startQuestionnaire(type: UserType, greeting: string) {
    const questions = type === 'business' ? BUSINESS_QUESTIONS : SALARIED_QUESTIONS
    setCurrentQ(0)
    setStep('collect')
    setTimeout(() => {
      addCA(`Perfect! Ab main ek ek karke thodi basic information lunga — bilkul waise jaise koi CA poochta hai. Koi bhi cheez yaad na ho toh 0 likhna bilkul theek hai. 👍`, undefined, undefined)
      setTimeout(() => {
        addCA(questions[0].text, undefined, { placeholder: questions[0].placeholder, key: questions[0].key, type: questions[0].type })
      }, 1500)
    }, 800)
  }

  async function analyzeAndShowResults(data: Partial<UserData>) {
    setStep('analyzing')
    addCA("Shukriya! Ab main aapka poora analysis kar raha hoon... ⚙️")
    setTimeout(() => addCA("Tax calculation ho rahi hai..."), 1000)
    setTimeout(() => addCA("Best regime dhundh raha hoon aapke liye..."), 2000)

    await new Promise(r => setTimeout(r, 3000))

    const income = Number(data.income) || 0
    const ded = {
      sec80c: Math.min((Number(data.pf) || 0) + (Number(data.lic) || 0), 150000),
      sec80d: Math.min(Number(data.health_insurance) || 0, 25000),
      nps: Math.min(Number(data.nps) || 0, 50000),
      hra: Number(data.hra) || 0,
      home_loan: Math.min(Number(data.home_loan) || 0, 200000),
    }

    const oldR = calcTax(income, 'old', ded)
    const newR = calcTax(income, 'new', ded)
    const recommended = oldR.tax < newR.tax ? 'old' : 'new'
    const savings = Math.abs(oldR.tax - newR.tax)

    const itrForm = income > 5000000 || data.userType === 'business' ? 'ITR-3'
      : (data.home_loan || 0) > 0 ? 'ITR-2' : 'ITR-1'

    const deadline = '31 July 2026'

    // Get AI advice
    let aiAdvice = ''
    try {
      const res = await fetch(`${API}/api/itr/ai-advice`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gross_income: income, age: 28, regime: recommended, deductions: ded })
      })
      const d = await res.json()
      aiAdvice = d.advice
    } catch {
      aiAdvice = `${recommended === 'new' ? 'New' : 'Old'} regime better hai tumhare liye — ${inr(savings)} bachenge.\n\nTax saving tips:\n• Section 80C mein ${inr(150000 - Math.min((Number(data.pf)||0)+(Number(data.lic)||0),150000))} aur invest kar sakte ho\n• NPS mein ₹50,000 aur daal do (80CCD 1B)\n• Deadline: 31 July 2026`
    }

    const result = { oldR, newR, recommended, savings, itrForm, deadline, aiAdvice, data, ded }
    setResults(result)
    setStep('results')

    setTimeout(() => {
      addCA(`✅ Ho gaya! Maine aapka poora analysis kar liya.`)
      setTimeout(() => {
        addCA(`Aapke liye ${recommended === 'new' ? 'New Regime' : 'Old Regime'} better hai — ${inr(savings)} bachenge tax mein!`)
        setTimeout(() => {
          addCA(`Aapko ${itrForm} file karni hai, deadline hai ${deadline}.`, undefined, undefined)
          setMessages(m => [...m, {
            id: Date.now(),
            from: 'ca',
            text: '',
            result: result
          }])
        }, 1500)
      }, 1000)
    }, 500)
  }

  const S = {
    btn:   { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 500 as const, cursor: 'pointer' } as React.CSSProperties,
    ghost: { background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border2)', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' } as React.CSSProperties,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #4F6EF7, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🧑‍💼</div>
          <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#22C55E', border: '2px solid var(--surface)' }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>TaxGenie CA</div>
          <div style={{ fontSize: 12, color: '#22C55E' }}>● Online — aapka personal AI Chartered Accountant</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {step === 'results' && (
            <button style={S.ghost} onClick={() => {
              setMessages([]); setStep('welcome'); setUserData({}); setCurrentQ(0); setResults(null)
              setTimeout(() => {
                addCA("Namaste phir se! 🙏 Kya help chahiye?", undefined, { placeholder: 'Apna naam likho', key: 'name' })
                setStep('identify')
              }, 300)
            }}>🔄 Naya session</button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map(msg => (
          <div key={msg.id}>
            {msg.from === 'ca' && msg.text && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', maxWidth: '75%' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#4F6EF7,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🧑‍💼</div>
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px 12px 12px 0', padding: '12px 16px', fontSize: 14, lineHeight: 1.6 }}>
                  {msg.text}
                </div>
              </div>
            )}

            {/* Options */}
            {msg.options && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginLeft: 42, marginTop: 8 }}>
                {msg.options.map(opt => (
                  <button key={opt} onClick={() => handleOption(opt)} style={{
                    padding: '8px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                    background: 'var(--card)', border: '1px solid var(--accent)', color: 'var(--accent)',
                    fontWeight: 500, transition: 'all .15s'
                  }}>{opt}</button>
                ))}
              </div>
            )}

            {/* Result card */}
            {msg.result && (
              <div style={{ marginLeft: 42, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
                {/* Tax summary */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>📊 Aapka Tax Summary</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    {(['new', 'old'] as const).map(r => (
                      <div key={r} style={{
                        padding: 14, borderRadius: 10,
                        background: msg.result.recommended === r ? 'rgba(79,110,247,.1)' : 'var(--surface)',
                        border: `1px solid ${msg.result.recommended === r ? 'var(--accent)' : 'var(--border)'}`
                      }}>
                        {msg.result.recommended === r && <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 6 }}>⭐ TUMHARE LIYE BEST</div>}
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{r === 'new' ? 'New Regime' : 'Old Regime'}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Taxable: {inr(msg.result[`${r}R`].taxable)}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: msg.result.recommended === r ? 'var(--accent)' : 'var(--text)' }}>{inr(msg.result[`${r}R`].tax)}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#052713', border: '1px solid #0a4020', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#22C55E' }}>💰 {inr(msg.result.savings)} bachenge {msg.result.recommended === 'new' ? 'New' : 'Old'} Regime se!</div>
                  </div>
                </div>

                {/* Action items */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>✅ Aapko yeh karna hai</div>
                  {[
                    { icon: '📋', text: `${msg.result.itrForm} file karo`, sub: `Deadline: ${msg.result.deadline}`, color: '#EF4444', href: '/itr' },
                    { icon: '💰', text: 'Tax bachane ke liye invest karo', sub: 'Section 80C mein jagah baaki hai', color: '#F59E0B', href: '/advisor' },
                    { icon: '📅', text: 'Compliance calendar check karo', sub: 'Aur koi deadline toh nahi?', color: '#4F6EF7', href: '/audit' },
                  ].map(a => (
                    <a key={a.text} href={a.href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, textDecoration: 'none', marginBottom: 8, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 22 }}>{a.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{a.text}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{a.sub}</div>
                      </div>
                      <span style={{ color: a.color, fontSize: 16 }}>→</span>
                    </a>
                  ))}
                </div>

                {/* AI Tips */}
                {msg.result.aiAdvice && (
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>🤖 Personalized Tax Tips</div>
                    <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--muted)', whiteSpace: 'pre-wrap', background: 'var(--surface)', borderRadius: 8, padding: 12 }}>
                      {msg.result.aiAdvice}
                    </div>
                  </div>
                )}
              </div>
            )}

            {msg.from === 'user' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: msg.from === 'user' ? 4 : 0 }}>
                <div style={{ background: 'var(--accent)', color: '#fff', borderRadius: '12px 12px 0 12px', padding: '10px 16px', fontSize: 14, maxWidth: '60%' }}>
                  {msg.text}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#4F6EF7,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🧑‍💼</div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px 12px 12px 0', padding: '12px 16px' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)', animation: `pulse 1.2s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {(step === 'identify' || step === 'collect') && (
        <div style={{ padding: '14px 24px', background: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, flexShrink: 0 }}>
          <input
            ref={inputRef}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleInput()}
            placeholder={messages.filter(m => m.input).slice(-1)[0]?.input?.placeholder || 'Jawab likho...'}
            type={messages.filter(m => m.input).slice(-1)[0]?.input?.type === 'number' ? 'number' : 'text'}
            style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10, padding: '12px 16px', color: 'var(--text)', fontSize: 14, outline: 'none' }}
          />
          <button onClick={handleInput} disabled={!inputVal.trim()} style={{ ...S.btn, opacity: inputVal.trim() ? 1 : 0.5, padding: '0 20px', fontSize: 20 }}>↑</button>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:.3;transform:scale(1)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
    </div>
  )
}
