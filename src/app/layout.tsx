import type { Metadata } from "next";
import { Rajdhani, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "BLAST R6 Major SLC 2026 - Predicciones",
  description: "Predice los ganadores del BLAST R6 Major Salt Lake City 2026 y compite en el leaderboard",
  openGraph: {
    title: "BLAST R6 Major SLC 2026 - Predicciones",
    description: "Predice los ganadores y compite por un premio exclusivo del Major",
    type: "website",
  },
  icons: {
    icon: "/fantasix_logoW.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${rajdhani.variable} min-h-screen flex flex-col font-body bg-bg text-text`}>
        <Header />
        <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full">
          {children}
        </main>
        <footer className="border-t border-border py-6 mt-12">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-muted text-xs">
              Predicciones BLAST R6 Major SLC 2026 &mdash; By Tebimedia
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://x.com/TebiiR6"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-accent transition text-xs"
              >
                @TebiiR6
              </a>
              <a
                href="https://twitch.tv/tebi10"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-accent transition text-xs"
              >
                twitch.tv/tebi10
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
