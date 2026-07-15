/**
 * Shared API client for HackForge frontend.
 *
 * - Prefixes every request with VITE_API_BASE_URL
 * - Attaches Authorization header when a token is available
 * - Normalises backend errors for UI consumption
 * - Clears auth state and redirects on 401
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

const readDevData = (key) => {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
};
const devForms = readDevData('hackforge_dev_forms');
const devResponses = readDevData('hackforge_dev_form_responses');
const devCertificates = readDevData('hackforge_dev_certificates');
const devCertificateTemplates = JSON.parse(localStorage.getItem('hackforge_dev_certificate_templates') || '{}');
const persistDevForms = () => {
  localStorage.setItem('hackforge_dev_forms', JSON.stringify(devForms));
  localStorage.setItem('hackforge_dev_form_responses', JSON.stringify(devResponses));
};

const persistDevCertificates = () => {
  localStorage.setItem('hackforge_dev_certificates', JSON.stringify(devCertificates));
  localStorage.setItem('hackforge_dev_certificate_templates', JSON.stringify(devCertificateTemplates));
};

const defaultCertificateTemplate = {
  preset: 'classic', primary_color: '#2B0A5A', secondary_color: '#C084FC',
  heading: 'Certificate of Achievement', body_text: 'This certificate is proudly presented to',
  signatory_name: 'Event Organizer', signatory_title: 'Hackathon Organizer', sponsor_names: [],
};

function devCertificatePdf(template, certificate = {}) {
  const clean = (value) => String(value || '').normalize('NFKD').replace(/[^\x20-\x7E]/g, '');
  const escape = (value) => clean(value).replace(/[\\()]/g, '\\$&');
  const color = (hex) => (hex.match(/[a-f\d]{2}/gi) || ['00', '00', '00'])
    .map((part) => (parseInt(part, 16) / 255).toFixed(3)).join(' ');
  const primary = color(template.primary_color);
  const secondary = color(template.secondary_color);
  const ink = color('#3F3A46');
  const white = '1 1 1';
  const centered = (value, font, size, y, fill = ink, maxWidth = 650) => {
    const text = escape(value);
    const fitted = Math.min(size, Math.max(9, maxWidth / Math.max(text.length * 0.55, 1)));
    const x = Math.max(45, (842 - text.length * fitted * 0.5) / 2);
    return `${fill} rg BT /${font} ${fitted.toFixed(1)} Tf 1 0 0 1 ${x.toFixed(1)} ${y} Tm (${text}) Tj ET`;
  };
  const wrapped = (value, limit) => clean(value).split(/\s+/).reduce((lines, word) => {
    const last = lines.at(-1);
    if (!last || `${last} ${word}`.length > limit) lines.push(word);
    else lines[lines.length - 1] = `${last} ${word}`;
    return lines;
  }, []);
  const preset = template.preset || 'classic';
  const recipient = certificate.recipient_name || 'Alex Morgan';
  const event = certificate.event_title || 'Global CyberShield AI 2024';
  const type = certificate.type || 'participant';
  const verification = certificate.verification_id || 'PREVIEW-VERIFICATION-ID';
  const issued = new Date(certificate.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const award = {
    participant: 'for successfully participating in', judge: 'in recognition of serving as a judge at',
    winner: 'for winning', runner_up: 'for earning runner-up honors at',
  }[type] || 'in recognition of achievement at';
  const commands = ['q'];
  if (preset === 'classic') {
    commands.push(`${primary} RG 4 w 22 22 798 551 re S`, `${secondary} RG 1 w 31 31 780 533 re S`);
  } else if (preset === 'modern') {
    commands.push(`${primary} rg 0 0 75 595 re f`, `${secondary} rg 75 579 767 16 re f`);
  } else {
    commands.push(`${primary} rg 0 465 842 130 re f`, `${secondary} rg 704 0 138 110 re f`);
  }
  commands.push(
    centered('HACKFORGE', 'F2', 11, 548, preset === 'bold' ? white : primary),
    centered(template.heading, preset === 'classic' ? 'F3' : 'F2', 30, 500, preset === 'bold' ? white : primary),
    ...wrapped(template.body_text, 82).slice(0, 4).map((line, index) => centered(line, 'F1', 12, 438 - index * 16)),
    centered(recipient, preset === 'classic' ? 'F4' : 'F2', 34, 370, primary),
    centered(award, 'F1', 12, 326),
    centered(event, 'F2', 21, 292, primary),
    `${secondary} RG 2 w 321 150 m 521 150 l S`,
    centered(template.signatory_name, 'F2', 11, 130),
    centered(template.signatory_title, 'F1', 9, 114),
  );
  if (template.sponsor_names?.length) {
    wrapped(`Supported by: ${template.sponsor_names.join(' / ')}`, 80).slice(0, 2)
      .forEach((line, index) => commands.push(centered(line, 'F1', 8, 86 - index * 11)));
  }
  commands.push(
    `${ink} rg BT /F1 7 Tf 1 0 0 1 45 48 Tm (Issued ${escape(issued)}) Tj ET`,
    `${ink} rg BT /F1 7 Tf 1 0 0 1 45 36 Tm (Verification ID: ${escape(verification)}) Tj ET`,
    `${secondary} RG 2 w 742 34 58 58 re S`,
    `${primary} rg BT /F2 12 Tf 1 0 0 1 759 60 Tm (HF) Tj ET`,
    `${ink} rg BT /F1 6 Tf 1 0 0 1 748 47 Tm (VERIFIED) Tj ET`,
    'Q',
  );
  const content = commands.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R /F4 7 0 R >> >> /Contents 8 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Times-BoldItalic >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((object, index) => {
    const offset = pdf.length;
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Blob([pdf], { type: 'application/pdf' });
}

function devCertificateRequest(path, options, method) {
  if (!path.startsWith('/certificates/')) return undefined;
  const body = options.body ? JSON.parse(options.body) : null;
  let match;
  if ((match = path.match(/^\/certificates\/hackathons\/([^/]+)\/template(?:\/preview)?$/))) {
    const hackathonId = match[1];
    if (path.endsWith('/preview')) return devCertificatePdf({ ...defaultCertificateTemplate, ...body });
    if (method === 'PUT') {
      devCertificateTemplates[hackathonId] = { ...body, id: crypto.randomUUID(), hackathon_id: hackathonId };
      persistDevCertificates();
    }
    return devCertificateTemplates[hackathonId] || { ...defaultCertificateTemplate, id: null, hackathon_id: hackathonId };
  }
  if ((match = path.match(/^\/certificates\/hackathons\/([^/]+)\/issue-bulk$/))) {
    const hackathonId = match[1];
    const recipients = body.type === 'judge' ? ['Dev Judge'] : body.type === 'participant' ? ['Dev Participant', 'Jamie Chen'] : ['Dev Participant', 'Jamie Chen'];
    let issued = 0;
    recipients.forEach((name, index) => {
      if (devCertificates.some((item) => item.hackathon_id === hackathonId && item.recipient_name === name && item.type === body.type)) return;
      devCertificates.push({ id: crypto.randomUUID(), hackathon_id: hackathonId, user_id: index ? 'another-participant-id' : '00000000-0000-0000-0000-000000000000', type: body.type, verification_id: crypto.randomUUID(), recipient_name: name, event_title: 'Global CyberShield AI 2024', created_at: new Date().toISOString() });
      issued += 1;
    });
    persistDevCertificates();
    return { issued, skipped: recipients.length - issued, total: recipients.length };
  }
  if ((match = path.match(/^\/certificates\/hackathons\/([^/]+)\/issued$/))) return devCertificates.filter((item) => item.hackathon_id === match[1]);
  if (path === '/certificates/me') return devCertificates.filter((item) => item.user_id === '00000000-0000-0000-0000-000000000000');
  if ((match = path.match(/^\/certificates\/verify\/(.+)$/))) {
    const item = devCertificates.find((certificate) => certificate.verification_id === match[1]);
    if (!item) {
      const error = new Error('Certificate not found or invalid');
      error.status = 404;
      error.detail = error.message;
      throw error;
    }
    return { verification_id: item.verification_id, recipient_name: item.recipient_name, event_title: item.event_title, type: item.type, issued_at: item.created_at, valid: true };
  }
  if ((match = path.match(/^\/certificates\/([^/]+)\/pdf$/))) {
    const certificate = devCertificates.find((item) => item.id === match[1]) || {};
    const template = devCertificateTemplates[certificate.hackathon_id] || defaultCertificateTemplate;
    return devCertificatePdf(template, certificate);
  }
  return undefined;
}

function devFormRequest(path, options, method) {
  if (!path.startsWith('/forms/')) return undefined;
  const body = options.body && !(options.body instanceof FormData) ? JSON.parse(options.body) : null;
  let match;
  if ((match = path.match(/^\/forms\/hackathons\/([^/]+)$/))) {
    if (method === 'POST') {
      const form = { id: crypto.randomUUID(), hackathon_id: match[1], title: body.title, description: body.description || '', slug: `${body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-5)}`, purpose: body.purpose, access: body.access, status: 'draft', questions: [], response_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      devForms.push(form); persistDevForms(); return form;
    }
    return devForms.filter((form) => form.hackathon_id === match[1]).map((form) => ({ ...form, response_count: devResponses.filter((r) => r.form_id === form.id).length }));
  }
  if ((match = path.match(/^\/forms\/manage\/([^/]+)(?:\/(questions|publish|close|responses))?$/))) {
    const form = devForms.find((item) => item.id === match[1]);
    if (!form) return null;
    if (match[2] === 'questions' && method === 'PUT') { form.questions = body.map((q, position) => ({ ...q, id: q.id || crypto.randomUUID(), position })); persistDevForms(); return { ...form }; }
    if (match[2] === 'publish' && method === 'POST') { form.status = 'published'; persistDevForms(); return { ...form }; }
    if (match[2] === 'close' && method === 'POST') { form.status = 'closed'; persistDevForms(); return { ...form }; }
    if (match[2] === 'responses') return devResponses.filter((r) => r.form_id === form.id);
    if (method === 'PATCH') { Object.assign(form, body); persistDevForms(); return { ...form }; }
    if (method === 'DELETE') { devForms.splice(devForms.indexOf(form), 1); persistDevForms(); return {}; }
    return { ...form };
  }
  if ((match = path.match(/^\/forms\/public\/([^/]+)(?:\/responses)?$/))) {
    const form = devForms.find((item) => item.slug === match[1]);
    if (!form) return null;
    if (method === 'POST') {
      const values = JSON.parse(options.body.get('answers'));
      const response = { id: crypto.randomUUID(), form_id: form.id, submitter_user_id: '00000000-0000-0000-0000-000000000000', total_score: null, feedback: null, graded_at: null, created_at: new Date().toISOString(), answers: form.questions.map((q) => ({ id: crypto.randomUUID(), question_id: q.id, value: values[q.id] ?? null, awarded_points: null, feedback: null, attachment: null })) };
      devResponses.push(response); persistDevForms(); return { id: response.id, submitted_at: response.created_at };
    }
    return { ...form };
  }
  if ((match = path.match(/^\/forms\/response-records\/([^/]+)(?:\/grade)?$/))) {
    const response = devResponses.find((item) => item.id === match[1]);
    if (!response) return null;
    if (method === 'PATCH') {
      body.answers.forEach((grade) => Object.assign(response.answers.find((a) => a.id === grade.answer_id), { awarded_points: grade.awarded_points, feedback: grade.feedback }));
      response.feedback = body.feedback; response.total_score = response.answers.reduce((sum, a) => sum + (a.awarded_points || 0), 0); response.graded_at = new Date().toISOString(); persistDevForms();
    }
    return { ...response };
  }
  return null;
}

/**
 * Core request helper.
 *
 * @param {string} path  – API path (e.g. "/auth/login")
 * @param {RequestInit & { skipAuth?: boolean }} options
 * @returns {Promise<any>}
 */
