import { createContext, useContext, useMemo, useState } from "react";
import { useOptionalConfig } from "@/context/ConfigContext";

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const cfg = useOptionalConfig();

  const defaultRealtime = cfg?.config?.data?.defaultRealtime ?? true;
  const defaultRanges = cfg?.config?.data?.ranges ?? [5, 15, 60];
  const defaultMaxPoints = cfg?.config?.charts?.maxPoints ?? 15; // si no existe en config, usa 15

  const [realtime, setRealtime] = useState(defaultRealtime);
  const [rangeMinutes, setRangeMinutes] = useState(defaultRanges[1] ?? 15);
  const [maxPoints, setMaxPoints] = useState(defaultMaxPoints); // 10 | 15 | 20

  const value = useMemo(
    () => ({
      realtime,
      setRealtime,
      rangeMinutes,
      setRangeMinutes,
      ranges: defaultRanges,
      maxPoints,
      setMaxPoints,
      pointOptions: [10, 15, 20],
    }),
    [realtime, rangeMinutes, defaultRanges, maxPoints]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
}
