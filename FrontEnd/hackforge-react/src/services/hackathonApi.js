import { apiGet, apiPost, apiPatch } from './apiClient.js';

export function listPublishedHackathons() {
  return apiGet('/hackathons/');
}

export function getHackathonBySlug(slug) {
  return apiGet(`/hackathons/${slug}`);
}

export function createHackathon(orgId, payload) {
  return apiPost(`/hackathons/${orgId}`, payload);
}

export function publishHackathon(hackathonId) {
  return apiPost(`/hackathons/${hackathonId}/publish`);
}

export function updateWebsiteConfig(hackathonId, config) {
  return apiPatch(`/hackathons/${hackathonId}/website-config`, config);
}
