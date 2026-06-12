import { gqlFetch } from "@/lib/graphql";
import { Participant } from "@/types";
const QUERY = `query GetParticipants($roomId: ID!) { participants(roomId: $roomId) { userId color joinedAt } }`;
export async function ParticipantsList({ roomId }: { roomId: string }) {
  const { participants } = await gqlFetch<{ participants: Participant[] }>(
    QUERY,
    { roomId },
  );
  return (
    <div className="p-4 border border-gray-800 rounded-xl bg-gray-900">
      <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">
        Participants ({participants.length})
      </p>
      <div className="flex gap-2 flex-wrap">
        {participants.map((p) => (
          <div
            key={p.userId}
            className="flex items-center gap-2 bg-gray-800 rounded-full px-3 py-1"
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-gray-300 text-xs">{p.userId}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
