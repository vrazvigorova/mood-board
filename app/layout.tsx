import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ApolloWrapper } from "@/lib/apollo-client";
import "./globals.css";
const inter = Inter({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "Mood Board",
  description: "Live collaborative mood board",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className + " bg-gray-950 min-h-screen"}>
        <ApolloWrapper>{children}</ApolloWrapper>
      </body>
    </html>
  );
}
