import { Suspense } from "react";
import { RoomInfo } from "@/components/RoomInfo";
import { ParticipantsList } from "@/components/ParticipantsList";
import { EmojiHistory } from "@/components/EmojiHistory";
import { MoodBoard } from "@/components/MoodBoard";
import { RoomInfoSkeleton } from "@/components/skeletons/RoomInfoSkeleton";
import { ParticipantsSkeleton } from "@/components/skeletons/ParticipantsSkeleton";
import { HistorySkeleton } from "@/components/skeletons/HistorySkeleton";
interface PageProps {
  params: Promise<{ roomId: string }>;
}
export default async function RoomPage({ params }: PageProps) {
  const { roomId } = await params;
  return (
    <>
      <div className="fixed top-0 left-0 h-full w-72 bg-gray-900/95 backdrop-blur border-r border-gray-800 z-40 p-4 flex flex-col gap-3 overflow-y-auto">
        <div className="mb-2">
          <h1 className="text-white font-bold text-base tracking-tight">
            Mood Board
          </h1>
          <p className="text-gray-500 text-xs">Room: {roomId}</p>
        </div>
        <Suspense fallback={<RoomInfoSkeleton />}>
          <RoomInfo roomId={roomId} />
        </Suspense>
        <Suspense fallback={<ParticipantsSkeleton />}>
          <ParticipantsList roomId={roomId} />
        </Suspense>
        <Suspense fallback={<HistorySkeleton />}>
          <EmojiHistory roomId={roomId} />
        </Suspense>
      </div>
      <MoodBoard roomId={roomId} />
    </>
  );
}
