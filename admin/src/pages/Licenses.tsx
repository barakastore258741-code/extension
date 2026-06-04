import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import styles from './Licenses.module.css'

interface License {
  id: string
  license_key: string
  user_name: string
  user_email: string
  status: string
  plan: string
  expires_at: string | null
  activated_at: string
  created_at: string
  notes: string
  max_devices: number
}

const EMPTY: Omit<License, 'id' | 'activated_at' | 'created_at'> = {
  license_key: '',
  user_name: '',
  user_email: '',
  status: 'active',
  plan: 'monthly',
  expires_at: '',
  notes: '',
  max_devices: 2,
}

function genKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let key = 'TV-'
  for (let i = 0; i < 20; i++) key += chars[Math.floor(Math.random() * chars.length)]
  return key
}

function planExpiry(plan: string): string {
  const now = new Date()
  if (plan === 'weekly') { now.setDate(now.getDate() + 7); return now.toISOString() }
  if (plan === 'monthly') { now.setDate(now.getDate() + 30); return now.toISOString() }
  return ''
}

export default function Licenses() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('licenses').select('*').order('created_at', { ascending: false })
    if (data) setLicenses(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditingId(null)
    setForm({ ...EMPTY, license_key: genKey() })
    setMsg('')
    setShowModal(true)
  }

  function openEdit(l: License) {
    setEditingId(l.id)
    setForm({
      license_key: l.license_key,
      user_name: l.user_name,
      user_email: l.user_email,
      status: l.status,
      plan: l.plan,
      expires_at: l.expires_at ? l.expires_at.slice(0, 16) : '',
      notes: l.notes,
      max_devices: l.max_devices,
    })
    setMsg('')
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    setMsg('')
    const payload: any = {
      license_key: form.license_key.trim(),
      user_name: form.user_name.trim(),
      user_email: form.user_email.trim(),
      status: form.status,
      plan: form.plan,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      notes: form.notes.trim(),
      max_devices: Number(form.max_devices),
      updated_at: new Date().toISOString(),
    }

    let err
    if (editingId) {
      const res = await supabase.from('licenses').update(payload).eq('id', editingId)
      err = res.error
    } else {
      const res = await supabase.from('licenses').insert({ ...payload, activated_at: new Date().toISOString() })
      err = res.error
    }

    if (err) {
      setMsg('Error: ' + err.message)
    } else {
      setShowModal(false)
      load()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this license? This cannot be undone.')) return
    await supabase.from('licenses').delete().eq('id', id)
    load()
  }

  async function quickStatus(id: string, status: string) {
    await supabase.from('licenses').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  function statusColor(s: string) {
    if (s === 'active') return '#22c55e'
    if (s === 'expired') return '#ef4444'
    if (s === 'suspended') return '#f59e0b'
    if (s === 'trial') return '#8b5cf6'
    return 'var(--text-muted)'
  }

  const filtered = licenses.filter(l => {
    const matchSearch = !search || l.license_key.includes(search) || l.user_name.toLowerCase().includes(search.toLowerCase()) || l.user_email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || l.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Licenses</h1>
          <p className={styles.subtitle}>{licenses.length} total licenses</p>
        </div>
        <button className={styles.createBtn} onClick={openCreate}>+ New License</button>
      </div>

      <div className={styles.filters}>
        <input
          className={styles.search}
          placeholder="Search by key, name, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className={styles.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {loading ? (
        <p className={styles.loading}>Loading...</p>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span>License Key</span>
            <span>User</span>
            <span>Plan</span>
            <span>Status</span>
            <span>Expires</span>
            <span>Actions</span>
          </div>
          {filtered.map(l => (
            <div key={l.id} className={styles.tableRow}>
              <span className={styles.mono}>{l.license_key}</span>
              <div>
                <div className={styles.userName}>{l.user_name || '-'}</div>
                <div className={styles.userEmail}>{l.user_email || '-'}</div>
              </div>
              <span className={styles.plan}>{l.plan}</span>
              <span style={{ color: statusColor(l.status), fontWeight: 700, fontSize: 11 }}>{l.status.toUpperCase()}</span>
              <span className={styles.date}>
                {l.expires_at ? new Date(l.expires_at).toLocaleDateString() : 'Lifetime'}
              </span>
              <div className={styles.actions}>
                <button className={styles.btnEdit} onClick={() => openEdit(l)}>Edit</button>
                {l.status !== 'suspended' && (
                  <button className={styles.btnSuspend} onClick={() => quickStatus(l.id, 'suspended')}>Suspend</button>
                )}
                {l.status === 'suspended' && (
                  <button className={styles.btnActivate} onClick={() => quickStatus(l.id, 'active')}>Activate</button>
                )}
                <button className={styles.btnDelete} onClick={() => handleDelete(l.id)}>Del</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className={styles.empty}>No licenses found</div>}
        </div>
      )}

      {showModal && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editingId ? 'Edit License' : 'Create License'}</h2>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>x</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label>License Key</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input className={styles.input} value={form.license_key} onChange={e => setForm(f => ({ ...f, license_key: e.target.value }))} />
                    {!editingId && <button className={styles.genBtn} onClick={() => setForm(f => ({ ...f, license_key: genKey() }))}>Gen</button>}
                  </div>
                </div>
                <div className={styles.field}>
                  <label>Plan</label>
                  <select className={styles.input} value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value, expires_at: planExpiry(e.target.value).slice(0, 16) }))}>
                    <option value="trial">Trial</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>User Name</label>
                  <input className={styles.input} value={form.user_name} onChange={e => setForm(f => ({ ...f, user_name: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label>User Email</label>
                  <input className={styles.input} type="email" value={form.user_email} onChange={e => setForm(f => ({ ...f, user_email: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label>Status</label>
                  <select className={styles.input} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="expired">Expired</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Expires At (blank = Lifetime)</label>
                  <input className={styles.input} type="datetime-local" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label>Max Devices</label>
                  <input className={styles.input} type="number" min={1} max={10} value={form.max_devices} onChange={e => setForm(f => ({ ...f, max_devices: Number(e.target.value) }))} />
                </div>
              </div>
              <div className={styles.field} style={{ marginTop: 12 }}>
                <label>Notes</label>
                <textarea className={styles.textarea} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>
              {msg && <p className={styles.errMsg}>{msg}</p>}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create License'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
