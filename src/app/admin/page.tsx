"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Team, Match } from "@/lib/types";

type MatchWithTeams = Match & { team_a: Team; team_b: Team };
type ModalMode = "edit" | "score" | null;

export default function AdminPage() {
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<MatchWithTeams[]>([]);
  const [saving, setSaving] = useState(false);

  // New Match Form
  const [matchTeamA, setMatchTeamA] = useState("");
  const [matchTeamB, setMatchTeamB] = useState("");
  const [matchStage, setMatchStage] = useState("Phase 1 - Upper Bracket");
  const [matchBo, setMatchBo] = useState(1);
  const [matchDay, setMatchDay] = useState("");
  const [matchTime, setMatchTime] = useState("");

  // New Team Form
  const [teamName, setTeamName] = useState("");
  const [teamShort, setTeamShort] = useState("");
  const [teamGroup, setTeamGroup] = useState("Phase 1");

  // Modal State
  const [modalMatch, setModalMatch] = useState<MatchWithTeams | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  // Edit modal fields
  const [editDay, setEditDay] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editStage, setEditStage] = useState("");
  const [editBo, setEditBo] = useState(1);

  // Filters
  const [searchFilter, setSearchFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "live" | "completed">("all");
  const [tab, setTab] = useState<"partidos" | "equipos">("partidos");

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function openEditModal(match: MatchWithTeams) {
    const d = new Date(match.match_date);
    setModalMatch(match);
    setModalMode("edit");
    setEditDay(d.getDate().toString());
    setEditTime(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
    setEditStage(match.stage);
    setEditBo(match.best_of);
  }

  function openScoreModal(match: MatchWithTeams) {
    setModalMatch(match);
    setModalMode("score");
    setScoreA(match.score_a ?? 0);
    setScoreB(match.score_b ?? 0);
  }

  function closeModal() {
    setModalMatch(null);
    setModalMode(null);
  }

  const loadData = useCallback(async () => {
    const { data: t } = await supabase.from("teams").select("*").order("group_name").order("name");
    setTeams(t || []);
    const { data: m } = await supabase
      .from("matches")
      .select("*, team_a:teams!matches_team_a_id_fkey(*), team_b:teams!matches_team_b_id_fkey(*)")
      .order("match_date", { ascending: true });
    setMatches(m || []);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { data } = await supabase.from("profiles").select("is_admin").eq("id", session.user.id).single();
      setIsAdmin(data?.is_admin || false);
      if (data?.is_admin) await loadData();
      setLoading(false);
    })();
  }, [loadData, supabase]);

  // --- Stats ---
  const stats = useMemo(() => ({
    total: matches.length,
    upcoming: matches.filter(m => m.status === "upcoming").length,
    live: matches.filter(m => m.status === "live").length,
    completed: matches.filter(m => m.status === "completed").length,
  }), [matches]);

  const activeStages = useMemo(() => {
    const stages = new Set(matches.map(m => m.stage));
    return Array.from(stages);
  }, [matches]);

  // --- Actions ---
  async function addMatch(e: React.FormEvent) {
    e.preventDefault();
    if (matchTeamA === matchTeamB) { alert("Equipos iguales"); return; }
    setSaving(true);
    const [hours, minutes] = matchTime.split(":");
    if (!matchDay || !hours || !minutes) { alert("Falta fecha/hora"); setSaving(false); return; }
    const localDate = new Date(2026, 4, parseInt(matchDay), parseInt(hours), parseInt(minutes));
    const date = localDate.toISOString();

    await supabase.from("matches").insert({
      team_a_id: matchTeamA, team_b_id: matchTeamB,
      stage: matchStage, best_of: matchBo,
      match_date: date, lock_date: date,
    });
    setMatchTeamA(""); setMatchTeamB("");
    await loadData();
    setSaving(false);
    showToast("Partido creado");
  }

  async function saveMatchEdit() {
    if (!modalMatch) return;
    setSaving(true);
    const [hours, minutes] = editTime.split(":");
    const d = new Date(modalMatch.match_date);
    const localDate = new Date(2026, d.getMonth(), parseInt(editDay), parseInt(hours), parseInt(minutes));
    const date = localDate.toISOString();

    await supabase.from("matches").update({
      match_date: date,
      lock_date: date,
      stage: editStage,
      best_of: editBo,
    }).eq("id", modalMatch.id);
    closeModal();
    await loadData();
    setSaving(false);
    showToast("Partido actualizado");
  }

  async function addTeam(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("teams").insert({
      name: teamName, short_name: teamShort.toUpperCase(), group_name: teamGroup || null,
    });
    setTeamName(""); setTeamShort("");
    await loadData();
    setSaving(false);
    showToast("Equipo añadido");
  }

  async function setStatus(matchId: string, status: string) {
    setSaving(true);
    await supabase.from("matches").update({ status }).eq("id", matchId);
    await loadData();
    setSaving(false);
    showToast(`Estado: ${status}`);
  }

  async function updateLiveScore(matchId: string, sA: number, sB: number) {
    setSaving(true);
    await supabase.from("matches").update({
      score_a: sA, score_b: sB, status: "live",
    }).eq("id", matchId);
    // Update the modalMatch in-place so UI reflects it
    if (modalMatch && modalMatch.id === matchId) {
      setModalMatch({ ...modalMatch, score_a: sA, score_b: sB, status: "live" });
    }
    await loadData();
    setSaving(false);
    showToast(`Score en vivo: ${sA}-${sB}`);
  }

  async function submitResult(matchId: string, winnerId: string, sA: number, sB: number) {
    setSaving(true);
    await supabase.from("matches").update({
      winner_id: winnerId, score_a: sA, score_b: sB, status: "completed",
    }).eq("id", matchId);
    closeModal();
    await loadData();
    setSaving(false);
    showToast("Resultado final guardado");
  }

  async function revertResult(matchId: string) {
    if (!confirm("¿Deshacer resultado?")) return;
    setSaving(true);
    await supabase.from("matches").update({
      winner_id: null, score_a: null, score_b: null, status: "upcoming",
    }).eq("id", matchId);
    await loadData();
    setSaving(false);
    showToast("Resultado revertido");
  }

  async function deleteMatch(matchId: string) {
    if (!confirm("¿Borrar partido y sus predicciones?")) return;
    setSaving(true);
    await supabase.from("predictions").delete().eq("match_id", matchId);
    await supabase.from("matches").delete().eq("id", matchId);
    await loadData();
    setSaving(false);
    showToast("Partido eliminado");
  }

  async function toggleEliminated(teamId: string, currentStatus: boolean) {
    setSaving(true);
    await supabase.from("teams").update({ eliminated: !currentStatus }).eq("id", teamId);
    await loadData();
    setSaving(false);
    showToast(currentStatus ? "Equipo reactivado" : "Equipo eliminado");
  }

  const STAGES = [
    "Phase 1 - Upper Bracket", "Phase 1 - Lower Bracket", "Phase 1 - UB Final", "Phase 1 - LB Final",
    "Phase 2 - Swiss Round 1", "Phase 2 - Swiss Round 2", "Phase 2 - Swiss Round 3", "Phase 2 - Swiss Round 4", "Phase 2 - Swiss Round 5",
    "Playoffs - Quarterfinal", "Playoffs - Semifinal", "Playoffs - Grand Final",
  ];

  const filteredMatches = useMemo(() => {
    let result = matches;
    if (searchFilter) {
      const lower = searchFilter.toLowerCase();
      result = result.filter(m =>
        m.team_a.name.toLowerCase().includes(lower) ||
        m.team_b.name.toLowerCase().includes(lower) ||
        m.team_a.short_name.toLowerCase().includes(lower) ||
        m.team_b.short_name.toLowerCase().includes(lower) ||
        m.stage.toLowerCase().includes(lower)
      );
    }
    if (stageFilter !== "all") {
      result = result.filter(m => m.stage === stageFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter(m => m.status === statusFilter);
    }
    return result;
  }, [matches, searchFilter, stageFilter, statusFilter]);

  // Quick score buttons based on best_of
  function getQuickScores(bo: number) {
    if (bo === 1) return [{ a: 1, b: 0 }, { a: 0, b: 1 }];
    if (bo === 3) return [{ a: 2, b: 0 }, { a: 0, b: 2 }, { a: 2, b: 1 }, { a: 1, b: 2 }];
    return [{ a: 3, b: 0 }, { a: 0, b: 3 }, { a: 3, b: 1 }, { a: 1, b: 3 }, { a: 3, b: 2 }, { a: 2, b: 3 }];
  }

  // All possible intermediate scores for live updates
  function getLiveScoreOptions(bo: number) {
    const maxWin = Math.ceil(bo / 2);
    const options: { a: number; b: number }[] = [];
    for (let a = 0; a <= maxWin; a++) {
      for (let b = 0; b <= maxWin; b++) {
        if (a === 0 && b === 0) continue;
        // Exclude "final" scores where someone already won
        if (a === maxWin && b === maxWin) continue;
        options.push({ a, b });
      }
    }
    return options;
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-gray-400 text-lg animate-pulse">Cargando admin...</div>
    </div>
  );
  if (!isAdmin) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-red-400 text-lg font-bold">No autorizado.</div>
    </div>
  );

  const inputStyle = "bg-[#1e2330] border border-[#2c3345] rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 transition-colors";

  return (
    <div className="font-sans text-sm max-w-[1400px] mx-auto p-4 space-y-6 text-gray-200">

      {/* Saving overlay */}
      {saving && (
        <div className="fixed top-4 right-4 z-[60] bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-bold flex items-center gap-2 animate-pulse">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75"/></svg>
          Guardando...
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-green-600 text-white px-6 py-2 rounded-lg shadow-lg text-sm font-bold">
          {toast}
        </div>
      )}

      {/* Header with tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[#2c3345] pb-3 gap-3">
        <div className="flex gap-4 items-center">
          <h1 className="text-2xl font-bold mr-4">Admin</h1>
          <button onClick={() => setTab("partidos")} className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${tab === "partidos" ? "border-blue-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}>PARTIDOS</button>
          <button onClick={() => setTab("equipos")} className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${tab === "equipos" ? "border-blue-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}>EQUIPOS</button>
        </div>
        <button onClick={() => loadData()} className="text-xs text-gray-500 hover:text-white border border-[#2c3345] hover:border-blue-500 px-3 py-1.5 rounded transition-all">
          Recargar datos
        </button>
      </div>

      {/* Stats bar */}
      {tab === "partidos" && (
        <div className="grid grid-cols-4 gap-3">
          <button onClick={() => setStatusFilter("all")} className={`p-3 rounded-lg border text-center transition-all ${statusFilter === "all" ? "bg-blue-600/20 border-blue-500" : "bg-[#151923] border-[#2c3345] hover:border-gray-500"}`}>
            <p className="text-2xl font-black text-white">{stats.total}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Total</p>
          </button>
          <button onClick={() => setStatusFilter("upcoming")} className={`p-3 rounded-lg border text-center transition-all ${statusFilter === "upcoming" ? "bg-yellow-600/20 border-yellow-500" : "bg-[#151923] border-[#2c3345] hover:border-gray-500"}`}>
            <p className="text-2xl font-black text-yellow-400">{stats.upcoming}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Pendientes</p>
          </button>
          <button onClick={() => setStatusFilter("live")} className={`p-3 rounded-lg border text-center transition-all ${statusFilter === "live" ? "bg-red-600/20 border-red-500" : "bg-[#151923] border-[#2c3345] hover:border-gray-500"}`}>
            <p className="text-2xl font-black text-red-400">{stats.live}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">En Vivo</p>
          </button>
          <button onClick={() => setStatusFilter("completed")} className={`p-3 rounded-lg border text-center transition-all ${statusFilter === "completed" ? "bg-green-600/20 border-green-500" : "bg-[#151923] border-[#2c3345] hover:border-gray-500"}`}>
            <p className="text-2xl font-black text-green-400">{stats.completed}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Completados</p>
          </button>
        </div>
      )}

      <div className="flex flex-col gap-6 items-start">

        {/* PESTAÑA: PARTIDOS */}
        {tab === "partidos" && (
          <div className="w-full space-y-6">

            {/* Filters row */}
            <div className="flex flex-wrap gap-3 items-center">
              <input
                type="text"
                placeholder="Buscar equipo o fase..."
                className={`flex-1 min-w-[200px] p-2 ${inputStyle}`}
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
              />
              <select
                className={`p-2 ${inputStyle}`}
                value={stageFilter}
                onChange={e => setStageFilter(e.target.value)}
              >
                <option value="all">Todas las fases</option>
                {activeStages.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {(searchFilter || stageFilter !== "all" || statusFilter !== "all") && (
                <button
                  onClick={() => { setSearchFilter(""); setStageFilter("all"); setStatusFilter("all"); }}
                  className="text-xs text-gray-400 hover:text-white px-3 py-2 border border-[#2c3345] rounded hover:border-red-500 transition-all"
                >
                  Limpiar filtros
                </button>
              )}
              <span className="text-xs text-gray-500 ml-auto">{filteredMatches.length} partidos</span>
            </div>

            {/* Match creator */}
            <details className="bg-[#151923] border border-[#2c3345] rounded-xl shadow-2xl group">
              <summary className="p-6 cursor-pointer font-bold text-lg text-white flex items-center justify-between hover:bg-[#1e2330] rounded-xl transition-colors">
                <span>Crear Nuevo Partido</span>
                <span className="text-gray-500 group-open:rotate-180 transition-transform text-xl">&#9660;</span>
              </summary>
              <form onSubmit={addMatch} className="p-8 pt-2 flex flex-col gap-6 border-t border-[#2c3345]">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Día (Mayo)</label>
                    <input type="number" min="1" max="31" className={`w-full text-lg p-3 ${inputStyle}`} value={matchDay} onChange={e => setMatchDay(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Hora</label>
                    <input type="time" className={`w-full text-lg p-3 ${inputStyle}`} value={matchTime} onChange={e => setMatchTime(e.target.value)} required />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Fase</label>
                    <select className={`w-full text-lg p-3 ${inputStyle}`} value={matchStage} onChange={e => setMatchStage(e.target.value)}>
                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="block text-sm font-black text-blue-400 uppercase tracking-widest">Equipo A {matchTeamA && teams.find(t => t.id === matchTeamA) && <span className="text-white ml-2">({teams.find(t => t.id === matchTeamA)!.short_name})</span>}</label>
                    <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-8 gap-2 max-h-[250px] overflow-y-auto p-3 bg-[#0f1219] rounded-xl border border-[#2c3345]">
                      {teams.filter(t => !t.eliminated).map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setMatchTeamA(t.id)}
                          className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                            matchTeamA === t.id ? "bg-blue-600/30 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : matchTeamB === t.id ? "opacity-30 cursor-not-allowed border-transparent" : "bg-[#1e2330] border-transparent hover:border-[#2c3345]"
                          }`}
                          disabled={matchTeamB === t.id}
                          title={t.name}
                        >
                          {t.logo_url ? (
                            <img src={t.logo_url} alt="" className="w-10 h-10 object-contain" />
                          ) : (
                            <div className="w-10 h-10 flex items-center justify-center text-[10px] font-bold">{t.short_name}</div>
                          )}
                          <span className="text-[9px] font-black mt-1 truncate w-full text-center uppercase">{t.short_name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-black text-blue-400 uppercase tracking-widest">Equipo B {matchTeamB && teams.find(t => t.id === matchTeamB) && <span className="text-white ml-2">({teams.find(t => t.id === matchTeamB)!.short_name})</span>}</label>
                    <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-8 gap-2 max-h-[250px] overflow-y-auto p-3 bg-[#0f1219] rounded-xl border border-[#2c3345]">
                      {teams.filter(t => !t.eliminated).map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setMatchTeamB(t.id)}
                          className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                            matchTeamB === t.id ? "bg-blue-600/30 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : matchTeamA === t.id ? "opacity-30 cursor-not-allowed border-transparent" : "bg-[#1e2330] border-transparent hover:border-[#2c3345]"
                          }`}
                          disabled={matchTeamA === t.id}
                          title={t.name}
                        >
                          {t.logo_url ? (
                            <img src={t.logo_url} alt="" className="w-10 h-10 object-contain" />
                          ) : (
                            <div className="w-10 h-10 flex items-center justify-center text-[10px] font-bold">{t.short_name}</div>
                          )}
                          <span className="text-[9px] font-black mt-1 truncate w-full text-center uppercase">{t.short_name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 items-end mt-2">
                  <div className="w-1/3">
                    <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Formato</label>
                    <select className={`w-full text-lg p-3 ${inputStyle}`} value={matchBo} onChange={e => setMatchBo(+e.target.value)}>
                      <option value={1}>BO1</option>
                      <option value={3}>BO3</option>
                      <option value={5}>BO5</option>
                    </select>
                  </div>
                  <button type="submit" className="w-2/3 h-[52px] text-lg font-black bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-all disabled:opacity-50 shadow-lg" disabled={saving || !matchTeamA || !matchTeamB}>CREAR PARTIDO</button>
                </div>
              </form>
            </details>

            {/* Match table */}
            <div className="bg-[#151923] border border-[#2c3345] rounded-xl overflow-x-auto shadow-2xl">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#1e2330] text-xs text-gray-400 border-b border-[#2c3345]">
                    <th className="p-4 font-medium uppercase tracking-widest">Fecha</th>
                    <th className="p-4 font-medium uppercase tracking-widest">Fase</th>
                    <th className="p-4 font-medium text-center uppercase tracking-widest">Fmt</th>
                    <th className="p-4 font-medium uppercase tracking-widest">Estado</th>
                    <th className="p-4 font-medium text-right uppercase tracking-widest">Equipos</th>
                    <th className="p-4 font-medium text-center uppercase tracking-widest">Score</th>
                    <th className="p-4 font-medium text-right uppercase tracking-widest">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2c3345]">
                  {filteredMatches.map(match => {
                    const d = new Date(match.match_date);
                    const isFinished = match.status === "completed";
                    const isLive = match.status === "live";
                    const hasLiveScore = !isFinished && (match.score_a !== null && match.score_a !== undefined);
                    return (
                      <tr key={match.id} className={`transition-colors ${isLive ? "bg-red-900/10 hover:bg-red-900/20" : isFinished ? "hover:bg-[#1e2330] opacity-60" : "hover:bg-[#1e2330]"}`}>
                        <td className="p-4 text-xs text-gray-400 whitespace-nowrap">
                          {d.getDate()}/{d.getMonth()+1} {d.getHours().toString().padStart(2, '0')}:{d.getMinutes().toString().padStart(2, '0')}
                        </td>
                        <td className="p-4 text-xs text-gray-300 whitespace-nowrap uppercase font-bold max-w-[180px] truncate" title={match.stage}>{match.stage}</td>
                        <td className="p-4 text-xs text-center text-gray-500 font-bold">BO{match.best_of}</td>
                        <td className="p-4 whitespace-nowrap">
                          {isFinished ? (
                            <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded uppercase">Finalizado</span>
                          ) : isLive ? (
                            <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-2 py-1 rounded uppercase animate-pulse">En Vivo</span>
                          ) : (
                            <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded uppercase">Pendiente</span>
                          )}
                        </td>
                        <td className="p-4 whitespace-nowrap text-right">
                          <span className={isFinished && match.winner_id === match.team_a_id ? "text-green-400 font-black text-base" : isFinished ? "text-gray-500" : "font-bold"}>{match.team_a.short_name}</span>
                          <span className="text-gray-600 mx-2 text-xs">vs</span>
                          <span className={isFinished && match.winner_id === match.team_b_id ? "text-green-400 font-black text-base" : isFinished ? "text-gray-500" : "font-bold"}>{match.team_b.short_name}</span>
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          {isFinished ? (
                            <span className="font-mono text-lg font-black text-green-400 bg-green-400/10 px-3 py-1 rounded-lg">{match.score_a}-{match.score_b}</span>
                          ) : hasLiveScore ? (
                            <span className="font-mono text-lg font-black text-red-400 bg-red-400/10 px-3 py-1 rounded-lg animate-pulse">{match.score_a}-{match.score_b}</span>
                          ) : (
                            <span className="text-xs text-gray-500">—</span>
                          )}
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit button - always available unless completed */}
                            {!isFinished && (
                              <button onClick={() => openEditModal(match)} className="text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1.5 rounded transition-all" title="Editar partido">
                                ✏️
                              </button>
                            )}

                            {isFinished ? (
                              <button onClick={() => revertResult(match.id)} className="text-xs text-gray-400 hover:text-white border border-[#2c3345] hover:border-yellow-500 px-3 py-1.5 rounded transition-all font-bold uppercase">Deshacer</button>
                            ) : (
                              <>
                                {match.status === "upcoming" && (
                                  <button onClick={() => setStatus(match.id, "live")} className="text-xs font-black bg-red-500/20 text-red-400 hover:bg-red-500/40 px-3 py-1.5 rounded uppercase tracking-wider transition-all">LIVE</button>
                                )}
                                {isLive && (
                                  <button onClick={() => setStatus(match.id, "upcoming")} className="text-xs font-bold text-gray-400 hover:text-white border border-[#2c3345] hover:border-yellow-500 px-2.5 py-1.5 rounded transition-all uppercase">PAUSE</button>
                                )}
                                <button onClick={() => openScoreModal(match)} className="text-xs font-black bg-orange-500/20 text-orange-400 hover:bg-orange-500/40 px-3 py-1.5 rounded uppercase tracking-wider transition-all">SCORE</button>
                              </>
                            )}
                            <button onClick={() => deleteMatch(match.id)} className="text-xs text-red-500/50 hover:text-red-400 font-bold p-1 transition-colors" title="Eliminar partido">✕</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMatches.length === 0 && (
                    <tr><td colSpan={7} className="p-8 text-center text-gray-500">No hay partidos que coincidan con los filtros</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PESTAÑA: EQUIPOS */}
        {tab === "equipos" && (
          <div className="w-full space-y-6">
            <form onSubmit={addTeam} className="bg-[#151923] border border-[#2c3345] rounded-xl p-8 flex flex-col gap-4 shadow-2xl">
              <h3 className="text-xl font-bold text-white border-b border-[#2c3345] pb-2">Crear Nuevo Equipo</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <input className={`md:col-span-1 p-3 text-lg ${inputStyle}`} placeholder="Corto (ej: W7M)" value={teamShort} onChange={e => setTeamShort(e.target.value)} required />
                <input className={`md:col-span-2 p-3 text-lg ${inputStyle}`} placeholder="Nombre completo" value={teamName} onChange={e => setTeamName(e.target.value)} required />
                <select className={`md:col-span-1 p-3 text-lg ${inputStyle}`} value={teamGroup} onChange={e => setTeamGroup(e.target.value)}>
                  <option value="Phase 1">Phase 1</option>
                  <option value="Phase 2">Phase 2</option>
                  <option value="LATAM">LATAM</option>
                  <option value="EU">EU</option>
                  <option value="NA">NA</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded text-lg transition-colors mt-2" disabled={saving}>Añadir Equipo</button>
            </form>

            <div className="bg-[#151923] border border-[#2c3345] rounded-xl overflow-hidden shadow-2xl">
              <div className="p-4 bg-[#1e2330] border-b border-[#2c3345] flex justify-between items-center">
                <span className="text-sm font-bold text-gray-300">{teams.length} equipos ({teams.filter(t => !t.eliminated).length} activos)</span>
              </div>
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-[#1e2330] text-gray-400 border-b border-[#2c3345]">
                  <tr>
                    <th className="p-4 font-bold uppercase tracking-widest">Equipo</th>
                    <th className="p-4 font-bold text-center uppercase tracking-widest">Grupo</th>
                    <th className="p-4 font-bold text-center uppercase tracking-widest">Estado</th>
                    <th className="p-4 font-bold text-right uppercase tracking-widest">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2c3345]">
                  {teams.map(team => (
                    <tr key={team.id} className={`transition-colors hover:bg-[#1e2330] ${team.eliminated ? 'opacity-40' : ''}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {team.logo_url && <img src={team.logo_url} className="w-10 h-10 object-contain" alt="" />}
                          <div>
                            <p className="font-black text-white uppercase">{team.name}</p>
                            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">{team.short_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center text-xs text-gray-400 font-bold">{team.group_name}</td>
                      <td className="p-4 text-center">
                        {team.eliminated ? (
                          <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-2 py-1 rounded uppercase">Eliminado</span>
                        ) : (
                          <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded uppercase">Activo</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => toggleEliminated(team.id, !!team.eliminated)} className={`px-4 py-2 font-bold rounded text-xs transition-all ${team.eliminated ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}>
                          {team.eliminated ? "Reactivar" : "Eliminar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ========== MODAL: EDITAR PARTIDO ========== */}
      {modalMatch && modalMode === "edit" && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-md p-4" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="bg-[#151923] border border-[#2c3345] rounded-2xl p-8 w-full max-w-xl shadow-2xl space-y-6">
            <div className="flex justify-between items-start border-b border-[#2c3345] pb-4">
              <div>
                <h2 className="text-2xl font-black text-white uppercase">Editar Partido</h2>
                <p className="text-lg font-bold text-gray-300 mt-2 flex items-center gap-3">
                  {modalMatch.team_a.logo_url && <img src={modalMatch.team_a.logo_url} className="w-6 h-6 object-contain" alt="" />}
                  {modalMatch.team_a.short_name}
                  <span className="text-gray-600 text-sm">vs</span>
                  {modalMatch.team_b.logo_url && <img src={modalMatch.team_b.logo_url} className="w-6 h-6 object-contain" alt="" />}
                  {modalMatch.team_b.short_name}
                </p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-white p-2 text-2xl font-bold transition-colors">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Día (Mayo)</label>
                <input type="number" min="1" max="31" className={`w-full text-lg p-3 ${inputStyle}`} value={editDay} onChange={e => setEditDay(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Hora</label>
                <input type="time" className={`w-full text-lg p-3 ${inputStyle}`} value={editTime} onChange={e => setEditTime(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">Fase</label>
              <select className={`w-full text-lg p-3 ${inputStyle}`} value={editStage} onChange={e => setEditStage(e.target.value)}>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">Formato</label>
              <div className="flex gap-3">
                {[1, 3, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setEditBo(n)}
                    className={`flex-1 py-3 text-lg font-black rounded-lg border transition-all ${
                      editBo === n
                        ? "bg-blue-600/30 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                        : "bg-[#1e2330] border-[#2c3345] text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    BO{n}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={saveMatchEdit}
              disabled={saving}
              className="w-full py-4 text-lg font-black bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition-all disabled:opacity-50 shadow-lg uppercase tracking-widest"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      )}

      {/* ========== MODAL: SCORE (LIVE + RESULTADO FINAL) ========== */}
      {modalMatch && modalMode === "score" && (() => {
        const m = modalMatch;
        const maxWin = Math.ceil(m.best_of / 2);
        const isLive = m.status === "live";
        return (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-md p-4" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
            <div className="bg-[#151923] border border-[#2c3345] rounded-2xl p-8 w-full max-w-3xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-[#2c3345] pb-4">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase">Score del Partido</h2>
                  <p className="text-sm text-gray-400 mt-1">{m.stage} — BO{m.best_of}</p>
                  <p className="text-lg font-bold text-gray-300 mt-2 flex items-center gap-3">
                    {m.team_a.logo_url && <img src={m.team_a.logo_url} className="w-6 h-6 object-contain" alt="" />}
                    {m.team_a.short_name}
                    <span className="text-gray-600 text-sm">vs</span>
                    {m.team_b.logo_url && <img src={m.team_b.logo_url} className="w-6 h-6 object-contain" alt="" />}
                    {m.team_b.short_name}
                  </p>
                  {m.score_a !== null && m.score_a !== undefined && (
                    <p className="text-sm text-orange-400 font-bold mt-2">Score actual: {m.score_a} - {m.score_b}</p>
                  )}
                </div>
                <button onClick={closeModal} className="text-gray-400 hover:text-white p-2 text-2xl font-bold transition-colors">✕</button>
              </div>

              {/* ====== LIVE SCORE SECTION ====== */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <p className="text-sm text-red-400 uppercase font-black tracking-widest">Score en Vivo</p>
                  <span className="text-[10px] text-gray-500 ml-auto">Actualiza el marcador sin finalizar el partido</span>
                </div>

                {/* Quick live score buttons */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {getLiveScoreOptions(m.best_of).map(({ a, b }) => {
                    const isFinal = a === maxWin || b === maxWin;
                    const isCurrent = m.score_a === a && m.score_b === b;
                    return (
                      <button
                        key={`live-${a}-${b}`}
                        onClick={() => {
                          if (isFinal) {
                            // If it's a winning score, ask to finalize
                            const winnerId = a === maxWin ? m.team_a_id : m.team_b_id;
                            submitResult(m.id, winnerId, a, b);
                          } else {
                            updateLiveScore(m.id, a, b);
                          }
                        }}
                        disabled={saving || isCurrent}
                        className={`py-3 rounded-lg border text-base font-bold transition-all ${
                          isCurrent
                            ? "bg-orange-500/30 border-orange-500 text-orange-300 cursor-default"
                            : isFinal
                            ? "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/30 hover:border-green-500"
                            : "bg-[#1e2330] border-[#2c3345] text-gray-300 hover:bg-orange-500/20 hover:border-orange-500/50 hover:text-orange-300"
                        }`}
                      >
                        <span className="font-black">{a} - {b}</span>
                        {isFinal && <span className="block text-[9px] mt-0.5 opacity-70 uppercase">Final</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Manual +/- controls */}
                <div className="flex items-center justify-center gap-6 bg-[#0f1219] p-5 rounded-xl border border-[#2c3345]">
                  <div className="flex flex-col items-center gap-2">
                    <span className="font-black text-sm uppercase tracking-wider text-gray-400">{m.team_a.short_name}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setScoreA(Math.max(0, scoreA - 1))} className="w-10 h-10 bg-[#1e2330] border border-[#2c3345] rounded-lg text-xl font-bold hover:bg-red-500/20 hover:border-red-500/50 transition-all text-gray-400 hover:text-red-400">−</button>
                      <span className="w-14 text-center text-3xl font-black text-white">{scoreA}</span>
                      <button onClick={() => setScoreA(Math.min(maxWin, scoreA + 1))} className="w-10 h-10 bg-[#1e2330] border border-[#2c3345] rounded-lg text-xl font-bold hover:bg-green-500/20 hover:border-green-500/50 transition-all text-gray-400 hover:text-green-400">+</button>
                    </div>
                  </div>
                  <span className="text-3xl font-black text-gray-700 mt-5">-</span>
                  <div className="flex flex-col items-center gap-2">
                    <span className="font-black text-sm uppercase tracking-wider text-gray-400">{m.team_b.short_name}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setScoreB(Math.max(0, scoreB - 1))} className="w-10 h-10 bg-[#1e2330] border border-[#2c3345] rounded-lg text-xl font-bold hover:bg-red-500/20 hover:border-red-500/50 transition-all text-gray-400 hover:text-red-400">−</button>
                      <span className="w-14 text-center text-3xl font-black text-white">{scoreB}</span>
                      <button onClick={() => setScoreB(Math.min(maxWin, scoreB + 1))} className="w-10 h-10 bg-[#1e2330] border border-[#2c3345] rounded-lg text-xl font-bold hover:bg-green-500/20 hover:border-green-500/50 transition-all text-gray-400 hover:text-green-400">+</button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => updateLiveScore(m.id, scoreA, scoreB)}
                    disabled={saving}
                    className="py-3 text-sm font-black bg-orange-500/20 text-orange-400 hover:bg-orange-500/40 border border-orange-500/30 hover:border-orange-500 rounded-xl uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    Actualizar Score en Vivo
                  </button>
                  {(scoreA === maxWin || scoreB === maxWin) && (
                    <button
                      onClick={() => {
                        const winnerId = scoreA === maxWin ? m.team_a_id : m.team_b_id;
                        submitResult(m.id, winnerId, scoreA, scoreB);
                      }}
                      disabled={saving}
                      className="py-3 text-sm font-black bg-green-600 hover:bg-green-500 text-white rounded-xl uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg"
                    >
                      Finalizar {scoreA}-{scoreB}
                    </button>
                  )}
                </div>
              </div>

              {/* ====== RESULTADO FINAL RÁPIDO ====== */}
              <div className="space-y-4 border-t border-[#2c3345] pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <p className="text-sm text-green-400 uppercase font-black tracking-widest">Resultado Final Rápido</p>
                  <span className="text-[10px] text-gray-500 ml-auto">Finaliza el partido directamente</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {getQuickScores(m.best_of).map(({ a, b }) => {
                    const winnerId = a > b ? m.team_a_id : m.team_b_id;
                    const winnerName = a > b ? m.team_a.short_name : m.team_b.short_name;
                    return (
                      <button
                        key={`final-${a}-${b}`}
                        onClick={() => submitResult(m.id, winnerId, a, b)}
                        className="bg-[#1e2330] hover:bg-green-600 border border-[#2c3345] hover:border-green-500 text-gray-200 hover:text-white py-4 rounded-xl text-base font-bold transition-all shadow-lg"
                        disabled={saving}
                      >
                        {a} - {b} <span className="text-sm opacity-70">(Gana {winnerName})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
