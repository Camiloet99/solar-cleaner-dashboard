// src/services/sessionService.js

// ⚠️ Simulamos llamadas al backend mientras no esté listo

export async function getActiveSessions() {
  // Simulamos una demora realista de red
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return [
    {
      id: "session-1753794683543",
      panelId: "PANEL-001",
      startTime: "2025-07-29T13:11:25.558Z",
      endTime: null,
      status: "active",
    },
    {
      id: "session-1753794999999",
      panelId: "PANEL-002",
      startTime: "2025-07-29T13:25:00.000Z",
      endTime: null,
      status: "active",
    },
  ];
}
