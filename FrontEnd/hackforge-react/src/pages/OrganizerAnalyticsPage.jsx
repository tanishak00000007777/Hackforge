import { useEffect, useState } from 'react';
import { PageHeader } from '../components/DashboardLayout.jsx';
import { useOrganizer, HackathonPicker } from './organizer/OrganizerLayout.jsx';
import * as registrationApi from '../services/registrationApi.js';
import * as teamApi from '../services/teamApi.js';
import * as submissionApi from '../services/submissionApi.js';

const STATUS_ORDER = ['pending', 'approved', 'waitlisted', 'rejected'];
const STATUS_COLORS = {
  pending: 'var(--color-outline)',
  approved: '#15803d',
  waitlisted: '#b45309',
  rejected: 'var(--color-error)',
};

function Bar({ label, value, total, color }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 140, fontSize: 13, color: 'var(--color-on-surface-variant)', textTransform: 'capitalize' }}>{label}</div>
      <div style={{ flex: 1, background: 'var(--color-surface-container)', borderRadius: 'var(--radius-full)', height: 22, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 'var(--radius-full)', transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ width: 76, fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', textAlign: 'right' }}>
        {value} · {pct}%
      </div>
    </div>
  );
}

function Metric({ label, value, hint }) {
  return (
    <div className="dash-card">
      <p className="label-mono" style={{ marginBottom: 10 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)' }}>{value}</p>
      {hint && <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

export default function OrganizerAnalyticsPage() {
  const { selectedHackathon } = useOrganizer();
  const [registrations, setRegistrations] = useState([]);
  const [teams, setTeams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedHackathon) return;
    setLoading(true);
    Promise.all([
      registrationApi.getRegistrations(selectedHackathon.id).catch(() => []),
      teamApi.getHackathonTeams(selectedHackathon.id).catch(() => []),
      submissionApi.getHackathonSubmissions(selectedHackathon.id).catch(() => []),
    ])
      .then(([regs, tms, subs]) => { setRegistrations(regs); setTeams(tms); setSubmissions(subs); })
      .finally(() => setLoading(false));
  }, [selectedHackathon]);

  if (!selectedHackathon) {
    return (
      <>
        <PageHeader title="Analytics" />
        <div className="dash-card empty-state">Create a hackathon to see its analytics.</div>
      </>
    );
  }

  const byStatus = STATUS_ORDER.map(s => ({ status: s, count: registrations.filter(r => r.status === s).length }));
  const approved = registrations.filter(r => r.status === 'approved').length;
  const submitted = submissions.filter(s => s.status !== 'draft').length;
  const teamed = teams.reduce((n, t) => n + (t.members ? t.members.length : 1), 0);
  const avgTeamSize = teams.length ? (teamed / teams.length).toFixed(1) : '—';

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle={`Live numbers for ${selectedHackathon.title}.`}
        actions={<HackathonPicker />}
      />

      {loading ? (
        <div className="empty-state">
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: 28 }}>progress_activity</span>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 'var(--spacing-md)' }}>
            <Metric label="Registrations" value={registrations.length} hint={`${approved} approved`} />
            <Metric label="Teams" value={teams.length} hint={`avg ${avgTeamSize} members`} />
            <Metric label="Participants in teams" value={teamed} hint={approved ? `${Math.round((teamed / approved) * 100)}% of approved` : 'No approvals yet'} />
            <Metric label="Submitted projects" value={submitted} hint={`${submissions.length - submitted} still draft`} />
          </div>

          <section className="dash-card" style={{ marginBottom: 'var(--spacing-md)' }}>
            <h2 className="section-title">Registrations by status</h2>
            {registrations.length === 0 ? (
              <p className="empty-state">No registrations yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {byStatus.map(row => (
                  <Bar key={row.status} label={row.status} value={row.count} total={registrations.length} color={STATUS_COLORS[row.status]} />
                ))}
              </div>
            )}
          </section>

          <section className="dash-card">
            <h2 className="section-title">Funnel</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Bar label="Registered" value={registrations.length} total={registrations.length} color="var(--color-primary-container)" />
              <Bar label="Approved" value={approved} total={registrations.length} color="var(--color-secondary)" />
              <Bar label="In a team" value={teamed} total={registrations.length} color="var(--color-on-tertiary-container)" />
              <Bar label="Submitted" value={submitted} total={registrations.length} color="#15803d" />
            </div>
          </section>
        </>
      )}
    </>
  );
}
