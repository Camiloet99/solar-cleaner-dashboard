import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Activity, RefreshCw, Search, Copy } from "lucide-react";
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

export default function HomePage({ onSelectSession }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const ago = useRelativeTime(lastUpdated);

  const fetchSessions = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
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
    fetchSessions(true);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = sessions
      .slice()
      .sort(
        (a, b) => new Date(b?.startTime ?? 0) - new Date(a?.startTime ?? 0)
      );
    if (!q) return base;
    return base.filter(
      (s) =>
        String(s?.panelId ?? "")
          .toLowerCase()
          .includes(q) ||
        String(s?.id ?? "")
          .toLowerCase()
          .includes(q)
    );
  }, [sessions, query]);

  const copyId = async (id) => {
    try {
      await navigator.clipboard.writeText(String(id ?? ""));
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Active Cleaning Sessions
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Selecciona una sesión activa para monitorear datos en tiempo real y
            predicciones.
          </p>
          <div className="mt-2 text-xs text-white/50">
            {loading ? "Cargando…" : `${filtered.length} sesiones activas`}
            {lastUpdated && <> · Actualizado {ago}</>}
          </div>
        </div>

        {/* Actions: search + refresh */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por panel o ID…"
              className="pl-8 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
            />
          </div>
          <Button
            onClick={() => fetchSessions(false)}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15"
            variant="ghost"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* States */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-5 w-1/2 bg-white/10 rounded" />
                <div className="h-3 w-2/3 bg-white/10 rounded" />
                <div className="h-3 w-1/3 bg-white/10 rounded" />
                <div className="h-8 w-full bg-white/10 rounded mt-4" />
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-6 border-red-500/30 bg-red-500/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-red-200">
                Error al cargar
              </div>
              <div className="text-sm text-red-200/80">{error}</div>
            </div>
            <Button
              onClick={() => fetchSessions(true)}
              className="bg-red-400/20 hover:bg-red-400/30 border border-red-400/30"
            >
              Reintentar
            </Button>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-lg font-medium mb-1">
            No hay sesiones activas
          </div>
          <div className="text-sm text-white/60 mb-4">
            Conecta una fuente de telemetría o refresca la vista.
          </div>
          <Button
            onClick={() => fetchSessions(true)}
            className="bg-indigo-500 hover:bg-indigo-600"
          >
            Buscar de nuevo
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((session) => {
            const startedAt = new Date(session?.startTime ?? 0);
            const shortId = String(session?.id ?? "").slice(0, 12);
            return (
              <Card
                key={session?.id}
                className="group overflow-hidden transition-shadow hover:shadow-lg"
              >
                <div className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-indigo-200 text-lg font-medium truncate">
                        {session?.panelId ?? "—"}
                      </div>
                      <div className="text-xs text-white/50 mt-0.5 flex items-center gap-1">
                        ID: {shortId}…
                        <button
                          onClick={() => copyId(session?.id)}
                          className="p-1 rounded hover:bg-white/10"
                          title="Copiar ID"
                        >
                          <Copy className="h-3.5 w-3.5 text-white/60" />
                        </button>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] border border-emerald-400/30 bg-emerald-400/10 text-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      LIVE
                    </span>
                  </div>
                </div>

                <div className="px-4 pt-2 pb-4 text-sm text-white/80">
                  <div className="text-xs text-white/60">Started at</div>
                  <div>
                    {isNaN(startedAt) ? "—" : startedAt.toLocaleString()}
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <Button
                    onClick={() => onSelectSession?.(session?.id)}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-sm"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Ver sesión
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
