/**
 * Shared API client for HackForge frontend.
 *
 * - Prefixes every request with VITE_API_BASE_URL
 * - Attaches Authorization header when a token is available
 * - Normalises backend errors for UI consumption
 * - Clears auth state and redirects on 401
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

/**
 * Core request helper.
 *
 * @param {string} path  – API path (e.g. "/auth/login")
 * @param {RequestInit & { skipAuth?: boolean }} options
 * @returns {Promise<any>}
 */
function handleDevMockRequest(path, options) {
  const method = options.method || 'GET';
  
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

  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken && !options.skipAuth ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Try to parse JSON (some endpoints may return empty body)
  const data = await response.json().catch(() => null);

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

export function apiDelete(path, options = {}) {
  return apiRequest(path, { ...options, method: 'DELETE' });
}
