// src/pages/Configuration.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useConfig } from "@/context/ConfigContext";

const Card = ({ title, children }) => (
  <div className="rounded-xl shadow-md border border-white/10 bg-white/5 p-4">
    <div className="text-xs uppercase tracking-wide text-white/60 mb-2">
      {title}
    </div>
    {children}
  </div>
);

// ---------- helpers ----------
const ensureNumber = (v, def = 0) =>
  Number.isFinite(Number(v)) ? Number(v) : def;
const parseRanges = (txt) =>
  txt
    .split(",")
    .map((v) => ensureNumber(v.trim()))
    .filter((n) => n > 0);

function applyTheme(theme) {
  const root = document.documentElement;
  const DARK = () => root.classList.add("dark");
  const LIGHT = () => root.classList.remove("dark");

  if (theme === "auto") {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const sync = () => (mq.matches ? DARK() : LIGHT());
    sync();
    mq?.addEventListener?.("change", sync);
    return () => mq?.removeEventListener?.("change", sync);
  }
  if (theme === "dark") DARK();
  else LIGHT();
  return () => {};
}

// HSL ←→ HEX para los tokens de charts
const clamp = (x, min, max) => Math.min(Math.max(x, min), max);
function hexToHslString(hex) {
  // #rrggbb -> "h s% l%"
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;
  let r = parseInt(m[1], 16) / 255;
  let g = parseInt(m[2], 16) / 255;
  let b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;
  if (max === min) h = s = 0;
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(
    l * 100
  )}%`;
}
function hslStringToHex(hsl) {
  // "h s% l%" -> #rrggbb
  const m = /^\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*$/.exec(hsl || "");
  if (!m) return "#888888";
  let h = (parseFloat(m[1]) % 360) / 360;
  let s = clamp(parseFloat(m[2]), 0, 100) / 100;
  let l = clamp(parseFloat(m[3]), 0, 100) / 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    const hex = (v << 16) | (v << 8) | v;
    return `#${hex.toString(16).padStart(6, "0")}`;
  }
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function readChartVars() {
  const style = getComputedStyle(document.documentElement);
  const keys = [
    "--chart-1",
    "--chart-2",
    "--chart-3",
    "--chart-4",
    "--chart-5",
  ];
  const obj = {};
  for (const k of keys) {
    const hsl = style.getPropertyValue(k).trim(); // "217 91% 60%"
    obj[k] = hslStringToHex(hsl);
  }
  return obj;
}

function writeChartVar(varName, hex) {
  const hsl = hexToHslString(hex);
  if (hsl) document.documentElement.style.setProperty(varName, hsl);
}

