import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import "./extra.css";
import { cn } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Toaster } from "sonner";
import CookieConsent from "@/components/CookieConsent";
import { PreferencesProvider } from '@/app/context/PreferencesContext';


// Force rebuild to clear cache
const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "AMFOFANA HIGH SCHOOL",
  description: "Excellence in Education. Future Leaders in the Making.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const preferences = cookieStore.get("preferences");

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
          <main className="h-full w-full">
              <PreferencesProvider initialPreferences={preferences?.value}>
                {children}
              </PreferencesProvider></main>
          <Footer />
          <CookieConsent />
        </div>
        <Toaster richColors />
      </body>
    </html>
  );
}
