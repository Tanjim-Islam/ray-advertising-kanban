import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import Script from "next/script";

import { AppProviders } from "@/components/providers/app-providers";
import { COLOR_MODE_STORAGE_KEY } from "@/lib/utils/theme";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ray Board",
  description: "Collaborative task management board",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-[var(--surface)] font-sans text-[var(--text-primary)] antialiased transition-colors duration-300">
        <Script id="ray-color-mode" strategy="beforeInteractive">
          {`
            (function () {
              try {
                const stored = window.localStorage.getItem("${COLOR_MODE_STORAGE_KEY}");
                const resolved =
                  stored === "dark" || stored === "light"
                    ? stored
                    : window.matchMedia("(prefers-color-scheme: dark)").matches
                      ? "dark"
                      : "light";
                document.documentElement.dataset.theme = resolved;
              } catch (error) {
                document.documentElement.dataset.theme = "light";
              }
            })();
          `}
        </Script>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
