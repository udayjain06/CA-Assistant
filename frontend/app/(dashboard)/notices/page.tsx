'use client'
import { useState } from 'react'

const API = 'process.env.NEXT_PUBLIC_API_URL!'

const NOTICES = [
  {
    code: '143(1)', title: 'Intimation u/s 143(1)',
    emoji: '📬', severity: 'low',
    simple: 'Tera ITR process ho gaya — income tax department ne teri return check ki aur koi difference mila toh bataya',
    whatItMeans: 'Yeh ek auto-generated letter hota hai. Teri return process ho gayi. Agar koi tax demand hai toh woh yahan show hoga. Agar refund hai toh woh bhi yahan bataya jayega.',
    whatToDo: ['Letter carefully padho', 'Demand hai toh 30 din mein pay karo ya disagree karo', 'Refund check karo bank account mein', 'Agar koi galti hai toh rectification file karo u/s 154'],
    deadline: '30 days to respond if demand',
    penalty: 'Interest on unpaid demand @ 1% per month',
  },
  {
    code: '139(9)', title: 'Defective Return u/s 139(9)',
    emoji: '⚠️', severity: 'medium',
    simple: 'Teri ITR mein koi technical galti hai — income tax department ne reject kar di aur theek karne ko kaha',
    whatItMeans: 'Return mein kuch missing hai — schedules fill nahi hue, wrong ITR form choose kiya, ya figures match nahi kar rahe.',
    whatToDo: ['Notice mein bataye gaye defect ko padho', '15 din mein revised return file karo', 'Agar agree nahi toh written response bhejo', 'Deadline miss karte ho toh return invalid ho jayegi'],
    deadline: '15 days from notice date',
    penalty: 'Return treated as not filed — late filing penalty applies',
  },
  {
    code: '148', title: 'Notice u/s 148 — Reassessment',
    emoji: '🚨', severity: 'high',
    simple: 'Income tax department ko lagta hai tune income chhupai hai — woh dobara assessment karna chahte hain',
    whatItMeans: 'Department ko laga ki teri koi income return mein nahi thi. Yeh serious notice hai. 3-10 saal purani return ke liye bhi aa sakta hai.',
    whatToDo: ['IMMEDIATELY ek CA ya tax lawyer se milo', 'Notice ki date note karo', '30 din mein return file karo (agar notice valid hai)', 'Return file karne ke baad assessment proceedings mein participate karo', 'Sabse pehle notice ki validity check karo'],
    deadline: '30 days to file return',
    penalty: 'Concealment penalty 100%-300% of tax evaded + interest',
  },
  {
    code: '245', title: 'Notice u/s 245 — Refund Adjustment',
    emoji: '💰', severity: 'medium',
    simple: 'Tera purana tax refund rokne wale hain kyunki pehle ka koi tax demand hai',
    whatItMeans: 'Tera current year ka refund hai, but purane kisi saal ka tax demand bhi hai. Department dono adjust karna chahta hai.',
    whatToDo: ['Purana demand check karo — AIS ya outstanding demand portal pe', 'Agar demand galat hai toh 30 din mein response bhejo', 'Agar demand sahi hai toh accept karo', 'Balance refund milega adjustment ke baad'],
    deadline: '30 days to respond',
    penalty: 'Refund adjusted — no additional penalty if demand valid',
  },
  {
    code: '156', title: 'Demand Notice u/s 156',
    emoji: '💸', severity: 'high',
    simple: 'Tujhe income tax bharna hai — yeh official demand hai ki itna tax do',
    whatItMeans: 'Assessment ke baad yeh notice aata hai. Exact amount batayi gayi hai jo pay karni hai.',
    whatToDo: ['30 din mein pay karo', 'Agar disagree ho toh CIT(A) ke paas appeal karo 30 din mein', 'Part payment karne se interest aata rehta hai', 'Installment ki request bhi kar sakte ho'],
    deadline: '30 days to pay or appeal',
    penalty: 'Interest u/s 220(2) @ 1% per month after due date',
  },
  {
    code: '131', title: 'Summons u/s 131',
    emoji: '⚖️', severity: 'high',
    simple: 'Income tax officer ne bulaya hai personal attendance ke liye ya documents maange hain',
    whatItMeans: 'Scrutiny assessment mein officer ko personally milna chahta hai ya specific documents chahiye.',
    whatToDo: ['Date pe zaroor attend karo — ignore mat karo', 'Requested documents saath le jao', 'CA ko saath le jao', 'Agar date pe nahi aa sakte toh advance mein adjournment maango'],
    deadline: 'As mentioned in notice',
    penalty: 'Non-compliance = contempt proceedings',
  },
  {
    code: '142(1)', title: 'Notice u/s 142(1) — Inquiry',
    emoji: '🔍', severity: 'medium',
    simple: 'Income tax officer kuch information ya documents maang raha hai teri return ke baare mein',
    whatItMeans: 'Scrutiny ke dauran officer specific documents — bank statements, investment proofs, business details — maangta hai.',
    whatToDo: ['Maange gaye documents collect karo', 'Specified date pe submit karo', 'Koi bhi document forge mat karo', 'Agar extension chahiye toh request karo'],
    deadline: 'As mentioned in notice (usually 15-30 days)',
    penalty: '₹10,000 penalty for non-compliance u/s 272A',
  },
  {
    code: '271(1)(c)', title: 'Penalty u/s 271(1)(c)',
    emoji: '⛔', severity: 'high',
    simple: 'Income tax department ko laga ki tune jaanbujhkar galat income batayi ya income chhupai — penalty lag rahi hai',
    whatItMeans: 'Concealment of income ya furnishing inaccurate particulars ke liye yeh penalty notice aata hai. 100% to 300% of tax evaded.',
    whatToDo: ['IMMEDIATELY CA se milo', 'Appeal file karo CIT(A) ke paas', 'Bona fide mistake tha toh proof do', 'Voluntary disclosure karne se penalty reduce ho sakti hai'],
    deadline: '30 days to respond',
    penalty: '100% to 300% of tax sought to be evaded',
  },
]

