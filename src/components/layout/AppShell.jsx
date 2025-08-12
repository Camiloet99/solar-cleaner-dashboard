import { Link, NavLink, Outlet } from "react-router-dom";
import { Activity, Pause } from "lucide-react";
import { useUI } from "@/context/UIContext";

const NavItem = ({ to, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `block px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive
          ? "bg-white/10 text-white"
          : "text-white/70 hover:text-white hover:bg-white/5"
      }`
    }
  >
    {label}
  </NavLink>
);

export default function AppShell() {
  const {
    realtime,
    setRealtime,
    rangeMinutes,
    setRangeMinutes,
    maxPoints,
    setMaxPoints,
    pointOptions,
  } = useUI();

  return (
    <div className="min-h-screen app-surface bg-[hsl(var(--bg))] text-[hsl(var(--fg))]">
      <header className="sticky top-0 z-30 backdrop-blur bg-zinc-950/60 border-b border-white/10">
        <div className="container mx-auto max-w-[1400px] px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-semibold tracking-tight">
            Telemetry Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRealtime((v) => !v)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                realtime
                  ? "border-emerald-400/30 bg-emerald-400/10"
                  : "border-white/20 bg-white/5 hover:bg-white/10"
              }`}
              title="Realtime ON/OFF"
            >
              {realtime ? <Activity size={16} /> : <Pause size={16} />}{" "}
              {realtime ? "Realtime ON" : "Realtime OFF"}
            </button>
            <div className="flex items-center gap-1" title="Rango temporal">
              {[5, 15, 60].map((m) => (
                <button
                  key={m}
                  onClick={() => setRangeMinutes(m)}
                  className={`px-2.5 py-1.5 rounded-md text-xs border transition-colors ${
                    rangeMinutes === m
                      ? "border-white/40 bg-white/10"
                      : "border-white/10 hover:bg-white/5"
                  }`}
                >
                  {m === 60 ? "1h" : `${m}m`}
                </button>
              ))}
            </div>
            <div
              className="flex items-center gap-1"
              title="Máximo de puntos en gráficos"
            >
              {pointOptions.map((p) => (
                <button
                  key={p}
                  onClick={() => setMaxPoints(p)}
                  className={`px-2.5 py-1.5 rounded-md text-xs border transition-colors ${
                    maxPoints === p
                      ? "border-white/40 bg-white/10"
                      : "border-white/10 hover:bg-white/5"
                  }`}
                >
                  {p}
                </button>
              ))}
              <span className="text-[11px] text-white/50 ml-1">pts</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-[1400px] px-4 py-6 grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <nav className="p-3 rounded-xl bg-white/5 border border-white/10">
            <NavItem to="/dashboard" label="Dashboard" />
            <NavItem to="/sessions" label="Sesiones" />
            <NavItem to="/settings" label="Configuración" />
          </nav>
        </aside>

        <main className="col-span-12 md:col-span-9 lg:col-span-10">
          {/* ← aquí se pintan las páginas */}
          <Outlet />
        </main>
      </div>

      <footer className="py-6 text-center text-xs text-white/50">
        <div className="container mx-auto max-w-[1400px] px-4">
          © {new Date().getFullYear()} – Telemetry
        </div>
      </footer>
    </div>
  );
}
