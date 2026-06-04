import React from 'https://esm.sh/react@18.3.1'
import ReactDOM from 'https://esm.sh/react-dom@18.3.1/client'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'https://esm.sh/react-router-dom@6.28.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const SUPABASE_URL = 'https://0ec90b57d6e95fcbda19832f.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function Login() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError(err.message)
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '36px 32px', animation: 'fadeIn 0.3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent), #1e40af)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px', boxShadow: '0 4px 16px var(--accent-glow)' }}>TV</div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1.2' }}>TechVai Admin</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Extension Control Panel</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label>
            <input
              type="email"
              style={{ padding: '11px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
              placeholder="admin@techvai.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
            <input
              type="password"
              style={{ padding: '11px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p style={{ fontSize: '12px', color: 'var(--danger)', padding: '10px 12px', background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-xs)' }}>{error}</p>}
          }
          <button type="submit" style={{ padding: '12px', border: 'none', borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, var(--accent), #1e40af)', color: '#fff', fontSize: '14px', fontWeight: '700', fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 2px 12px var(--accent-glow)', marginTop: '4px' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '24px' }}>TechVai © {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}

function Dashboard() {
  const [stats, setStats] = React.useState({ total: 0, active: 0, expired: 0, suspended: 0, trial: 0 })
  const [recentLicenses, setRecentLicenses] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      const [{ data: all }, { data: recent }] = await Promise.all([
        supabase.from('licenses').select('status'),
        supabase.from('licenses').select('license_key,user_name,plan,status,created_at').order('created_at', { ascending: false }).limit(5),
      ])
      if (all) {
        setStats({
          total: all.length,
          active: all.filter(l => l.status === 'active').length,
          expired: all.filter(l => l.status === 'expired').length,
          suspended: all.filter(l => l.status === 'suspended').length,
          trial: all.filter(l => l.status === 'trial').length,
        })
      }
      if (recent) setRecentLicenses(recent)
      setLoading(false)
    }
    load()
  }, [])

  const cards = [
    { label: 'Total Licenses', value: stats.total, color: 'blue' },
    { label: 'Active', value: stats.active, color: 'green' },
    { label: 'Expired', value: stats.expired, color: 'red' },
    { label: 'Suspended', value: stats.suspended, color: 'orange' },
    { label: 'Trial', value: stats.trial, color: 'purple' },
  ]

  function statusColor(s) {
    if (s === 'active') return '#22c55e'
    if (s === 'expired') return '#ef4444'
    if (s === 'suspended') return '#f59e0b'
    if (s === 'trial') return '#8b5cf6'
    return 'var(--text-muted)'
  }

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>Dashboard</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>TechVai Extension overview</p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading stats...</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px', marginBottom: '32px' }}>
            {cards.map(c => (
              <div key={c.label} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: c.color === 'blue' ? '3px solid #2563eb' : c.color === 'green' ? '3px solid #22c55e' : c.color === 'red' ? '3px solid #ef4444' : c.color === 'orange' ? '3px solid #f59e0b' : '3px solid #8b5cf6' }}>
                <span style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1' }}>{c.value}</span>
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{c.label}</span>
              </div>
            ))}
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px' }}>Recent Licenses</h2>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr', padding: '12px 16px', gap: '12px', alignItems: 'center', fontSize: '12px', background: 'var(--bg-surface)', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid var(--border)' }}>
                <span>License Key</span>
                <span>User</span>
                <span>Plan</span>
                <span>Status</span>
                <span>Created</span>
              </div>
              {recentLicenses.map(l => (
                <div key={l.license_key} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr', padding: '12px 16px', gap: '12px', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-primary)' }}>{l.license_key.slice(0, 24)}...</span>
                  <span>{l.user_name || '-'}</span>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: 'var(--accent-subtle)', color: '#60a5fa', fontWeight: '600', display: 'inline-block' }}>{l.plan}</span>
                  <span style={{ color: statusColor(l.status), fontWeight: '600', fontSize: '12px' }}>{l.status}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{new Date(l.created_at).toLocaleDateString()}</span>
                </div>
              ))}
              {recentLicenses.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No licenses yet</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ProtectedRoute({ children }) {
  const [loading, setLoading] = React.useState(true)
  const [authed, setAuthed] = React.useState(false)

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setAuthed(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)', fontSize: 14 }}>Loading...</div>
  return authed ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        }
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
