import { RoomInfoSkeleton } from "@/components/skeletons/RoomInfoSkeleton";
import { ParticipantsSkeleton } from "@/components/skeletons/Participants Skeleton";
import { HistorySkeleton } from "@/components/skeletons/HistorySkeleton";
export default function Loading() {
  return (
    <div className="fixed top-0 left-0 h-full w-72 bg-gray-900/95 backdrop-blur border-r border-gray-800 z-40 p-4 flex flex-col gap-3">
      <div className="mb-2">
        <div className="h-5 bg-gray-700 rounded w-28 animate-pulse mb-1" />
        <div className="h-3 bg-gray-800 rounded w-16 animate-pulse" />
      </div>
      <RoomInfoSkeleton />
      <ParticipantsSkeleton />
      <HistorySkeleton />
    </div>
  );
}
