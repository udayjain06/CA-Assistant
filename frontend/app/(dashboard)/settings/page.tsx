'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteAllUserData, deleteAccountAction } from '@/lib/supabase/actions'

export default function SettingsPage() {
  const [clearStatus, setClearStatus]   = useState<'idle'|'loading'|'done'|'error'>('idle')
  const [deleteStatus, setDeleteStatus] = useState<'idle'|'confirm'|'loading'|'done'|'error'>('idle')
  const router = useRouter()

  async function handleClearData() {
    setClearStatus('loading')
    const res = await deleteAllUserData()
    setClearStatus(res.error ? 'error' : 'done')
    if (!res.error) router.refresh()
  }

  async function handleDeleteAccount() {
    setDeleteStatus('loading')
    const res = await deleteAccountAction()
    if (res.error) { setDeleteStatus('error'); return }
    router.push('/login')
  }

  const S = {
    card:    { background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:24, marginBottom:16 } as React.CSSProperties,
    btn:     { background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, padding:'10px 20px', fontSize:14, fontWeight:500 as const, cursor:'pointer' } as React.CSSProperties,
    danger:  { background:'#1a0505', color:'#EF4444', border:'1px solid #3d1010', borderRadius:8, padding:'10px 20px', fontSize:14, fontWeight:500 as const, cursor:'pointer' } as React.CSSProperties,
    ghost:   { background:'transparent', color:'var(--muted)', border:'1px solid var(--border2)', borderRadius:8, padding:'10px 20px', fontSize:14, cursor:'pointer' } as React.CSSProperties,
  }

  return (
    <div style={{ padding:28, maxWidth:600 }}>
      <h1 style={{ fontSize:22, fontWeight:600, marginBottom:24 }}>Settings</h1>

      {/* Clear data */}
      <div style={S.card}>
        <div style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>🗑️ Clear all filings</div>
        <div style={{ fontSize:13, color:'var(--muted)', marginBottom:16, lineHeight:1.6 }}>
          Saari filings, transactions aur documents delete ho jayengi. Account active rahega.
          Yeh undo nahi ho sakta.
        </div>
        {clearStatus === 'done' ? (
          <div style={{ fontSize:14, color:'#22C55E' }}>✅ Sab data clear ho gaya!</div>
        ) : (
          <button onClick={handleClearData} disabled={clearStatus==='loading'} style={{ ...S.danger, opacity:clearStatus==='loading'?0.6:1 }}>
            {clearStatus==='loading' ? 'Clearing...' : clearStatus==='error' ? '❌ Error — retry' : '🗑️ Clear all data'}
          </button>
        )}
      </div>

      {/* Delete account */}
      <div style={{ ...S.card, border:'1px solid #3d1010' }}>
        <div style={{ fontSize:15, fontWeight:600, color:'#EF4444', marginBottom:6 }}>⛔ Delete account</div>
        <div style={{ fontSize:13, color:'var(--muted)', marginBottom:16, lineHeight:1.6 }}>
          Poora account aur sab data permanently delete ho jayega. Yeh action reversible nahi hai.
        </div>

        {deleteStatus === 'idle' && (
          <button onClick={() => setDeleteStatus('confirm')} style={S.danger}>
            ⛔ Delete my account
          </button>
        )}

        {deleteStatus === 'confirm' && (
          <div style={{ background:'#1a0505', border:'1px solid #3d1010', borderRadius:10, padding:16 }}>
            <div style={{ fontSize:14, fontWeight:600, color:'#EF4444', marginBottom:8 }}>
              Pakka delete karna hai?
            </div>
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:16 }}>
              Yeh nahi ho sakta undo. Sab data chala jayega.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setDeleteStatus('idle')} style={S.ghost}>Cancel</button>
              <button onClick={handleDeleteAccount} style={{ ...S.danger, background:'#EF4444', color:'#fff', border:'none' }}>
                Haan, delete karo
              </button>
            </div>
          </div>
        )}

        {deleteStatus === 'loading' && (
          <div style={{ fontSize:14, color:'var(--muted)' }}>⏳ Deleting...</div>
        )}

        {deleteStatus === 'error' && (
          <div style={{ fontSize:14, color:'#EF4444' }}>❌ Error aaya — dobara try karo</div>
        )}
      </div>

      {/* Admin note */}
      <div style={{ fontSize:12, color:'var(--muted)', background:'var(--surface)', borderRadius:8, padding:12, lineHeight:1.6 }}>
        💡 Note: Complete account deletion ke liye Supabase dashboard se bhi delete kar sakte ho —<br/>
        Authentication → Users → apna user → Delete
      </div>
    </div>
  )
}
