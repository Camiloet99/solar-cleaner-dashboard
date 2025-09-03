import React, { useMemo, useState } from "react";
import { useConfig } from "@/context/ConfigContext";

function toEpochMs(input) {
  if (input == null) return null;
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (input instanceof Date)
    return Number.isFinite(input.getTime()) ? input.getTime() : null;
  if (typeof input === "string") {
    const n = Date.parse(input);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
const fmtTime = (tsLike) => {
  const ms = toEpochMs(tsLike);
  return ms ? new Date(ms).toLocaleTimeString() : "—";
};

// Paleta por tipo
const tone = {
  ALERT: "border-red-500/30 bg-red-500/10 text-red-200",
  WARN: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  EVENT: "border-sky-400/30 bg-sky-400/10 text-sky-100",
  INFO: "border-white/20 bg-white/10 text-white/80",
};

// Iconitos simples sin dependencias nuevas
const iconFor = (t) =>
  t === "ALERT" ? "⚠️" : t === "WARN" ? "🟡" : t === "EVENT" ? "🛰️" : "ℹ️";

// Etiquetas de filtro visibles
const FILTERS = ["ALL", "ALERT", "WARN", "EVENT", "INFO"];

/**
 * maxVisible: override opcional; por defecto usa config.alerts.scrollFrom
 * rowApproxPx: altura base por fila para max-height
 * logs: Array<{ type: 'ALERT'|'WARN'|'EVENT'|'INFO', message: string, timestamp: number|string|Date, payload?: any }>
 */
export default function InfoPanel({
  last,
  logs = [],
  maxVisible, // <- si no lo pasan, toma de config
  rowApproxPx = 64,
  onClear,
}) {
  const { config } = useConfig();
  const effectiveMax = maxVisible ?? config?.alerts?.scrollFrom ?? 3;

  // ===== NUEVO: filtros por tipo =====
  const [filter, setFilter] = useState("ALL");
  const filtered = useMemo(() => {
    if (filter === "ALL") return logs;
    return logs.filter((l) => (l?.type || "INFO") === filter);
  }, [logs, filter]);

  // Resumen por tipo (para chips/contadores)
  const counts = useMemo(() => {
    const base = { ALERT: 0, WARN: 0, EVENT: 0, INFO: 0 };
    for (const l of logs) {
      const t = l?.type || "INFO";
      base[t] = (base[t] || 0) + 1;
    }
    return base;
  }, [logs]);

  const scrollable = filtered.length > effectiveMax;
  const maxHeightPx = useMemo(
    () => `${effectiveMax * rowApproxPx}px`,
    [effectiveMax, rowApproxPx]
  );

  return (
    <div className="rounded-xl shadow-md border border-white/10 bg-white/5 p-4 space-y-4">
      {/* Última lectura */}
      <div>
        <div className="text-xs uppercase tracking-wide text-white/60">
          Última lectura
        </div>
        <div className="mt-1 text-sm">
          {last ? (
            <>
              <span className="text-white/80">Hora: </span>
              <span className="text-white/60">
                {fmtTime(last.timestamp ?? last.ts)}
              </span>
              {/* hint de estado/params si vienen en la lectura */}
              {last?.state?.mode && (
                <span className="ml-3 inline-flex items-center gap-2 text-white/70">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{
                      background:
                        last.state.mode === "RIGOROUS"
                          ? "#EF4444"
                          : last.state.mode === "REGULAR"
                          ? "#3B82F6"
                          : last.state.mode === "LIGHT"
                          ? "#10B981"
                          : last.state.mode === "IDLE"
                          ? "#9CA3AF"
                          : "#6B7280",
                    }}
                  />
                  {last.state.mode}
                  {last.state.cause && (
                    <span className="text-white/50">· {last.state.cause}</span>
                  )}
                </span>
              )}
            </>
          ) : (
            <span className="text-white/60">—</span>
          )}
        </div>
      </div>

      {/* Cabecera de Eventos / acciones */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-wide text-white/60">
            Eventos{" "}
            <span className="ml-2 px-2 py-0.5 rounded bg-white/10 text-white/70 text-[10px]">
              {logs.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Filtros */}
            <div className="hidden sm:flex items-center gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2 py-0.5 rounded text-[11px] border ${
                    filter === f
                      ? "border-sky-400/40 bg-sky-400/10 text-sky-100"
                      : "border-white/15 bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                  title={f === "ALL" ? "Todos" : `${f} (${counts[f] ?? 0})`}
                >
                  {f === "ALL" ? "ALL" : `${f} (${counts[f] ?? 0})`}
                </button>
              ))}
            </div>

            {onClear && (
              <button
                onClick={onClear}
                className="px-2 py-1 rounded-md text-xs border border-white/15 bg-white/5 hover:bg-white/10"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Lista de eventos */}
        <div
          role="log"
          aria-live="polite"
          className={`relative ${scrollable ? "thin-scrollbar pr-2" : ""}`}
          style={
            scrollable
              ? { maxHeight: maxHeightPx, overflowY: "auto" }
              : undefined
          }
        >
          <ul className="space-y-2">
            {filtered.map((log, i) => (
              <li
                key={`${log.timestamp ?? i}-${i}`}
                className={`px-3 py-2 rounded-lg border ${
                  tone[log.type] ?? tone.INFO
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] leading-none">
                      {iconFor(log.type || "INFO")}
                    </span>
                    <span className="text-[11px] uppercase">
                      {log.type || "INFO"}
                    </span>
                  </div>
                  <span className="text-xs opacity-80">
                    {fmtTime(log.timestamp)}
                  </span>
                </div>

                <div className="text-sm mt-1 leading-snug whitespace-pre-wrap">
                  {log.message}
                </div>

                {/* NUEVO: detalles si el log trae payload (ej. eventos runtime) */}
                {log.payload ? (
                  <div className="mt-2">
                    {/* Resumen inteligente del payload si se detecta formato de eventos runtime */}
                    <SmartEventSummary payload={log.payload} />
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs opacity-80 hover:opacity-100">
                        ver payload
                      </summary>
                      <pre className="text-xs bg-black/20 p-2 rounded-md overflow-x-auto">
                        {safeJson(log.payload)}
                      </pre>
                    </details>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>

          {/* Indicador de overflow */}
          {scrollable && (
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[rgba(0,0,0,.35)] to-transparent" />
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Helpers/Componentes extra =====

function safeJson(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/**
 * Muestra un resumen “listo para humanos” si el payload parece
 * un evento de runtime: { type, prev, next, details, paramsTarget }
 */
function SmartEventSummary({ payload }) {
  const t = payload?.type || "";
  const prev = payload?.prev;
  const next = payload?.next;
  const details = payload?.details;
  const paramsTarget = payload?.paramsTarget;

  // Resumen por tipo conocido
  if (t === "state_change") {
    return (
      <div className="text-sm">
        <b>Cambio de estado:</b>{" "}
        {next?.mode ? (
          <>
            {prev?.mode ? (
              <>
                <span className="opacity-90">{prev.mode}</span> →{" "}
              </>
            ) : null}
            <span className="font-semibold">{next.mode}</span>
          </>
        ) : (
          "—"
        )}
        {payload?.cause && (
          <span className="text-white/60"> · {payload.cause}</span>
        )}
        {paramsTarget && (
          <span className="ml-2 text-white/50">
            ({Object.keys(paramsTarget).length} params objetivo)
          </span>
        )}
      </div>
    );
  }

  if (t === "param_change") {
    const p = details?.param;
    const v = details?.value;
    const clamp = details?.clampedApplied ? " (clamped)" : "";
    return (
      <div className="text-sm">
        <b>Ajuste de parámetro:</b>{" "}
        {p ? (
          <>
            <span className="opacity-90">{p}</span> ={" "}
            <span className="font-semibold">{String(v)}</span>
            {clamp}
          </>
        ) : (
          "—"
        )}
      </div>
    );
  }

  if (t === "param_change_bulk") {
    const changed = Array.isArray(details?.changed)
      ? details.changed.join(", ")
      : "múltiples";
    return (
      <div className="text-sm">
        <b>Ajuste múltiple:</b> {changed}
      </div>
    );
  }

  // Fallback genérico
  return null;
}
