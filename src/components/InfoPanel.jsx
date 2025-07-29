// src/components/InfoPanel.jsx
import React from "react";
import { AlertTriangle, MapPin, Info } from "lucide-react";

const InfoPanel = ({ last, logs }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
      <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <MapPin className="w-4 h-4 text-indigo-300" /> Current Location
        </div>
        <p className="text-sm mt-1 text-indigo-200">
          Lat: {last?.location?.lat ?? "-"} <br />
          Lng: {last?.location?.lng ?? "-"}
        </p>
      </div>

      <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Info className="w-4 h-4 text-indigo-300" /> Adjustment Recommendation
        </div>
        <p className="text-sm mt-1 text-indigo-200">
          {last?.adjustment ?? "No adjustments recommended."}
        </p>
      </div>

      <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 overflow-auto max-h-40">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <AlertTriangle className="w-4 h-4 text-indigo-300" /> Alerts & Logs
        </div>
        <ul className="mt-2 text-sm space-y-1">
          {logs.length === 0 ? (
            <li className="text-zinc-400 italic">No alerts registered.</li>
          ) : (
            logs.map((log, index) => (
              <li
                key={index}
                className={
                  log.type === "ALERT" ? "text-red-400" : "text-zinc-300"
                }
              >
                [{log.timestamp?.slice(11, 19)}] {log.message}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default InfoPanel;
