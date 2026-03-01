"use client";

import { useTournamentStore } from '@/hooks/use-tournament-store';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Calendar, Users, Play, ShieldAlert, ShoppingBag, Layers, Target, ChevronRight, UserCircle2, Star, Sword, Zap, Info, Coins, LayoutGrid, Sparkles, RefreshCw, Brackets, Group } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { Team, Player, Match, TournamentGroup } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CrestIcon } from '@/components/ui/crest-icon';

export default function TournamentDetailPage() {
  const { id } = useParams();
  const { tournaments, teams, players, updateTournament, settings, applySanction, resolveMatch, triggerMarketMoves, advanceSeason, createKnockoutFromStandings } = useTournamentStore();
  const { toast } = useToast();
  
  const [sanctionTargetId, setSanctionTargetId] = useState('');
  const [sanctionType, setSanctionType] = useState<'club' | 'player'>('club');
  const [sanctionValue, setSanctionValue] = useState(1);
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [viewingTeamId, setViewTeamId] = useState<string | null>(null);

  const tournament = tournaments.find(t => t.id === id);

  const isSeasonOver = useMemo(() => {
    if (!tournament) return false;
    return tournament.matches.length > 0 && tournament.matches.every(m => m.isSimulated);
  }, [tournament]);

  const getStandingsForParticipants = (participantIds: string[]) => {
    if (!tournament) return [];
    return participantIds.map(pId => {
      const item = teams.find(t => t.id === pId) || players.find(p => p.id === pId);
      if (!item) return null;
      
      let played = 0, won = 0, lost = 0, draw = 0, gf = 0, ga = 0, pts = 0;
      tournament.matches.forEach(m => {
        if (!m.isSimulated || m.homeScore === undefined) return;
        if (m.homeId === pId || m.awayId === pId) {
          played++;
          const isHome = m.homeId === pId;
          const myScore = isHome ? m.homeScore : m.awayScore;
          const opScore = isHome ? m.awayScore : m.homeScore;
          gf += myScore; ga += opScore;
          if (myScore > opScore) { won++; pts += tournament.winPoints; }
          else if (myScore < opScore) { lost++; pts += tournament.lossPoints; }
          else { draw++; pts += tournament.drawPoints; }
        }
      });
      return { ...item, played, won, lost, draw, gf, ga, gd: gf - ga, pts };
    })
    .filter((x): x is any => x !== null)
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd);
  };

  const tournamentStandings = useMemo(() => {
    if (!tournament) return [];
    if (tournament.leagueType === 'groups' && tournament.groups) {
      return tournament.groups.map(g => ({
        name: g.name,
        data: getStandingsForParticipants(g.participantIds)
      }));
    }
    return [{ name: "Clasificación General", data: getStandingsForParticipants(tournament.participants) }];
  }, [tournament, teams, players]);

  const currentMatchdayMatches = useMemo(() => {
    if (!tournament) return [];
    return tournament.matches.filter(m => m.matchday === tournament.currentMatchday);
  }, [tournament]);

  const arcadeMatch = useMemo(() => {
    if (!tournament || tournament.mode !== 'arcade' || !tournament.managedParticipantId) return null;
    return currentMatchdayMatches.find(m => m.homeId === tournament.managedParticipantId || m.awayId === tournament.managedParticipantId);
  }, [tournament, currentMatchdayMatches]);

  const simulateMatchLogic = (m: Match) => {
    let hScore = 0, aScore = 0;
    const rule = tournament?.scoringRuleType;
    const val = tournament?.scoringValue || 9;
    
    if (rule === 'bestOfN') {
      hScore = Math.floor(Math.random() * (val + 1));
      aScore = val - hScore;
    } else {
      hScore = Math.floor(Math.random() * 5);
      aScore = Math.floor(Math.random() * 5);
    }
    
    const hPlayers = players.filter(p => p.teamId === m.homeId).sort((a, b) => b.monetaryValue - a.monetaryValue);
    const aPlayers = players.filter(p => p.teamId === m.awayId).sort((a, b) => b.monetaryValue - a.monetaryValue);
    
    const getSelection = (pList: Player[]) => {
      if (Math.random() < 0.7) return pList[0]?.id;
      return pList[1]?.id || pList[0]?.id;
    };

    return { hScore, aScore, hPlayerId: getSelection(hPlayers), aPlayerId: getSelection(aPlayers) };
  };

  const handleSimulateSingleMatch = (matchId: string, isDual: boolean = false) => {
    const targetMatches = isDual ? tournament?.dualLeagueMatches : tournament?.matches;
    const m = targetMatches?.find(x => x.id === matchId);
    if (!m || m.isSimulated || !tournament) return;
    const { hScore, aScore, hPlayerId, aPlayerId } = simulateMatchLogic(m);
    resolveMatch(tournament.id, m.id, hScore, aScore, isDual, hPlayerId, aPlayerId);
    toast({ title: "Partido Simulado" });
  };

  const handleSimulateMatchday = () => {
    if (!tournament) return;
    if (tournament.mode === 'arcade' && arcadeMatch && !arcadeMatch.isSimulated) {
      setSelectedMatch(arcadeMatch);
      setIsPreviewOpen(true);
      return;
    }

    currentMatchdayMatches.forEach(m => {
      if (m.isSimulated) return;
      const { hScore, aScore, hPlayerId, aPlayerId } = simulateMatchLogic(m);
      resolveMatch(tournament.id, m.id, hScore, aScore, false, hPlayerId, aPlayerId);
      if (tournament.dualLeagueEnabled) {
        const mirror = tournament.dualLeagueMatches.find(x => x.matchday === m.matchday && (x.homeId === m.homeId || x.awayId === m.homeId));
        if (mirror && !mirror.isSimulated) {
          const { hScore: mh, aScore: ma, hPlayerId: hp, aPlayerId: ap } = simulateMatchLogic(mirror);
          resolveMatch(tournament.id, mirror.id, mh, ma, true, hp, ap);
        }
      }
    });

    triggerMarketMoves(tournament.id);
    const nextMatchday = tournament.currentMatchday + 1;
    const maxMatchday = tournament.matches.length > 0 ? Math.max(...tournament.matches.map(m => m.matchday)) : 0;
    
    if (nextMatchday <= maxMatchday) {
      updateTournament({ ...tournament, currentMatchday: nextMatchday });
    }
    toast({ title: "Jornada Finalizada", description: "El mercado se ha movido." });
  };

  const playArcadeMatch = () => {
    if (!selectedMatch || !selectedPlayerId || !tournament) return;
    const { hScore, aScore, hPlayerId, aPlayerId } = simulateMatchLogic(selectedMatch);
    
    const isHome = selectedMatch.homeId === tournament.managedParticipantId;
    const userHPlayer = isHome ? selectedPlayerId : hPlayerId;
    const userAPlayer = !isHome ? selectedPlayerId : aPlayerId;

    resolveMatch(tournament.id, selectedMatch.id, hScore, aScore, false, userHPlayer, userAPlayer);
    
    if (tournament.dualLeagueEnabled) {
      const mirrorMatch = tournament.dualLeagueMatches.find(m => m.matchday === tournament.currentMatchday && (m.homeId === selectedMatch.homeId || m.awayId === selectedMatch.homeId));
      if (mirrorMatch) {
        const { hScore: mh, aScore: ma, hPlayerId: hp, aPlayerId: ap } = simulateMatchLogic(mirrorMatch);
        resolveMatch(tournament.id, mirrorMatch.id, mh, ma, true, hp, ap);
      }
    }

    setIsPreviewOpen(false);
    toast({ title: "¡Partido Finalizado!", description: `${hScore} - ${aScore}` });
  };

  if (!tournament) return <div className="p-20 text-center font-black">TORNEO NO ENCONTRADO</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2 md:px-0">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center shadow-2xl shrink-0"><Trophy className="text-white w-10 h-10" /></div>
          <div><h1 className="text-4xl font-black uppercase tracking-tighter truncate">{tournament.name}</h1><p className="text-muted-foreground font-bold uppercase text-xs tracking-widest mt-1">{tournament.sport} • SEASON {tournament.currentSeason} • JORNADA {tournament.currentMatchday}</p></div>
        </div>
        {!isSeasonOver && (
          <Button onClick={handleSimulateMatchday} size="lg" className="h-16 rounded-2xl px-10 font-black shadow-xl shadow-primary/20"><Play className="w-5 h-5 mr-3 fill-current" /> SIGUIENTE JORNADA</Button>
        )}
      </header>

      {isSeasonOver && (
        <Card className="border-none bg-accent/10 border-2 border-accent/20 rounded-[3rem] p-8 animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-black uppercase text-accent mb-2">¡TEMPORADA FINALIZADA!</h2>
              <p className="font-bold text-muted-foreground uppercase text-xs">El comisionado ha cerrado las actas. Es hora de decidir el futuro.</p>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button onClick={() => advanceSeason(tournament.id)} size="lg" className="rounded-2xl h-14 font-black shadow-lg">
                <RefreshCw className="w-4 h-4 mr-2" /> NUEVA TEMPORADA
              </Button>
              {tournament.format === 'league' && (
                <>
                  <Button onClick={() => createKnockoutFromStandings(tournament.id, 'playoff')} size="lg" variant="secondary" className="rounded-2xl h-14 font-black">
                    <Brackets className="w-4 h-4 mr-2" /> LANZAR PLAYOFFS
                  </Button>
                  <Button onClick={() => createKnockoutFromStandings(tournament.id, 'relegation')} size="lg" variant="destructive" className="rounded-2xl h-14 font-black">
                    <ShieldAlert className="w-4 h-4 mr-2" /> LANZAR DESCENSO
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      <Tabs defaultValue="table" className="w-full px-2 md:px-0">
        <TabsList className="bg-muted/30 p-1 h-14 rounded-2xl border mb-6 flex overflow-x-auto scrollbar-hide">
          <TabsTrigger value="table" className="rounded-xl font-black uppercase text-xs px-6">Clasificación</TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-xl font-black uppercase text-xs px-6">Calendario</TabsTrigger>
          {tournament.dualLeagueEnabled && <TabsTrigger value="dual" className="rounded-xl font-black uppercase text-xs px-6">Liga Dual</TabsTrigger>}
          <TabsTrigger value="market" className="rounded-xl font-black uppercase text-xs px-6">Mercado</TabsTrigger>
          <TabsTrigger value="discipline" className="rounded-xl font-black uppercase text-xs px-6">Disciplina</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-8">
          {tournamentStandings.map((group, gIdx) => (
            <Card key={gIdx} className="border-none bg-card shadow-2xl rounded-[3rem] overflow-hidden mb-8">
              <CardHeader className="bg-muted/10 border-b p-8 flex flex-row items-center gap-3">
                <Group className="text-primary w-6 h-6" />
                <CardTitle className="text-xl font-black uppercase">{group.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/5">
                      <TableRow className="border-b"><TableHead className="w-12 text-center font-black">#</TableHead><TableHead className="font-black">Club</TableHead><TableHead className="text-center font-black">P</TableHead><TableHead className="text-center font-black">DIF</TableHead><TableHead className="text-center font-black">CR</TableHead><TableHead className="text-center font-black text-primary">PTS</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.data.map((item, idx) => {
                        const isPlayoff = idx < (tournament.playoffSpots || 0);
                        const isRelegation = idx >= (group.data.length - (tournament.relegationSpots || 0));
                        return (
                          <TableRow 
                            key={item.id} 
                            className={cn(
                              "h-16 cursor-pointer hover:bg-primary/5 transition-colors",
                              tournament.managedParticipantId === item.id && "bg-primary/5 border-l-4 border-l-primary",
                              isPlayoff && "bg-green-500/5",
                              isRelegation && "bg-red-500/5"
                            )} 
                            onClick={() => setViewTeamId(item.id)}
                          >
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-black text-lg leading-none">{idx + 1}</span>
                                {isPlayoff && <span className="text-[8px] font-black text-green-500 uppercase mt-1">PO</span>}
                                {isRelegation && <span className="text-[8px] font-black text-red-500 uppercase mt-1">DE</span>}
                              </div>
                            </TableCell>
                            <TableCell><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-black text-[10px]">{('abbreviation' in item) ? item.abbreviation : 'IA'}</div><span className="font-bold">{item.name}</span></div></TableCell>
                            <TableCell className="text-center font-bold">{item.played}</TableCell>
                            <TableCell className={cn("text-center font-bold", item.gd >= 0 ? "text-green-500" : "text-destructive")}>{item.gd > 0 ? `+${item.gd}` : item.gd}</TableCell>
                            <TableCell className="text-center font-bold text-accent">{('budget' in item) ? item.budget : '-'}</TableCell>
                            <TableCell className="text-center font-black text-xl text-primary">{item.pts}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-8">
          <ScrollArea className="h-[700px] border rounded-[3rem] bg-card p-8">
            <div className="divide-y divide-muted/10 space-y-8">
              {Array.from({ length: tournament.matches.length > 0 ? Math.max(...tournament.matches.map(m => m.matchday)) : 0 }).map((_, i) => (
                <div key={i} className="pt-8 first:pt-0">
                  <header className="flex justify-between items-center mb-6"><h3 className="font-black uppercase text-accent tracking-widest text-sm">JORNADA {i+1}</h3></header>
                  <div className="space-y-4 max-w-2xl mx-auto">
                    {tournament.matches.filter(m => m.matchday === i+1).map(m => {
                      const h = teams.find(t => t.id === m.homeId);
                      const a = teams.find(t => t.id === m.awayId);
                      if(!h || !a) return null;
                      return (
                        <div key={m.id} className={cn("grid grid-cols-[1fr_auto_1fr_auto] items-center gap-4 p-4 rounded-2xl border shadow-md", m.isSimulated && "opacity-60")}>
                          <div className="flex items-center gap-3 overflow-hidden">
                            <CrestIcon shape={h.emblemShape} pattern={h.emblemPattern} c1={h.crestPrimary} c2={h.crestSecondary} c3={h.crestTertiary || h.crestSecondary} size="w-8 h-8" />
                            <span className="font-black text-lg">{h.abbreviation}</span>
                          </div>
                          <div className="flex items-center gap-2 px-4"><div className="w-10 h-10 flex items-center justify-center rounded-lg font-black text-xl border-2">{m.homeScore ?? '-'}</div><span className="font-black opacity-30 text-xl">:</span><div className="w-10 h-10 flex items-center justify-center rounded-lg font-black text-xl border-2">{m.awayScore ?? '-'}</div></div>
                          <div className="flex items-center gap-3 justify-end overflow-hidden">
                            <span className="font-black text-lg">{a.abbreviation}</span>
                            <CrestIcon shape={a.emblemShape} pattern={a.emblemPattern} c1={a.crestPrimary} c2={a.crestSecondary} c3={a.crestTertiary || a.crestSecondary} size="w-8 h-8" />
                          </div>
                          <div className="pl-4 border-l">{!m.isSimulated && <Button size="icon" variant="ghost" className="text-primary h-8 w-8" onClick={() => handleSimulateSingleMatch(m.id)}><Zap className="w-4 h-4 fill-current" /></Button>}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="dual" className="space-y-8">
          <Card className="border-none bg-card shadow-2xl rounded-[3rem] p-8">
            <header className="mb-8"><h2 className="text-2xl font-black uppercase flex items-center gap-3"><Layers className="text-accent" /> Liga de Reservas</h2></header>
            <div className="grid gap-4 max-w-2xl mx-auto">
              {tournament.dualLeagueMatches.filter(m => m.matchday === tournament.currentMatchday).map(m => {
                const h = teams.find(t => t.id === m.homeId);
                const a = teams.find(t => t.id === m.awayId);
                return (
                  <div key={m.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border">
                    <div className="flex items-center gap-3"><CrestIcon shape={h?.emblemShape!} pattern={h?.emblemPattern!} c1={h?.crestPrimary!} c2={h?.crestSecondary!} size="w-6 h-6" /><span className="font-black">{h?.abbreviation}</span></div>
                    <div className="flex items-center gap-4 font-mono font-black text-xl"><span>{m.homeScore ?? '-'}</span><span>:</span><span>{m.awayScore ?? '-'}</span></div>
                    <div className="flex items-center gap-3 justify-end"><span className="font-black">{a?.abbreviation}</span><CrestIcon shape={a?.emblemShape!} pattern={a?.emblemPattern!} c1={a?.crestPrimary!} c2={a?.crestSecondary!} size="w-6 h-6" /></div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="market" className="space-y-8">
          <Card className="border-none bg-card shadow-2xl rounded-[3rem] p-8">
            <header className="mb-8"><h2 className="text-2xl font-black uppercase flex items-center gap-3"><ShoppingBag className="text-accent" /> Dinámica de Mercado</h2></header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-black text-xs uppercase text-muted-foreground border-b pb-2">Valores Actualizados</h3>
                <ScrollArea className="h-[400px]">
                  <div className="grid gap-3 pr-2">
                    {players.filter(p => tournament.participants.includes(p.teamId || '') || !p.teamId).sort((a,b) => b.monetaryValue - a.monetaryValue).map(p => (
                      <div key={p.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border">
                        <div className="overflow-hidden"><p className="font-black truncate">{p.name}</p><p className="text-[10px] font-bold text-accent uppercase">{teams.find(t => t.id === p.teamId)?.name || 'Agente Libre'}</p></div>
                        <span className="font-black text-sm">{p.monetaryValue} CR</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div className="p-6 bg-accent/5 rounded-3xl border border-accent/20 flex flex-col items-center justify-center text-center">
                <Sparkles className="w-12 h-12 text-accent mb-4" />
                <h4 className="text-xl font-black uppercase mb-2">Mercado Vivo</h4>
                <p className="text-sm text-muted-foreground">Los valores fluctúan tras cada jornada según el rendimiento. La IA de los clubs realiza traspasos estratégicos automáticamente.</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="discipline" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="rounded-[3rem] p-8 shadow-2xl"><h2 className="text-xl font-black uppercase text-destructive flex items-center gap-3 mb-6"><ShieldAlert /> Sanción</h2><div className="space-y-6">
              <div className="space-y-2"><Label>Tipo</Label><Select value={sanctionType} onValueChange={(v: any) => setSanctionType(v)}><SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="club">Multa (Club)</SelectItem><SelectItem value="player">Suspensión (Agente)</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Objetivo</Label><Select onValueChange={setSanctionTargetId}><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Elegir..." /></SelectTrigger><SelectContent>{sanctionType === 'club' ? teams.filter(t => tournament.participants.includes(t.id)).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>) : players.filter(p => p.teamId && tournament.participants.includes(p.teamId)).map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({teams.find(t => t.id === p.teamId)?.abbreviation})</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Valor</Label><Input type="number" value={sanctionValue} onChange={e => setSanctionValue(Number(e.target.value))} className="h-12 rounded-xl" /></div>
              <Button variant="destructive" className="w-full h-12 rounded-xl font-black" onClick={() => { if(!sanctionTargetId) return; applySanction(sanctionTargetId, sanctionType === 'club' ? 'team-budget' : 'player-suspension', sanctionValue); toast({ title: "Sanción Aplicada" }); }}>CONFIRMAR</Button>
            </div></Card>
            <Card className="rounded-[3rem] p-8 shadow-2xl"><h2 className="text-xl font-black uppercase flex items-center gap-3 mb-6"><ChevronRight className="text-yellow-500" /> Sancionados</h2><ScrollArea className="h-[300px]"><div className="space-y-3">{players.filter(p => p.suspensionMatchdays > 0).map(p => (
              <div key={p.id} className="p-4 bg-destructive/10 rounded-2xl border border-destructive/20 flex justify-between items-center"><div><p className="font-black uppercase">{p.name}</p><p className="text-[10px] font-bold opacity-50 uppercase">{teams.find(t => t.id === p.teamId)?.name}</p></div><Badge variant="destructive" className="font-black">{p.suspensionMatchdays} J.</Badge></div>
            ))}</div></ScrollArea></Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="hidden"><DialogTitle>Preview Match</DialogTitle></DialogHeader>
          {arcadeMatch && (
            <div className="flex flex-col">
              <div className="bg-primary p-10 text-white flex items-center gap-8">
                {(() => {
                  const opId = arcadeMatch.homeId === tournament.managedParticipantId ? arcadeMatch.awayId : arcadeMatch.homeId;
                  const opponent = teams.find(t => t.id === opId);
                  const opStandings = tournamentStandings.flatMap(s => s.data).find(s => s.id === opId);
                  const opBestP = players.filter(p => p.teamId === opId).sort((a,b) => b.monetaryValue - a.monetaryValue)[0];
                  
                  return (
                    <>
                      <CrestIcon shape={opponent?.emblemShape!} pattern={opponent?.emblemPattern!} c1={opponent?.crestPrimary!} c2={opponent?.crestSecondary!} c3={opponent?.crestTertiary || opponent?.crestSecondary!} size="w-24 h-24" />
                      <div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter">vs {opponent?.name}</h2>
                        <p className="text-white/80 font-bold uppercase tracking-widest flex items-center gap-2 mt-2"><Target className="w-4 h-4" /> Posición: {tournamentStandings.flatMap(s => s.data).indexOf(opStandings) + 1}º en tabla</p>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="p-10 space-y-8">
                <section className="space-y-4">
                  <h3 className="font-black text-xs uppercase text-muted-foreground tracking-widest border-b pb-2">Líder del Escuadrón</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {players.filter(p => p.teamId === tournament.managedParticipantId && p.suspensionMatchdays === 0).map(p => (
                      <button key={p.id} onClick={() => setSelectedPlayerId(p.id)} className={cn("p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center gap-1", selectedPlayerId === p.id ? "bg-primary/10 border-primary shadow-lg scale-105" : "bg-card border-transparent hover:bg-muted/50")}>
                        <p className="font-black text-[10px] uppercase truncate w-full">{p.name}</p>
                        <p className="text-[10px] font-bold text-primary">{p.monetaryValue} CR</p>
                      </button>
                    ))}
                  </div>
                </section>
                <Button disabled={!selectedPlayerId} onClick={playArcadeMatch} className="w-full h-16 rounded-2xl text-xl font-black bg-primary shadow-xl shadow-primary/20"><Sword className="w-6 h-6 mr-3" /> SALTAR A LA PISTA</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingTeamId} onOpenChange={(o) => !o && setViewTeamId(null)}>
        <DialogContent className="max-w-3xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="hidden"><DialogTitle>Team Info</DialogTitle></DialogHeader>
          {teams.find(t => t.id === viewingTeamId) && (
            <div className="flex flex-col h-[80vh]">
              <div className="p-8 bg-muted/10 border-b flex items-center gap-6">
                <CrestIcon shape={teams.find(t => t.id === viewingTeamId)!.emblemShape} pattern={teams.find(t => t.id === viewingTeamId)!.emblemPattern} c1={teams.find(t => t.id === viewingTeamId)!.crestPrimary} c2={teams.find(t => t.id === viewingTeamId)!.crestSecondary} c3={teams.find(t => t.id === viewingTeamId)!.crestTertiary || teams.find(t => t.id === viewingTeamId)!.crestSecondary} size="w-20 h-20" />
                <div className="flex-1 overflow-hidden">
                  <DialogTitle className="text-3xl font-black uppercase tracking-tighter truncate">{teams.find(t => t.id === viewingTeamId)!.name}</DialogTitle>
                  <div className="flex items-center gap-4 mt-2"><span className="flex items-center gap-1 text-sm font-black text-accent"><Coins className="w-4 h-4" /> {teams.find(t => t.id === viewingTeamId)!.budget} {settings.currency}</span><span className="flex items-center gap-1 text-sm font-black text-primary"><Star className="w-4 h-4 fill-current" /> {teams.find(t => t.id === viewingTeamId)!.rating}</span></div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                <section className="space-y-3"><h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2"><Info className="w-3 h-3" /> Historia</h4><p className="text-sm italic">"{teams.find(t => t.id === viewingTeamId)!.description || 'Sin descripción.'}"</p></section>
                <section className="space-y-4"><h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2"><LayoutGrid className="w-3 h-3" /> Plantilla Actual</h4><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{players.filter(p => p.teamId === viewingTeamId).map(p => (<div key={p.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-xl border"><div><p className="font-bold text-sm truncate">{p.name}</p><p className="text-[9px] font-black uppercase opacity-50">{p.position} • #{p.jerseyNumber}</p></div><Badge variant="outline" className="font-black text-[9px]">{p.monetaryValue} CR</Badge></div>))}</div></section>
              </div>
              <div className="p-6 border-t bg-muted/5 flex justify-end"><Button onClick={() => setViewTeamId(null)} className="rounded-xl font-black h-12 px-8">CERRAR INFORME</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}