// ------------- Component -------------
export default function Configuration() {
  const { config, setConfig, reset, importConfig, exportConfig } = useConfig();
  const fileRef = useRef(null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");

  // Theme application
  useEffect(() => applyTheme(config.general.theme), [config.general.theme]);

  // Local palette state (hex) synced with CSS vars
  const [palette, setPalette] = useState(() => readChartVars());
  useEffect(() => {
    // init from config if present (optional)
    const saved = config?.charts?.palette;
    if (saved) {
      Object.entries(saved).forEach(([k, hex]) => writeChartVar(k, hex));
      setPalette((prev) => ({ ...prev, ...saved }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (path, value) => {
    setConfig((prev) => {
      const next = structuredClone(prev);
      const segs = path.split(".");
      let obj = next;
      for (let i = 0; i < segs.length - 1; i++) obj = obj[segs[i]];
      obj[segs.at(-1)] = value;
      return next;
    });
    setDirty(true);
  };

  const onImport = async (file) => {
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      if (!json || typeof json !== "object")
        throw new Error("Formato inválido");
      importConfig(json);
      setDirty(false);
      setError("");
    } catch (e) {
      setError("Archivo de configuración inválido.");
    }
  };

  const confirmReset = () => {
    if (confirm("¿Restablecer configuración a valores de fábrica?")) {
      reset();
      setDirty(false);
    }
  };

  // Test WebSocket connection
  const [wsStatus, setWsStatus] = useState("idle"); // idle | ok | fail | pending
  const testWS = () => {
    try {
      setWsStatus("pending");
      const ws = new WebSocket(config.data.wsUrl);
      const t = setTimeout(() => {
        try {
          ws.close();
        } catch {}
        setWsStatus((s) => (s === "pending" ? "fail" : s));
      }, 3000);
      ws.onopen = () => {
        clearTimeout(t);
        ws.close();
        setWsStatus("ok");
        setTimeout(() => setWsStatus("idle"), 2000);
      };
      ws.onerror = () => {
        clearTimeout(t);
        setWsStatus("fail");
        setTimeout(() => setWsStatus("idle"), 2000);
      };
    } catch {
      setWsStatus("fail");
      setTimeout(() => setWsStatus("idle"), 2000);
    }
  };

  // Notifications
  const askNotif = async () => {
    try {
      const p = await Notification.requestPermission();
      alert(`Permiso de notificaciones: ${p}`);
    } catch {
      alert("Tu navegador no soporta Notification API.");
    }
  };
  const testNotif = () => {
    if (Notification?.permission === "granted") {
      new Notification("Telemetry Dashboard", {
        body: "Esto es una notificación de prueba.",
      });
    } else {
      alert("Concede permiso de notificaciones primero.");
    }
  };

  // Sound
  const testSound = async () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      g.gain.value = 0.001;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      o.stop(ctx.currentTime + 0.25);
    } catch {}
  };

  // Ranges input value
  const rangesStr = useMemo(
    () => (config.data.ranges || []).join(","),
    [config.data.ranges]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Configuration</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={confirmReset}
            className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-sm"
          >
            Reset
          </button>
          <button
            onClick={() => {
              const blob = new Blob([exportConfig()], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "telemetry-config.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-sm"
          >
            Export
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-sm"
          >
            Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])}
          />
          {dirty && (
            <span className="text-xs text-amber-300">Guardado automático</span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-100 text-sm px-3 py-2">
          {error}
        </div>
      )}

      {/* General */}
      <Card title="General">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <label className="text-sm">
            <span className="block text-white/60 mb-1">Theme</span>
            <select
              value={config.general.theme}
              onChange={(e) => onChange("general.theme", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            >
              <option value="auto">Auto</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-white/60 mb-1">Locale</span>
            <input
              value={config.general.locale}
              onChange={(e) => onChange("general.locale", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="block text-white/60 mb-1">Timezone</span>
            <input
              value={config.general.timezone}
              onChange={(e) => onChange("general.timezone", e.target.value)}
              placeholder="auto"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="block text-white/60 mb-1">Density</span>
            <select
              value={config.general.density}
              onChange={(e) => onChange("general.density", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </label>
        </div>
      </Card>

      {/* Data & Realtime */}
      <Card title="Data & Realtime">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-sm">
            <span className="block text-white/60 mb-1">WebSocket URL</span>
            <input
              value={config.data.wsUrl}
              onChange={(e) => onChange("data.wsUrl", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={testWS}
                className="px-2 py-1 rounded-md text-xs border border-white/15 bg-white/5 hover:bg-white/10"
              >
                Test WS
              </button>
              {wsStatus !== "idle" && (
                <span
                  className={`text-xs ${
                    wsStatus === "ok"
                      ? "text-emerald-300"
                      : wsStatus === "pending"
                      ? "text-white/70"
                      : "text-red-300"
                  }`}
                >
                  {wsStatus === "ok"
                    ? "OK"
                    : wsStatus === "pending"
                    ? "Conectando…"
                    : "Fallo"}
                </span>
              )}
            </div>
          </label>

          <label className="text-sm">
            <span className="block text-white/60 mb-1">Throttle (ms)</span>
            <input
              type="number"
              value={config.data.throttleMs}
              onChange={(e) =>
                onChange("data.throttleMs", ensureNumber(e.target.value, 250))
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            />
          </label>

          <label className="text-sm">
            <span className="block text-white/60 mb-1">Decimate every N</span>
            <input
              type="number"
              value={config.data.decimateEvery}
              onChange={(e) =>
                onChange("data.decimateEvery", ensureNumber(e.target.value, 1))
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            />
          </label>

          <label className="text-sm">
            <span className="block text-white/60 mb-1">Buffer max points</span>
            <input
              type="number"
              value={config.data.bufferMaxPoints}
              onChange={(e) =>
                onChange(
                  "data.bufferMaxPoints",
                  ensureNumber(e.target.value, 600)
                )
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            />
          </label>

          <label className="text-sm">
            <span className="block text-white/60 mb-1">Ranges (min, coma)</span>
            <input
              value={rangesStr}
              onChange={(e) =>
                onChange("data.ranges", parseRanges(e.target.value))
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            />
          </label>

          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.data.defaultRealtime}
              onChange={(e) =>
                onChange("data.defaultRealtime", e.target.checked)
              }
            />
            <span>Realtime ON por defecto</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          <label className="text-sm">
            <span className="block text-white/60 mb-1">
              Reconnect base (ms)
            </span>
            <input
              type="number"
              value={config.data.reconnect.baseMs}
              onChange={(e) =>
                onChange(
                  "data.reconnect.baseMs",
                  ensureNumber(e.target.value, 1000)
                )
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="block text-white/60 mb-1">Reconnect max (ms)</span>
            <input
              type="number"
              value={config.data.reconnect.maxMs}
              onChange={(e) =>
                onChange(
                  "data.reconnect.maxMs",
                  ensureNumber(e.target.value, 10000)
                )
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="block text-white/60 mb-1">Reconnect retries</span>
            <input
              type="number"
              value={config.data.reconnect.retries}
              onChange={(e) =>
                onChange(
                  "data.reconnect.retries",
                  ensureNumber(e.target.value, 6)
                )
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            />
          </label>
        </div>
      </Card>

      {/* Alertas */}
      <Card title="Alertas">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {Object.entries(config.alerts.thresholds).map(([k, v]) => (
            <label key={k} className="text-sm">
              <span className="block text-white/60 mb-1">Threshold {k}</span>
              <input
                type="number"
                value={v}
                onChange={(e) =>
                  onChange(
                    `alerts.thresholds.${k}`,
                    ensureNumber(e.target.value, v)
                  )
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
              />
            </label>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
          <label className="text-sm">
            <span className="block text-white/60 mb-1">Debounce (ms)</span>
            <input
              type="number"
              value={config.alerts.debounceMs}
              onChange={(e) =>
                onChange(
                  "alerts.debounceMs",
                  ensureNumber(e.target.value, 2000)
                )
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            />
          </label>

          <label className="text-sm">
            <span className="block text-white/60 mb-1">Máx eventos</span>
            <input
              type="number"
              value={config.alerts.maxEvents ?? 200}
              onChange={(e) =>
                onChange("alerts.maxEvents", ensureNumber(e.target.value, 200))
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            />
          </label>

          <label className="text-sm">
            <span className="block text-white/60 mb-1">Scroll desde N</span>
            <input
              type="number"
              value={config.alerts.scrollFrom ?? 3}
              onChange={(e) =>
                onChange("alerts.scrollFrom", ensureNumber(e.target.value, 3))
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            />
          </label>

          <div className="flex items-end gap-2">
            <button
              onClick={askNotif}
              className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-sm"
            >
              Permitir notificaciones
            </button>
            <button
              onClick={testNotif}
              className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-sm"
            >
              Probar notificación
            </button>
            <button
              onClick={testSound}
              className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-sm"
            >
              Probar sonido
            </button>
          </div>
        </div>
      </Card>

      {/* Gráficos */}
      <Card title="Gráficos">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <label className="text-sm">
            <span className="block text-white/60 mb-1">Smoothing</span>
            <select
              value={config.charts.smoothing}
              onChange={(e) => onChange("charts.smoothing", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            >
              <option value="monotone">Monotone</option>
              <option value="linear">Linear</option>
            </select>
          </label>

          <label className="text-sm">
            <span className="block text-white/60 mb-1">Stroke width</span>
            <input
              type="number"
              value={config.charts.strokeWidth}
              onChange={(e) =>
                onChange("charts.strokeWidth", ensureNumber(e.target.value, 2))
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            />
          </label>

          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.charts.showDots}
              onChange={(e) => onChange("charts.showDots", e.target.checked)}
            />
            <span>Show dots</span>
          </label>

          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.charts.showGrid}
              onChange={(e) => onChange("charts.showGrid", e.target.checked)}
            />
            <span>Show grid</span>
          </label>
        </div>

        {/* Paleta de colores de charts */}
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wide text-white/60 mb-2">
            Paleta de charts
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              "--chart-1",
              "--chart-2",
              "--chart-3",
              "--chart-4",
              "--chart-5",
            ].map((k) => (
              <label
                key={k}
                className="text-sm flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-white/10 bg-white/5"
              >
                <span className="text-white/70">{k.replace("--", "")}</span>
                <input
                  type="color"
                  value={palette[k] || "#888888"}
                  onChange={(e) => {
                    const hex = e.target.value;
                    setPalette((p) => ({ ...p, [k]: hex }));
                    writeChartVar(k, hex);
                    // persiste en config
                    onChange(`charts.palette.${k}`, hex);
                  }}
                />
              </label>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
