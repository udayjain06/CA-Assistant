'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const nav = [
  { section: 'Overview', items: [
    { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { href: '/advisor',   icon: '🤖', label: 'AI Advisor', badge: 'New' },
  ]},
  { section: 'Tax Filing', items: [
    { href: '/itr',           icon: '📋', label: 'ITR Filing' },
    { href: '/gst',           icon: '🧾', label: 'GST Returns' },
    { href: '/tds',           icon: '📊', label: 'TDS Returns' },
    { href: '/capital-gains', icon: '📈', label: 'Capital Gains' },
    { href: '/crypto',        icon: '₿',  label: 'Crypto Tax' },
  ]},
  { section: 'Business', items: [
    { href: '/invoice',     icon: '🧾', label: 'Invoice Generator' },
    { href: '/statements',  icon: '📉', label: 'Financial Statements' },
    { href: '/payroll',     icon: '💰', label: 'Payroll & Form 16' },
    { href: '/docs',        icon: '📂', label: 'Document Vault' },
  ]},
  { section: 'Compliance', items: [
    { href: '/audit',   icon: '🔍', label: 'Audit & Advisory' },
    { href: '/notices', icon: '📬', label: 'IT Notice Handler' },
  ]},
]

type Props = { userName: string; userEmail: string }

export default function Sidebar({ userName, userEmail }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside style={{
      width: 220, background: 'var(--surface)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 10, overflowY: 'auto'
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🧾</div>
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>TaxGenie</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {nav.map(({ section, items }) => (
          <div key={section}>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '10px 8px 4px' }}>
              {section}
            </div>
            {items.map(({ href, icon, label, badge }) => {
              const active = pathname === href
              return (
                <Link key={href} href={href} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                  borderRadius: 7, textDecoration: 'none', fontSize: 13, fontWeight: active ? 500 : 400,
                  color: active ? 'var(--accent)' : 'var(--muted)',
                  background: active ? 'rgba(79,110,247,.15)' : 'transparent',
                }}>
                  <span style={{ fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
                  <span style={{ flex: 1 }}>{label}</span>
                  {badge && <span style={{ fontSize: 10, background: 'var(--accent)', color: '#fff', padding: '1px 6px', borderRadius: 10 }}>{badge}</span>}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '10px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <button onClick={logout} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8,
          cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left' as const
        }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{userName}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>
          </div>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>→</span>
        </button>
      </div>
    </aside>
  )
}
