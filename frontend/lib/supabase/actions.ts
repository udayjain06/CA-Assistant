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
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Login karo pehle' }

    const { error } = await supabase.from('filings').insert({
      user_id:         user.id,
      type:            data.itr_form,
      assessment_year: data.assessment_year,
      status:          'calculated',
      data: {
        gross_income: data.gross_income,
        regime:       data.regime,
        tax_amount:   data.tax_amount,
        tax_savings:  data.tax_savings,
        deductions:   data.deductions,
      },
      ai_advice: data.ai_advice || '',
    })

    if (error) return { error: error.message }
    return { success: true }
  } catch (e) {
    return { error: 'Save failed. Dobara try karo.' }
  }
}

// ── Delete single filing ───────────────────────────────────────────────────────
export async function deleteFiling(filingId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not logged in' }

    const { error } = await supabase
      .from('filings')
      .delete()
      .eq('id', filingId)
      .eq('user_id', user.id)   // Safety: only delete own filings

    if (error) return { error: error.message }
    return { success: true }
  } catch {
    return { error: 'Delete failed' }
  }
}

// ── Delete all user data (account wipe) ───────────────────────────────────────
export async function deleteAllMyData() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not logged in' }

    // Delete all user data from all tables
    await supabase.from('filings').delete().eq('user_id', user.id)
    await supabase.from('transactions').delete().eq('user_id', user.id)
    await supabase.from('employees').delete().eq('user_id', user.id)
    await supabase.from('documents').delete().eq('user_id', user.id)
    await supabase.from('profiles').delete().eq('id', user.id)

    // Sign out
    await supabase.auth.signOut()

    return { success: true }
  } catch {
    return { error: 'Delete failed' }
  }
}

// ── Get dashboard stats ────────────────────────────────────────────────────────
export async function getDashboardStats() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: filings, error } = await supabase
      .from('filings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error || !filings || filings.length === 0) return null

    const taxSaved   = filings.reduce((s, f) => s + (f.data?.tax_savings || 0), 0)
    const lastFiling = filings[0]

    return {
      filingCount: filings.length,
      taxSaved,
      lastFiling: {
        type:   lastFiling.type,
        date:   lastFiling.created_at,
        regime: lastFiling.data?.regime,
        tax:    lastFiling.data?.tax_amount,
      },
      recentFilings: filings.slice(0, 5).map(f => ({
        id:     f.id,
        type:   f.type,
        status: f.status,
        date:   f.created_at,
        tax:    f.data?.tax_amount,
        savings: f.data?.tax_savings,
      }))
    }
  } catch {
    return null
  }
}
