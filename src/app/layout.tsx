import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "../components/app-shell";
import { getCurrentUser } from "./actions";

export const metadata: Metadata = {
  title: "قَيْد OS | الخواض لخدمات الطباعة",
  description: "نظام إدارة التشغيل، الفواتير، نقاط البيع، والعقود لمطبعة الخواض",
  icons: {
    icon: "/icon.svg",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getCurrentUser();

  return (
    <html lang="ar" dir="rtl" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F4FAF9] text-[#142826] font-sans antialiased selection:bg-[#FFD23F] selection:text-[#1E4D48]">
        <AppShell sessionUser={sessionUser}>{children}</AppShell>
      </body>
    </html>
  );
}
