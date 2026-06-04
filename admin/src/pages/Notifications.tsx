import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import styles from './Simple.module.css'

interface Notif {
  id: string
  title: string
  message: string
  link: string
  is_active: boolean
  created_at: string
}

const EMPTY = { title: '', message: '', link: '', is_active: true }

export default function Notifications() {
  const [rows, setRows] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false })
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

  function openEdit(r: Notif) {
    setEditingId(r.id)
    setForm({ title: r.title, message: r.message, link: r.link || '', is_active: r.is_active })
    setMsg('')
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    setMsg('')
    const payload = { ...form, updated_at: new Date().toISOString() }
    let err
    if (editingId) {
      const res = await supabase.from('notifications').update(payload).eq('id', editingId)
      err = res.error
    } else {
      const res = await supabase.from('notifications').insert(payload)
      err = res.error
    }
    if (err) { setMsg('Error: ' + err.message) } else { setShowModal(false); load() }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this notification?')) return
    await supabase.from('notifications').delete().eq('id', id)
    load()
  }

  async function toggleActive(r: Notif) {
    await supabase.from('notifications').update({ is_active: !r.is_active }).eq('id', r.id)
    load()
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Notifications</h1>
          <p className={styles.subtitle}>Push notifications shown in the extension</p>
        </div>
        <button className={styles.createBtn} onClick={openCreate}>+ New Notification</button>
      </div>

      {loading ? <p className={styles.loading}>Loading...</p> : (
        <div className={styles.cards}>
          {rows.map(r => (
            <div key={r.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <h3 className={styles.cardTitle}>{r.title}</h3>
                  <p className={styles.cardMsg}>{r.message}</p>
                  {r.link && <a href={r.link} target="_blank" rel="noreferrer" className={styles.cardLink}>{r.link}</a>}
                </div>
                <span className={`${styles.badge} ${r.is_active ? styles.badgeOn : styles.badgeOff}`}>
                  {r.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.date}>{new Date(r.created_at).toLocaleDateString()}</span>
                <div className={styles.actions}>
                  <button className={styles.btnSmall} onClick={() => toggleActive(r)}>{r.is_active ? 'Deactivate' : 'Activate'}</button>
                  <button className={styles.btnSmall} onClick={() => openEdit(r)}>Edit</button>
                  <button className={`${styles.btnSmall} ${styles.btnDanger}`} onClick={() => handleDelete(r.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
          {rows.length === 0 && <p className={styles.empty}>No notifications yet</p>}
        </div>
      )}

      {showModal && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editingId ? 'Edit Notification' : 'Create Notification'}</h2>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>x</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label>Title</label>
                <input className={styles.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label>Message</label>
                <textarea className={styles.textarea} rows={3} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label>Link (optional)</label>
                <input className={styles.input} value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="https://..." />
              </div>
              <label className={styles.checkRow}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <span>Active (visible to users)</span>
              </label>
              {msg && <p className={styles.errMsg}>{msg}</p>}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
