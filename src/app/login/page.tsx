"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  async function handleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full text-center space-y-6">
        <div>
          <div className="w-14 h-14 bg-r6-red rounded-xl flex items-center justify-center font-heading font-bold text-xl text-white mx-auto">
            R6
          </div>
          <h1 className="font-heading font-bold text-2xl tracking-wider mt-4">
            Predicciones
          </h1>
          <p className="font-heading text-r6-red text-sm tracking-widest">
            BLAST MAJOR SLC 2026
          </p>
        </div>

        <div className="space-y-3 text-sm text-text-secondary">
          <p>Inicia sesión con 𝕏 para:</p>
          <ul className="text-left space-y-2 text-xs">
            <li className="flex items-center gap-2">
              <span className="text-accent">→</span> Predecir ganadores de cada partido
            </li>
            <li className="flex items-center gap-2">
              <span className="text-accent">→</span> Competir en el leaderboard
            </li>
            <li className="flex items-center gap-2">
              <span className="text-accent">→</span> Compartir tus predicciones
            </li>
            <li className="flex items-center gap-2">
              <span className="text-success">🏆</span> Optar al premio del #1
            </li>
          </ul>
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-r6-red hover:bg-r6-red/80 text-white font-heading font-bold text-base py-3 rounded-xl tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Login con 𝕏
        </button>

        <p className="text-[10px] text-muted">
          Solo necesitamos tu nombre y foto de perfil
        </p>
      </div>
    </div>
  );
}
