import { API_BASE } from "@/config";

export async function getActiveSessions() {
  const r = await fetch(`${API_BASE}/api/sessions/active`);
  if (!r.ok) throw new Error("Failed fetch sessions");
  return r.json();
}