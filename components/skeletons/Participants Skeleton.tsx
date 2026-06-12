export function ParticipantsSkeleton() {
  return (
    <div className="animate-pulse p-4 border border-gray-800 rounded-xl bg-gray-900">
      <div className="h-3 bg-gray-700 rounded w-24 mb-3" />
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-8 h-8 rounded-full bg-gray-700" />
        ))}
      </div>
    </div>
  );
}
