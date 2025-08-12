import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  subscribeToSessionTelemetry,
  unsubscribeFromTelemetry,
} from "@/services/telemetryService";
import InfoPanel from "@/components/InfoPanel";
import StatusPanel from "@/components/StatusPanel";
import ChartsPanel from "@/components/ChartsPanel";
import { useUI } from "@/context/UIContext";
import useRelativeTime from "@/hooks/useRelativeTime";

const MAX_BUFFER = 1200; // seguridad por si te llegan muchas

function toTs(r) {
  return r?.timestamp ?? r?.timestampMs ?? r?.ts ?? null;
}

const SessionDashboard = () => {
  const { sessionId } = useParams();
  const [readings, setReadings] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const { realtime, rangeMinutes, maxPoints } = useUI();

  // Última lectura general
  const last = readings[readings.length - 1] || null;
  const lastTs = toTs(last) ?? Date.now();
  const ago = useRelativeTime(lastTs);

  // Ventana temporal (5m/15m/1h)
  const cutoff = Date.now() - rangeMinutes * 60_000;
  const timeWindow = useMemo(
    () =>
      readings.filter((r) => {
        const t = toTs(r);
        return t == null ? false : t >= cutoff;
      }),
    [readings, cutoff]
  );

  // Limita a los últimos N puntos (10/15/20) dentro de la ventana temporal
  const windowReadings = useMemo(() => {
    if (timeWindow.length <= maxPoints) return timeWindow;
    return timeWindow.slice(-maxPoints);
  }, [timeWindow, maxPoints]);

  useEffect(() => {
    const handler = (newReading) => {
      if (!realtime) return;

      setReadings((prev) => {
        const next =
          prev.length > MAX_BUFFER - 1
            ? [...prev.slice(-MAX_BUFFER + 1), newReading]
            : [...prev, newReading];
        return next;
      });

      const risk =
        newReading.micro_fracture_risk ?? newReading.microFractureRisk ?? 0;
      const dust =
        newReading.dustLevel ?? newReading.dust ?? newReading.dust_level ?? 0;
      const ts = toTs(newReading) ?? Date.now();

      if (risk > 0.6) {
        setLogs((prev) => [
          {
            type: "ALERT",
            message: `High micro-fracture risk (${risk.toFixed?.(2) ?? risk})`,
            timestamp: ts,
          },
          ...prev.slice(0, 19),
        ]);
      } else if (dust > 55) {
        setLogs((prev) => [
          {
            type: "INFO",
            message: `Dust level elevated: ${dust}`,
            timestamp: ts,
          },
          ...prev.slice(0, 19),
        ]);
      }
    };

    subscribeToSessionTelemetry(sessionId, handler);
    setLoading(false);

    return () => {
      try {
        unsubscribeFromTelemetry(sessionId);
      } catch {}
    };
  }, [sessionId, realtime]);

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--fg))] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Monitoring Session:{" "}
            <span className="text-white/90">{sessionId}</span>
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

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-10 w-10 text-indigo-300 animate-spin" />
        </div>
      ) : (
        <>
          {/* KPIs sobre la ventana actual */}
          <StatusPanel
            readings={windowReadings}
            last={windowReadings[windowReadings.length - 1] ?? last}
          />

          {/* Eventos */}
          <InfoPanel last={last} logs={logs} maxVisible={3} />

          {/* Gráficas limitadas a N puntos */}
          <ChartsPanel readings={windowReadings} />
        </>
      )}
    </div>
  );
};

export default SessionDashboard;
