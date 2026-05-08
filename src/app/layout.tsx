import type { Metadata } from "next";
import { Rajdhani, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";
import { EventJsonLd, WebsiteJsonLd } from "@/components/json-ld";

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
  metadataBase: new URL("https://predicciones.tebimedia.com"),
  title: {
    default: "Predicciones BLAST R6 Major Salt Lake City 2026 | Rainbow Six Siege",
    template: "%s | Predicciones R6 Major SLC 2026",
  },
  description: "Predice los ganadores del BLAST R6 Major Salt Lake City 2026, compite en el leaderboard y gana premios exclusivos. Rainbow Six Siege esports predictions.",
  keywords: [
    "Rainbow Six Siege", "R6 Siege", "BLAST Major", "Salt Lake City 2026",
    "predicciones", "predictions", "esports", "pick'em", "leaderboard",
    "R6 Major", "BLAST R6", "Rainbow Six esports", "SLC 2026",
    "FaZe Clan", "G2 Esports", "FURIA", "DarkZero", "Virtus.pro",
    "Tebimedia", "TebiiR6",
  ],
  authors: [{ name: "Tebimedia", url: "https://x.com/TebiiR6" }],
  creator: "Tebimedia",
  openGraph: {
    title: "Predicciones BLAST R6 Major Salt Lake City 2026",
    description: "Predice los ganadores del Major de Rainbow Six Siege y compite por un premio exclusivo. 20 equipos, fase de grupos a playoffs.",
    type: "website",
    locale: "es_ES",
    siteName: "Predicciones R6 Major SLC 2026",
    url: "https://predicciones.tebimedia.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Predicciones BLAST R6 Major SLC 2026",
    description: "Predice los ganadores del Major de R6 Siege y compite en el ranking",
    creator: "@TebiiR6",
    site: "@TebiiR6",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://predicciones.tebimedia.com",
  },
  icons: {
    icon: "/fantasix_logoW.png",
    apple: "/fantasix_logoW.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <EventJsonLd />
        <WebsiteJsonLd />
      </head>
      <body className={`${inter.variable} ${rajdhani.variable} min-h-screen flex flex-col font-body bg-bg text-text`}>
        <Header />
        <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full">
          {children}
        </main>
        <footer className="border-t border-border/50 mt-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-accent/0 via-accent/20 to-accent/0" />
          <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 opacity-50">
                <img src="/fantasix_logoW.png" alt="" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-text-secondary text-xs font-heading font-bold tracking-widest uppercase">
                  Predicciones R6 Major SLC 2026
                </p>
                <p className="text-muted text-[10px] tracking-wider mt-0.5">
                  Hecho con amor por Tebimedia
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <a
                href="https://x.com/TebiiR6"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-accent transition text-xs flex items-center gap-1.5 group"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                @TebiiR6
              </a>
              <a
                href="https://twitch.tv/tebi10"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-accent transition text-xs flex items-center gap-1.5 group"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                </svg>
                tebi10
              </a>
            </div>
          </div>
        </footer>
        <Toaster position="top-center" theme="dark" toastOptions={{ className: 'font-heading font-bold tracking-widest uppercase' }} />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
