const api = {
  token: () => localStorage.getItem("access_token"),
  async request(path, options = {}) {
    let response;
    try {
      response = await fetch(`/api/v1${path}`, { ...options, headers: { "Content-Type": "application/json", ...(this.token() && { Authorization: `Bearer ${this.token()}` }), ...options.headers } });
    } catch {
      throw new Error("Backend unavailable. Check the server and try again.");
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.detail || `Request failed (${response.status})`);
    return data;
  },
  me() { return this.request("/auth/me"); },
  logout() { localStorage.removeItem("access_token"); localStorage.removeItem("refresh_token"); location.href = "/login"; },
};
const roleRoutes = { organizer: "/organizer", participant: "/participant", judge: "/judge", admin: "/organizer" };
async function requireAuth(role) {
  if (!api.token()) return location.replace("/login");
  try {
    const user = await api.me();
    if (role && user.role !== role && user.role !== "admin") location.replace(roleRoutes[user.role] || "/login");
    return user;
  } catch { api.logout(); }
}
window.HackForge = { api, requireAuth, roleRoutes };
