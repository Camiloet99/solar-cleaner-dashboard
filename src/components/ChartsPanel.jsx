// src/components/ChartsPanel.jsx
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";

const ChartsPanel = ({ readings }) => {
  return (
    <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      <ChartWrapper title="Temperature (°C)">
        <LineChart data={readings}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="timestamp" tick={false} />
          <YAxis domain={[20, 60]} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartWrapper>

      <ChartWrapper title="Humidity (%)">
        <AreaChart data={readings}>
          <defs>
            <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#67e8f9" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#67e8f9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="timestamp" tick={false} />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="humidity"
            stroke="#67e8f9"
            fillOpacity={1}
            fill="url(#colorHum)"
          />
        </AreaChart>
      </ChartWrapper>

      <ChartWrapper title="Dust Level (%)">
        <AreaChart data={readings}>
          <XAxis dataKey="timestamp" tick={false} />
          <YAxis domain={[20, 60]} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="dust_level"
            stroke="#facc15"
            fill="#facc1544"
            fillOpacity={0.4}
          />
        </AreaChart>
      </ChartWrapper>

      <ChartWrapper title="Power Output (W)">
        <LineChart data={readings}>
          <XAxis dataKey="timestamp" tick={false} />
          <YAxis domain={[100, 180]} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="power_output"
            stroke="#34d399"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartWrapper>

      <ChartWrapper title="Vibration (m/s²)">
        <BarChart data={readings}>
          <XAxis dataKey="timestamp" tick={false} />
          <YAxis domain={[0, 0.2]} />
          <Tooltip />
          <Bar dataKey="vibration" fill="#f472b6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartWrapper>

      <ChartWrapper title="Micro-Fracture Risk (%)">
        <AreaChart data={readings}>
          <defs>
            <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f87171" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="timestamp" tick={false} />
          <YAxis domain={[0, 1]} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="micro_fracture_risk"
            stroke="#f87171"
            fillOpacity={1}
            fill="url(#colorRisk)"
          />
        </AreaChart>
      </ChartWrapper>
    </div>
  );
};

const ChartWrapper = ({ title, children }) => (
  <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
    <h2 className="text-lg mb-2 font-medium text-indigo-300">{title}</h2>
    <ResponsiveContainer width="100%" height={200}>
      {children}
    </ResponsiveContainer>
  </div>
);

export default ChartsPanel;
