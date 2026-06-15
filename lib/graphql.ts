export async function gqlFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  // When running on the server (Server Components inside Docker),
  // we can't use localhost — we need the internal container URL.
  // NEXT_PUBLIC_APP_URL is set in compose.yaml for Docker,
  // falls back to localhost:3000 for local dev outside Docker.
  const baseUrl =
    typeof window === "undefined"
      ? (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
      : "";

  const res = await fetch(`${baseUrl}/api/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`GraphQL request failed: ${res.status}`);

  const { data, errors } = await res.json();

  if (errors?.length)
    throw new Error(
      `GraphQL errors: ${errors.map((e: { message: string }) => e.message).join(", ")}`,
    );

  return data as T;
}
