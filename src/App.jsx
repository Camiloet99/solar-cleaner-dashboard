import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

import { ConfigProvider } from "@/context/ConfigContext";
import { UIProvider } from "@/context/UIContext";

import AppShell from "@/components/layout/AppShell";
import HomePage from "@/pages/HomePage";
import SessionDashboard from "@/pages/SessionDashboard";
import Configuration from "@/pages/Configuration";
import Dashboard from "./pages/Dashboard";

import { connectWS, disconnectWS } from "@/services/telemetryService";

function SessionsWrapper() {
  const navigate = useNavigate();
  return <HomePage onSelectSession={(id) => navigate(`/session/${id}`)} />;
}

function NotFound() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-xl font-semibold mb-2">No encontrado</h2>
      <p className="text-white/60">La ruta solicitada no existe.</p>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    connectWS();
    return () => disconnectWS();
  }, []);

  return (
    <BrowserRouter>
      <ConfigProvider>
        <UIProvider>
          <Routes>
            <Route element={<AppShell />}>
              {/* "/" → tu Dashboard (HomePage) */}
              <Route index element={<SessionsWrapper />} />
              {/* "/sessions" → misma vista de lista (si quieres un alias) */}
              <Route path="sessions" element={<SessionsWrapper />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="session/:sessionId" element={<SessionDashboard />} />
              <Route path="settings" element={<Configuration />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </UIProvider>
      </ConfigProvider>
    </BrowserRouter>
  );
}
