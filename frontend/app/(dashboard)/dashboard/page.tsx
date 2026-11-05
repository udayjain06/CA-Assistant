import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats } from '@/lib/supabase/actions'

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

const ALL_DEADLINES = [
  { icon:'📋', name:'ITR-1 filing (AY 2025–26)', due:'31 July 2026', badge:'Urgent', bc:'#EF4444', bb:'#1a0505', href:'/itr' },
  { icon:'🧾', name:'GSTR-3B (June 2026)',        due:'20 July 2026', badge:'Soon',   bc:'#F59E0B', bb:'#1f1500', href:'/gst' },
  { icon:'📊', name:'TDS return Q1 (26Q)',         due:'31 July 2026', badge:'Soon',   bc:'#F59E0B', bb:'#1f1500', href:'/tds' },
  { icon:'🏢', name:'MCA Annual return (MGT-7)',  due:'29 Nov 2026',  badge:'Later',  bc:'#4F6EF7', bb:'#0d1433', href:'/audit' },
]

const MODULES = [
  { href:'/ca-session',    emoji:'🧑‍💼', name:'Meet Your CA',         desc:'Baat karo AI CA se — sab kuch woh handle karega',        badge:'Start here ✨', bc:'#4F6EF7', bb:'#0d1433' },
  { href:'/itr',           emoji:'📋', name:'ITR Filing',            desc:'Old vs new regime compare, AI tax advice',               badge:'31 July!',      bc:'#EF4444', bb:'#1a0505' },
  { href:'/gst',           emoji:'🧾', name:'GST Returns',           desc:'GSTR-1, 3B deadlines aur AI Q&A',                       badge:'20 July due',   bc:'#F59E0B', bb:'#1f1500' },
  { href:'/capital-gains', emoji:'📈', name:'Capital Gains',         desc:'Stocks, MF, property — STCG/LTCG auto calculate',       badge:'',              bc:'', bb:'' },
  { href:'/crypto',        emoji:'₿',  name:'Crypto Tax',            desc:'30% flat tax + 1% TDS har transaction pe',              badge:'',              bc:'', bb:'' },
  { href:'/invoice',       emoji:'🧾', name:'Invoice Generator',     desc:'GST-compliant invoice banao, print/PDF ready',          badge:'Free',          bc:'#22C55E', bb:'#052713' },
  { href:'/statements',    emoji:'📉', name:'Financial Statements',  desc:'Transactions se P&L, balance sheet auto',               badge:'',              bc:'', bb:'' },
  { href:'/payroll',       emoji:'💰', name:'Payroll & Form 16',     desc:'Employees add karo, salary slips calculate karo',       badge:'',              bc:'', bb:'' },
  { href:'/tds',           emoji:'📊', name:'TDS Returns',           desc:'Calculator, rate chart, deadlines ek jagah',            badge:'',              bc:'', bb:'' },
  { href:'/notices',       emoji:'📬', name:'IT Notice Handler',     desc:'Income tax notice simple Hindi mein samjho',            badge:'',              bc:'', bb:'' },
  { href:'/audit',         emoji:'🔍', name:'Audit & Advisory',      desc:'Compliance checker + AI advisor',                       badge:'',              bc:'', bb:'' },
  { href:'/docs',          emoji:'📂', name:'Document Vault',        desc:'Salary slip, Form 16 — AI extract kar lega',            badge:'',              bc:'', bb:'' },
]

