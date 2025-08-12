export default function ChartSkeleton({ height = 256 }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="animate-pulse" style={{ height }}>
        <div className="h-full bg-white/10" />
      </div>
    </div>
  );
}
