// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Settings, ArrowRight, RefreshCw } from "lucide-react";
import { useUI } from "@/context/UIContext";
import { getActiveSessions } from "@/services/sessionService";
import useRelativeTime from "@/hooks/useRelativeTime";
import { Button } from "@/components/ui/button";

const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-xl shadow-md border border-white/10 bg-white/5 ${className}`}
  >
    {children}
  </div>
);

const Dot = ({ active }) => (
  <span className="relative inline-flex h-2.5 w-2.5 rounded-full">
    <span
      className={`absolute inset-0 rounded-full ${
        active ? "bg-emerald-400" : "bg-white/40"
      }`}
    />
    {active && (
      <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400/60" />
    )}
  </span>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { realtime, rangeMinutes, maxPoints } = useUI();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const ago = useRelativeTime(lastUpdated);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getActiveSessions();
      setSessions(Array.isArray(res) ? res : []);
      setLastUpdated(Date.now());
    } catch (e) {
      console.error("Error fetching sessions", e);
      setError("No se pudieron obtener las sesiones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const recent = useMemo(
    () =>
      sessions
        .slice()
        .sort(
          (a, b) => new Date(b?.startTime ?? 0) - new Date(a?.startTime ?? 0)
        )
        .slice(0, 6),
    [sessions]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Resumen del sistema y accesos rápidos.
          </p>
          <div className="mt-2 text-xs text-white/50">
            {loading ? "Cargando…" : `${sessions.length} sesiones activas`}
            {lastUpdated && <> · Actualizado {ago}</>}
          </div>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-white/15 bg-white/5 hover:bg-white/10"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-white/60">
            Sesiones activas
          </div>
          <div className="mt-2 text-3xl font-semibold">
            {loading ? "—" : sessions.length}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-white/60">
            Realtime
          </div>
          <div className="mt-2 flex items-center gap-2 text-lg">
            <Dot active={realtime} />
            {realtime ? "Activo" : "Pausado"}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-white/60">
            Rango seleccionado
          </div>
          <div className="mt-2 text-3xl font-semibold">
            {rangeMinutes === 60 ? "1h" : `${rangeMinutes}m`}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-white/60">
            Máx. puntos por gráfica
          </div>
          <div className="mt-2 text-3xl font-semibold">{maxPoints}</div>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-medium">Ir a Sesiones</div>
            <div className="text-sm text-white/60">
              Ver y buscar todas las sesiones activas.
            </div>
          </div>
          <Link
            to="/sessions"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-white/15 bg-white/5 hover:bg-white/10"
          >
            <Activity className="h-4 w-4" />
            Abrir
          </Link>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-medium">Configuración</div>
            <div className="text-sm text-white/60">
              Ajusta rangos, alertas y apariencia.
            </div>
          </div>
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-white/15 bg-white/5 hover:bg-white/10"
          >
            <Settings className="h-4 w-4" />
            Abrir
          </Link>
        </Card>
      </div>

      {/* Sesiones recientes */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs uppercase tracking-wide text-white/60">
            Sesiones recientes
          </div>
          <Link
            to="/sessions"
            className="text-xs text-white/70 hover:text-white inline-flex items-center gap-1"
          >
            Ver todas <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-white/10 bg-white/5 p-3"
              >
                <div className="animate-pulse space-y-2">
                  <div className="h-4 w-1/2 bg-white/10 rounded" />
                  <div className="h-3 w-2/3 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : recent.length === 0 ? (
          <div className="text-sm text-white/60">
            No hay sesiones activas por ahora.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border border-white/10 bg-white/5 p-3 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{s.panelId}</div>
                  <div className="text-xs text-white/60 truncate">
                    ID: {String(s.id).slice(0, 12)}…
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/session/${s.id}`)}
                  className="px-2.5 py-1.5 rounded-md text-xs border border-indigo-400/30 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-200"
                >
                  Ver
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
