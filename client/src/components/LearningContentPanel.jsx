import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { AdminBtn } from './AdminBtn.jsx';
import { Plus, Pencil, Send, Archive, Trash2, Check } from 'lucide-react';

const TYPE_LABELS = {
  document: 'Document',
  video: 'Video',
  link: 'Link',
  platform_url: 'Learning platform',
};

const STATUS_LABELS = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
};

const EMPTY_FORM = { title: '', description: '', type: 'link', url: '', personaKeys: [] };

export default function LearningContentPanel() {
  const [resources, setResources] = useState(null);
  const [personas, setPersonas] = useState(null);
  const [form, setForm] = useState(null); // null = form closed; otherwise { ...EMPTY_FORM, editingId? }
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // resource pending deletion
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function loadResources() {
    api.adminLearningResources().then((r) => setResources(r.resources)).catch((e) => setError(e.message));
  }

  useEffect(() => {
    loadResources();
    api.getPersonas().then((r) => setPersonas(r.personas)).catch((e) => setError(e.message));
  }, []);

  function openCreate() {
    setError('');
    setNotice('');
    setForm({ ...EMPTY_FORM });
  }

  function openEdit(resource) {
    setError('');
    setNotice('');
    setForm({
      editingId: resource.id,
      title: resource.title,
      description: resource.description || '',
      type: resource.type,
      url: resource.url,
      personaKeys: resource.personas,
    });
  }

  function togglePersona(key) {
    setForm((f) => ({
      ...f,
      personaKeys: f.personaKeys.includes(key) ? f.personaKeys.filter((k) => k !== key) : [...f.personaKeys, key],
    }));
  }

  async function submitForm() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        type: form.type,
        url: form.url,
        personaKeys: form.personaKeys,
      };
      if (form.editingId) {
        await api.adminUpdateLearningResource(form.editingId, payload);
        setNotice('Resource updated.');
      } else {
        await api.adminCreateLearningResource(payload);
        setNotice('Resource created as a draft — publish it when ready.');
      }
      setForm(null);
      loadResources();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(resource, status) {
    setError('');
    setNotice('');
    try {
      await api.adminSetLearningResourceStatus(resource.id, status);
      setNotice(
        status === 'published'
          ? `"${resource.title}" is now published and will appear in the relevant personas' learning records.`
          : `"${resource.title}" is now ${STATUS_LABELS[status].toLowerCase()}.`
      );
      loadResources();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.adminDeleteLearningResource(confirmDelete.id);
      setNotice(`Deleted "${confirmDelete.title}".`);
      setConfirmDelete(null);
      loadResources();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  }

  function nextStatusAction(status) {
    if (status === 'draft') return { label: 'Publish', to: 'published', icon: Send, variant: 'primary' };
    if (status === 'published') return { label: 'Archive', to: 'archived', icon: Archive, variant: 'secondary' };
    return { label: 'Publish', to: 'published', icon: Send, variant: 'primary' }; // archived -> republish
  }

  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <h3>📚 Learning content</h3>
        {!form && (
          <AdminBtn variant="primary" icon={Plus} onClick={openCreate}>New resource</AdminBtn>
        )}
      </div>
      <p className="admin-note">
        Resources you publish here appear automatically in the learning record of every user
        matched to an assigned persona — no deploy needed. This is separate from each persona's
        built-in learning journey, which stays as-is.
      </p>

      {error && <div className="admin-flash" style={{ background: 'rgba(220,50,50,.1)', color: '#a02020', border: '1px solid rgba(220,50,50,.3)' }}>{error}</div>}
      {notice && <div className="admin-flash ok">{notice}</div>}

      {form && (
        <div className="modal-backdrop" onClick={() => !saving && setForm(null)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>{form.editingId ? 'Edit resource' : 'New resource'}</h3>

            <div className="field">
              <label htmlFor="lr-title">Title *</label>
              <input id="lr-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} />
            </div>
            <div className="field">
              <label htmlFor="lr-desc">Description</label>
              <textarea
                id="lr-desc"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={{ width: '100%', fontFamily: 'inherit', fontSize: '1rem', padding: 10, borderRadius: 10, border: '1.5px solid var(--line)' }}
              />
            </div>
            <div className="field">
              <label htmlFor="lr-type">Type *</label>
              <select id="lr-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(TYPE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="lr-url">URL *</label>
              <input id="lr-url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" />
            </div>
            <div className="field">
              <label>Assign to personas *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                {personas &&
                  Object.entries(personas).map(([key, p]) => (
                    <label
                      key={key}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                        borderRadius: 999, border: '1.5px solid var(--line)',
                        background: form.personaKeys.includes(key) ? 'rgba(23,111,193,.08)' : '#fff',
                        cursor: 'pointer', fontSize: '.85rem',
                      }}
                    >
                      <input type="checkbox" checked={form.personaKeys.includes(key)} onChange={() => togglePersona(key)} />
                      {p.emoji} {p.name}
                    </label>
                  ))}
              </div>
            </div>

            <div className="modal-actions">
              <AdminBtn variant="secondary" disabled={saving} onClick={() => setForm(null)}>Cancel</AdminBtn>
              <AdminBtn variant="primary" icon={Check} disabled={saving} onClick={submitForm}>
                {saving ? 'Saving…' : form.editingId ? 'Save changes' : 'Create draft'}
              </AdminBtn>
            </div>
          </div>
        </div>
      )}

      {!resources ? (
        <p style={{ color: 'var(--ink-soft)' }}>Loading resources…</p>
      ) : resources.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)' }}>No learning resources yet — create one to get started.</p>
      ) : (
        <div className="utable-scroll">
          <table className="utable">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Personas</th>
                <th>Status</th>
                <th className="act">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => {
                const next = nextStatusAction(r.status);
                return (
                  <tr key={r.id}>
                    <td>
                      <b>{r.title}</b>
                      <span className="usub"><a href={r.url} target="_blank" rel="noopener noreferrer">{r.url}</a></span>
                    </td>
                    <td>{TYPE_LABELS[r.type]}</td>
                    <td>
                      {personas ? r.personas.map((k) => personas[k]?.emoji).join(' ') : r.personas.join(', ')}
                    </td>
                    <td>
                      <span className={r.status === 'published' ? 'utag' : undefined} style={r.status !== 'published' ? { color: 'var(--ink-soft)' } : undefined}>
                        {STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="act">
                      <div className="admin-actions">
                        <AdminBtn variant="secondary" icon={Pencil} onClick={() => openEdit(r)}>Edit</AdminBtn>
                        <AdminBtn variant={next.variant} icon={next.icon} onClick={() => handleStatusChange(r, next.to)}>{next.label}</AdminBtn>
                        <AdminBtn variant="danger" icon={Trash2} onClick={() => setConfirmDelete(r)}>Delete</AdminBtn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-backdrop" onClick={() => !deleting && setConfirmDelete(null)}>
          <div className="modal" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Delete this resource?</h3>
            <p>
              <strong>{confirmDelete.title}</strong> will be removed immediately, including from
              anyone's learning record it currently appears in. This cannot be undone.
            </p>
            <div className="modal-actions">
              <AdminBtn variant="secondary" disabled={deleting} onClick={() => setConfirmDelete(null)}>Cancel</AdminBtn>
              <AdminBtn variant="danger" icon={Trash2} disabled={deleting} onClick={handleDelete}>
                {deleting ? 'Deleting…' : 'Yes, delete it'}
              </AdminBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
