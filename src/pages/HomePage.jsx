import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Activity } from "lucide-react";
import { getActiveSessions } from "@/services/sessionService";

const HomePage = ({ onSelectSession }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveSessions()
      .then((res) => setSessions(res))
      .catch((err) => console.error("Error fetching sessions", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 to-zinc-900 text-zinc-100 px-4 py-8 md:px-10">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold flex items-center gap-2 text-indigo-300">
          <Activity className="text-indigo-400" size={28} />
          Active Cleaning Sessions
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Select an active session to monitor its real-time data and
          predictions.
        </p>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-10 w-10 text-indigo-300 animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-zinc-400">No active sessions found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className="bg-white/5 backdrop-blur border border-white/10 rounded-lg shadow-md hover:shadow-indigo-400/20 transition-all duration-300"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-indigo-200 truncate">
                  {session.panelId}
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Session ID: {session.id.slice(0, 12)}...
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-zinc-300 space-y-3">
                <div>
                  <p className="text-xs text-zinc-400">Started at</p>
                  <p>{new Date(session.startTime).toLocaleString()}</p>
                </div>
                <Button
                  onClick={() => onSelectSession(session.id)}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-sm"
                >
                  View Session
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