function handleDevMockRequest(path, options) {
  const method = options.method || 'GET';
  const formResult = devFormRequest(path, options, method);
  if (formResult !== undefined) return formResult;
  const certificateResult = devCertificateRequest(path, options, method);
  if (certificateResult !== undefined) return certificateResult;
  
  if (path.startsWith('/organizations/me')) {
    return [
      { id: 'dev-org-id', name: 'Dev Organization' }
    ];
  }
  if (path.startsWith('/hackathons/')) {
    return [
      {
        id: 'dev-hackathon-1',
        title: 'Global CyberShield AI 2024',
        slug: 'cybershield-2024',
        tagline: 'Build next-gen security protocols using decentralized AI agents',
        description: 'Welcome to the ultimate security challenge. Form teams, build agents, and evaluate protocols.',
        mode: 'online',
        status: 'published',
        max_participants: 500,
        max_team_size: 4,
        min_team_size: 1,
        registration_mode: 'open'
      },
      {
        id: 'dev-hackathon-2',
        title: 'Global Health Sprint 2024',
        slug: 'health-sprint',
        tagline: 'Accelerating medical research through collaborative data science tools',
        description: 'Collaborate with top health professionals and developers to build medical tooling.',
        mode: 'hybrid',
        status: 'published',
        max_participants: 200,
        max_team_size: 3,
        min_team_size: 1,
        registration_mode: 'approval'
      }
    ];
  }
  if (path.startsWith('/registrations/')) {
    if (method === 'POST') {
      return { id: 'reg-new', status: 'approved' };
    }
    return [
      {
        id: 'reg-1',
        user_id: '00000000-0000-0000-0000-000000000000',
        status: 'approved',
        form_data: { experience: 'Advanced' },
        created_at: '2026-07-10T12:00:00Z'
      },
      {
        id: 'reg-2',
        user_id: 'another-participant-id',
        status: 'approved',
        form_data: { experience: 'Intermediate' },
        created_at: '2026-07-10T12:00:00Z'
      }
    ];
  }
  if (path.startsWith('/teams/')) {
    if (path.endsWith('/all')) {
      return [{ id: 'dev-team-id', name: 'Dev Forge Team', leader_id: '00000000-0000-0000-0000-000000000000', members: [{ id: 'm1', user_id: '00000000-0000-0000-0000-000000000000' }, { id: 'm2', user_id: 'another-participant-id' }] }];
    }
    if (method === 'DELETE') {
      return { detail: 'Left team successfully' };
    }
    return {
      id: 'dev-team-id',
      name: 'Dev Forge Team',
      invite_code: 'DEVCODE1',
      leader_id: '00000000-0000-0000-0000-000000000000',
      members: [
        { id: 'm1', user_id: '00000000-0000-0000-0000-000000000000' },
        { id: 'm2', user_id: 'another-participant-id' }
      ]
    };
  }
  if (path.startsWith('/announcements/')) {
    return [
      {
        id: 'ann-1',
        title: 'Welcome to Dev HackForge!',
        content: 'Use this local environment to test all components without a live database connection.',
        created_at: '2026-07-10T12:00:00Z'
      }
    ];
  }
  if (path.startsWith('/submissions/')) {
    return [
      {
        id: 'sub-1',
        title: 'AI EcoTracker',
        description: 'Tracking carbon footprints and greenhouse gas emissions using local intelligence.',
        status: 'submitted',
        team_id: 'dev-team-id',
        github_url: 'https://github.com/example/ecotracker',
        video_url: 'https://youtube.com/watch?v=example',
        deck_url: 'https://example.com/slides.pdf',
        demo_url: 'https://ecotracker.example.com'
      }
    ];
  }
  if (path.startsWith('/judges/')) {
    if (method === 'POST') {
      return { detail: 'Score submitted successfully' };
    }
    return [
      { id: 'r1', name: 'Technical Complexity', description: 'How complex is the project architecture?', max_score: 10 },
      { id: 'r2', name: 'Design & UI', description: 'Ease of use and layout quality.', max_score: 10 }
    ];
  }
  if (path.startsWith('/analytics/')) {
    return {
      registrations: 142,
      teams: 32,
      submissions: 12
    };
  }
  return null;
}

