"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Team, Match } from "@/lib/types";

type MatchWithTeams = Match & { team_a: Team; team_b: Team };

export default function AdminPage() {
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<MatchWithTeams[]>([]);
  const [tab, setTab] = useState<"matches" | "results" | "teams">("matches");
  const [saving, setSaving] = useState(false);

  const [teamName, setTeamName] = useState("");
  const [teamShort, setTeamShort] = useState("");
  const [teamLogo, setTeamLogo] = useState("");
  const [teamGroup, setTeamGroup] = useState("Phase 1");

  const [matchTeamA, setMatchTeamA] = useState("");
  const [matchTeamB, setMatchTeamB] = useState("");
  const [matchStage, setMatchStage] = useState("Phase 1 - Upper Bracket");
  const [matchBo, setMatchBo] = useState(1);
  const [matchDate, setMatchDate] = useState("");

  const loadData = useCallback(async () => {
    const { data: t } = await supabase.from("teams").select("*").order("group_name").order("name");
    setTeams(t || []);
    const { data: m } = await supabase
      .from("matches")
      .select("*, team_a:teams!matches_team_a_id_fkey(*), team_b:teams!matches_team_b_id_fkey(*)")
      .order("match_date", { ascending: true });
    setMatches(m || []);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { data } = await supabase.from("profiles").select("is_admin").eq("id", session.user.id).single();
      setIsAdmin(data?.is_admin || false);
      if (data?.is_admin) await loadData();
      setLoading(false);
    })();
  }, [loadData]);

  async function addTeam(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("teams").insert({
      name: teamName, short_name: teamShort.toUpperCase(),
      logo_url: teamLogo || null, group_name: teamGroup || null,
    });
    setTeamName(""); setTeamShort(""); setTeamLogo("");
    await loadData();
    setSaving(false);
  }

  async function addMatch(e: React.FormEvent) {
    e.preventDefault();
    if (matchTeamA === matchTeamB) { alert("Selecciona equipos diferentes"); return; }
    setSaving(true);
    const date = new Date(matchDate).toISOString();
    await supabase.from("matches").insert({
      team_a_id: matchTeamA, team_b_id: matchTeamB,
      stage: matchStage, best_of: matchBo,
      match_date: date, lock_date: date,
    });
    setMatchTeamA(""); setMatchTeamB(""); setMatchDate("");
    await loadData();
    setSaving(false);
  }

  async function setStatus(matchId: string, status: string) {
    setSaving(true);
    await supabase.from("matches").update({ status }).eq("id", matchId);
    await loadData();
    setSaving(false);
  }

  async function setResult(matchId: string, winnerId: string, scoreA: number, scoreB: number) {
    setSaving(true);
    await supabase.from("matches").update({
      winner_id: winnerId, score_a: scoreA, score_b: scoreB, status: "completed",
    }).eq("id", matchId);
    await loadData();
    setSaving(false);
  }

  async function deleteMatch(matchId: string) {
    if (!confirm("¿Eliminar partido y sus predicciones?")) return;
    await supabase.from("predictions").delete().eq("match_id", matchId);
    await supabase.from("matches").delete().eq("id", matchId);
    await loadData();
  }

  async function deleteTeam(teamId: string) {
    if (!confirm("¿Eliminar equipo?")) return;
    await supabase.from("teams").delete().eq("id", teamId);
    await loadData();
  }

  if (loading) return <div className="text-center py-16 text-muted">Cargando...</div>;
  if (!isAdmin) return <div className="text-center py-16 text-muted">Acceso denegado</div>;

  const inp = "w-full bg-bg border border-border px-4 py-2.5 text-sm text-text focus:outline-none focus:border-accent transition slc-cyber-clip";
  const btn = "bg-accent hover:bg-accent-hover text-bg font-heading font-black tracking-widest text-xs px-6 py-3 uppercase transition cursor-pointer disabled:opacity-50 btn-skew";

  const STAGES = [
    "Phase 1 - Upper Bracket",
    "Phase 1 - Lower Bracket",
    "Phase 1 - UB Final",
    "Phase 1 - LB Final",
    "Phase 2 - Swiss Round 1",
    "Phase 2 - Swiss Round 2",
    "Phase 2 - Swiss Round 3",
    "Phase 2 - Swiss Round 4",
    "Phase 2 - Swiss Round 5",
    "Playoffs - Quarterfinal",
    "Playoffs - Semifinal",
    "Playoffs - Grand Final",
  ];

  const pendingMatches = matches.filter(m => m.status !== "completed");
  const completedMatches = matches.filter(m => m.status === "completed");

  return (
    <div className="space-y-6">
      <h1 className="font-heading font-bold text-2xl tracking-wider">Panel Admin</h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 border-b border-border/50 pb-4">
        {([["matches", "Partidos"], ["results", "Resultados"], ["teams", "Equipos"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`btn-skew shrink-0 px-6 py-2.5 transition-all cursor-pointer border ${
              tab === key
                ? "bg-accent border-accent text-bg shadow-lg shadow-accent/20"
                : "bg-bg-alt border-border text-text-secondary hover:text-text hover:border-border-light hover:bg-card-hover"
            }`}
          >
            <div className="flex items-center gap-2 font-heading font-black tracking-widest text-sm">
              <span>{label}</span>
              {key === "results" && pendingMatches.length > 0 && (
                <span className="bg-r6-red text-white text-[9px] px-1.5 py-0.5 rounded-full">
                  {pendingMatches.length}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* ===== MATCHES TAB ===== */}
      {tab === "matches" && (
        <div className="space-y-6">
          <form onSubmit={addMatch} className="bg-card border border-border slc-cyber-clip p-6 space-y-5">
            <h3 className="font-heading font-black tracking-widest text-lg text-text">CREAR PARTIDO</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Team A */}
              <div>
                <label className="text-[10px] text-muted tracking-wider uppercase block mb-1">Equipo A</label>
                <select className={inp} value={matchTeamA} onChange={e => setMatchTeamA(e.target.value)} required>
                  <option value="">Seleccionar...</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.short_name} — {t.name}</option>)}
                </select>
              </div>
              {/* Team B */}
              <div>
                <label className="text-[10px] text-muted tracking-wider uppercase block mb-1">Equipo B</label>
                <select className={inp} value={matchTeamB} onChange={e => setMatchTeamB(e.target.value)} required>
                  <option value="">Seleccionar...</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.short_name} — {t.name}</option>)}
                </select>
              </div>
              {/* Stage */}
              <div>
                <label className="text-[10px] text-muted tracking-wider uppercase block mb-1">Fase</label>
                <select className={inp} value={matchStage} onChange={e => setMatchStage(e.target.value)}>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {/* BO */}
              <div>
                <label className="text-[10px] text-text-secondary tracking-widest uppercase block mb-1.5 font-bold">Formato</label>
                <div className="flex gap-2">
                  {[1, 3, 5].map(n => (
                    <button
                      key={n} type="button"
                      onClick={() => setMatchBo(n)}
                      className={`flex-1 font-heading font-black text-xs py-2 slc-cyber-clip transition cursor-pointer ${
                        matchBo === n ? "bg-accent text-bg" : "bg-bg-alt border border-border text-text-secondary hover:text-text"
                      }`}
                    >
                      BO{n}
                    </button>
                  ))}
                </div>
              </div>
              {/* Date */}
              <div className="sm:col-span-2">
                <label className="text-[10px] text-muted tracking-wider uppercase block mb-1">
                  Fecha y hora (predicciones se cierran automáticamente al llegar la hora)
                </label>
                <input type="datetime-local" className={inp} value={matchDate} onChange={e => setMatchDate(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className={btn} disabled={saving}>
              {saving ? "Guardando..." : "Crear Partido"}
            </button>
          </form>

          {/* Match list */}
          <div className="space-y-3">
            <h3 className="font-heading font-black tracking-widest text-lg text-text-secondary">
              PARTIDOS ({matches.length})
            </h3>
            {matches.map(match => (
              <div key={match.id} className="bg-card border border-border slc-cyber-clip p-4 flex items-center gap-4 hover:bg-card-hover transition">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-bold text-sm">
                      {match.team_a.short_name} vs {match.team_b.short_name}
                    </span>
                    <span className="text-[10px] bg-border text-text-secondary px-1.5 rounded font-heading">
                      BO{match.best_of}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      match.status === "completed" ? "bg-success-dim text-success" :
                      match.status === "live" ? "bg-r6-red text-white animate-pulse" :
                      "bg-border text-muted"
                    }`}>
                      {match.status === "completed" ? "FIN" : match.status === "live" ? "LIVE" : "PROG"}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted mt-0.5">
                    {match.stage} · {new Date(match.match_date).toLocaleString("es-ES", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {match.status === "upcoming" && (
                    <button onClick={() => setStatus(match.id, "live")}
                      className="text-[10px] bg-r6-red/20 text-r6-red px-2 py-1 rounded font-bold cursor-pointer hover:bg-r6-red/30">
                      EN VIVO
                    </button>
                  )}
                  {match.status === "live" && (
                    <button onClick={() => setStatus(match.id, "upcoming")}
                      className="text-[10px] bg-border text-muted px-2 py-1 rounded font-bold cursor-pointer hover:bg-border-light">
                      PAUSAR
                    </button>
                  )}
                  <button onClick={() => deleteMatch(match.id)}
                    className="text-[10px] text-r6-red hover:underline cursor-pointer">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== RESULTS TAB ===== */}
      {tab === "results" && (
        <div className="space-y-4">
          <p className="text-text-secondary text-sm font-medium">
            Marca el ganador y resultado de cada partido. Las predicciones se resuelven automáticamente.
          </p>

          {pendingMatches.length === 0 && (
            <div className="text-center py-12 bg-card border border-border slc-cyber-clip">
              <p className="text-text-secondary font-heading tracking-widest uppercase font-bold text-sm">Todos los partidos tienen resultado</p>
            </div>
          )}

          {pendingMatches.map(match => (
            <ResultCard key={match.id} match={match} onSubmit={setResult} saving={saving} />
          ))}

          {completedMatches.length > 0 && (
            <>
              <h3 className="font-heading font-black tracking-widest text-lg text-text-secondary pt-6">
                COMPLETADOS ({completedMatches.length})
              </h3>
              {completedMatches.map(match => (
                <div key={match.id} className="bg-card border border-success/30 slc-cyber-clip p-4 flex items-center gap-4 opacity-70 relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-1 h-full bg-success" />
                  <span className="text-success text-xl font-black">✓</span>
                  <span className="font-heading font-black tracking-widest text-base flex-1 uppercase">
                    {match.team_a.short_name} <span className="text-success mx-2">{match.score_a} - {match.score_b}</span> {match.team_b.short_name}
                  </span>
                  <span className="text-[10px] bg-bg border border-border text-text-secondary px-2 py-0.5 font-heading font-bold tracking-widest uppercase">
                    {match.stage}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ===== TEAMS TAB ===== */}
      {tab === "teams" && (
        <div className="space-y-6">
          <form onSubmit={addTeam} className="bg-card border border-border slc-cyber-clip p-6 space-y-4">
            <h3 className="font-heading font-black tracking-widest text-lg text-text">AÑADIR EQUIPO</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input className={inp} placeholder="Nombre completo" value={teamName} onChange={e => setTeamName(e.target.value)} required />
              <input className={inp} placeholder="Abreviatura (ej: W7M)" value={teamShort} onChange={e => setTeamShort(e.target.value)} required />
              <input className={inp} placeholder="URL Logo (opcional)" value={teamLogo} onChange={e => setTeamLogo(e.target.value)} />
              <select className={inp} value={teamGroup} onChange={e => setTeamGroup(e.target.value)}>
                <option value="Phase 1">Phase 1</option>
                <option value="Phase 2">Phase 2</option>
              </select>
            </div>
            <button type="submit" className={btn} disabled={saving}>Añadir</button>
          </form>

          <div className="bg-card border border-border slc-cyber-clip overflow-hidden">
            {teams.map(team => (
              <div key={team.id} className="flex items-center gap-4 px-5 py-3 border-b border-border/50 last:border-0 hover:bg-card-hover transition">
                {team.logo_url ? (
                  <img src={team.logo_url} alt="" className="w-8 h-8 object-contain" />
                ) : (
                  <div className="w-8 h-8 slc-cyber-clip bg-bg-alt flex items-center justify-center text-[11px] font-black text-text-secondary">{team.short_name}</div>
                )}
                <span className="font-medium text-sm flex-1">{team.name}</span>
                <span className="text-[10px] text-muted font-heading">{team.short_name}</span>
                <span className="text-[10px] bg-border px-1.5 py-0.5 rounded">{team.group_name}</span>
                <button onClick={() => deleteTeam(team.id)} className="text-r6-red text-[10px] hover:underline cursor-pointer">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultCard({ match, onSubmit, saving }: {
  match: MatchWithTeams;
  onSubmit: (id: string, winnerId: string, scoreA: number, scoreB: number) => void;
  saving: boolean;
}) {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  function submit(winnerId: string) {
    onSubmit(match.id, winnerId, scoreA, scoreB);
  }

  return (
    <div className="bg-card border border-border slc-cyber-clip p-6 space-y-5 relative overflow-hidden">
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <span className="font-heading font-black text-lg tracking-widest uppercase">
            {match.team_a.short_name} <span className="text-text-secondary mx-1 text-xs">VS</span> {match.team_b.short_name}
          </span>
          <span className="text-[10px] bg-bg border border-border text-text-secondary px-2 py-0.5 font-heading font-bold tracking-widest uppercase">BO{match.best_of}</span>
          {match.status === "live" && (
            <span className="text-[10px] bg-r6-red text-white px-2 py-0.5 font-black tracking-widest uppercase animate-pulse border border-r6-red">LIVE</span>
          )}
        </div>
        <span className="text-[10px] text-text-secondary font-heading tracking-widest uppercase font-bold">{match.stage}</span>
      </div>

      {/* Score input */}
      <div className="flex items-center justify-center gap-5 relative z-10">
        <div className="flex items-center gap-3">
          <span className="font-heading font-black text-base w-14 text-right uppercase tracking-widest">{match.team_a.short_name}</span>
          <input
            type="number" min="0" max="16" value={scoreA}
            onChange={e => setScoreA(+e.target.value)}
            className="w-16 bg-bg border border-border slc-cyber-clip px-3 py-2 text-center text-xl font-heading font-black focus:border-accent focus:outline-none transition"
          />
        </div>
        <span className="text-text-secondary font-heading font-black text-xl">—</span>
        <div className="flex items-center gap-3">
          <input
            type="number" min="0" max="16" value={scoreB}
            onChange={e => setScoreB(+e.target.value)}
            className="w-16 bg-bg border border-border slc-cyber-clip px-3 py-2 text-center text-xl font-heading font-black focus:border-accent focus:outline-none transition"
          />
          <span className="font-heading font-black text-base w-14 uppercase tracking-widest">{match.team_b.short_name}</span>
        </div>
      </div>

      {/* Winner buttons */}
      <div className="flex gap-3 relative z-10 pt-2">
        <button
          onClick={() => submit(match.team_a_id)}
          disabled={saving}
          className="flex-1 bg-success/10 hover:bg-success border border-success/30 hover:border-success text-success hover:text-bg font-heading font-black text-xs py-3 slc-cyber-clip tracking-widest uppercase transition cursor-pointer disabled:opacity-50"
        >
          ✓ {match.team_a.short_name} GANA
        </button>
        <button
          onClick={() => submit(match.team_b_id)}
          disabled={saving}
          className="flex-1 bg-success/10 hover:bg-success border border-success/30 hover:border-success text-success hover:text-bg font-heading font-black text-xs py-3 slc-cyber-clip tracking-widest uppercase transition cursor-pointer disabled:opacity-50"
        >
          ✓ {match.team_b.short_name} GANA
        </button>
      </div>
    </div>
  );
}
