import Link from 'next/link'

const stats = [
  { label: 'Tax saved this year', value: '₹42,800', sub: '↑ vs last year', color: '#22C55E' },
  { label: 'GST liability (Q1)', value: '₹1,24,500', sub: 'Due 20 July', color: '#F59E0B' },
  { label: 'Filings completed', value: '7', sub: 'of 12 this year', color: 'var(--text)' },
  { label: 'Documents uploaded', value: '34', sub: '3 pending review', color: 'var(--text)' },
]

const deadlines = [
  { icon: '📋', name: 'ITR-1 filing (AY 2025–26)', due: '31 July 2026', badge: 'Urgent', badgeColor: '#EF4444', badgeBg: '#1a0505' },
  { icon: '🧾', name: 'GSTR-3B (June 2026)', due: '20 July 2026', badge: 'Soon', badgeColor: '#F59E0B', badgeBg: '#1f1500' },
  { icon: '📊', name: 'TDS return Q1 (26Q)', due: '31 July 2026', badge: 'Soon', badgeColor: '#F59E0B', badgeBg: '#1f1500' },
  { icon: '🏢', name: 'MCA Annual return (MGT-7)', due: '29 Nov 2026', badge: 'Planned', badgeColor: '#4F6EF7', badgeBg: '#0d1433' },
]

const activity = [
  { text: 'GSTR-1 for May 2026 filed successfully', time: 'Today, 11:24 AM', color: '#4F6EF7' },
  { text: '₹42,800 tax saved via NPS deduction (80CCD)', time: 'Yesterday', color: '#22C55E' },
  { text: 'Bank statement (HDFC) uploaded and parsed', time: '25 Jun 2026', color: '#F59E0B' },
  { text: 'Form 16 from employer added', time: '20 Jun 2026', color: '#4F6EF7' },
]

const modules = [
  { href: '/itr', emoji: '📋', name: 'ITR Filing', desc: 'File ITR-1/2/3/4, compare tax regimes, get AI recommendations', badge: 'Action needed', badgeColor: '#EF4444', badgeBg: '#1a0505' },
  { href: '/gst', emoji: '🧾', name: 'GST Compliance', desc: 'Auto-generate GSTR-1, 3B, reconcile input tax credit', badge: 'Due soon', badgeColor: '#F59E0B', badgeBg: '#1f1500' },
  { href: '/statements', emoji: '📈', name: 'Financial Statements', desc: 'Upload transactions, get P&L, balance sheet, cash flow', badge: 'Up to date', badgeColor: '#22C55E', badgeBg: '#052713' },
  { href: '/payroll', emoji: '💰', name: 'Payroll & Form 16', desc: 'Generate salary slips, Form 16, EPF/ESI challans', badge: '3 employees', badgeColor: '#4F6EF7', badgeBg: '#0d1433' },
  { href: '/audit', emoji: '🔍', name: 'Audit & Advisory', desc: 'AI scans your books for red flags and compliance gaps', badge: 'No issues', badgeColor: '#22C55E', badgeBg: '#052713' },
  { href: '/advisor', emoji: '🤖', name: 'AI Advisor', desc: 'Ask anything about taxes, GST, compliance in Hindi/English', badge: 'New', badgeColor: '#4F6EF7', badgeBg: '#0d1433' },
]

export default function DashboardPage() {
  const C = { card: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 } }
  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.3px' }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/itr" style={{
            background: 'var(--accent)', color: '#fff', padding: '9px 18px',
            borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500
          }}>+ New filing</Link>
        </div>
      </div>

      {/* Deadline banner */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(79,110,247,.15),rgba(79,110,247,.05))',
        border: '1px solid rgba(79,110,247,.3)', borderRadius: 12, padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 16
      }}>
        <span style={{ fontSize: 28 }}>⚠️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>ITR filing deadline: 31 July 2026</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>File your income tax return before the due date to avoid a ₹5,000 penalty</div>
        </div>
        <Link href="/itr" style={{
          background: 'var(--accent)', color: '#fff', padding: '9px 18px',
          borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500
        }}>File now →</Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {stats.map(s => (
          <div key={s.label} style={C.card}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: s.color === 'var(--text)' ? 'var(--muted)' : s.color, marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Two col */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={C.card}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Upcoming deadlines</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {deadlines.map(d => (
              <div key={d.name} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)'
              }}>
                <span style={{ fontSize: 20 }}>{d.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Due {d.due}</div>
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 20,
                  color: d.badgeColor, background: d.badgeBg
                }}>{d.badge}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={C.card}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Recent activity</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {activity.map(a => (
              <div key={a.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13 }}>{a.text}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modules */}
      <div style={C.card}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>All modules</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {modules.map(m => (
            <Link key={m.href} href={m.href} style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
              padding: 20, textDecoration: 'none', display: 'block', transition: 'border-color .15s'
            }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{m.emoji}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>{m.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 12 }}>{m.desc}</div>
              <span style={{ fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 20, color: m.badgeColor, background: m.badgeBg }}>{m.badge}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
