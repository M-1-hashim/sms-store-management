import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "سیستم مدریتی فروشگاه",
  description: "سیستم جامع مدیریت فروشگاه - مدیریت موجودی، فروش، مشتریان و گزارش‌ها",
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground font-sans">
        {children}
        <Toaster position="top-left" dir="rtl" />
      </body>
    </html>
  );
}
