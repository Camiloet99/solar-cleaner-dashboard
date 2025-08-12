export default function ErrorState({
  title = "Error al cargar",
  message = "Intenta nuevamente.",
  onRetry,
}) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
      <div className="text-sm font-medium text-red-200 mb-1">{title}</div>
      <div className="text-sm text-red-300/80 mb-4">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 rounded-lg text-sm border border-red-400/40 bg-red-400/10 hover:bg-red-400/20"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
