import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Support guest mode — don't redirect if not logged in
  let name  = 'Guest'
  let email = ''
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      name  = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
      email = user.email || ''
    }
  } catch { /* guest */ }

  return (
    <div className="dashboard-container">
      <Sidebar userName={name} userEmail={email} />
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  )
}
