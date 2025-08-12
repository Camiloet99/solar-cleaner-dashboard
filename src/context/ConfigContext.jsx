import React, { createContext, useContext, useMemo, useState } from "react";

const ConfigContext = createContext(null);

// Config por defecto (puedes ajustarlo a tu gusto)
const DEFAULT_CONFIG = {
  general: {
    theme: "dark",
    locale: "es-CO",
    timezone: "auto",
    density: "comfortable",
  },
  data: {
    wsUrl: "",
    throttleMs: 0,
    decimateEvery: 1,
    bufferMaxPoints: 1200,
    ranges: [5, 15, 60],
    defaultRealtime: true,
    reconnect: { baseMs: 1000, maxMs: 10000, retries: 10 },
  },
  alerts: {
    thresholds: {
      temperature: 60,
      humidity: 80,
      dust: 70,
      vibration: 0.5,
      risk: 0.6,
    },
    debounceMs: 2000,
    channels: { toast: true, sound: false, desktop: false },
  },
  charts: {
    smoothing: "monotone",
    strokeWidth: 2,
    showDots: false,
    showGrid: true,
    // si quieres un default global:
    // maxPoints: 15,
  },
};

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  const value = useMemo(
    () => ({
      config,
      setConfig,
      reset: () => setConfig(DEFAULT_CONFIG),
      importConfig: (c) => setConfig(c),
      exportConfig: () => JSON.stringify(config, null, 2),
    }),
    [config]
  );

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}

// Hook estricto (lanza si no hay provider)
export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig debe usarse dentro de ConfigProvider");
  return ctx;
}

// ✅ Hook opcional (devuelve null si no hay provider)
export function useOptionalConfig() {
  return useContext(ConfigContext);
}
