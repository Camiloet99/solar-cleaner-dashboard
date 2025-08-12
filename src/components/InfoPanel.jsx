import React, { useMemo } from "react";
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

const tone = {
  ALERT: "border-red-500/30 bg-red-500/10 text-red-200",
  WARN: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  INFO: "border-white/20 bg-white/10 text-white/80",
};

/**
 * maxVisible: override opcional; por defecto usa config.alerts.scrollFrom
 * rowApproxPx: altura base por fila para max-height
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

  const scrollable = logs.length > effectiveMax;
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
            </>
          ) : (
            <span className="text-white/60">—</span>
          )}
        </div>
      </div>

      {/* Eventos / Alerts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-wide text-white/60">
            Eventos{" "}
            <span className="ml-2 px-2 py-0.5 rounded bg-white/10 text-white/70 text-[10px]">
              {logs.length}
            </span>
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
            {logs.map((log, i) => (
              <li
                key={`${log.timestamp ?? i}-${i}`}
                className={`px-3 py-2 rounded-lg border ${
                  tone[log.type] ?? tone.INFO
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase">{log.type}</span>
                  <span className="text-xs text-white/60">
                    {fmtTime(log.timestamp)}
                  </span>
                </div>
                <div className="text-sm mt-1 leading-snug">{log.message}</div>
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
