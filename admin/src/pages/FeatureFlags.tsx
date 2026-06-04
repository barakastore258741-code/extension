import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import styles from './Simple.module.css'

interface Flag {
  id: string
  flag_key: string
  enabled: boolean
  description: string
  updated_at: string
}

const EMPTY = { flag_key: '', enabled: true, description: '' }

export default function FeatureFlags() {
  const [rows, setRows] = useState<Flag[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('feature_flags').select('*').order('flag_key')
    if (data) setRows(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggleFlag(r: Flag) {
    await supabase.from('feature_flags').update({ enabled: !r.enabled, updated_at: new Date().toISOString() }).eq('id', r.id)
    load()
  }

  function openCreate() {
    setEditingId(null)
    setForm({ ...EMPTY })
    setMsg('')
    setShowModal(true)
  }

  function openEdit(r: Flag) {
    setEditingId(r.id)
    setForm({ flag_key: r.flag_key, enabled: r.enabled, description: r.description })
    setMsg('')
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    setMsg('')
    const payload = { ...form, updated_at: new Date().toISOString() }
    let err
    if (editingId) {
      const res = await supabase.from('feature_flags').update(payload).eq('id', editingId)
      err = res.error
    } else {
      const res = await supabase.from('feature_flags').insert(payload)
      err = res.error
    }
    if (err) { setMsg('Error: ' + err.message) } else { setShowModal(false); load() }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this flag?')) return
    await supabase.from('feature_flags').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Feature Flags</h1>
          <p className={styles.subtitle}>Toggle features on/off for all extension users</p>
        </div>
        <button className={styles.createBtn} onClick={openCreate}>+ New Flag</button>
      </div>

      {loading ? <p className={styles.loading}>Loading...</p> : (
        <div className={styles.table}>
          <div className={styles.tableHead} style={{ gridTemplateColumns: '1.5fr 3fr 1fr 1fr' }}>
            <span>Flag Key</span>
            <span>Description</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {rows.map(r => (
            <div key={r.id} className={styles.tableRow} style={{ gridTemplateColumns: '1.5fr 3fr 1fr 1fr' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{r.flag_key}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{r.description || '-'}</span>
              <label className={styles.toggle} title={r.enabled ? 'Enabled - click to disable' : 'Disabled - click to enable'}>
                <input type="checkbox" checked={r.enabled} onChange={() => toggleFlag(r)} />
                <span className={styles.toggleSlider}></span>
              </label>
              <div className={styles.actions}>
                <button className={styles.btnSmall} onClick={() => openEdit(r)}>Edit</button>
                <button className={`${styles.btnSmall} ${styles.btnDanger}`} onClick={() => handleDelete(r.id)}>Del</button>
              </div>
            </div>
          ))}
          {rows.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No flags yet</div>}
        </div>
      )}

      {showModal && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editingId ? 'Edit Flag' : 'New Flag'}</h2>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>x</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label>Flag Key</label>
                <input className={styles.input} value={form.flag_key} onChange={e => setForm(f => ({ ...f, flag_key: e.target.value }))} placeholder="e.g. download_files" disabled={!!editingId} />
              </div>
              <div className={styles.field}>
                <label>Description</label>
                <input className={styles.input} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <label className={styles.checkRow}>
                <input type="checkbox" checked={form.enabled} onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))} />
                <span>Enabled</span>
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
