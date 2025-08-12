import { useEffect, useMemo, useState } from "react";

const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

function toEpochMs(input) {
  if (input == null) return null;
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (input instanceof Date) return Number.isFinite(input.getTime()) ? input.getTime() : null;
  if (typeof input === "string") {
    const n = Date.parse(input);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export default function useRelativeTime(tsLike) {
  const [now, setNow] = useState(() => Date.now());
  const target = useMemo(() => toEpochMs(tsLike), [tsLike]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (target == null) return "—";

  const diffMs = target - now;
  const abs = Math.abs(diffMs);

  if (abs < 60_000) return rtf.format(Math.round(diffMs / 1000), "seconds");
  if (abs < 3_600_000) return rtf.format(Math.round(diffMs / 60_000), "minutes");
  if (abs < 86_400_000) return rtf.format(Math.round(diffMs / 3_600_000), "hours");
  return rtf.format(Math.round(diffMs / 86_400_000), "days");
}
