import React, { useMemo } from "react";
import { useUI } from "@/context/UIContext";
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
  const { maxPoints } = useUI();

  const data = useMemo(() => {
    const mapped = readings.map(mapReading);
    // Limita a los últimos N puntos
    return mapped.length > maxPoints ? mapped.slice(-maxPoints) : mapped;
  }, [readings, maxPoints]);

  const commonGrid = (
    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--fg) / .15)" />
  );
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
      {/* Potencia */}
      <Card title="Potencia (W)">
        <LineChart data={data}>
          {commonGrid}
          {commonXAxis}
          <YAxis stroke="hsl(var(--fg) / .6)" />
          {commonTooltip}
          <Line
            type="monotone"
            dataKey="power"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </Card>

      {/* Temperatura & Humedad */}
      <Card title="Temperatura (°C) & Humedad (%)">
        <LineChart data={data}>
          {commonGrid}
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
            type="monotone"
            dataKey="temperature"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="humidity"
            stroke="hsl(var(--chart-3))"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </Card>

      {/* Polvo */}
      <Card title="Polvo (ppm)">
        <LineChart data={data}>
          {commonGrid}
          {commonXAxis}
          <YAxis stroke="hsl(var(--fg) / .6)" />
          {commonTooltip}
          <Line
            type="monotone"
            dataKey="dust"
            stroke="hsl(var(--chart-4))"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </Card>

      {/* Vibración & Riesgo */}
      <Card title="Vibración (m/s²) & Riesgo de microfractura (0–1)">
        <LineChart data={data}>
          {commonGrid}
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
            type="monotone"
            dataKey="vibration"
            stroke="hsl(var(--chart-5))"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="risk"
            stroke="hsl(var(--chart-3))"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </Card>
    </div>
  );
}
