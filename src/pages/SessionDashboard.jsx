// src/pages/SessionDashboard.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  subscribeToSessionTelemetry,
  unsubscribeFromTelemetry,
} from "@/services/telemetryService";
import InfoPanel from "@/components/InfoPanel";
import StatusPanel from "@/components/StatusPanel";
import ChartsPanel from "@/components/ChartsPanel";

const SessionDashboard = () => {
  const { sessionId } = useParams();
  const [readings, setReadings] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handler = (newReading) => {
      setReadings((prev) => [...prev.slice(-14), newReading]);

      if (newReading.micro_fracture_risk > 0.6) {
        setLogs((prev) => [
          {
            type: "ALERT",
            message: `High micro-fracture risk (${newReading.micro_fracture_risk})`,
            timestamp: newReading.timestamp,
          },
          ...prev.slice(0, 19),
        ]);
      } else if (newReading.dust_level > 55) {
        setLogs((prev) => [
          {
            type: "INFO",
            message: `Dust level elevated: ${newReading.dust_level}`,
            timestamp: newReading.timestamp,
          },
          ...prev.slice(0, 19),
        ]);
      }
    };
    subscribeToSessionTelemetry(sessionId, handler);
    setLoading(false);
    return () => unsubscribeFromTelemetry();
  }, [sessionId]);

  const last = readings[readings.length - 1];

  const avg = (key) => {
    const sum = readings.reduce((acc, r) => acc + (r[key] || 0), 0);
    return readings.length > 0 ? (sum / readings.length).toFixed(2) : "-";
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <h1 className="text-3xl font-semibold mb-6 text-indigo-400">
        Monitoring Session: <span className="text-white">{sessionId}</span>
      </h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-10 w-10 text-indigo-300 animate-spin" />
        </div>
      ) : (
        <>
          <StatusPanel avg={avg} last={last} />
          <InfoPanel last={last} logs={logs} />
          <ChartsPanel readings={readings} />
        </>
      )}
    </div>
  );
};

export default SessionDashboard;
