const configuredStudioUrl = import.meta.env.VITE_STUDIO_URL;

export function getStudioUrl(hackathonId) {
  const url = new URL(configuredStudioUrl || '/studio/', window.location.origin);
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  if (hackathonId) url.searchParams.set('hackathonId', hackathonId);
  return url;
}

export function getApiBaseUrl() {
  return import.meta.env.DEV
    ? (import.meta.env.VITE_API_BASE_URL || `${window.location.origin}/api/v1`)
    : (import.meta.env.VITE_API_BASE_URL || `${window.location.origin}/api/v1`);
}
