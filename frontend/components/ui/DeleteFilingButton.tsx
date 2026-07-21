'use client'
import { useState } from 'react'
import { deleteFilingAction } from '@/lib/supabase/actions'
import { useRouter } from 'next/navigation'

export default function DeleteFilingButton({ filingId }: { filingId: string }) {
  const [status, setStatus] = useState<'idle'|'confirm'|'deleting'>('idle')
  const router = useRouter()

  async function handleDelete() {
    setStatus('deleting')
    const res = await deleteFilingAction(filingId)
    if (!res.error) router.refresh()
    else setStatus('idle')
  }

  if (status === 'confirm') return (
    <div style={{ display:'flex', gap:6 }}>
      <button onClick={() => setStatus('idle')} style={{ fontSize:11, padding:'3px 8px', borderRadius:6, border:'1px solid var(--border)', background:'none', color:'var(--muted)', cursor:'pointer' }}>
        Cancel
      </button>
      <button onClick={handleDelete} style={{ fontSize:11, padding:'3px 8px', borderRadius:6, border:'none', background:'#EF4444', color:'#fff', cursor:'pointer' }}>
        Haan delete
      </button>
    </div>
  )

  return (
    <button onClick={() => setStatus('confirm')} disabled={status==='deleting'} style={{
      fontSize:12, padding:'3px 10px', borderRadius:6, border:'1px solid #3d1010',
      background:'#1a0505', color:'#EF4444', cursor:'pointer'
    }}>
      {status==='deleting' ? '...' : '🗑️'}
    </button>
  )
}
