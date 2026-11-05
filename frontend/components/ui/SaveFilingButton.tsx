'use client'
import { useState } from 'react'
import { saveITRFiling } from '@/lib/supabase/actions'

type Props = {
  income: number
  regime: string
  taxAmount: number
  taxSavings: number
  itrForm: string
  deductions: Record<string, number>
  aiAdvice?: string
}

export default function SaveFilingButton({ income, regime, taxAmount, taxSavings, itrForm, deductions, aiAdvice }: Props) {
  const [status, setStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle')

  async function save() {
    setStatus('saving')
    const result = await saveITRFiling({
      itr_form:        itrForm,
      assessment_year: 'AY 2025-26',
      gross_income:    income,
      regime,
      tax_amount:      taxAmount,
      tax_savings:     taxSavings,
      deductions,
      ai_advice:       aiAdvice,
    })
    setStatus(result.error ? 'error' : 'saved')
  }

  if (status === 'saved') return (
    <div
      role="status"
      style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:8, background:'#052713', border:'1px solid #0a4020', fontSize:14, color:'var(--green)', fontWeight:500 }}
    >
      ✅ Filing saved! Dashboard pe dikh jayega
    </div>
  )

  return (
    <button
      onClick={save}
      disabled={status==='saving'}
      className="pressable"
      style={{
        background: status==='error' ? '#1a0505' : 'var(--accent)',
        color: status==='error' ? 'var(--red)' : '#fff',
        border:'none', borderRadius:8, padding:'10px 20px',
        fontSize:14, fontWeight:500, cursor:'pointer',
        opacity: status==='saving' ? 0.7 : 1,
      }}
    >
      {status==='saving' ? '💾 Saving…' : status==='error' ? '❌ Error — retry' : '💾 Save to dashboard'}
    </button>
  )
}
