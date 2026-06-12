import { createSchema, createYoga } from "graphql-yoga";
import { NextRequest, NextResponse } from "next/server";
import { getRoomInfo, getParticipants, getEmojiHistory } from "@/lib/data";

const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type RoomInfo {
      id: ID!
      name: String!
      createdAt: String!
      owner: String!
    }

    type Participant {
      userId: String!
      color: String!
      joinedAt: String!
    }

    type EmojiDrop {
      id: ID!
      userId: String!
      emoji: String!
      x: Float!
      y: Float!
    }

    type Query {
      roomInfo(roomId: ID!): RoomInfo
      participants(roomId: ID!): [Participant!]!
      emojiHistory(roomId: ID!): [EmojiDrop!]!
    }
  `,
  resolvers: {
    Query: {
      roomInfo: (_: unknown, { roomId }: { roomId: string }) =>
        getRoomInfo(roomId),
      participants: (_: unknown, { roomId }: { roomId: string }) =>
        getParticipants(roomId),
      emojiHistory: (_: unknown, { roomId }: { roomId: string }) =>
        getEmojiHistory(roomId),
    },
  },
});

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response },
});

// Cast to Next.js Route Handler signature to avoid version-specific type conflicts
const handler = (req: NextRequest) =>
  yoga.handleRequest(req, {}) as Promise<NextResponse>;

export { handler as GET, handler as POST, handler as OPTIONS };
