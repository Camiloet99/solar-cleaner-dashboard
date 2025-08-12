const runtime = typeof window !== 'undefined' && window.__APP_CONFIG__?.API_BASE;
const envCRA  = typeof process !== 'undefined' && process.env.REACT_APP_API_BASE;
const envNext = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE;

export const API_BASE = (runtime || envCRA || envNext || 'http://localhost:8080').replace(/\/+$/, '');

export function wsBrokerUrlFromApi(base = API_BASE) {
  try {
    const u = new URL(base);
    const proto = u.protocol === 'https:' ? 'wss:' : 'ws:';
    // Conectar al endpoint STOMP nativo registrado en Spring: /ws
    return `${proto}//${u.host}/ws`;
  } catch {
    return base.replace(/^http/, 'ws') + '/ws';
  }
}
