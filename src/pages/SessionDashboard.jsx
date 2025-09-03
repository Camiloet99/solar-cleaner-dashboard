// src/pages/SessionDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  subscribeToSessionTelemetry,
  unsubscribeFromTelemetry,
  subscribeToPanelTelemetry,
  unsubscribeFromPanelTelemetry,
  subscribeToRuntimeEvents,
  unsubscribeFromRuntimeEvents,
} from "@/services/telemetryService";
import InfoPanel from "@/components/InfoPanel";
import StatusPanel from "@/components/StatusPanel";
import ChartsPanel from "@/components/ChartsPanel";
import { useUI } from "@/context/UIContext";
import { useOptionalConfig } from "@/context/ConfigContext";
import useRelativeTime from "@/hooks/useRelativeTime";

// helpers
function toMs(input) {
  if (input == null) return null;
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (input instanceof Date) {
    const n = input.getTime();
    return Number.isFinite(n) ? n : null;
  }
  if (typeof input === "string") {
    const n = Date.parse(input);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
function tsOf(r) {
  // soporta timestamp ISO, epoch ms, o ts
  return toMs(r?.timestamp ?? r?.timestampMs ?? r?.ts);
}

export default function SessionDashboard() {
  const { sessionId } = useParams();
  const [readings, setReadings] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // NUEVO: capturamos el panelId para suscripciones por panel
  const [panelId, setPanelId] = useState(null);

  const { realtime, rangeMinutes, maxPoints } = useUI();
  const cfg = useOptionalConfig();

  // límites configurables
  const MAX_BUFFER =
    cfg?.config?.data?.bufferMaxPoints && cfg.config.data.bufferMaxPoints > 100
      ? cfg.config.data.bufferMaxPoints
      : 1200;
  const maxEvents = cfg?.config?.alerts?.maxEvents ?? 200;
  const scrollFrom = cfg?.config?.alerts?.scrollFrom ?? 3;

  // última lectura y "actualizado hace"
  const last = readings[readings.length - 1] || null;
  const lastTsMs = tsOf(last) ?? Date.now();
  const ago = useRelativeTime(lastTsMs);

  // ventana temporal (5m/15m/1h)
  const cutoff = Date.now() - (Number(rangeMinutes) || 15) * 60_000;
  const timeWindow = useMemo(() => {
    return readings.filter((r) => {
      const t = tsOf(r);
      return t != null && t >= cutoff;
    });
  }, [readings, cutoff]);

  // limita a los últimos N puntos (10/15/20) dentro de la ventana
  const windowReadings = useMemo(() => {
    return timeWindow.length > maxPoints
      ? timeWindow.slice(-maxPoints)
      : timeWindow;
  }, [timeWindow, maxPoints]);

  // handler para limpiar eventos
  const handleClearLogs = () => setLogs([]);

  useEffect(() => {
    const handler = (newReading) => {
      if (!realtime) return;

      // buffer deslizante para lecturas
      setReadings((prev) => {
        const next =
          prev.length > MAX_BUFFER - 1
            ? [...prev.slice(-MAX_BUFFER + 1), newReading]
            : [...prev, newReading];
        return next;
      });

      if (!panelId && newReading?.panelId) {
        setPanelId(String(newReading.panelId));
      }

      const risk =
        newReading.micro_fracture_risk ??
        newReading.microFractureRisk ??
        newReading.risk ??
        0;
      const dust =
        newReading.dustLevel ?? newReading.dust_level ?? newReading.dust ?? 0;
      const ts = tsOf(newReading) ?? Date.now();

      if (risk > 0.6) {
        setLogs((prev) =>
          [
            {
              type: "ALERT",
              message: `High micro-fracture risk (${
                Number.isFinite(risk) ? risk.toFixed(2) : risk
              })`,
              timestamp: ts,
            },
            ...prev,
          ].slice(0, maxEvents)
        );
      } else if (dust > 55) {
        setLogs((prev) =>
          [
            {
              type: "INFO",
              message: `Dust level elevated: ${dust}`,
              timestamp: ts,
            },
            ...prev,
          ].slice(0, maxEvents)
        );
      }
    };

    subscribeToSessionTelemetry(sessionId, handler);
    setLoading(false);

    return () => {
      try {
        unsubscribeFromTelemetry(sessionId);
      } catch {}
    };
  }, [sessionId, realtime, MAX_BUFFER, maxEvents, panelId]);

  useEffect(() => {
    if (!panelId) return;

    const handlePanelTelemetry = () => {
      // no necesitamos actualizar nada aquí si ya usamos la de sesión
      // deja el handler vacío o añade lógica de KPIs por panel si quieres
    };
    subscribeToPanelTelemetry(panelId, handlePanelTelemetry);

    const handlers = {
      state_change: (evt) => {
        const msg = evt?.next?.mode
          ? `State changed → ${evt.next.mode}${
              evt?.prev?.mode ? ` (from ${evt.prev.mode})` : ""
            }`
          : "State changed";
        const ts = toMs(evt?.timestamp) ?? Date.now();
        setLogs((prev) =>
          [{ type: "EVENT", message: msg, timestamp: ts }, ...prev].slice(
            0,
            maxEvents
          )
        );
      },
      param_change: (evt) => {
        const p = evt?.details?.param;
        const v = evt?.details?.value;
        const msg = p ? `Param change: ${p} = ${v}` : "Param change";
        const ts = toMs(evt?.timestamp) ?? Date.now();
        setLogs((prev) =>
          [{ type: "EVENT", message: msg, timestamp: ts }, ...prev].slice(
            0,
            maxEvents
          )
        );
      },
      param_change_bulk: (evt) => {
        const changed = Array.isArray(evt?.details?.changed)
          ? evt.details.changed.join(", ")
          : "multiple";
        const msg = `Param change (bulk): ${changed}`;
        const ts = toMs(evt?.timestamp) ?? Date.now();
        setLogs((prev) =>
          [{ type: "EVENT", message: msg, timestamp: ts }, ...prev].slice(
            0,
            maxEvents
          )
        );
      },
    };

    subscribeToRuntimeEvents(panelId, handlers);

    return () => {
      try {
        unsubscribeFromPanelTelemetry(panelId);
      } catch {}
      try {
        unsubscribeFromRuntimeEvents(panelId);
      } catch {}
    };
  }, [panelId, maxEvents]);

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--fg))] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Monitoring Session:{" "}
            <span className="text-white/90">{sessionId}</span>
            {panelId ? (
              <span className="ml-2 text-sm text-white/50">
                · Panel {panelId}
              </span>
            ) : null}
          </h1>
          <p className="text-sm text-white/60">Actualizado {ago}</p>
        </div>

        {/* Dot realtime */}
        <div className="flex items-center gap-2 text-sm">
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white/40">
            <span
              className={`absolute inline-flex h-2.5 w-2.5 rounded-full ${
                realtime ? "bg-emerald-400" : "bg-white/40"
              }`}
              style={{ inset: 0 }}
            />
            {realtime && (
              <span
                className="absolute inline-flex h-2.5 w-2.5 rounded-full animate-ping bg-emerald-400/60"
                style={{ inset: 0 }}
              />
            )}
          </span>
          {realtime ? "Realtime activo" : "Realtime pausado"}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-10 w-10 text-indigo-300 animate-spin" />
        </div>
      ) : (
        <>
          {/* KPIs en base a la ventana actual */}
          <StatusPanel
            readings={windowReadings}
            last={windowReadings[windowReadings.length - 1] ?? last}
          />

          {/* Eventos (scroll desde config) */}
          <InfoPanel
            last={last}
            logs={logs}
            maxVisible={scrollFrom}
            onClear={handleClearLogs}
          />

          {/* Gráficas limitadas a N puntos */}
          <ChartsPanel readings={windowReadings} />
        </>
      )}
    </div>
  );
}
