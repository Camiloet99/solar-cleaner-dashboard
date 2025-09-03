import { Client } from '@stomp/stompjs';
import { wsBrokerUrlFromApi } from '@/config';

let client = null;
let connected = false;

// Suscripciones "deseadas" (persisten aunque se caiga el socket)
const desired = new Map();   // key -> { dest, handler }
// Suscripciones activas en el broker actual
const liveSubs = new Map();  // key -> StompSubscription

function normalizeTelemetry(msg) {
  console.log(msg);
  // mantiene compat con tus nombres existentes
  const base = {
    ts: msg.timestampMs ?? msg.timestamp ?? Date.now(),
    sessionId: msg.sessionId,
    power: msg.power ?? msg.power_output ?? null,
    temperature: msg.temperature ?? msg.temp ?? null,
    humidity: msg.humidity ?? msg.rh ?? null,
    dust: msg.dustLevel ?? msg.dust ?? msg.dust_level ?? null,
    vibration: msg.vibration ?? msg.vib ?? null,
    micro_fracture_risk: msg.microFractureRisk ?? msg.micro_fracture_risk ?? null,
  };

  // NUEVO: panelId y location (si vienen)
  if (msg.panelId) base.panelId = msg.panelId;
  if (msg.location && (msg.location.lat != null && msg.location.lng != null)) {
    base.location = { lat: Number(msg.location.lat), lng: Number(msg.location.lng) };
  }

  // NUEVO: state y params (opcionales)
  if (msg.state && msg.state.mode) {
    base.state = {
      mode: String(msg.state.mode),
      lastChangeTs: msg.state.lastChangeTs ?? null,
      cause: msg.state.cause ?? null,
    };
  }
  if (msg.params) {
    base.params = {
      robotSpeed: numOrUndef(msg.params.robotSpeed),
      brushRpm: numOrUndef(msg.params.brushRpm),
      waterPressure: numOrUndef(msg.params.waterPressure),
      detergentFlowRate: numOrUndef(msg.params.detergentFlowRate),
      vacuumPower: numOrUndef(msg.params.vacuumPower),
      turnRadius: numOrUndef(msg.params.turnRadius),
      passOverlap: numOrUndef(msg.params.passOverlap),
      pathSpacing: numOrUndef(msg.params.pathSpacing),
      squeegeePressure: numOrUndef(msg.params.squeegeePressure),
      dwellTime: numOrUndef(msg.params.dwellTime),
      rpmRampRate: numOrUndef(msg.params.rpmRampRate),
      maxWaterPerMin: numOrUndef(msg.params.maxWaterPerMin),
      maxEnergyPerMin: numOrUndef(msg.params.maxEnergyPerMin),
    };
  }

  return base;
}

function numOrUndef(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
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

// === NUEVO: Telemetría por PANEL (además de por sesión, si quieres) ===
export function subscribeToPanelTelemetry(panelId, handler /* (telemetry) => void */) {
  ensureClient();
  const key = `telemetry:panel:${panelId}`;
  const dest = `/topic/panels/${panelId}/telemetry`;
  if (desired.has(key)) return;
  // handler recibe ya normalizado
  const wrapped = (msg) => handler(normalizeTelemetry(msg));
  addDesiredAndMaybeSubscribe(key, dest, wrapped);
}

export function unsubscribeFromPanelTelemetry(panelId) {
  const key = `telemetry:panel:${panelId}`;
  desired.delete(key);
  const sub = liveSubs.get(key);
  if (sub) { try { sub.unsubscribe(); } catch {} liveSubs.delete(key); }
}

// === NUEVO: Eventos de runtime por PANEL ===
export function subscribeToRuntimeEvents(panelId, handlers = {}) {
  ensureClient();
  const types = ['state_change', 'param_change', 'param_change_bulk'];
  types.forEach((type) => {
    const key = `evt:${type}:panel:${panelId}`;
    const dest = `/topic/panels/${panelId}/${type}`;
    if (desired.has(key)) return;
    const wrapped = (evt) => {
      try {
        handlers?.[type]?.(evt);
      } catch (e) {
        console.warn('[ws] handler error for', type, e);
      }
    };
    addDesiredAndMaybeSubscribe(key, dest, wrapped);
  });
}

export function unsubscribeFromRuntimeEvents(panelId) {
  ['state_change', 'param_change', 'param_change_bulk'].forEach((type) => {
    const key = `evt:${type}:panel:${panelId}`;
    desired.delete(key);
    const sub = liveSubs.get(key);
    if (sub) { try { sub.unsubscribe(); } catch {} liveSubs.delete(key); }
  });
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
