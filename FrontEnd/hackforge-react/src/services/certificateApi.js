import { apiGet, apiPost, apiPostBlob, apiPut, apiDownload } from './apiClient.js';

export function getTemplate(hackathonId) {
  return apiGet(`/certificates/hackathons/${hackathonId}/template`);
}

export function saveTemplate(hackathonId, payload) {
  return apiPut(`/certificates/hackathons/${hackathonId}/template`, payload);
}

export function previewTemplate(hackathonId, payload) {
  return apiPostBlob(`/certificates/hackathons/${hackathonId}/template/preview`, payload);
}

export function issueCertificates(hackathonId, payload) {
  return apiPost(`/certificates/hackathons/${hackathonId}/issue-bulk`, payload);
}

export function getMyCertificates() {
  return apiGet('/certificates/me');
}

export function verifyCertificate(verificationId) {
  return apiGet(`/certificates/verify/${verificationId}`, { skipAuth: true });
}

export function getHackathonCertificates(hackathonId) {
  return apiGet(`/certificates/hackathons/${hackathonId}/issued`);
}

export function downloadCertificate(certificateId) {
  return apiDownload(`/certificates/${certificateId}/pdf`);
}
