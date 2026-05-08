"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  async function handleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "x",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] relative">
      <div className="absolute inset-0 bg-cyber-dots opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 blur-[120px] pointer-events-none" />
      
      <div className="bg-card/90 backdrop-blur-md slc-cyber-clip border border-border p-10 max-w-md w-full text-center space-y-8 relative z-10">
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent/40 m-2" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-r6-red/40 m-2" />
        
        <div>
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-2">
            <img src="/fantasix_logoW.png" alt="Fantasix Logo" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
          </div>
          <h1 className="font-heading font-black text-3xl tracking-widest mt-6 text-text uppercase">
            PREDICCIONES
          </h1>
          <p className="font-heading font-bold text-r6-red text-sm tracking-[0.3em] mt-1 uppercase">
            SIX MAJOR SLC
          </p>
        </div>

        <div className="space-y-4 text-sm text-text-secondary">
          <p className="font-heading tracking-widest uppercase text-xs border-b border-border/50 pb-2 font-bold">Inicia sesión con 𝕏 para:</p>
          <ul className="text-left space-y-3 text-[13px] font-medium bg-bg-alt/50 p-5 slc-cyber-clip border border-border/50">
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-accent rounded-full"></span> Predecir ganadores de cada partido
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-accent rounded-full"></span> Competir en el leaderboard
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-accent rounded-full"></span> Compartir tus predicciones
            </li>
            <li className="flex items-center gap-3 text-text">
              <span className="text-success text-lg">🏆</span> Optar al premio del #1
            </li>
          </ul>
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-r6-red hover:bg-r6-red/80 text-white font-heading font-black text-lg py-4 btn-skew tracking-widest uppercase transition cursor-pointer flex items-center justify-center gap-3 hover:-translate-y-1"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          LOGIN CON 𝕏
        </button>

        <p className="text-[10px] text-text-secondary font-heading tracking-widest uppercase opacity-70">
          Solo solicitamos información pública de tu perfil
        </p>
      </div>
    </div>
  );
}
