export default function EmptyState({
  title = "Sin datos",
  message = "No hay información para mostrar.",
  ctaLabel,
  onCta,
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
      <div className="text-lg font-medium mb-1">{title}</div>
      <div className="text-sm text-white/60 mb-4">{message}</div>
      {ctaLabel && (
        <button
          onClick={onCta}
          className="px-3 py-1.5 rounded-lg text-sm border border-white/20 bg-white/10 hover:bg-white/15"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
