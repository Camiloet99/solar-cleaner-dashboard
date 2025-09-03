// src/components/ChartsPanel.jsx
import React, { useMemo } from "react";
import { useOptionalConfig } from "@/context/ConfigContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
function mapReading(r) {
  return {
    ts: toEpochMs(r.timestamp ?? r.timestampMs ?? r.ts),
    power: r.powerOutput ?? r.power ?? r.power_output ?? null,
    temperature: r.temperature ?? r.temp ?? null,
    humidity: r.humidity ?? r.rh ?? null,
    dust: r.dustLevel ?? r.dust ?? r.dust_level ?? null,
    vibration: r.vibration ?? r.vib ?? null,
    risk: r.microFractureRisk ?? r.micro_fracture_risk ?? null,
  };
}

const Card = ({ title, children, height = 240 }) => (
  <div className="rounded-xl shadow-md border border-white/10 bg-white/5 p-4">
    <div className="text-xs uppercase tracking-wide text-white/60 mb-2">
      {title}
    </div>
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  </div>
);

export default function ChartsPanel({ readings = [] }) {
  const cfg = useOptionalConfig();
  const c = cfg?.config?.charts ?? {};

  const type = c.smoothing === "linear" ? "linear" : "monotone";
  const strokeWidth = Number.isFinite(+c.strokeWidth) ? +c.strokeWidth : 2;
  const showDots = !!c.showDots;
  const showGrid = c.showGrid !== false; // default true

  const data = useMemo(() => readings.map(mapReading), [readings]);

  const Grid = showGrid ? (
    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--fg) / .15)" />
  ) : null;

  const commonXAxis = (
    <XAxis
      dataKey="ts"
      tickFormatter={(t) => (t ? new Date(t).toLocaleTimeString() : "")}
      stroke="hsl(var(--fg) / .6)"
    />
  );
  const commonTooltip = (
    <Tooltip
      contentStyle={{ background: "rgba(0,0,0,.7)", border: "none" }}
      labelFormatter={(v) => (v ? new Date(v).toLocaleTimeString() : "")}
    />
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1) Potencia */}
      <Card title="Potencia (W)">
        <LineChart data={data}>
          {Grid}
          {commonXAxis}
          <YAxis stroke="hsl(var(--fg) / .6)" />
          {commonTooltip}
          <Line
            type={type}
            dataKey="power"
            stroke="hsl(var(--chart-1))"
            strokeWidth={strokeWidth}
            dot={showDots}
            isAnimationActive={false}
          />
        </LineChart>
      </Card>

      {/* 2) Temperatura & Humedad */}
      <Card title="Temperatura (°C) & Humedad (%)">
        <LineChart data={data}>
          {Grid}
          {commonXAxis}
          <YAxis yAxisId="left" stroke="hsl(var(--fg) / .6)" />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="hsl(var(--fg) / .6)"
          />
          {commonTooltip}
          <Line
            yAxisId="left"
            type={type}
            dataKey="temperature"
            stroke="hsl(var(--chart-2))"
            strokeWidth={strokeWidth}
            dot={showDots}
            isAnimationActive={false}
          />
          <Line
            yAxisId="right"
            type={type}
            dataKey="humidity"
            stroke="hsl(var(--chart-3))"
            strokeWidth={strokeWidth}
            dot={showDots}
            isAnimationActive={false}
          />
        </LineChart>
      </Card>

      {/* 3) Polvo */}
      <Card title="Polvo (ppm)">
        <LineChart data={data}>
          {Grid}
          {commonXAxis}
          <YAxis stroke="hsl(var(--fg) / .6)" />
          {commonTooltip}
          <Line
            type={type}
            dataKey="dust"
            stroke="hsl(var(--chart-4))"
            strokeWidth={strokeWidth}
            dot={showDots}
            isAnimationActive={false}
          />
        </LineChart>
      </Card>

      {/* 4) Vibración & Riesgo */}
      <Card title="Vibración (m/s²) & Riesgo de microfractura (0–1)">
        <LineChart data={data}>
          {Grid}
          {commonXAxis}
          <YAxis yAxisId="left" stroke="hsl(var(--fg) / .6)" />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 1]}
            stroke="hsl(var(--fg) / .6)"
          />
          {commonTooltip}
          <Line
            yAxisId="left"
            type={type}
            dataKey="vibration"
            stroke="hsl(var(--chart-5))"
            strokeWidth={strokeWidth}
            dot={showDots}
            isAnimationActive={false}
          />
          <Line
            yAxisId="right"
            type={type}
            dataKey="risk"
            stroke="hsl(var(--chart-3))"
            strokeWidth={strokeWidth}
            dot={showDots}
            isAnimationActive={false}
          />
        </LineChart>
      </Card>
    </div>
  );
}