export async function apiRequest(path, options = {}) {
  // Lazy import to avoid circular dependency with authStore
  const { useAuthStore } = await import('../store/authStore.js');
  const { accessToken, clearAuth } = useAuthStore.getState();

  if (accessToken === 'dev-access-token') {
    const mock = handleDevMockRequest(path, options);
    if (mock !== null) return mock;
  }

  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(accessToken && !options.skipAuth ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  const { responseType, ...fetchOptions } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  // Try to parse JSON (some endpoints may return empty body)
  const data = response.ok && responseType === 'blob'
    ? await response.blob()
    : await response.json().catch(() => null);

  if (!response.ok) {
    // On 401, clear auth state — session is invalid
    if (response.status === 401) {
      clearAuth();
      // Don't redirect if we're already on login/register page
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }

    // Throw a structured error the UI can use
    const error = new Error(data?.detail || `Request failed (${response.status})`);
    error.status = response.status;
    error.detail = data?.detail || 'Request failed';
    error.data = data;
    throw error;
  }

  return data;
}

/* ------------------------------------------------------------------ */
/*  Convenience wrappers                                               */
/* ------------------------------------------------------------------ */

export function apiGet(path, options = {}) {
  return apiRequest(path, { ...options, method: 'GET' });
}

export function apiPost(path, body, options = {}) {
  return apiRequest(path, { ...options, method: 'POST', body: JSON.stringify(body) });
}

export function apiPatch(path, body, options = {}) {
  return apiRequest(path, { ...options, method: 'PATCH', body: JSON.stringify(body) });
}

export function apiPut(path, body, options = {}) {
  return apiRequest(path, { ...options, method: 'PUT', body: JSON.stringify(body) });
}

export function apiDelete(path, options = {}) {
  return apiRequest(path, { ...options, method: 'DELETE' });
}

export function apiDownload(path, options = {}) {
  return apiRequest(path, { ...options, method: 'GET', responseType: 'blob' });
}

export function apiPostBlob(path, body, options = {}) {
  return apiRequest(path, { ...options, method: 'POST', body: JSON.stringify(body), responseType: 'blob' });
}