export default function NoticesPage() {
  const [selected, setSelected] = useState<typeof NOTICES[0] | null>(null)
  const [aiResponse, setAiResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [situation, setSituation] = useState('')

  async function getDraftResponse() {
    if (!selected) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/advisor/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Draft a formal response letter in English for Income Tax Notice u/s ${selected.code}. 
User situation: ${situation || 'General response'}
The letter should be professional, polite, and mention that we are complying/disputing as applicable.
Include: Subject line, proper salutation, body explaining position, closing.`
          }]
        })
      })
      const data = await res.json()
      setAiResponse(data.reply)
    } catch {
      setAiResponse(`Draft Response Letter\n\nTo,\nThe Income Tax Officer,\n[Ward/Circle]\n[City]\n\nSub: Response to Notice u/s ${selected?.code} for AY ______\n\nRef: Notice No. _________ dated _________\n\nRespected Sir/Ma'am,\n\nWith reference to the above notice, I would like to submit the following:\n\n1. I have received the notice dated _______ u/s ${selected?.code}.\n\n2. [Your specific response here based on the situation]\n\n3. I am enclosing the following documents in support:\n   a. [Document 1]\n   b. [Document 2]\n\nI request you to consider the above and dispose off the proceedings accordingly.\n\nYours faithfully,\n[Your Name]\nPAN: [Your PAN]\nDate: ${new Date().toLocaleDateString('en-IN')}`)
    }
    setLoading(false)
  }

  const severityColor = (s: string) => s === 'high' ? '#EF4444' : s === 'medium' ? '#F59E0B' : '#22C55E'
  const severityBg    = (s: string) => s === 'high' ? '#1a0505' : s === 'medium' ? '#1f1500' : '#052713'

  const S = {
    card:  { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 } as React.CSSProperties,
    btn:   { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer' } as React.CSSProperties,
    ghost: { background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border2)', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' } as React.CSSProperties,
    inp:   { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', width: '100%' } as React.CSSProperties,
  }

  if (selected) return (
    <div style={{ padding: 28 }}>
      <button style={{ ...S.ghost, marginBottom: 20 }} onClick={() => { setSelected(null); setAiResponse('') }}>← Back to notices</button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Notice explanation */}
          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 32 }}>{selected.emoji}</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Section {selected.code}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>{selected.title}</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: severityBg(selected.severity), color: severityColor(selected.severity) }}>
                {selected.severity === 'high' ? '🚨 Urgent' : selected.severity === 'medium' ? '⚠️ Important' : '✅ Routine'}
              </span>
            </div>

            <div style={{ background: 'rgba(79,110,247,.1)', border: '1px solid rgba(79,110,247,.3)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginBottom: 4 }}>Simple explanation</div>
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>{selected.simple}</div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Iska matlab kya hai?</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>{selected.whatItMeans}</div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>✅ Kya karna chahiye?</div>
              {selected.whatToDo.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, paddingTop: 2 }}>{step}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#1f1500', border: '1px solid #3d2a00', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600, marginBottom: 4 }}>⏰ DEADLINE</div>
                <div style={{ fontSize: 13 }}>{selected.deadline}</div>
              </div>
              <div style={{ background: '#1a0505', border: '1px solid #3d1010', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 600, marginBottom: 4 }}>⚠️ PENALTY</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{selected.penalty}</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Response Drafter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={S.card}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>🤖 AI Response Letter Drafter</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Teri situation kya hai? (optional)</label>
              <textarea value={situation} onChange={e => setSituation(e.target.value)}
                placeholder="e.g. Meri income sahi thi, documents mere paas hain. Ya: Mujhe extend chahiye deadline."
                style={{ ...S.inp, minHeight: 80, resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }} />
            </div>
            <button style={{ ...S.btn, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={getDraftResponse}>
              {loading ? '🤖 Draft ban raha hai...' : '✍️ Draft response letter'}
            </button>

            {aiResponse && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Draft letter:</div>
                  <button style={S.ghost} onClick={() => navigator.clipboard.writeText(aiResponse)}>📋 Copy</button>
                </div>
                <div style={{ background: 'var(--surface)', borderRadius: 8, padding: 16, fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'monospace', maxHeight: 400, overflow: 'auto' }}>
                  {aiResponse}
                </div>
              </div>
            )}
          </div>

          <div style={{ ...S.card, background: '#052713', border: '1px solid #0a4020' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#22C55E', marginBottom: 8 }}>💡 Pro tips</div>
            {[
              'Har notice ki deadline note karo — miss mat karo',
              '143(1) aur 245 routine hain — ghabrao mat',
              '148 aur 271 serious hain — CA se zaroor milo',
              'Notice ka response registered post se bhejo — receipt rakho',
              'Income Tax portal pe sab responses online bhi submit hote hain',
            ].map(tip => (
              <div key={tip} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#4ade80', marginBottom: 6 }}>
                <span>→</span><span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>IT Notice Handler</h1>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>Apna notice select karo — simple Hindi mein samjhayenge aur response draft karenge</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
        {NOTICES.map(n => (
          <button key={n.code} onClick={() => setSelected(n)} style={{
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
            padding: 20, cursor: 'pointer', textAlign: 'left' as const, transition: 'border-color .15s'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 24 }}>{n.emoji}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Section {n.code}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{n.title}</div>
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: severityBg(n.severity), color: severityColor(n.severity), flexShrink: 0 }}>
                {n.severity === 'high' ? '🚨 Urgent' : n.severity === 'medium' ? '⚠️ Important' : '✅ Routine'}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{n.simple}</div>
            <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 10 }}>Click to know more + draft response →</div>
          </button>
        ))}
      </div>
    </div>
  )
}
