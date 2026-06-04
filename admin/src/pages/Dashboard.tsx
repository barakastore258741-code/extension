import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import styles from './Dashboard.module.css'

interface Stats {
  total: number
  active: number
  expired: number
  suspended: number
  trial: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, expired: 0, suspended: 0, trial: 0 })
  const [recentLicenses, setRecentLicenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

  function statusColor(s: string) {
    if (s === 'active') return '#22c55e'
    if (s === 'expired') return '#ef4444'
    if (s === 'suspended') return '#f59e0b'
    if (s === 'trial') return '#8b5cf6'
    return 'var(--text-muted)'
  }

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>TechVai Extension overview</p>
      </div>

      {loading ? (
        <p className={styles.loading}>Loading stats...</p>
      ) : (
        <>
          <div className={styles.statsGrid}>
            {cards.map(c => (
              <div key={c.label} className={styles.statCard} data-color={c.color}>
                <span className={styles.statValue}>{c.value}</span>
                <span className={styles.statLabel}>{c.label}</span>
              </div>
            ))}
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Recent Licenses</h2>
            <div className={styles.table}>
              <div className={styles.tableHead}>
                <span>License Key</span>
                <span>User</span>
                <span>Plan</span>
                <span>Status</span>
                <span>Created</span>
              </div>
              {recentLicenses.map(l => (
                <div key={l.license_key} className={styles.tableRow}>
                  <span className={styles.mono}>{l.license_key.slice(0, 24)}...</span>
                  <span>{l.user_name || '-'}</span>
                  <span className={styles.plan}>{l.plan}</span>
                  <span style={{ color: statusColor(l.status), fontWeight: 600, fontSize: 12 }}>{l.status}</span>
                  <span className={styles.date}>{new Date(l.created_at).toLocaleDateString()}</span>
                </div>
              ))}
              {recentLicenses.length === 0 && (
                <div className={styles.empty}>No licenses yet</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
