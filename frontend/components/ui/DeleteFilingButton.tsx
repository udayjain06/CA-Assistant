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
      <button
        onClick={() => setStatus('idle')}
        className="pressable"
        style={{ fontSize:11, padding:'3px 8px', borderRadius:6, border:'1px solid var(--border)', background:'none', color:'var(--muted)', cursor:'pointer' }}
      >
        Cancel
      </button>
      <button
        onClick={handleDelete}
        className="pressable"
        style={{ fontSize:11, padding:'3px 8px', borderRadius:6, border:'none', background:'var(--red)', color:'#fff', cursor:'pointer' }}
      >
        Haan delete
      </button>
    </div>
  )

  return (
    <button
      onClick={() => setStatus('confirm')}
      disabled={status==='deleting'}
      className="pressable"
      aria-label="Delete filing"
      style={{
        fontSize:12, padding:'3px 10px', borderRadius:6, border:'1px solid #3d1010',
        background:'#1a0505', color:'var(--red)', cursor:'pointer',
      }}
    >
      {status==='deleting' ? '…' : '🗑️'}
    </button>
  )
}
