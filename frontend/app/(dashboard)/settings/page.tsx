'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteAllUserData, deleteAccountAction } from '@/lib/supabase/actions'
import IOSSheet from '@/components/ui/IOSSheet'

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
    <div className="page-container" style={{ maxWidth: 640 }}>
      <h1 style={{ marginBottom:24 }}>Settings</h1>

      {/* Clear data */}
      <div style={S.card}>
        <div style={{ fontSize:15, fontWeight:600, marginBottom:6, letterSpacing:'-0.01em' }}>🗑️ Clear all filings</div>
        <div style={{ fontSize:13, color:'var(--muted)', marginBottom:16, lineHeight:1.6 }}>
          Saari filings, transactions aur documents delete ho jayengi. Account active rahega.
          Yeh undo nahi ho sakta.
        </div>
        {clearStatus === 'done' ? (
          <div role="status" style={{ fontSize:14, color:'var(--green)', fontWeight:500 }}>✅ Sab data clear ho gaya!</div>
        ) : (
          <button className="pressable" onClick={handleClearData} disabled={clearStatus==='loading'} style={{ ...S.danger, opacity:clearStatus==='loading'?0.6:1 }}>
            {clearStatus==='loading' ? 'Clearing…' : clearStatus==='error' ? '❌ Error — retry' : '🗑️ Clear all data'}
          </button>
        )}
      </div>

      {/* Delete account */}
      <div style={{ ...S.card, border:'1px solid #3d1010' }}>
        <div style={{ fontSize:15, fontWeight:600, color:'var(--red)', marginBottom:6, letterSpacing:'-0.01em' }}>⛔ Delete account</div>
        <div style={{ fontSize:13, color:'var(--muted)', marginBottom:16, lineHeight:1.6 }}>
          Poora account aur sab data permanently delete ho jayega. Yeh action reversible nahi hai.
        </div>

        {deleteStatus === 'idle' && (
          <button className="pressable" onClick={() => setDeleteStatus('confirm')} style={S.danger}>
            ⛔ Delete my account
          </button>
        )}

        <IOSSheet isOpen={deleteStatus === 'confirm'} onClose={() => setDeleteStatus('idle')} title="⛔ Delete Account">
          <div style={{ background:'#1a0505', border:'1px solid #3d1010', borderRadius:12, padding:18 }}>
            <div style={{ fontSize:15, fontWeight:600, color:'var(--red)', marginBottom:8 }}>
              Pakka delete karna hai?
            </div>
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:20, lineHeight: 1.6 }}>
              Yeh action reversible nahi hai. Saari filings, documents, profile data sab delete ho jayega.
            </div>
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
              <button className="pressable" onClick={() => setDeleteStatus('idle')} style={S.ghost}>Cancel</button>
              <button className="pressable" onClick={handleDeleteAccount} style={{ ...S.danger, background:'var(--red)', color:'#fff', border:'none' }}>
                Haan, delete karo
              </button>
            </div>
          </div>
        </IOSSheet>

        {deleteStatus === 'loading' && (
          <div style={{ fontSize:14, color:'var(--muted)' }}>⏳ Deleting…</div>
        )}

        {deleteStatus === 'error' && (
          <div role="alert" style={{ fontSize:14, color:'var(--red)' }}>❌ Error aaya — dobara try karo</div>
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
