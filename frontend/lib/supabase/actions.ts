'use server'
import { createClient } from './server'

// ── Save ITR filing ────────────────────────────────────────────────────────────
export async function saveITRFiling(data: {
  itr_form: string
  assessment_year: string
  gross_income: number
  regime: string
  tax_amount: number
  tax_savings: number
  deductions: Record<string, number>
  ai_advice?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { error } = await supabase.from('filings').insert({
    user_id:         user.id,
    type:            data.itr_form,
    assessment_year: data.assessment_year,
    status:          'calculated',
    data: {
      gross_income: data.gross_income,
      regime:       data.regime,
      tax_amount:   data.tax_amount,
      deductions:   data.deductions,
    },
    ai_advice: data.ai_advice || '',
  })

  return error ? { error: error.message } : { success: true }
}

// ── Save CA session ────────────────────────────────────────────────────────────
export async function saveCASession(data: {
  gross_income: number
  regime: string
  tax_amount: number
  tax_savings: number
  itr_form: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { error } = await supabase.from('filings').insert({
    user_id:         user.id,
    type:            data.itr_form,
    assessment_year: 'AY 2025-26',
    status:          'calculated',
    data: {
      gross_income: data.gross_income,
      regime:       data.regime,
      tax_amount:   data.tax_amount,
      tax_savings:  data.tax_savings,
      source:       'ca-session',
    },
  })

  return error ? { error: error.message } : { success: true }
}

// ── Get dashboard stats ────────────────────────────────────────────────────────
export async function getDashboardStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: filings } = await supabase
    .from('filings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!filings || filings.length === 0) return null

  const taxSaved     = filings.reduce((s, f) => s + (f.data?.tax_savings || 0), 0)
  const lastFiling   = filings[0]
  const filingCount  = filings.length

  return {
    filingCount,
    taxSaved,
    lastFiling: {
      type:   lastFiling.type,
      date:   lastFiling.created_at,
      regime: lastFiling.data?.regime,
      tax:    lastFiling.data?.tax_amount,
    },
    recentFilings: filings.slice(0, 3).map(f => ({
      id:     f.id,
      type:   f.type,
      status: f.status,
      date:   f.created_at,
      tax:    f.data?.tax_amount,
    }))
  }
}
