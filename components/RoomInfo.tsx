import { gqlFetch } from "@/lib/graphql";
import { RoomInfo as RoomInfoType } from "@/types";
const QUERY = `query GetRoomInfo($roomId: ID!) { roomInfo(roomId: $roomId) { id name createdAt owner } }`;
export async function RoomInfo({ roomId }: { roomId: string }) {
  const { roomInfo } = await gqlFetch<{ roomInfo: RoomInfoType }>(QUERY, {
    roomId,
  });
  const date = new Date(roomInfo.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    <div className="p-4 border border-gray-800 rounded-xl bg-gray-900">
      <h2 className="text-white font-semibold text-lg">{roomInfo.name}</h2>
      <p className="text-gray-400 text-sm mt-1">
        Created {date} · Owner:{" "}
        <span className="text-gray-300">{roomInfo.owner}</span>
      </p>
    </div>
  );
}
