import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { BottomNav } from "@/components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brain — your commitments",
  description: "Swipe through what you committed to. Never write it down again.",
};

export const viewport: Viewport = {
  themeColor: "#f6f7f9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <StoreProvider>
          <div className="mx-auto flex min-h-dvh max-w-md flex-col">
            <main className="flex-1 pb-20">{children}</main>
            <BottomNav />
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
