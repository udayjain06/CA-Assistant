import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats } from '@/lib/supabase/actions'

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

const ALL_DEADLINES = [
  { icon:'📋', name:'ITR-1 filing (AY 2025–26)', due:'31 July 2026', badge:'Urgent', badgeColor:'#EF4444', badgeBg:'#1a0505' },
  { icon:'🧾', name:'GSTR-3B (June 2026)',        due:'20 July 2026', badge:'Soon',   badgeColor:'#F59E0B', badgeBg:'#1f1500' },
  { icon:'📊', name:'TDS return Q1 (26Q)',         due:'31 July 2026', badge:'Soon',   badgeColor:'#F59E0B', badgeBg:'#1f1500' },
  { icon:'🏢', name:'MCA Annual return (MGT-7)',  due:'29 Nov 2026',  badge:'Later',  badgeColor:'#4F6EF7', badgeBg:'#0d1433' },
]

const MODULES = [
  { href:'/ca-session',    emoji:'🧑‍💼', name:'Meet Your CA',         desc:'Baat karo AI CA se — sab kuch woh handle karega',           badge:'Start here ✨', bc:'#4F6EF7', bb:'#0d1433' },
  { href:'/itr',           emoji:'📋', name:'ITR Filing',            desc:'Old vs new regime, AI advice, ITR form suggest',           badge:'31 July!',      bc:'#EF4444', bb:'#1a0505' },
  { href:'/gst',           emoji:'🧾', name:'GST Returns',           desc:'GSTR-1, 3B deadlines aur AI Q&A',                         badge:'20 July due',   bc:'#F59E0B', bb:'#1f1500' },
  { href:'/capital-gains', emoji:'📈', name:'Capital Gains',         desc:'Stocks, MF, property — STCG/LTCG auto calculate',         badge:'',              bc:'',         bb:'' },
  { href:'/crypto',        emoji:'₿',  name:'Crypto Tax',            desc:'30% flat tax + 1% TDS har transaction pe',                badge:'',              bc:'',         bb:'' },
  { href:'/invoice',       emoji:'🧾', name:'Invoice Generator',     desc:'GST-compliant invoice banao, print/PDF ready',            badge:'Free',          bc:'#22C55E',  bb:'#052713' },
  { href:'/statements',    emoji:'📉', name:'Financial Statements',  desc:'Transactions se P&L, balance sheet auto',                 badge:'',              bc:'',         bb:'' },
  { href:'/payroll',       emoji:'💰', name:'Payroll & Form 16',     desc:'Employees add karo, salary slips calculate karo',         badge:'',              bc:'',         bb:'' },
  { href:'/tds',           emoji:'📊', name:'TDS Returns',           desc:'Calculator, rate chart, deadlines ek jagah',              badge:'',              bc:'',         bb:'' },
  { href:'/docs',          emoji:'📂', name:'Document Vault',        desc:'Salary slip, Form 16 — AI extract kar lega',              badge:'',              bc:'',         bb:'' },
  { href:'/notices',       emoji:'📬', name:'IT Notice Handler',     desc:'Income tax notice simple Hindi mein samjho',              badge:'',              bc:'',         bb:'' },
  { href:'/audit',         emoji:'🔍', name:'Audit & Advisory',      desc:'Compliance checker + AI advisor',                         badge:'',              bc:'',         bb:'' },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const name  = user?.user_metadata?.full_name?.split(' ')[0] || 'there'
  const stats = await getDashboardStats()

  const C = { card: { background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:20 } as React.CSSProperties }

  return (
    <div style={{ padding:28, display:'flex', flexDirection:'column', gap:24 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:600 }}>Namaste, {name}! 👋</h1>
          <p style={{ fontSize:14, color:'var(--muted)', marginTop:4 }}>Aapka AI CA — kisi bhi tax kaam ke liye ready hai</p>
        </div>
        <Link href="/ca-session" style={{ background:'var(--accent)', color:'#fff', padding:'10px 20px', borderRadius:8, textDecoration:'none', fontSize:14, fontWeight:500 }}>
          🧑‍💼 Meet Your CA
        </Link>
      </div>

      {/* Deadline banner */}
      <div style={{ background:'linear-gradient(135deg,rgba(79,110,247,.15),rgba(79,110,247,.05))', border:'1px solid rgba(79,110,247,.3)', borderRadius:12, padding:'16px 20px', display:'flex', alignItems:'center', gap:16 }}>
        <span style={{ fontSize:28 }}>⚠️</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:600 }}>ITR filing deadline: 31 July 2026</div>
          <div style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>Late filing pe ₹5,000 penalty — abhi file karo</div>
        </div>
        <Link href="/itr" style={{ background:'var(--accent)', color:'#fff', padding:'9px 18px', borderRadius:8, textDecoration:'none', fontSize:14, fontWeight:500 }}>File now →</Link>
      </div>

      {/* REAL STATS — only if user has data */}
      {stats ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
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
      ) : (
        /* First time user — show CTA */
        <div style={{ background:'linear-gradient(135deg,rgba(124,58,237,.15),rgba(79,110,247,.1))', border:'1px solid rgba(124,58,237,.3)', borderRadius:12, padding:24, display:'flex', alignItems:'center', gap:20 }}>
          <div style={{ fontSize:48 }}>🧑‍💼</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:600, marginBottom:4 }}>Pehli baar? Meet Your CA se shuru karo</div>
            <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6 }}>
              Bas sawaalon ka jawab do — AI CA khud decide karega kya karna hai. ITR, tax saving sab handle ho jayega.
            </div>
          </div>
          <Link href="/ca-session" style={{ background:'linear-gradient(135deg,#7C3AED,#4F6EF7)', color:'#fff', padding:'12px 24px', borderRadius:8, textDecoration:'none', fontSize:14, fontWeight:600, whiteSpace:'nowrap' }}>
            Shuru karo ✨
          </Link>
        </div>
      )}

      {/* Recent filings — only if data exists */}
      {stats && stats.recentFilings.length > 0 && (
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
            <div key={d.name} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:'var(--surface)', borderRadius:8, border:'1px solid var(--border)' }}>
              <span style={{ fontSize:20 }}>{d.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500 }}>{d.name}</div>
                <div style={{ fontSize:12, color:'var(--muted)' }}>Due {d.due}</div>
              </div>
              <span style={{ fontSize:12, fontWeight:500, padding:'3px 10px', borderRadius:20, color:d.badgeColor, background:d.badgeBg }}>{d.badge}</span>
            </div>
          ))}
        </div>
      </div>

      {/* All modules */}
      <div style={C.card}>
        <div style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>🛠️ All modules</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {MODULES.map(m => (
            <Link key={m.href} href={m.href} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:18, textDecoration:'none', display:'block' }}>
              <div style={{ fontSize:26, marginBottom:10 }}>{m.emoji}</div>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:4, color:'var(--text)' }}>{m.name}</div>
              <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.5, marginBottom:m.badge?10:0 }}>{m.desc}</div>
              {m.badge && <span style={{ fontSize:11, fontWeight:500, padding:'2px 8px', borderRadius:20, color:m.bc, background:m.bb }}>{m.badge}</span>}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
