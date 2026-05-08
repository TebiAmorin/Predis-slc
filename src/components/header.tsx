"use client";

import Link from "next/link";
import Image from "next/image";
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
  }, [supabase]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  async function handleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "x",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  }

  return (
    <header className="bg-bg-alt/90 backdrop-blur-xl border-b border-border sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-accent/0 via-accent/50 to-accent/0" />
      <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between relative">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Image src="/fantasix_logoW.png" alt="Fantasix Logo" width={40} height={40} className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-heading font-black text-base leading-none tracking-widest text-text uppercase italic">
                Six Major
              </h1>
              <p className="text-[11px] text-r6-red font-bold tracking-widest uppercase mt-0.5 italic shadow-sm">
                SALT LAKE CITY
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 ml-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-heading font-black tracking-widest uppercase relative group transition-colors ${
                  pathname === link.href ? "text-text" : "text-text-secondary hover:text-text"
                }`}
              >
                {link.label}
                {pathname === link.href && (
                  <div className="absolute -bottom-2 left-0 w-full h-[3px] bg-r6-red shadow-[0_0_12px_rgba(239,68,68,0.6)]" />
                )}
                <div className="absolute -bottom-2 left-0 w-0 h-[3px] bg-r6-red transition-all group-hover:w-full opacity-0 group-hover:opacity-50" />
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
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
            <div className="w-10 h-10 rounded-full bg-border animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-4 group">
              {user.is_admin && (
                <Link href="/admin" className="hidden lg:block text-[9px] font-black tracking-widest bg-r6-red text-white px-2 py-1 slc-cyber-clip hover:scale-105 transition shadow-[0_0_10px_rgba(255,0,60,0.3)]">
                  ADMIN
                </Link>
              )}
              
              <div className="flex items-center gap-3 bg-bg-alt/50 backdrop-blur-md border border-border/50 pl-3 pr-1 py-1 slc-cyber-clip group-hover:border-accent/30 transition-all">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-[10px] font-heading font-black tracking-widest uppercase text-text max-w-[80px] truncate italic leading-none">
                    {user.display_name || user.username}
                  </span>
                  <button onClick={handleLogout} className="text-[8px] font-heading font-black tracking-[0.2em] uppercase text-text-secondary hover:text-r6-red transition cursor-pointer mt-0.5">
                    Desconectar
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 bg-accent/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  {(user.avatar_url && !avatarError) ? (
                    <Image 
                      src={user.avatar_url} 
                      alt="" 
                      width={36} 
                      height={36} 
                      className="rounded-full border-2 border-border group-hover:border-accent transition-colors relative z-10" 
                      unoptimized 
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full border-2 border-border bg-card flex items-center justify-center text-[10px] font-black text-text relative z-10">
                      {(user.display_name || user.username || "U")[0].toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-r6-red hover:bg-r6-red/80 text-white font-heading font-black text-xs px-8 py-3 slc-cyber-clip tracking-widest uppercase transition cursor-pointer flex items-center gap-2 shadow-[0_0_15px_rgba(255,0,60,0.3)] hover:shadow-[0_0_25px_rgba(255,0,60,0.5)] active:scale-95"
            >
              <span>LOGIN 𝕏</span>
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
        <nav className="md:hidden border-t border-border bg-bg-alt/95 backdrop-blur-xl px-4 py-4 space-y-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block text-sm font-heading font-black tracking-widest px-4 py-3 slc-cyber-clip transition uppercase ${
                pathname === link.href
                  ? "text-bg bg-accent shadow-[0_0_10px_rgba(209,242,0,0.3)]"
                  : "text-text-secondary hover:text-accent bg-card border border-border"
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
