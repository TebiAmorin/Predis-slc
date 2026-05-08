"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Team, Match } from "@/lib/types";

type MatchWithTeams = Match & { team_a: Team; team_b: Team };

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
  const [editingMatch, setEditingMatch] = useState<MatchWithTeams | null>(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  // Filters
  const [searchFilter, setSearchFilter] = useState("");
  const [tab, setTab] = useState<"partidos" | "equipos">("partidos");

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
    // Mantenemos día/hora para clonar más rápido si están metiendo muchos seguidos
    await loadData();
    setSaving(false);
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
  }

  async function setStatus(matchId: string, status: string) {
    setSaving(true);
    await supabase.from("matches").update({ status }).eq("id", matchId);
    await loadData();
    setSaving(false);
  }

  async function submitResult(matchId: string, winnerId: string, sA: number, sB: number) {
    setSaving(true);
    await supabase.from("matches").update({
      winner_id: winnerId, score_a: sA, score_b: sB, status: "completed",
    }).eq("id", matchId);
    setEditingMatch(null);
    await loadData();
    setSaving(false);
  }

  async function revertResult(matchId: string) {
    if (!confirm("¿Deshacer resultado?")) return;
    setSaving(true);
    await supabase.from("matches").update({
      winner_id: null, score_a: null, score_b: null, status: "upcoming",
    }).eq("id", matchId);
    await loadData();
    setSaving(false);
  }

  async function deleteMatch(matchId: string) {
    if (!confirm("¿Borrar partido?")) return;
    await supabase.from("predictions").delete().eq("match_id", matchId);
    await supabase.from("matches").delete().eq("id", matchId);
    await loadData();
  }

  async function toggleEliminated(teamId: string, currentStatus: boolean) {
    setSaving(true);
    await supabase.from("teams").update({ eliminated: !currentStatus }).eq("id", teamId);
    await loadData();
    setSaving(false);
  }

  const STAGES = [
    "Phase 1 - Upper Bracket", "Phase 1 - Lower Bracket", "Phase 1 - UB Final", "Phase 1 - LB Final",
    "Phase 2 - Swiss Round 1", "Phase 2 - Swiss Round 2", "Phase 2 - Swiss Round 3", "Phase 2 - Swiss Round 4", "Phase 2 - Swiss Round 5",
    "Playoffs - Quarterfinal", "Playoffs - Semifinal", "Playoffs - Grand Final",
  ];

  const filteredMatches = useMemo(() => {
    if (!searchFilter) return matches;
    const lower = searchFilter.toLowerCase();
    return matches.filter(m => 
      m.team_a.name.toLowerCase().includes(lower) || 
      m.team_b.name.toLowerCase().includes(lower) ||
      m.stage.toLowerCase().includes(lower)
    );
  }, [matches, searchFilter]);

  if (loading) return <div className="p-10">Cargando admin...</div>;
  if (!isAdmin) return <div className="p-10">No autorizado.</div>;

  const inputStyle = "bg-[#1e2330] border border-[#2c3345] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#4a5568]";

  return (
    <div className="font-sans text-sm max-w-[1400px] mx-auto p-4 space-y-8 text-gray-200">
      
      {/* Sugerencias añadidas: Filtro rápido de partidos y layout comprimido */}
      <div className="flex justify-between items-end border-b border-[#2c3345] pb-2">
        <div className="flex gap-4 items-center">
          <h1 className="text-2xl font-bold mr-4">Admin Panel</h1>
          <button onClick={() => setTab("partidos")} className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${tab === "partidos" ? "border-blue-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}>PARTIDOS</button>
          <button onClick={() => setTab("equipos")} className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${tab === "equipos" ? "border-blue-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}>GESTIÓN DE EQUIPOS</button>
        </div>
        {tab === "partidos" && (
          <div className="flex items-center gap-4">
            <input 
              type="text" 
              placeholder="Buscar equipo o fase..." 
              className={inputStyle}
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-8 items-start">
        
        {/* PESTAÑA: PARTIDOS */}
        {tab === "partidos" && (
          <div className="w-full space-y-8">
            
            {/* Creador de partidos - Extra Grande */}
            <form onSubmit={addMatch} className="bg-[#151923] border border-[#2c3345] rounded-xl p-8 shadow-2xl flex flex-col gap-6">
              <h2 className="text-xl font-bold text-white border-b border-[#2c3345] pb-2">Crear Nuevo Partido</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Día (Mayo)</label>
                  <input type="number" min="1" max="31" className={`w-full text-lg p-3 ${inputStyle}`} value={matchDay} onChange={e => setMatchDay(e.target.value)} required />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Hora</label>
                  <input type="time" className={`w-full text-lg p-3 ${inputStyle}`} value={matchTime} onChange={e => setMatchTime(e.target.value)} required />
                </div>
                <div className="col-span-2 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Fase</label>
                  <select className={`w-full text-lg p-3 ${inputStyle}`} value={matchStage} onChange={e => setMatchStage(e.target.value)}>
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="block text-sm font-black text-blue-400 uppercase tracking-widest">Equipo A</label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 max-h-[300px] overflow-y-auto p-3 bg-[#0f1219] rounded-xl border border-[#2c3345]">
                    {teams.filter(t => !t.eliminated).map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setMatchTeamA(t.id)}
                        className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                          matchTeamA === t.id ? "bg-blue-600/30 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-[#1e2330] border-transparent hover:border-[#2c3345]"
                        }`}
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

                <div className="space-y-4">
                  <label className="block text-sm font-black text-blue-400 uppercase tracking-widest">Equipo B</label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 max-h-[300px] overflow-y-auto p-3 bg-[#0f1219] rounded-xl border border-[#2c3345]">
                    {teams.filter(t => !t.eliminated).map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setMatchTeamB(t.id)}
                        className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                          matchTeamB === t.id ? "bg-blue-600/30 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-[#1e2330] border-transparent hover:border-[#2c3345]"
                        }`}
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

              <div className="flex gap-4 items-end mt-4">
                <div className="w-1/3">
                  <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Formato</label>
                  <select className={`w-full text-lg p-3 ${inputStyle}`} value={matchBo} onChange={e => setMatchBo(+e.target.value)}>
                    <option value={1}>BO1</option>
                    <option value={3}>BO3</option>
                    <option value={5}>BO5</option>
                  </select>
                </div>
                <button type="submit" className={`w-2/3 h-[60px] text-xl font-black bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-all disabled:opacity-50 shadow-lg`} disabled={saving}>CREAR PARTIDO</button>
              </div>
            </form>

            {/* Tabla de Partidos */}
            <div className="bg-[#151923] border border-[#2c3345] rounded-xl overflow-x-auto shadow-2xl">
              <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#1e2330] text-xs text-gray-400 border-b border-[#2c3345]">
                  <th className="p-4 font-medium uppercase tracking-widest">Fecha</th>
                  <th className="p-4 font-medium uppercase tracking-widest">Fase</th>
                  <th className="p-4 font-medium text-center uppercase tracking-widest">Fmt</th>
                  <th className="p-4 font-medium text-right uppercase tracking-widest">Equipos</th>
                  <th className="p-4 font-medium text-center uppercase tracking-widest">Res</th>
                  <th className="p-4 font-medium text-right uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2c3345]">
                {filteredMatches.map(match => {
                  const d = new Date(match.match_date);
                  const isFinished = match.status === "completed";
                  return (
                    <tr key={match.id} className="hover:bg-[#1e2330] transition-colors">
                      <td className="p-4 text-xs text-gray-400 whitespace-nowrap">
                        {d.getDate()}/{d.getMonth()+1} {d.getHours().toString().padStart(2, '0')}:{d.getMinutes().toString().padStart(2, '0')}
                      </td>
                      <td className="p-4 text-xs text-gray-300 whitespace-nowrap uppercase font-bold">{match.stage.replace('Phase', 'P').replace('Playoffs', 'PO')}</td>
                      <td className="p-4 text-xs text-center text-gray-500 font-bold">BO{match.best_of}</td>
                      <td className="p-4 whitespace-nowrap text-right">
                        <span className={isFinished && match.winner_id === match.team_a_id ? "text-green-400 font-black text-base" : isFinished ? "text-gray-500" : "font-bold"}>{match.team_a.short_name}</span>
                        <span className="text-gray-600 mx-2 text-xs">vs</span>
                        <span className={isFinished && match.winner_id === match.team_b_id ? "text-green-400 font-black text-base" : isFinished ? "text-gray-500" : "font-bold"}>{match.team_b.short_name}</span>
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        {isFinished ? (
                          <span className="font-mono text-lg font-black text-green-400 bg-green-400/10 px-3 py-1 rounded-lg">{match.score_a}-{match.score_b}</span>
                        ) : match.status === "live" ? (
                          <span className="text-xs text-red-400 font-black animate-pulse bg-red-400/10 px-2 py-1 rounded">LIVE</span>
                        ) : (
                          <span className="text-xs text-gray-500">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap space-x-3">
                        {isFinished ? (
                          <button onClick={() => revertResult(match.id)} className="text-xs text-gray-400 hover:text-white underline font-bold uppercase">Deshacer</button>
                        ) : (
                          <>
                            {match.status === "upcoming" && (
                              <button onClick={() => setStatus(match.id, "live")} className="text-xs font-black bg-red-500/20 text-red-400 hover:bg-red-500/40 px-3 py-1.5 rounded uppercase tracking-widest transition-all">ON AIR</button>
                            )}
                            <button onClick={() => { setEditingMatch(match); setScoreA(0); setScoreB(0); }} className="text-xs font-black bg-green-500/20 text-green-400 hover:bg-green-500/40 px-3 py-1.5 rounded uppercase tracking-widest transition-all">RESULTADO</button>
                          </>
                        )}
                        <button onClick={() => deleteMatch(match.id)} className="text-xs text-red-500 hover:text-red-400 font-bold p-1 transition-colors">✕</button>
                      </td>
                    </tr>
                  )
                })}
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
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-[#1e2330] text-gray-400 border-b border-[#2c3345]">
                  <tr>
                    <th className="p-4 font-bold text-base uppercase tracking-widest">Equipo</th>
                    <th className="p-4 font-bold text-base text-right uppercase tracking-widest">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2c3345]">
                  {teams.map(team => (
                    <tr key={team.id} className={`hover:bg-[#1e2330] transition-colors ${team.eliminated ? 'opacity-40 grayscale line-through' : ''}`}>
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          {team.logo_url && <img src={team.logo_url} className="w-12 h-12 object-contain" alt="" />}
                          <div>
                            <p className="text-xl font-black text-white uppercase">{team.name}</p>
                            <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">{team.short_name} — {team.group_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => toggleEliminated(team.id, !!team.eliminated)} className={`px-4 py-2 font-bold rounded text-sm ${team.eliminated ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}>
                          {team.eliminated ? "Revivir" : "Eliminar del Torneo"}
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

      {/* MODAL RESULTADOS GIGANTE */}
      {editingMatch && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-md p-4">
          <div className="bg-[#151923] border border-[#2c3345] rounded-2xl p-8 w-full max-w-3xl shadow-2xl space-y-8">
            <div className="flex justify-between items-start border-b border-[#2c3345] pb-4">
              <div>
                <h2 className="text-3xl font-black text-white uppercase">Establecer Resultado</h2>
                <p className="text-lg text-gray-400 mt-1">{editingMatch.stage} - BO{editingMatch.best_of}</p>
              </div>
              <button onClick={() => setEditingMatch(null)} className="text-gray-400 hover:text-white p-2 text-2xl font-bold">✕</button>
            </div>

            {/* Quick buttons */}
            <div className="space-y-4">
              <p className="text-sm text-blue-400 uppercase font-bold tracking-widest text-center">1-Clic (Recomendado)</p>
              <div className="grid grid-cols-2 gap-4">
                {editingMatch.best_of === 3 && (
                  <>
                    <button onClick={() => submitResult(editingMatch.id, editingMatch.team_a_id, 2, 0)} className="bg-[#1e2330] hover:bg-green-600 border border-[#2c3345] hover:border-green-500 text-gray-200 hover:text-white py-6 rounded-xl text-xl font-bold transition-all shadow-lg">2 - 0 (Gana {editingMatch.team_a.short_name})</button>
                    <button onClick={() => submitResult(editingMatch.id, editingMatch.team_b_id, 0, 2)} className="bg-[#1e2330] hover:bg-green-600 border border-[#2c3345] hover:border-green-500 text-gray-200 hover:text-white py-6 rounded-xl text-xl font-bold transition-all shadow-lg">0 - 2 (Gana {editingMatch.team_b.short_name})</button>
                    <button onClick={() => submitResult(editingMatch.id, editingMatch.team_a_id, 2, 1)} className="bg-[#1e2330] hover:bg-green-600 border border-[#2c3345] hover:border-green-500 text-gray-200 hover:text-white py-6 rounded-xl text-xl font-bold transition-all shadow-lg">2 - 1 (Gana {editingMatch.team_a.short_name})</button>
                    <button onClick={() => submitResult(editingMatch.id, editingMatch.team_b_id, 1, 2)} className="bg-[#1e2330] hover:bg-green-600 border border-[#2c3345] hover:border-green-500 text-gray-200 hover:text-white py-6 rounded-xl text-xl font-bold transition-all shadow-lg">1 - 2 (Gana {editingMatch.team_b.short_name})</button>
                  </>
                )}
                {editingMatch.best_of === 1 && (
                  <>
                    <button onClick={() => submitResult(editingMatch.id, editingMatch.team_a_id, 1, 0)} className="bg-[#1e2330] hover:bg-green-600 border border-[#2c3345] hover:border-green-500 text-gray-200 hover:text-white py-6 rounded-xl text-xl font-bold transition-all shadow-lg">1 - 0 (Gana {editingMatch.team_a.short_name})</button>
                    <button onClick={() => submitResult(editingMatch.id, editingMatch.team_b_id, 0, 1)} className="bg-[#1e2330] hover:bg-green-600 border border-[#2c3345] hover:border-green-500 text-gray-200 hover:text-white py-6 rounded-xl text-xl font-bold transition-all shadow-lg">0 - 1 (Gana {editingMatch.team_b.short_name})</button>
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-[#2c3345] pt-6 space-y-6 bg-[#0f1219] p-6 rounded-xl mt-4">
              <p className="text-sm text-gray-500 uppercase font-bold tracking-widest text-center">Score Manual (Si no es BO1/BO3 estándar)</p>
              <div className="flex items-center justify-center gap-8">
                <div className="flex flex-col items-center gap-3">
                  <span className="font-black text-2xl uppercase tracking-wider">{editingMatch.team_a.short_name}</span>
                  <input type="number" min="0" value={scoreA} onChange={e => setScoreA(+e.target.value)} className="w-24 bg-[#1e2330] border-2 border-[#2c3345] text-center text-4xl font-bold p-3 rounded-lg focus:border-blue-500 focus:outline-none" />
                  <button onClick={() => submitResult(editingMatch.id, editingMatch.team_a_id, scoreA, scoreB)} className="w-full mt-2 text-lg font-bold bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded shadow-lg transition-colors">✔ GANADOR</button>
                </div>
                <span className="text-5xl font-black text-gray-700 pb-10">-</span>
                <div className="flex flex-col items-center gap-3">
                  <span className="font-black text-2xl uppercase tracking-wider">{editingMatch.team_b.short_name}</span>
                  <input type="number" min="0" value={scoreB} onChange={e => setScoreB(+e.target.value)} className="w-24 bg-[#1e2330] border-2 border-[#2c3345] text-center text-4xl font-bold p-3 rounded-lg focus:border-blue-500 focus:outline-none" />
                  <button onClick={() => submitResult(editingMatch.id, editingMatch.team_b_id, scoreA, scoreB)} className="w-full mt-2 text-lg font-bold bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded shadow-lg transition-colors">✔ GANADOR</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
