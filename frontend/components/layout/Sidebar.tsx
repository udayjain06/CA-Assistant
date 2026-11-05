'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const nav = [
  { section:'Overview', items:[
    { href:'/dashboard',   icon:'🏠', label:'Dashboard' },
    { href:'/ca-session',  icon:'🧑‍💼', label:'Meet Your CA', badge:'✨ New' },
    { href:'/advisor',     icon:'🤖', label:'AI Advisor' },
  ]},
  { section:'Tax Filing', items:[
    { href:'/itr',           icon:'📋', label:'ITR Filing' },
    { href:'/gst',           icon:'🧾', label:'GST Returns' },
    { href:'/tds',           icon:'📊', label:'TDS Returns' },
    { href:'/capital-gains', icon:'📈', label:'Capital Gains' },
    { href:'/crypto',        icon:'₿',  label:'Crypto Tax' },
  ]},
  { section:'Business', items:[
    { href:'/invoice',    icon:'🧾', label:'Invoice Generator' },
    { href:'/statements', icon:'📉', label:'Financial Statements' },
    { href:'/payroll',    icon:'💰', label:'Payroll & Form 16' },
    { href:'/docs',       icon:'📂', label:'Document Vault' },
  ]},
  { section:'Compliance', items:[
    { href:'/audit',   icon:'🔍', label:'Audit & Advisory' },
    { href:'/notices', icon:'📬', label:'IT Notice Handler' },
  ]},
  { section:'Account', items:[
    { href:'/settings', icon:'⚙️', label:'Settings' },
  ]},
]

type Props = { userName: string; userEmail: string }

/** Hamburger icon — three lines */
function MenuIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6"  x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

