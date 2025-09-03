import React, { useMemo } from "react";

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function pick(r, keys) {
  for (const k of keys) {
    const v = r?.[k];
    if (v != null) return num(v);
  }
  return null;
}
function normalize(r) {
  return {
    ts: r?.ts ?? r?.timestampMs ?? r?.timestamp ?? null,
    temperature: pick(r, ["temperature", "temp"]),
    humidity: pick(r, ["humidity", "rh"]),
    dust: pick(r, ["dustLevel", "dust", "dust_level"]),
    power: pick(r, ["powerOutput", "power", "power_output"]),
    risk: pick(r, ["microFractureRisk", "micro_fracture_risk", "risk"]),

    // NUEVO: pasamos-through sin convertir a número
    panelId: r?.panelId ?? null,
    state: r?.state ?? null, // { mode, cause, lastChangeTs }
    params: r?.params ?? null, // objeto con parámetros
  };
}
function avg(arr, key) {
  const values = arr
    .map(normalize)
    .map((x) => x[key])
    .filter((v) => v != null);
  if (!values.length) return null;
  const s = values.reduce((a, b) => a + b, 0);
  return s / values.length;
}
const fmt = (v, digits = 2) => (v == null ? "—" : Number(v).toFixed(digits));
const when = (ts) => {
  const n = num(ts);
  return n ? new Date(n).toLocaleTimeString() : "—";
};

const Badge = ({ label, tone = "ok" }) => {
  const cls =
    tone === "risk"
      ? "bg-red-500/15 text-red-200 border border-red-400/30"
      : tone === "warn"
      ? "bg-amber-400/15 text-amber-100 border border-amber-300/30"
      : "bg-emerald-400/15 text-emerald-100 border border-emerald-300/30";
  return (
    <span className={`px-2 py-0.5 rounded-md text-[11px] uppercase ${cls}`}>
      {label}
    </span>
  );
};

// ===== NUEVO: Modo de limpieza (badge) =====
const ModeBadge = ({ mode, cause, ts }) => {
  const color =
    mode === "RIGOROUS"
      ? "#EF4444"
      : mode === "REGULAR"
      ? "#3B82F6"
      : mode === "LIGHT"
      ? "#10B981"
      : mode === "IDLE"
      ? "#9CA3AF"
      : "#6B7280";
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block w-2.5 h-2.5 rounded-full"
        style={{ background: color }}
        title={mode}
      />
      <div className="text-sm">
        <b>{mode ?? "UNKNOWN"}</b>
        {cause && <span className="text-white/60"> · {cause}</span>}
        {ts && (
          <span className="text-white/40 ml-2">
            {new Date(ts).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
};

// ===== NUEVO: Tabla compacta de parámetros =====
const PARAM_ROWS = [
  ["brushRpm", "RPM escobilla", "rpm"],
  ["waterPressure", "Presión agua", "bar"],
  ["detergentFlowRate", "Flujo detergente", "L/min"],
  ["vacuumPower", "Potencia vacío", "0..1"],
  ["robotSpeed", "Velocidad", "m/s"],
  ["pathSpacing", "Separación pasada", "m"],
  ["passOverlap", "Overlap", "%"],
  ["turnRadius", "Radio giro", "m"],
  ["squeegeePressure", "Presión squeegee", "N"],
  ["dwellTime", "Tiempo contacto", "s"],
  ["rpmRampRate", "Rampa RPM", "rpm/s"],
  ["maxWaterPerMin", "Máx agua/min", "L/min"],
  ["maxEnergyPerMin", "Máx energía/min", "Wh/min"],
];

const ParamsTable = ({ params }) => {
  if (!params) return null;
  return (
    <div className="mt-3 border border-white/10 rounded-lg p-3">
      <div className="text-xs text-white/60 mb-2">Parámetros (en rampa)</div>
      <table className="w-full text-sm">
        <tbody>
          {PARAM_ROWS.map(([k, label, unit]) => (
            <tr key={k}>
              <td className="py-1 pr-2 text-white/70">{label}</td>
              <td className="py-1 text-right tabular-nums">
                {params?.[k] ?? "—"}
              </td>
              <td className="py-1 pl-2 text-white/40">{unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function StatusPanel({ readings = [], last }) {
  const normalized = useMemo(() => (last ? normalize(last) : null), [last]);

  const aTemp = useMemo(() => avg(readings, "temperature"), [readings]);
  const aHum = useMemo(() => avg(readings, "humidity"), [readings]);
  const aDust = useMemo(() => avg(readings, "dust"), [readings]);

  const tone =
    normalized?.risk != null
      ? normalized.risk >= 0.6
        ? "risk"
        : normalized.risk >= 0.35
        ? "warn"
        : "ok"
      : "ok";

  return (
    <div className="rounded-xl shadow-md border border-white/10 bg-white/5 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-wide text-white/60">
          Estado general
        </div>
        <Badge
          tone={tone}
          label={
            tone === "risk" ? "Riesgo" : tone === "warn" ? "Atención" : "OK"
          }
        />
      </div>

      {/* NUEVO: modo de limpieza (si viene en la señal) */}
      {normalized?.state && (
        <div className="mb-3">
          <ModeBadge
            mode={normalized.state.mode}
            cause={normalized.state.cause}
            ts={normalized.state.lastChangeTs}
          />
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi title="Temp. promedio" value={`${fmt(aTemp)} °C`} />
        <Kpi title="Humedad promedio" value={`${fmt(aHum)} %`} />
        <Kpi title="Polvo promedio" value={`${fmt(aDust)} ppm`} />
        <Kpi
          title="Última lectura"
          value={normalized ? when(normalized.ts) : "—"}
          sub={
            normalized
              ? `Pwr ${fmt(normalized.power)} W · Riesgo ${fmt(
                  normalized.risk ?? 0
                )}`
              : "—"
          }
        />
      </div>

      {/* NUEVO: tabla de parámetros si vienen en la telemetría */}
      {normalized?.params ? <ParamsTable params={normalized.params} /> : null}
    </div>
  );
}

function Kpi({ title, value, sub }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-white/60">{title}</div>
      <div className="text-xl font-semibold mt-0.5">{value}</div>
      {sub && <div className="text-xs text-white/50 mt-0.5">{sub}</div>}
    </div>
  );
}
