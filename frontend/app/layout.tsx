import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import "./extra.css";
import { cn } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Toaster } from "sonner";

// Force rebuild to clear cache
const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "AMFOFANA HIGH SCHOOL",
  description: "Excellence in Education. Future Leaders in the Making.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <div className="relative min-h-screen">
          <Navbar />
          <main className="h-full w-full">{children}</main>
          <Footer />
        </div>
        <Toaster richColors />
      </body>
    </html>
  );
}
