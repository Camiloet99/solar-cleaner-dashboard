// src/components/Header.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

const Header = () => {
  const [sessionId, setSessionId] = useState("");
  const navigate = useNavigate();

  const goToSession = () => {
    if (sessionId.trim()) {
      navigate(`/session/${sessionId.trim()}`);
      setSessionId("");
    }
  };

  return (
    <header className="bg-zinc-900 text-white border-b border-zinc-800 shadow flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-8">
        <Link
          to="/"
          className="text-xl font-bold text-indigo-300 hover:text-indigo-400"
        >
          Dashboard
        </Link>
        <Link to="/about" className="text-sm hover:text-indigo-300">
          About Us
        </Link>
        <Link to="/historic" className="text-sm hover:text-indigo-300">
          Historic
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          className="p-2 rounded bg-zinc-800 text-sm text-white border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Enter session ID"
        />
        <button
          onClick={goToSession}
          className="p-2 bg-indigo-500 rounded text-white hover:bg-indigo-600"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Header;
