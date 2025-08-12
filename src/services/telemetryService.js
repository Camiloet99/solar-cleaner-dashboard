import { Client } from '@stomp/stompjs';
import { wsBrokerUrlFromApi } from '@/config';

let client = null;
let connected = false;

// Suscripciones "deseadas" (persisten aunque se caiga el socket)
const desired = new Map();   // key -> { dest, handler }
// Suscripciones activas en el broker actual
const liveSubs = new Map();  // key -> StompSubscription

function normalizeTelemetry(msg) {
  return {
    ts: msg.timestampMs ?? msg.timestamp ?? Date.now(),
    sessionId: msg.sessionId,
    power: msg.power ?? msg.power_output ?? null,
    temperature: msg.temperature ?? msg.temp ?? null,
    humidity: msg.humidity ?? msg.rh ?? null,
    dust: msg.dustLevel ?? msg.dust ?? msg.dust_level ?? null,
    vibration: msg.vibration ?? msg.vib ?? null,
    micro_fracture_risk: msg.microFractureRisk ?? msg.micro_fracture_risk ?? null,
  };
}

function ensureClient() {
  if (client?.active) return client;

  client = new Client({
    brokerURL: wsBrokerUrlFromApi(), // ← nativo, sin SockJS
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: () => {},

    onConnect: () => {
      connected = true;
      // Re-suscribe todo lo “deseado”
      for (const [key, d] of desired.entries()) {
        if (!liveSubs.has(key)) {
          const sub = client.subscribe(d.dest, (frame) => {
            try {
              const payload = JSON.parse(frame.body);
              d.handler(payload);
            } catch { /* ignore */ }
          });
          liveSubs.set(key, sub);
        }
      }
    },

    onStompError: (f) => {
      // opcional: console.warn('STOMP error', f?.headers, f?.body);
    },

    onWebSocketClose: () => {
      connected = false;
      // Limpia subs activas, pero conserva “desired” para reintentar al reconectar
      for (const s of liveSubs.values()) {
        try { s.unsubscribe(); } catch {}
      }
      liveSubs.clear();
    },
  });

  client.activate();
  return client;
}

export function connectWS() {
  ensureClient();
}

export function disconnectWS() {
  for (const s of liveSubs.values()) {
    try { s.unsubscribe(); } catch {}
  }
  liveSubs.clear();
  desired.clear();
  client?.deactivate();
  client = null;
  connected = false;
}

function addDesiredAndMaybeSubscribe(key, dest, rawHandler) {
  // guarda el handler deseado (lo usaremos en re-suscripciones)
  desired.set(key, { dest, handler: rawHandler });

  if (connected) {
    if (!liveSubs.has(key)) {
      const sub = client.subscribe(dest, (frame) => {
        try {
          const payload = JSON.parse(frame.body);
          rawHandler(payload);
        } catch {}
      });
      liveSubs.set(key, sub);
    }
  }
  // si no está conectado, se suscribirá en onConnect automáticamente
}

export function subscribeToSessionTelemetry(sessionId, handler) {
  ensureClient();
  const key = `telemetry:${sessionId}`;
  const dest = `/topic/telemetry/${sessionId}`;
  const wrapped = (payload) => handler(normalizeTelemetry(payload));

  if (desired.has(key)) return; // ya pedida

  addDesiredAndMaybeSubscribe(key, dest, wrapped);
}

export function unsubscribeFromTelemetry(sessionId) {
  if (!sessionId) {
    // borra todas las de telemetría
    for (const [k, s] of liveSubs.entries()) {
      if (k.startsWith('telemetry:')) { try { s.unsubscribe(); } catch {} liveSubs.delete(k); }
    }
    for (const k of Array.from(desired.keys())) {
      if (k.startsWith('telemetry:')) desired.delete(k);
    }
    return;
  }
  const key = `telemetry:${sessionId}`;
  desired.delete(key);
  const sub = liveSubs.get(key);
  if (sub) { try { sub.unsubscribe(); } catch {} liveSubs.delete(key); }
}

export function subscribeToPredictions(sessionId, handler) {
  ensureClient();
  const key = `pred:${sessionId}`;
  const dest = `/topic/predictions/${sessionId}`;

  if (desired.has(key)) return;
  addDesiredAndMaybeSubscribe(key, dest, handler);
}

export function unsubscribeFromPredictions(sessionId) {
  const key = `pred:${sessionId}`;
  desired.delete(key);
  const sub = liveSubs.get(key);
  if (sub) { try { sub.unsubscribe(); } catch {} liveSubs.delete(key); }
}
