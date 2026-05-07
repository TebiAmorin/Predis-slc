"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

const NAV_LINKS = [
  { href: "/live", label: "Live Stream" },
  { href: "/predicciones", label: "Predicciones" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/historial", label: "Historial" },
];

export function Header() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setUser(data);
      }
      setLoading(false);
    }
    getUser();
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  async function handleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  }

  return (
    <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-r6-red rounded flex items-center justify-center font-heading font-bold text-[11px] text-white">
              R6
            </div>
            <div className="hidden sm:block">
              <h1 className="font-heading font-bold text-sm leading-none tracking-widest text-text">
                BLAST MAJOR SLC
              </h1>
              <p className="text-[9px] text-muted tracking-[0.2em] uppercase">
                Predicciones 2026
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs font-heading font-semibold tracking-wider px-3 py-1.5 rounded transition uppercase ${
                  pathname === link.href
                    ? "text-accent bg-accent-dim"
                    : "text-text-secondary hover:text-text"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://x.com/TebiiR6"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-text transition"
            title="@TebiiR6"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          {loading ? (
            <div className="w-7 h-7 rounded-full bg-border animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2">
              {user.avatar_url && (
                <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full" />
              )}
              <span className="text-xs font-medium hidden sm:block max-w-[100px] truncate">
                {user.display_name || user.username}
              </span>
              {user.is_admin && (
                <Link href="/admin" className="text-[10px] bg-r6-red/20 text-r6-red px-2 py-0.5 rounded font-bold">
                  ADMIN
                </Link>
              )}
              <button onClick={handleLogout} className="text-[10px] text-muted hover:text-text transition cursor-pointer">
                Salir
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-r6-red hover:bg-r6-red/80 text-white font-heading font-bold text-xs px-4 py-1.5 rounded tracking-wider uppercase transition cursor-pointer"
            >
              Login 𝕏
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-text-secondary hover:text-text transition cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
              {menuOpen ? (
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-border bg-card px-4 py-3 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block text-sm font-heading font-semibold tracking-wider px-3 py-2 rounded transition uppercase ${
                pathname === link.href
                  ? "text-accent bg-accent-dim"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
