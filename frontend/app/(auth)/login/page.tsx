'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else router.push('/dashboard')
    setLoading(false)
  }

  async function handleSignup() {
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    })
    if (error) setError(error.message)
    else setSuccess('Account created! Check your email to confirm.')
    setLoading(false)
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/dashboard` }
    })
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(79,110,247,.12) 0%, transparent 70%)',
      padding: 16
    }}>
      <div style={{
        width: '100%', maxWidth: 420, background: 'var(--card)', border: '1px solid var(--border2)',
        borderRadius: 16, padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10, background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
          }}>🧾</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2 }}>TaxGenie</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Your AI Chartered Accountant</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {(['login', 'signup'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setSuccess('') }}
              style={{
                padding: '8px 20px', fontSize: 14, fontWeight: 500, background: 'none', border: 'none',
                borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
                color: tab === t ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer',
                transition: 'color 150ms ease, border-color 150ms ease',
              }}
            >
              {t === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        {/* Error / success banners */}
        {error && (
          <div
            role="alert"
            style={{ background: '#1a0505', border: '1px solid #3d1010', color: 'var(--red)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            role="status"
            style={{ background: '#052713', border: '1px solid #0a4020', color: 'var(--green)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}
          >
            {success}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tab === 'signup' && (
            <Field label="Full name" htmlFor="name">
              <input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Rahul Sharma"
                autoComplete="name"
              />
            </Field>
          )}
          <Field label="Email" htmlFor="email">
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Field>
          <Field label="Password" htmlFor="password">
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              onKeyDown={e => e.key === 'Enter' && (tab === 'login' ? handleLogin() : handleSignup())}
            />
          </Field>

          <button
            onClick={tab === 'login' ? handleLogin : handleSignup}
            disabled={loading}
            style={{
              background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8,
              padding: '11px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              opacity: loading ? 0.6 : 1,
              letterSpacing: '-0.01em',
            }}
          >
            {loading ? 'Please wait…' : tab === 'login' ? 'Sign in' : 'Create account'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--muted)', fontSize: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            or
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <button
            onClick={handleGoogle}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border2)', color: 'var(--text)',
              borderRadius: 8, padding: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
            }}
          >
            <GoogleIcon /> Continue with Google
          </button>
        </div>

        <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.6 }}>
          By continuing you agree to our Terms and Privacy Policy
        </p>
      </div>
    </div>
  )
}

/* ─── Field component — fixed: no more invalid & input key ─── */
function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        htmlFor={htmlFor}
        style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500, letterSpacing: '0.01em' }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}
