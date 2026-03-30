import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getClinicSettings } from "@/lib/data";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  variable: "--font-clinic-sans",
  subsets: ["latin"],
});

const display = Fraunces({
  variable: "--font-clinic-display",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const clinic = await getClinicSettings();

  return {
    title: {
      default: clinic.name,
      template: `%s | ${clinic.name}`,
    },
    description:
      "Book doctor consultations online, request appointment tokens, and manage approvals for Webappzz Clinic.",
  };
}

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} min-h-full scroll-smooth`}
    >
      <body className="min-h-full bg-[var(--paper)] text-[var(--ink)] antialiased">
        <div className="relative flex min-h-screen flex-col overflow-hidden">
          <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),transparent_58%),linear-gradient(180deg,rgba(255,248,240,0.96),rgba(247,243,234,0.72)_46%,rgba(247,243,234,0.98))]" />
          <div className="absolute left-[-120px] top-[120px] -z-10 h-80 w-80 rounded-full bg-[rgba(239,68,68,0.09)] blur-3xl" />
          <div className="absolute right-[-80px] top-[240px] -z-10 h-72 w-72 rounded-full bg-[rgba(250,204,21,0.16)] blur-3xl" />
          <SiteHeader />
          <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-14 pt-6 sm:px-6 lg:px-8">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
