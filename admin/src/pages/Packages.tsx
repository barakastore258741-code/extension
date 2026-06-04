import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import styles from './Simple.module.css'

interface Package {
  id: string
  name: string
  price: number
  duration_days: number | null
  is_active: boolean
  is_popular: boolean
  sort_order: number
  features: string[]
  created_at: string
}

const EMPTY = { name: '', price: 0, duration_days: 30 as number | null, is_active: true, is_popular: false, sort_order: 0, features: '' }

export default function Packages() {
  const [rows, setRows] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('packages').select('*').order('sort_order')
    if (data) setRows(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditingId(null)
    setForm({ ...EMPTY })
    setMsg('')
    setShowModal(true)
  }

  function openEdit(r: Package) {
    setEditingId(r.id)
    setForm({
      name: r.name,
      price: r.price,
      duration_days: r.duration_days,
      is_active: r.is_active,
      is_popular: r.is_popular,
      sort_order: r.sort_order,
      features: (r.features || []).join('\n'),
    })
    setMsg('')
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    setMsg('')
    const featuresArr = form.features.split('\n').map(s => s.trim()).filter(Boolean)
    const payload = {
      name: form.name,
      price: Number(form.price),
      duration_days: form.duration_days === null || form.duration_days === 0 ? null : Number(form.duration_days),
      is_active: form.is_active,
      is_popular: form.is_popular,
      sort_order: Number(form.sort_order),
      features: featuresArr,
    }
    let err
    if (editingId) {
      const res = await supabase.from('packages').update(payload).eq('id', editingId)
      err = res.error
    } else {
      const res = await supabase.from('packages').insert(payload)
      err = res.error
    }
    if (err) { setMsg('Error: ' + err.message) } else { setShowModal(false); load() }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this package?')) return
    await supabase.from('packages').delete().eq('id', id)
    load()
  }

  async function toggleActive(r: Package) {
    await supabase.from('packages').update({ is_active: !r.is_active }).eq('id', r.id)
    load()
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Packages</h1>
          <p className={styles.subtitle}>Subscription plans shown to users</p>
        </div>
        <button className={styles.createBtn} onClick={openCreate}>+ New Package</button>
      </div>

      {loading ? <p className={styles.loading}>Loading...</p> : (
        <div className={styles.cards}>
          {rows.map(r => (
            <div key={r.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h3 className={styles.cardTitle} style={{ margin: 0 }}>{r.name}</h3>
                    {r.is_popular && <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 99, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontWeight: 700 }}>POPULAR</span>}
                  </div>
                  <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
                    R$ {Number(r.price).toFixed(2)}
                    <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>
                      / {r.duration_days ? r.duration_days + ' days' : 'Lifetime'}
                    </span>
                  </p>
                  <ul style={{ fontSize: 11, color: 'var(--text-secondary)', paddingLeft: 16, marginTop: 4 }}>
                    {(r.features || []).map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
                <span className={`${styles.badge} ${r.is_active ? styles.badgeOn : styles.badgeOff}`}>
                  {r.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.date}>Order: {r.sort_order}</span>
                <div className={styles.actions}>
                  <button className={styles.btnSmall} onClick={() => toggleActive(r)}>{r.is_active ? 'Deactivate' : 'Activate'}</button>
                  <button className={styles.btnSmall} onClick={() => openEdit(r)}>Edit</button>
                  <button className={`${styles.btnSmall} ${styles.btnDanger}`} onClick={() => handleDelete(r.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
          {rows.length === 0 && <p className={styles.empty}>No packages yet</p>}
        </div>
      )}

      {showModal && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editingId ? 'Edit Package' : 'New Package'}</h2>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>x</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label>Name</label>
                <input className={styles.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label>Price (R$)</label>
                <input className={styles.input} type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
              </div>
              <div className={styles.field}>
                <label>Duration (days, 0 = Lifetime)</label>
                <input className={styles.input} type="number" min={0} value={form.duration_days ?? 0} onChange={e => setForm(f => ({ ...f, duration_days: Number(e.target.value) || null }))} />
              </div>
              <div className={styles.field}>
                <label>Sort Order</label>
                <input className={styles.input} type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} />
              </div>
              <div className={styles.field}>
                <label>Features (one per line)</label>
                <textarea className={styles.textarea} rows={4} value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} placeholder={'Full access\nPriority support\n...'} />
              </div>
              <label className={styles.checkRow}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <span>Active</span>
              </label>
              <label className={styles.checkRow}>
                <input type="checkbox" checked={form.is_popular} onChange={e => setForm(f => ({ ...f, is_popular: e.target.checked }))} />
                <span>Mark as Popular</span>
              </label>
              {msg && <p className={styles.errMsg}>{msg}</p>}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