export default async function DashboardPage() {
  // Try to get user — guests get null
  let user = null
  let stats = null
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
    if (user) stats = await getDashboardStats()
  } catch { /* guest mode */ }

  const name = user?.user_metadata?.full_name?.split(' ')[0] || null
  const C = {
    card: {
      background: 'var(--card)',
      border: '1px solid rgba(255, 255, 255, 0.07)',
      borderRadius: 14,
      padding: 20,
      boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
    } as React.CSSProperties
  }

  return (
    <div className="page-container" style={{ display:'flex', flexDirection:'column', gap:24 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ marginBottom:4 }}>
            {name ? `Namaste, ${name}! 👋` : 'Namaste! 👋'}
          </h1>
          <p style={{ fontSize:14, color:'var(--muted)' }}>Aapka AI tax assistant — kisi bhi tax kaam ke liye ready</p>
        </div>
        <Link href="/ca-session" className="pressable" style={{ background:'var(--accent)', color:'#fff', padding:'10px 20px', borderRadius:8, textDecoration:'none', fontSize:14, fontWeight:500, letterSpacing:'-0.01em' }}>
          🧑‍💼 Meet Your CA
        </Link>
      </div>

      {/* Guest banner — only for non-logged-in users */}
      {!user && (
        <div style={{ background:'rgba(79,110,247,.08)', border:'1px solid rgba(79,110,247,.25)', borderRadius:12, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, flex:1, minWidth:220 }}>
            <span style={{ fontSize:22 }}>💾</span>
            <div>
              <div style={{ fontSize:14, fontWeight:500 }}>Apna progress save karna chahte ho?</div>
              <div style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>Account banao — filings, tax savings history sab save rahega</div>
            </div>
          </div>
          <Link href="/login" className="pressable" style={{ background:'var(--accent)', color:'#fff', padding:'8px 18px', borderRadius:8, textDecoration:'none', fontSize:13, fontWeight:500, whiteSpace:'nowrap' }}>
            Free mein sign up →
          </Link>
        </div>
      )}

      {/* Deadline banner */}
      <div style={{ background:'linear-gradient(135deg,rgba(79,110,247,.15),rgba(79,110,247,.05))', border:'1px solid rgba(79,110,247,.3)', borderRadius:12, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, flex:1, minWidth:220 }}>
          <span style={{ fontSize:28 }}>⚠️</span>
          <div>
            <div style={{ fontSize:15, fontWeight:600 }}>ITR filing deadline: 31 July 2026</div>
            <div style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>Late filing pe ₹5,000 penalty — abhi file karo</div>
          </div>
        </div>
        <Link href="/itr" className="pressable" style={{ background:'var(--accent)', color:'#fff', padding:'9px 18px', borderRadius:8, textDecoration:'none', fontSize:14, fontWeight:500, whiteSpace:'nowrap' }}>File now →</Link>
      </div>

      {/* Real stats — logged in users with data */}
      {user && stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16 }}>
          <div style={C.card}>
            <div style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}>Tax saved (all filings)</div>
            <div style={{ fontSize:26, fontWeight:700, color:'#22C55E' }}>{inr(stats.taxSaved)}</div>
            <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>AI recommendations se</div>
          </div>
          <div style={C.card}>
            <div style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}>Filings completed</div>
            <div style={{ fontSize:26, fontWeight:700 }}>{stats.filingCount}</div>
            <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>AY 2025-26</div>
          </div>
          <div style={C.card}>
            <div style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}>Last filing</div>
            <div style={{ fontSize:16, fontWeight:700 }}>{stats.lastFiling.type}</div>
            <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>
              {new Date(stats.lastFiling.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
            </div>
          </div>
        </div>
      )}

      {/* CTA for first-time logged-in users */}
      {user && !stats && (
        <div style={{ background:'linear-gradient(135deg,rgba(124,58,237,.15),rgba(79,110,247,.1))', border:'1px solid rgba(124,58,237,.3)', borderRadius:12, padding:24, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16, flex:1, minWidth:220 }}>
            <div style={{ fontSize:40 }}>🧑‍💼</div>
            <div>
              <div style={{ fontSize:16, fontWeight:600, marginBottom:4 }}>Pehli baar? Meet Your CA se shuru karo</div>
              <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6 }}>Bas sawaalon ka jawab do — AI CA sab handle karega</div>
            </div>
          </div>
          <Link href="/ca-session" className="pressable" style={{ background:'linear-gradient(135deg,#7C3AED,#4F6EF7)', color:'#fff', padding:'12px 24px', borderRadius:8, textDecoration:'none', fontSize:14, fontWeight:600, whiteSpace:'nowrap' }}>
            Shuru karo ✨
          </Link>
        </div>
      )}

      {/* Recent filings */}
      {user && stats && stats.recentFilings.length > 0 && (
        <div style={C.card}>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>📋 Recent filings</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {stats.recentFilings.map(f => (
              <div key={f.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:'var(--surface)', borderRadius:8, border:'1px solid var(--border)' }}>
                <span style={{ fontSize:20 }}>📋</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500 }}>{f.type}</div>
                  <div style={{ fontSize:12, color:'var(--muted)' }}>{new Date(f.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</div>
                </div>
                <div style={{ textAlign:'right' as const }}>
                  {f.tax && <div style={{ fontSize:13, fontWeight:600, color:'var(--accent)' }}>{inr(f.tax)}</div>}
                  <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'#052713', color:'#22C55E' }}>{f.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deadlines */}
      <div style={C.card}>
        <div style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>📅 Upcoming deadlines</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {ALL_DEADLINES.map(d => (
            <Link key={d.name} href={d.href} className="pressable" style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:'var(--surface)', borderRadius:8, border:'1px solid var(--border)', textDecoration:'none', color:'inherit' }}>
              <span style={{ fontSize:20 }}>{d.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500 }}>{d.name}</div>
                <div style={{ fontSize:12, color:'var(--muted)' }}>Due {d.due}</div>
              </div>
              <span style={{ fontSize:12, fontWeight:500, padding:'3px 10px', borderRadius:20, color:d.bc, background:d.bb }}>{d.badge}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* All modules */}
      <div style={C.card}>
        <div style={{ fontSize:15, fontWeight:600, marginBottom:16, letterSpacing:'-0.01em' }}>🛠️ All modules</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:14 }}>
          {MODULES.map(m => (
            <Link
              key={m.href}
              href={m.href}
              className="module-card"
              style={{ background:'var(--surface)', borderRadius:14, padding:18, textDecoration:'none', display:'block' }}
            >
              <div style={{ fontSize:26, marginBottom:10 }}>{m.emoji}</div>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:4, color:'var(--text)', letterSpacing:'-0.01em' }}>{m.name}</div>
              <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.6, marginBottom:m.badge?10:0 }}>{m.desc}</div>
              {m.badge && <span style={{ fontSize:11, fontWeight:500, padding:'2px 8px', borderRadius:20, color:m.bc, background:m.bb }}>{m.badge}</span>}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
