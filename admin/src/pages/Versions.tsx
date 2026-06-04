import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import styles from './Simple.module.css'

interface Version {
  id: string
  version: string
  changelog: string
  file_path: string
  is_alert_active: boolean
  created_at: string
}

const EMPTY = { version: '', changelog: '', file_path: '', is_alert_active: false }

export default function Versions() {
  const [rows, setRows] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('extension_versions').select('*').order('created_at', { ascending: false })
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

  function openEdit(r: Version) {
    setEditingId(r.id)
    setForm({ version: r.version, changelog: r.changelog, file_path: r.file_path, is_alert_active: r.is_alert_active })
    setMsg('')
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    setMsg('')
    let err
    if (editingId) {
      const res = await supabase.from('extension_versions').update({ ...form }).eq('id', editingId)
      err = res.error
    } else {
      const res = await supabase.from('extension_versions').insert({ ...form })
      err = res.error
    }
    if (err) { setMsg('Error: ' + err.message) } else { setShowModal(false); load() }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this version?')) return
    await supabase.from('extension_versions').delete().eq('id', id)
    load()
  }

  async function toggleAlert(r: Version) {
    await supabase.from('extension_versions').update({ is_alert_active: !r.is_alert_active }).eq('id', r.id)
    load()
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Extension Versions</h1>
          <p className={styles.subtitle}>Manage update alerts shown to users</p>
        </div>
        <button className={styles.createBtn} onClick={openCreate}>+ New Version</button>
      </div>

      {loading ? <p className={styles.loading}>Loading...</p> : (
        <div className={styles.cards}>
          {rows.map(r => (
            <div key={r.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <h3 className={styles.cardTitle}>v{r.version}</h3>
                  <p className={styles.cardMsg} style={{ whiteSpace: 'pre-line' }}>{r.changelog || 'No changelog'}</p>
                  {r.file_path && <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{r.file_path}</span>}
                </div>
                <span className={`${styles.badge} ${r.is_alert_active ? styles.badgeOn : styles.badgeOff}`}>
                  {r.is_alert_active ? 'Alert Active' : 'No Alert'}
                </span>
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.date}>{new Date(r.created_at).toLocaleDateString()}</span>
                <div className={styles.actions}>
                  <button className={styles.btnSmall} onClick={() => toggleAlert(r)}>
                    {r.is_alert_active ? 'Disable Alert' : 'Enable Alert'}
                  </button>
                  <button className={styles.btnSmall} onClick={() => openEdit(r)}>Edit</button>
                  <button className={`${styles.btnSmall} ${styles.btnDanger}`} onClick={() => handleDelete(r.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
          {rows.length === 0 && <p className={styles.empty}>No versions yet</p>}
        </div>
      )}

      {showModal && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editingId ? 'Edit Version' : 'New Version'}</h2>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>x</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label>Version</label>
                <input className={styles.input} value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} placeholder="e.g. 6.0.14" />
              </div>
              <div className={styles.field}>
                <label>Changelog</label>
                <textarea className={styles.textarea} rows={4} value={form.changelog} onChange={e => setForm(f => ({ ...f, changelog: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label>File Path (for download link)</label>
                <input className={styles.input} value={form.file_path} onChange={e => setForm(f => ({ ...f, file_path: e.target.value }))} placeholder="e.g. extension-v6.0.14.zip" />
              </div>
              <label className={styles.checkRow}>
                <input type="checkbox" checked={form.is_alert_active} onChange={e => setForm(f => ({ ...f, is_alert_active: e.target.checked }))} />
                <span>Show update alert to users</span>
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
