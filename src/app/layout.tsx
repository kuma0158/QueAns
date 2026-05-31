import type { Metadata } from "next";
import "./globals.css";
import { getCurrentUser } from "@/lib/session";
import { TopNav } from "@/components/TopNav";

export const metadata: Metadata = {
  title: "QueAns - 社員研修QA管理",
  description: "社員研修のQ&A管理システム",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="ja">
      <body>
        <TopNav user={user} />
        <main className="mx-auto max-w-7xl p-6">{children}</main>
      </body>
    </html>
  );
}
