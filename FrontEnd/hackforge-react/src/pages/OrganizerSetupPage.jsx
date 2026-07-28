import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import * as organizationApi from '../services/organizationApi.js';
import * as hackathonApi from '../services/hackathonApi.js';

function toSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

function errorMessage(error) {
  return typeof error?.detail === 'string'
    ? error.detail
    : 'We could not complete organizer setup. Please try again.';
}

const fieldStyle = {
  width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1px solid rgba(19,2,37,0.14)',
  borderRadius: 10, background: '#fff', color: 'var(--color-on-surface)', fontSize: 15, fontFamily: 'var(--font-inter)',
};

export default function OrganizerSetupPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!name && user?.org_name) {
      setName(user.org_name);
    }
  }, [name, user?.org_name]);

  useEffect(() => {
    if (!slugEdited) {
      setSlug(toSlug(name));
    }
  }, [name, slugEdited]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedName = name.trim();
    const normalizedSlug = toSlug(slug);

    if (!normalizedName || !normalizedSlug) {
      setError('Organization name and slug are required.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const organization = await organizationApi.createOrganization({
        name: normalizedName,
        slug: normalizedSlug,
        description: description.trim() || null,
        website_url: websiteUrl.trim() || null,
        logo_url: logoUrl.trim() || null,
      });
      const hackathon = await hackathonApi.createHackathon(organization.id, {
        title: `${normalizedName} Hackathon`,
        slug: `${normalizedSlug}-hackathon`,
      });
      navigate(`/organizer/hackathons/${hackathon.id}/studio`, { replace: true });
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#fbf8ff' }}>
      <section style={{ width: '100%', maxWidth: 620, padding: 32, borderRadius: 20, background: '#fff', boxShadow: '0 20px 50px -12px rgba(43,25,61,0.14)' }}>
        <p style={{ margin: 0, color: 'var(--color-secondary)', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em' }}>ORGANIZER SETUP</p>
        <h1 style={{ margin: '10px 0 8px', color: 'var(--color-primary)', fontSize: 30 }}>Set up your organization</h1>
        <p style={{ margin: '0 0 28px', color: 'var(--color-on-surface-variant)' }}>Your organization is the home for the hackathons you create.</p>

        {error && <div role="alert" style={{ marginBottom: 20, padding: '12px 14px', borderRadius: 10, background: 'var(--color-error-container)', color: 'var(--color-on-error-container)' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
          <label>
            <span style={{ display: 'block', marginBottom: 7, fontSize: 13, fontWeight: 600 }}>Organization name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Forge Lab" style={fieldStyle} required />
          </label>

          <label>
            <span style={{ display: 'block', marginBottom: 7, fontSize: 13, fontWeight: 600 }}>Slug</span>
            <input value={slug} onChange={(event) => { setSlugEdited(true); setSlug(event.target.value); }} placeholder="forge-lab" style={fieldStyle} required />
            <small style={{ display: 'block', marginTop: 6, color: 'var(--color-on-surface-variant)' }}>Used in organization URLs. It must be unique.</small>
          </label>

          <label>
            <span style={{ display: 'block', marginBottom: 7, fontSize: 13, fontWeight: 600 }}>Description <em style={{ fontWeight: 400 }}>(optional)</em></span>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Tell participants about your organization." rows={4} style={{ ...fieldStyle, resize: 'vertical' }} />
          </label>

          <label>
            <span style={{ display: 'block', marginBottom: 7, fontSize: 13, fontWeight: 600 }}>Website URL <em style={{ fontWeight: 400 }}>(optional)</em></span>
            <input type="url" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} placeholder="https://example.org" style={fieldStyle} />
          </label>

          <label>
            <span style={{ display: 'block', marginBottom: 7, fontSize: 13, fontWeight: 600 }}>Logo URL <em style={{ fontWeight: 400 }}>(optional)</em></span>
            <input type="url" value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} placeholder="https://example.org/logo.png" style={fieldStyle} />
          </label>

          <button type="submit" disabled={isSubmitting} style={{ marginTop: 6, padding: '13px 18px', border: 'none', borderRadius: 10, background: 'var(--color-primary-container)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? 'Creating organization…' : 'Create organization'}
          </button>
        </form>
      </section>
    </main>
  );
}
