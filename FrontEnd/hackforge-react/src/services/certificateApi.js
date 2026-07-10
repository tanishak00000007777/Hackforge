import { apiGet, apiPost } from './apiClient.js';

export function issueCertificates(hackathonId, payload) {
  return apiPost(`/certificates/${hackathonId}/issue`, payload);
}

export function getMyCertificates() {
  return apiGet('/certificates/me');
}

export function verifyCertificate(verificationId) {
  return apiGet(`/certificates/verify/${verificationId}`);
}

export function getHackathonCertificates(hackathonId) {
  return apiGet(`/certificates/${hackathonId}`);
}
