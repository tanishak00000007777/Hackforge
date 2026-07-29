import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../../components/DashboardLayout.jsx';
import { useOrganizer, HackathonPicker } from './OrganizerLayout.jsx';
import * as registrationApi from '../../services/registrationApi.js';

const STATUS_STYLES = {
  pending: { background: 'var(--color-surface-container-high)', color: 'var(--color-on-surface-variant)' },
  approved: { background: '#dcfce7', color: '#15803d' },
  rejected: { background: 'var(--color-error-container)', color: 'var(--color-on-error-container)' },
  waitlisted: { background: '#fef3c7', color: '#b45309' },
};

const FILTERS = ['all', 'pending', 'approved', 'waitlisted', 'rejected'];

export default function OrganizerRegistrations() {
  const { selectedHackathon } = useOrganizer();
  const [registrations, setRegistrations] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!selectedHackathon) return;
    setLoading(true);
    registrationApi.getRegistrations(selectedHackathon.id)
      .then(setRegistrations)
      .catch(err => setError(err.detail || 'Could not load registrations.'))
      .finally(() => setLoading(false));
  }, [selectedHackathon]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (reg, status) => {
    setBusyId(reg.id);
    setError('');
    try {
      await registrationApi.updateRegistrationStatus(reg.id, status);
      setRegistrations(prev => prev.map(r => (r.id === reg.id ? { ...r, status } : r)));
    } catch (err) {
      setError(err.detail || 'Could not update this registration.');
    } finally {
      setBusyId('');
    }
  };

  const visible = filter === 'all' ? registrations : registrations.filter(r => r.status === filter);
  const counts = registrations.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {});

  const exportCsv = () => {
    const rows = [['participant_id', 'status', 'registered_on']];
    visible.forEach(r => rows.push([r.user_id, r.status, new Date(r.created_at).toISOString()]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations-${selectedHackathon?.title || 'hackathon'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!selectedHackathon) {
    return (
      <>
        <PageHeader title="Registrations" />
        <div className="dash-card empty-state">Create a hackathon before managing registrations.</div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Registrations"
        subtitle={`Review who has signed up for ${selectedHackathon.title}.`}
        actions={
          <>
            <HackathonPicker />
            <button className="btn btn-ghost" onClick={exportCsv} disabled={!visible.length}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
              Export CSV
            </button>
          </>
        }
      />

      {error && <div className="alert-error" style={{ marginBottom: 'var(--spacing-sm)' }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '6px 14px', fontSize: 13, textTransform: 'capitalize' }}
          >
            {f}{f !== 'all' && counts[f] ? ` (${counts[f]})` : ''}
          </button>
        ))}
      </div>

      <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Registered</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="empty-state">
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: 24 }}>progress_activity</span>
                </td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan={4} className="empty-state">
                  {filter === 'all' ? 'No one has registered yet.' : `No ${filter} registrations.`}
                </td></tr>
              ) : visible.map(reg => (
                <tr key={reg.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-surface-container-high)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                        {(reg.user_id || '').slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{reg.user_id?.slice(0, 8)}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-on-surface-variant)' }}>{new Date(reg.created_at).toLocaleDateString()}</td>
                  <td><span className="pill" style={STATUS_STYLES[reg.status] || STATUS_STYLES.pending}>{reg.status}</span></td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {['approved', 'waitlisted', 'rejected'].filter(s => s !== reg.status).map(s => (
                      <button
                        key={s}
                        className="btn btn-ghost"
                        style={{ padding: '5px 10px', fontSize: 12, marginLeft: 6, textTransform: 'capitalize' }}
                        disabled={busyId === reg.id}
                        onClick={() => setStatus(reg, s)}
                      >
                        {s === 'approved' ? 'Approve' : s === 'rejected' ? 'Reject' : 'Waitlist'}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
