import { gqlFetch } from "@/lib/graphql";
import { EmojiDrop } from "@/types";
const QUERY = `query GetEmojiHistory($roomId: ID!) { emojiHistory(roomId: $roomId) { id userId emoji x y } }`;
export async function EmojiHistory({ roomId }: { roomId: string }) {
  const { emojiHistory } = await gqlFetch<{ emojiHistory: EmojiDrop[] }>(
    QUERY,
    { roomId },
  );
  return (
    <div className="p-4 border border-gray-800 rounded-xl bg-gray-900">
      <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">
        Recent drops ({emojiHistory.length})
      </p>
      <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
        {emojiHistory.map((drop) => (
          <div key={drop.id} className="flex items-center gap-2 text-sm">
            <span className="text-lg">{drop.emoji}</span>
            <span className="text-gray-500 text-xs">
              {drop.userId} · ({Math.round(drop.x)}, {Math.round(drop.y)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
