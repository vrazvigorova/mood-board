export function HistorySkeleton() {
  return (
    <div className="animate-pulse p-4 border border-gray-800 rounded-xl bg-gray-900">
      <div className="h-3 bg-gray-700 rounded w-28 mb-3" />
      <div className="flex flex-col gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gray-700" />
            <div className="h-3 bg-gray-800 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