/** Close (×) icon */
function CloseIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function Sidebar({ userName, userEmail }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const initials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const [open, setOpen] = useState(false)

  // Principle 02 & 10: Direct manipulation & gesture drag tracking for mobile drawer
  const [dragOffset, setDragOffset] = useState<number | null>(null)
  const dragRef = useRef<{
    startX: number
    startY: number
    isDragging: boolean
    history: Array<{ x: number; time: number }>
  }>({ startX: 0, startY: 0, isDragging: false, history: [] })

  // Principle 09: Rubber-band progressive resistance
  const rubberband = (overshoot: number, dimension = 280, constant = 0.55) => {
    return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot))
  }

  // Principle 06: Momentum projection (Apple WWDC 2018 deceleration model)
  const project = (velocity: number, decelerationRate = 0.998) => {
    return (velocity / 1000) * decelerationRate / (1 - decelerationRate)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!open) return
    const touch = e.touches[0]
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      isDragging: false,
      history: [{ x: touch.clientX, time: performance.now() }],
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!open) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - dragRef.current.startX
    const deltaY = touch.clientY - dragRef.current.startY

    // If primarily vertical scroll, don't hijack horizontal drag
    if (!dragRef.current.isDragging) {
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) return
      if (Math.abs(deltaX) > 8) {
        dragRef.current.isDragging = true
      }
    }

    if (!dragRef.current.isDragging) return

    // Position & velocity history for handoff (Principle 05)
    const now = performance.now()
    dragRef.current.history.push({ x: touch.clientX, time: now })
    if (dragRef.current.history.length > 5) dragRef.current.history.shift()

    // Dragging left (towards closing): 1:1 direct tracking
    // Dragging right (past 0): soft rubber-band resistance
    let offset = deltaX
    if (offset > 0) {
      offset = rubberband(offset)
    }
    setDragOffset(offset)
  }

  const handleTouchEnd = () => {
    if (!dragRef.current.isDragging || dragOffset === null) {
      setDragOffset(null)
      dragRef.current.isDragging = false
      return
    }

    const history = dragRef.current.history
    let velocity = 0
    if (history.length >= 2) {
      const oldest = history[0]
      const newest = history[history.length - 1]
      const dt = (newest.time - oldest.time) || 1
      velocity = ((newest.x - oldest.x) / dt) * 1000 // px per sec
    }

    // Projected resting point
    const projected = dragOffset + project(velocity) * 0.15

    // Flick left or dragged past threshold -> close with spring settle
    if (velocity < -250 || dragOffset < -80 || projected < -100) {
      setDragOffset(-300)
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(8)
      setTimeout(() => {
        setOpen(false)
        setDragOffset(null)
      }, 200)
    } else {
      // Settle back to open position
      setDragOffset(0)
      setTimeout(() => setDragOffset(null), 200)
    }

    dragRef.current.isDragging = false
  }

  // Close sidebar on route change (mobile)
  useEffect(() => { setOpen(false); setDragOffset(null) }, [pathname])

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const closeOnMobile = useCallback(() => {
    setOpen(false)
    setDragOffset(null)
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const sidebarContent = (
    <aside
      style={{
        width: '100%',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'16px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <div style={{ width:30, height:30, borderRadius:8, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🧾</div>
        <span style={{ fontSize:16, fontWeight:700, letterSpacing:'-0.025em' }}>TaxGenie</span>
        {/* Mobile close button */}
        <button
          onClick={closeOnMobile}
          aria-label="Close navigation"
          className="pressable mobile-only-flex"
          style={{
            marginLeft:'auto', background:'var(--card)', border:'1px solid var(--border2)', color:'var(--muted)',
            padding:'6px 8px', borderRadius:8, display:'flex', alignItems:'center', cursor:'pointer',
          }}
        >
          <CloseIcon size={18} />
        </button>
      </div>

      {/* Nav links */}
      <nav style={{ flex:1, padding:'10px 8px', display:'flex', flexDirection:'column', gap:1 }} aria-label="Main navigation">
        {nav.map(({ section, items }) => (
          <div key={section}>
            <div
              style={{ fontSize:10, color:'var(--muted)', textTransform:'uppercase' as const, letterSpacing:'0.06em', padding:'10px 8px 4px' }}
              className="label-sm"
            >
              {section}
            </div>
            {items.map(({ href, icon, label, badge }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={closeOnMobile}
                  aria-current={active ? 'page' : undefined}
                  className="nav-item"
                  style={{
                    display:'flex', alignItems:'center', gap:8, padding:'7px 10px',
                    borderRadius:7, textDecoration:'none', fontSize:13,
                    fontWeight: active ? 500 : 400,
                    color: active ? 'var(--accent)' : 'var(--muted)',
                    background: href==='/ca-session'&&!active ? 'rgba(79,110,247,.06)' : active ? 'rgba(79,110,247,.15)' : 'transparent',
                    border: href==='/ca-session'&&!active ? '1px solid rgba(79,110,247,.2)' : '1px solid transparent',
                    marginBottom: href==='/ca-session' ? 4 : 0,
                  }}
                >
                  <span style={{ fontSize:15, width:18, textAlign:'center' as const, flexShrink:0 }}>{icon}</span>
                  <span style={{ flex:1 }}>{label}</span>
                  {badge && (
                    <span style={{ fontSize:10, background:'var(--accent)', color:'#fff', padding:'1px 6px', borderRadius:10, whiteSpace:'nowrap' as const }}>
                      {badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User / logout */}
      <div style={{ padding:'10px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
        <button
          onClick={logout}
          aria-label={`Sign out as ${userName}`}
          className="pressable"
          style={{
            display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8,
            cursor:'pointer', background:'none', border:'none', width:'100%', textAlign:'left' as const,
          }}
        >
          <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:'#fff', flexShrink:0 }}>
            {initials}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:500, color:'var(--text)' }}>{userName}</div>
            <div style={{ fontSize:10, color:'var(--muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{userEmail}</div>
          </div>
          <span style={{ color:'var(--muted)', fontSize:12 }} aria-hidden="true">→</span>
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Mobile top bar — shown only on small screens */}
      <header
        className="mobile-topbar glass-header"
      >
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          aria-expanded={open}
          aria-controls="sidebar-panel"
          className="pressable"
          style={{
            background:'var(--card)', border:'1px solid var(--border2)', borderRadius:8,
            color:'var(--text)', padding:'7px 10px', display:'flex', alignItems:'center', cursor:'pointer',
          }}
        >
          <MenuIcon size={20} />
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:26, height:26, borderRadius:6, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>🧾</div>
          <span style={{ fontSize:15, fontWeight:700, letterSpacing:'-0.02em' }}>TaxGenie</span>
        </div>
        <Link
          href="/ca-session"
          className="pressable"
          style={{
            background:'rgba(79,110,247,.15)', border:'1px solid rgba(79,110,247,.3)',
            color:'var(--accent)', padding:'5px 12px', borderRadius:20, fontSize:12, fontWeight:500,
            textDecoration:'none', display:'flex', alignItems:'center', gap:4
          }}
        >
          <span>🧑‍💼</span><span>Meet CA</span>
        </Link>
      </header>

      {/* Mobile backdrop with dynamic gesture opacity */}
      <div
        className={`sidebar-backdrop ${open ? 'visible' : ''}`}
        onClick={closeOnMobile}
        style={dragOffset !== null && open ? {
          opacity: dragOffset < 0 ? Math.max(0, 1 + dragOffset / 260) : 1,
          transition: 'none'
        } : undefined}
        aria-hidden="true"
      />

      {/* Sidebar panel — fixed translucent on desktop, gesture-draggable sheet on mobile */}
      <div
        id="sidebar-panel"
        className={`sidebar-wrapper ${open ? 'open' : ''}`}
        role="navigation"
        aria-label="Application navigation"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={dragOffset !== null ? {
          transform: `translateX(${dragOffset}px)`,
          transition: 'none'
        } : undefined}
      >
        {sidebarContent}
      </div>
    </>
  )
}
