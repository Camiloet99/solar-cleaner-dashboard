// src/services/telemetryService.js

let intervalId = null;
let listener = null;

// 🔁 Función para generar una lectura simulada
function generateMockReading(sessionId) {
  const now = new Date().toISOString();
  return {
    sessionId,
    timestamp: now,
    temperature: +(30 + Math.random() * 10).toFixed(2),
    humidity: +(50 + Math.random() * 20).toFixed(2),
    dust_level: +(30 + Math.random() * 20).toFixed(2),
    power_output: +(120 + Math.random() * 40).toFixed(2),
    vibration: +(0.02 + Math.random() * 0.08).toFixed(3),
    micro_fracture_risk: +(Math.random()).toFixed(2),
    location: { lat: 6.251839, lng: -75.563591 },
  };
}

export function subscribeToSessionTelemetry(sessionId, onReading) {
  if (intervalId) clearInterval(intervalId);
  listener = onReading;

  intervalId = setInterval(() => {
    const reading = generateMockReading(sessionId);
    listener(reading);
  }, 2000);
}

export function unsubscribeFromTelemetry() {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
  listener = null;
}