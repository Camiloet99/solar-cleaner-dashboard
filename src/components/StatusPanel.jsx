// src/components/StatusPanel.jsx
import React from "react";

const StatusPanel = ({ avg, last }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
        <p className="text-sm text-zinc-400">Temperature (avg)</p>
        <p className="text-xl font-bold text-indigo-300">
          {avg("temperature")} °C
        </p>
      </div>
      <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
        <p className="text-sm text-zinc-400">Humidity (avg)</p>
        <p className="text-xl font-bold text-indigo-300">{avg("humidity")} %</p>
      </div>
      <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
        <p className="text-sm text-zinc-400">Dust Level (avg)</p>
        <p className="text-xl font-bold text-indigo-300">
          {avg("dust_level")} %
        </p>
      </div>
      <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
        <p className="text-sm text-zinc-400">Last Reading</p>
        <p className="text-xs text-zinc-300">
          {last?.timestamp?.slice(11, 19) || "-"}
        </p>
      </div>
    </div>
  );
};

export default StatusPanel;
