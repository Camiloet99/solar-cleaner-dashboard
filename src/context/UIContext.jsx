// src/context/UIContext.jsx
import { createContext, useContext, useMemo, useState } from "react";

const UIContext = createContext(null);

export function UIProvider({ children }) {
  // Estados globales de UI
  const [realtime, setRealtime] = useState(true);
  const [rangeMinutes, setRangeMinutes] = useState(15); // 5 / 15 / 60 (topbar)
  const [maxPoints, setMaxPoints] = useState(15); // 10 / 15 / 20 (topbar)
  const pointOptions = [10, 15, 20];

  const value = useMemo(
    () => ({
      realtime,
      setRealtime,
      rangeMinutes,
      setRangeMinutes,
      maxPoints,
      setMaxPoints,
      pointOptions,
    }),
    [realtime, rangeMinutes, maxPoints]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
}

export { UIContext };
