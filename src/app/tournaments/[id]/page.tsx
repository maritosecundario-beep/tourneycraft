
"use client";

import { useTournamentStore } from '@/hooks/use-tournament-store';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Calendar, Users, Play, ShieldAlert, ShoppingBag, Layers, Target, ChevronRight, Star, Sword, Zap, Info, Coins, LayoutGrid, Sparkles, RefreshCw, Brackets, Group, Trash2, MapPin, UserCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { Team, Player, Match } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CrestIcon } from '@/components/ui/crest-icon';

export default function TournamentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { tournaments, teams, players, updateTournament, deleteTournament, resolveMatch, triggerMarketMoves, advanceSeason, createKnockoutFromStandings, applySanction, generateSchedule, settings } = useTournamentStore();
  const { toast } = useToast();
  
  const [sanctionTargetId, setSanctionTargetId] = useState('');
  const [sanctionType, setSanctionType] = useState<'club' | 'player'>('club');
  const [sanctionValue, setSanctionValue] = useState(1);
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [userHomeScore, setUserHomeScore] = useState<string>('0');
  const [userAwayScore, setUserAwayScore] = useState<string>('0');
  const [viewingTeamId, setViewTeamId] = useState<string | null>(null);
  const [viewingMatchId, setViewingMatchId] = useState<string | null>(null);

  const tournament = tournaments.find(t => t.id === id);

  const isSeasonOver = useMemo(() => {
    if (!tournament || tournament.matches.length === 0) return false;
    return tournament.matches.every(m => m.isSimulated);
  }, [tournament]);

  const userGroup = useMemo(() => {
    if (!tournament || !tournament.managedParticipantId || tournament.leagueType !== 'groups') return null;
    return tournament.groups?.find(g => g.participantIds.includes(tournament.managedParticipantId!));
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
    const hTeam = teams.find(t => t.id === m.homeId);
    const aTeam = teams.find(t => t.id === m.awayId);
    
    const hPlayers = players.filter(p => p.teamId === m.homeId);
    const aPlayers = players.filter(p => p.teamId === m.awayId);
    
    const hVal = hPlayers.reduce((acc, p) => acc + p.monetaryValue, 0) + (hTeam?.rating || 50) * 2;
    const aVal = aPlayers.reduce((acc, p) => acc + p.monetaryValue, 0) + (aTeam?.rating || 50) * 2;
    
    // Bias probability by value
    const total = hVal + aVal;
    const hProb = hVal / total;
    
    let hScore = 0, aScore = 0;
    const rule = tournament?.scoringRuleType;
    const maxVal = tournament?.scoringValue || 9;
    
    if (rule === 'bestOfN') {
      const rolls = Array.from({ length: maxVal }, () => Math.random() < hProb ? 'h' : 'a');
      hScore = rolls.filter(r => r === 'h').length;
      aScore = maxVal - hScore;
    } else {
      hScore = Math.floor(Math.random() * 5) + (Math.random() < hProb ? 1 : 0);
      aScore = Math.floor(Math.random() * 5) + (Math.random() > hProb ? 1 : 0);
    }
    
    const getSelection = (pList: Player[]) => {
      const sorted = [...pList].sort((a, b) => b.monetaryValue - a.monetaryValue);
      return Math.random() < 0.7 ? sorted[0]?.id : sorted[1]?.id || sorted[0]?.id;
    };

    return { hScore, aScore, hPlayerId: getSelection(hPlayers), aPlayerId: getSelection(aPlayers) };
  };

  const handleSimulateSingleMatch = (matchId: string, isDual: boolean = false) => {
    const targetMatches = isDual ? tournament?.dualLeagueMatches : tournament?.matches;
    const m = targetMatches?.find(x => x.id === matchId);
    if (!m || m.isSimulated || !tournament) return;
    const { hScore, aScore, hPlayerId, aPlayerId } = simulateMatchLogic(m);
    resolveMatch(tournament.id, m.id, hScore, aScore, isDual, hPlayerId, aPlayerId);
  };

  const handleSimulateMatchday = () => {
    if (!tournament) return;

    // Filter matches to simulate only if they belong to user group (if groups exist)
    const matchesToSimulate = currentMatchdayMatches.filter(m => {
      if (tournament.mode === 'arcade' && (m.homeId === tournament.managedParticipantId || m.awayId === tournament.managedParticipantId)) return false;
      if (userGroup) {
        return userGroup.participantIds.includes(m.homeId);
      }
      return true;
    });

    matchesToSimulate.forEach(m => {
      if (m.isSimulated) return;
      const { hScore, aScore, hPlayerId, aPlayerId } = simulateMatchLogic(m);
      resolveMatch(tournament.id, m.id, hScore, aScore, false, hPlayerId, aPlayerId);
      
      // Also simulate dual league mirrored match
      if (tournament.dualLeagueEnabled) {
        const dualMatch = tournament.dualLeagueMatches.find(dm => dm.matchday === m.matchday && dm.homeId === m.awayId && dm.awayId === m.homeId);
        if (dualMatch && !dualMatch.isSimulated) {
          const { hScore: dh, aScore: da, hPlayerId: dhp, aPlayerId: dap } = simulateMatchLogic(dualMatch);
          resolveMatch(tournament.id, dualMatch.id, dh, da, true, dhp, dap);
        }
      }
    });

    if (tournament.mode === 'arcade' && arcadeMatch && !arcadeMatch.isSimulated) {
      setSelectedMatch(arcadeMatch);
      setIsPreviewOpen(true);
    } else {
      triggerMarketMoves(tournament.id);
      const nextMatchday = tournament.currentMatchday + 1;
      const maxMatchday = tournament.matches.length > 0 ? Math.max(...tournament.matches.map(m => m.matchday)) : 0;
      if (nextMatchday <= maxMatchday) {
        updateTournament({ ...tournament, currentMatchday: nextMatchday });
      }
      toast({ title: "Jornada Finalizada" });
    }
  };

  const playArcadeMatch = () => {
    if (!selectedMatch || !selectedPlayerId || !tournament) return;
    
    const hScore = parseInt(userHomeScore);
    const aScore = parseInt(userAwayScore);
    
    const isHome = selectedMatch.homeId === tournament.managedParticipantId;
    const hPlayers = players.filter(p => p.teamId === selectedMatch.homeId);
    const aPlayers = players.filter(p => p.teamId === selectedMatch.awayId);
    
    const hP = isHome ? selectedPlayerId : (players.find(p => p.teamId === selectedMatch.homeId)?.id);
    const aP = !isHome ? selectedPlayerId : (players.find(p => p.teamId === selectedMatch.awayId)?.id);

    resolveMatch(tournament.id, selectedMatch.id, hScore, aScore, false, hP, aP);
    
    // Auto-resolve dual match for arcade team
    if (tournament.dualLeagueEnabled) {
      const dualMatch = tournament.dualLeagueMatches.find(dm => dm.matchday === tournament.currentMatchday && dm.homeId === selectedMatch.awayId && dm.awayId === selectedMatch.homeId);
      if (dualMatch) {
        const { hScore: dh, aScore: da, hPlayerId: dhp, aPlayerId: dap } = simulateMatchLogic(dualMatch);
        resolveMatch(tournament.id, dualMatch.id, dh, da, true, dhp, dap);
      }
    }

    triggerMarketMoves(tournament.id);
    const nextMatchday = tournament.currentMatchday + 1;
    updateTournament({ ...tournament, currentMatchday: nextMatchday });
    
    setIsPreviewOpen(false);
    toast({ title: "Resultado Registrado" });
  };

  const viewingMatch = useMemo(() => {
    if (!viewingMatchId || !tournament) return null;
    return [...tournament.matches, ...tournament.dualLeagueMatches].find(m => m.id === viewingMatchId);
  }, [viewingMatchId, tournament]);

  if (!tournament) return <div className="p-20 text-center font-black">TORNEO NO ENCONTRADO</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-32 px-4 md:px-0">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-primary rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shadow-2xl shrink-0">
            <Trophy className="text-white w-8 h-8 md:w-10 md:h-10" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter truncate max-w-[200px] md:max-w-none">{tournament.name}</h1>
            <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest mt-1">
              {tournament.sport} • SEASON {tournament.currentSeason} • JORNADA {tournament.currentMatchday}
              {userGroup && ` • CONFERENCIA: ${userGroup.name}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {!isSeasonOver && tournament.matches.length > 0 && (
            <Button onClick={handleSimulateMatchday} size="lg" className="flex-1 md:flex-none h-14 md:h-16 rounded-2xl px-10 font-black shadow-xl shadow-primary/20">
              <Play className="w-5 h-5 mr-3 fill-current" /> {tournament.mode === 'arcade' ? 'JUGAR JORNADA' : 'SIGUIENTE JORNADA'}
            </Button>
          )}
          <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-destructive/20 text-destructive" onClick={() => { if(confirm("¿Borrar?")) { deleteTournament(tournament.id); router.push('/tournaments'); } }}>
            <Trash2 className="w-6 h-6" />
          </Button>
        </div>
      </header>

      {tournament.matches.length === 0 && (
        <Card className="border-none bg-yellow-500/10 border-2 border-yellow-500/20 rounded-[2rem] p-8 text-center space-y-6">
          <Calendar className="text-yellow-500 w-12 h-12 mx-auto" />
          <h2 className="text-2xl font-black uppercase text-yellow-600">Calendario Pendiente</h2>
          <Button onClick={() => generateSchedule(tournament.id)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-black h-14 px-10 rounded-xl">GENERAR CALENDARIO</Button>
        </Card>
      )}

      {isSeasonOver && (
        <Card className="border-none bg-accent/10 border-2 border-accent/20 rounded-[2rem] p-6 animate-in fade-in zoom-in">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <h2 className="text-xl md:text-3xl font-black uppercase text-accent">¡TEMPORADA FINALIZADA!</h2>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => advanceSeason(tournament.id)} className="rounded-xl h-12 font-black shadow-lg"><RefreshCw className="w-4 h-4 mr-2" /> NUEVA TEMP.</Button>
              {tournament.format === 'league' && (
                <>
                  <Button onClick={() => createKnockoutFromStandings(tournament.id, 'playoff')} variant="secondary" className="rounded-xl h-12 font-black"><Brackets className="w-4 h-4 mr-2" /> PLAYOFFS</Button>
                  <Button onClick={() => createKnockoutFromStandings(tournament.id, 'relegation')} variant="destructive" className="rounded-xl h-12 font-black"><ShieldAlert className="w-4 h-4 mr-2" /> DESCENSO</Button>
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      <Tabs defaultValue="table" className="w-full">
        <ScrollArea className="w-full whitespace-nowrap mb-6">
          <TabsList className="bg-muted/30 p-1 h-12 md:h-14 rounded-xl md:rounded-2xl border flex w-max">
            <TabsTrigger value="table" className="rounded-lg md:rounded-xl font-black uppercase text-[10px] md:text-xs px-4 md:px-6">Clasificación</TabsTrigger>
            <TabsTrigger value="calendar" className="rounded-lg md:rounded-xl font-black uppercase text-[10px] md:text-xs px-4 md:px-6">Calendario</TabsTrigger>
            {tournament.dualLeagueEnabled && <TabsTrigger value="dual" className="rounded-lg md:rounded-xl font-black uppercase text-[10px] md:text-xs px-4 md:px-6">Liga Dual</TabsTrigger>}
            <TabsTrigger value="market" className="rounded-lg md:rounded-xl font-black uppercase text-[10px] md:text-xs px-4 md:px-6">Mercado</TabsTrigger>
            <TabsTrigger value="discipline" className="rounded-lg md:rounded-xl font-black uppercase text-[10px] md:text-xs px-4 md:px-6">Disciplina</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>

        <TabsContent value="table" className="space-y-6 md:space-y-8">
          {tournamentStandings.map((group, gIdx) => (
            <Card key={gIdx} className="border-none bg-card shadow-2xl rounded-[1.5rem] md:rounded-[3rem] overflow-hidden">
              <CardHeader className="bg-muted/10 border-b p-6 flex flex-row items-center gap-3">
                <Group className="text-primary w-6 h-6" />
                <CardTitle className="text-lg md:text-xl font-black uppercase">{group.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader className="bg-muted/5">
                      <TableRow className="border-b">
                        <TableHead className="w-12 text-center font-black">#</TableHead>
                        <TableHead className="font-black">Club</TableHead>
                        <TableHead className="text-center font-black">P</TableHead>
                        <TableHead className="text-center font-black">DIF</TableHead>
                        <TableHead className="text-center font-black">CR</TableHead>
                        <TableHead className="text-center font-black text-primary">PTS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.data.map((item, idx) => (
                        <TableRow key={item.id} className="h-14 md:h-16 cursor-pointer hover:bg-primary/5 transition-colors" onClick={() => setViewTeamId(item.id)}>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-black text-base md:text-lg">{idx + 1}</span>
                              {idx < (tournament.playoffSpots || 0) && <span className="text-[7px] font-black text-green-500">PO</span>}
                              {idx >= (group.data.length - (tournament.relegationSpots || 0)) && <span className="text-[7px] font-black text-red-500">DE</span>}
                            </div>
                          </TableCell>
                          <TableCell><div className="flex items-center gap-2 md:gap-3"><CrestIcon shape={item.emblemShape} pattern={item.emblemPattern} c1={item.crestPrimary} c2={item.crestSecondary} size="w-6 h-6 md:w-8 md:h-8" /><span className="font-bold text-xs md:text-sm truncate max-w-[80px] md:max-w-none">{item.name}</span></div></TableCell>
                          <TableCell className="text-center font-bold text-xs">{item.played}</TableCell>
                          <TableCell className={cn("text-center font-bold text-xs", item.gd >= 0 ? "text-green-500" : "text-destructive")}>{item.gd > 0 ? `+${item.gd}` : item.gd}</TableCell>
                          <TableCell className="text-center font-bold text-accent text-xs">{item.budget}</TableCell>
                          <TableCell className="text-center font-black text-lg md:text-xl text-primary">{item.pts}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <Card className="border-none bg-card shadow-2xl rounded-[1.5rem] p-6 md:p-8">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-8">
                {Array.from({ length: Math.max(...tournament.matches.map(m => m.matchday), 0) }).map((_, i) => (
                  <div key={i}>
                    <h3 className="font-black uppercase text-accent tracking-widest text-xs mb-4">JORNADA {i+1}</h3>
                    <div className="space-y-3 max-w-2xl mx-auto">
                      {tournament.matches.filter(m => m.matchday === i+1).map(m => {
                        const h = teams.find(t => t.id === m.homeId);
                        const a = teams.find(t => t.id === m.awayId);
                        if(!h || !a) return null;
                        return (
                          <div key={m.id} className={cn("flex flex-col p-3 md:p-4 rounded-xl border transition-all cursor-pointer hover:bg-muted/30", m.isSimulated && "opacity-60")} onClick={() => setViewingMatchId(m.id)}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2"><MapPin className="w-3 h-3 text-muted-foreground" /><span className="text-[10px] font-bold uppercase text-muted-foreground">{h.venueName}</span></div>
                              {m.isSimulated && <Badge variant="secondary" className="text-[8px] h-4">FINALIZADO</Badge>}
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex-1 flex items-center gap-2 md:gap-3"><CrestIcon shape={h.emblemShape} pattern={h.emblemPattern} c1={h.crestPrimary} c2={h.crestSecondary} size="w-6 h-6 md:w-8 md:h-8" /><span className="font-black text-sm md:text-lg">{h.abbreviation}</span></div>
                              <div className="flex items-center gap-2"><div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg font-black text-sm md:text-xl bg-muted/50 border">{m.homeScore ?? '-'}</div><span className="opacity-30">:</span><div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg font-black text-sm md:text-xl bg-muted/50 border">{m.awayScore ?? '-'}</div></div>
                              <div className="flex-1 flex items-center gap-2 md:gap-3 justify-end"><span className="font-black text-sm md:text-lg">{a.abbreviation}</span><CrestIcon shape={a.emblemShape} pattern={a.emblemPattern} c1={a.crestPrimary} c2={a.crestSecondary} size="w-6 h-6 md:w-8 md:h-8" /></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="dual">
          <Card className="p-6 md:p-8 rounded-[2rem] shadow-xl">
            <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><Layers className="text-accent" /> LIGA DE RESERVAS</h2>
            <div className="grid gap-3 max-w-2xl mx-auto">
              {tournament.dualLeagueMatches.filter(m => m.matchday === tournament.currentMatchday).map(m => (
                <div key={m.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border">
                  <span className="font-black text-sm">{teams.find(t => t.id === m.homeId)?.abbreviation}</span>
                  <div className="flex items-center gap-3 font-black text-xl"><span>{m.homeScore ?? '-'}</span><span>:</span><span>{m.awayScore ?? '-'}</span></div>
                  <span className="font-black text-sm">{teams.find(t => t.id === m.awayId)?.abbreviation}</span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="market">
          <Card className="p-6 md:p-8 rounded-[2rem] shadow-xl space-y-6">
            <header className="flex items-center gap-2"><ShoppingBag className="text-accent" /><h2 className="text-xl font-black uppercase">BOLSA DE VALORES</h2></header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-muted-foreground border-b pb-2">TOP AGENTES</h3>
                <ScrollArea className="h-[400px]">
                  <div className="grid gap-2 pr-2">
                    {players.filter(p => !p.teamId || tournament.participants.includes(p.teamId)).sort((a,b) => b.monetaryValue - a.monetaryValue).map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-xl border">
                        <div><p className="font-black text-xs">{p.name}</p><p className="text-[8px] font-bold text-accent uppercase">{teams.find(t => t.id === p.teamId)?.name || 'Agente Libre'}</p></div>
                        <span className="font-black text-xs text-primary">{p.monetaryValue} CR</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div className="bg-accent/5 p-6 rounded-3xl border border-dashed flex flex-col items-center justify-center text-center">
                <Sparkles className="w-12 h-12 text-accent mb-4" />
                <h4 className="text-lg font-black uppercase mb-2">Simulación Dinámica</h4>
                <p className="text-xs text-muted-foreground italic">El valor de los agentes fluctúa según su rendimiento en pista. Los clubes de la IA realizarán ajustes automáticos tras cada jornada.</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="discipline">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 md:p-8 rounded-[2rem] shadow-xl">
              <h2 className="text-xl font-black uppercase text-destructive flex items-center gap-2 mb-6"><ShieldAlert /> SANCIONAR</h2>
              <div className="space-y-4">
                <Select value={sanctionType} onValueChange={(v: any) => setSanctionType(v)}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="club">Multa a Club (CR)</SelectItem><SelectItem value="player">Suspensión Agente (J.)</SelectItem></SelectContent></Select>
                <Select onValueChange={setSanctionTargetId}><SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{sanctionType === 'club' ? teams.filter(t => tournament.participants.includes(t.id)).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>) : players.filter(p => p.teamId && tournament.participants.includes(p.teamId)).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                <Input type="number" value={sanctionValue} onChange={e => setSanctionValue(Number(e.target.value))} className="rounded-xl" />
                <Button variant="destructive" className="w-full h-12 rounded-xl font-black" onClick={() => { if(sanctionTargetId) { applySanction(sanctionTargetId, sanctionType === 'club' ? 'team-budget' : 'player-suspension', sanctionValue); toast({ title: "Sanción Aplicada" }); } }}>CONFIRMAR SANCION</Button>
              </div>
            </Card>
            <Card className="p-6 md:p-8 rounded-[2rem] shadow-xl">
              <h2 className="text-xl font-black uppercase mb-6">LISTA NEGRA</h2>
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {players.filter(p => p.suspensionMatchdays > 0).map(p => (
                    <div key={p.id} className="p-3 bg-destructive/10 rounded-xl border border-destructive/20 flex justify-between items-center">
                      <p className="font-black uppercase text-xs">{p.name}</p>
                      <Badge variant="destructive" className="font-black text-[10px]">{p.suspensionMatchdays} J.</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
          {arcadeMatch && (
            <div className="flex flex-col">
              <div className="bg-primary p-10 text-white flex flex-col md:flex-row items-center gap-8">
                {(() => {
                  const opp = teams.find(t => t.id === (selectedMatch?.homeId === tournament.managedParticipantId ? selectedMatch?.awayId : selectedMatch?.homeId));
                  return (
                    <>
                      <CrestIcon shape={opp?.emblemShape!} pattern={opp?.emblemPattern!} c1={opp?.crestPrimary!} c2={opp?.crestSecondary!} size="w-24 h-24" />
                      <div className="text-center md:text-left">
                        <DialogTitle className="text-3xl font-black uppercase">vs {opp?.name}</DialogTitle>
                        <p className="text-white/80 font-bold uppercase tracking-widest mt-2 flex items-center gap-2"><Target className="w-4 h-4" /> DUELO ARCADE</p>
                        <p className="text-[10px] mt-2 italic opacity-70">"{opp?.description || 'Club histórico de la comarca.'}"</p>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="p-10 space-y-8">
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-muted-foreground border-b pb-2">Elige tu Jugador Clave</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {players.filter(p => p.teamId === tournament.managedParticipantId && p.suspensionMatchdays === 0).map(p => (
                      <button key={p.id} onClick={() => setSelectedPlayerId(p.id)} className={cn("p-4 rounded-2xl border-2 transition-all text-center", selectedPlayerId === p.id ? "bg-primary/10 border-primary scale-105 shadow-lg" : "bg-card border-transparent hover:bg-muted/50")}>
                        <p className="font-black text-xs uppercase">{p.name}</p>
                        <p className="text-[9px] font-bold text-primary">{p.monetaryValue} CR</p>
                      </button>
                    ))}
                  </div>
                </section>
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-muted-foreground border-b pb-2">Registrar Resultado</h3>
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center space-y-2"><Label className="text-[10px] font-black uppercase">TUS PUNTOS</Label><Input type="number" value={userHomeScore} onChange={e => setUserHomeScore(e.target.value)} className="w-20 h-16 text-3xl font-black text-center rounded-2xl" /></div>
                    <span className="text-4xl font-black opacity-20">:</span>
                    <div className="text-center space-y-2"><Label className="text-[10px] font-black uppercase">RIVAL</Label><Input type="number" value={userAwayScore} onChange={e => setUserAwayScore(e.target.value)} className="w-20 h-16 text-3xl font-black text-center rounded-2xl" /></div>
                  </div>
                </section>
                <Button disabled={!selectedPlayerId} onClick={playArcadeMatch} className="w-full h-16 rounded-2xl text-xl font-black bg-primary shadow-xl"><Sword className="w-6 h-6 mr-2" /> FINALIZAR PARTIDO</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingTeamId} onOpenChange={o => !o && setViewTeamId(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
          {teams.find(t => t.id === viewingTeamId) && (
            <div className="flex flex-col max-h-[85vh]">
              <div className="p-8 bg-muted/10 border-b flex items-center gap-6">
                <CrestIcon shape={teams.find(t => t.id === viewingTeamId)!.emblemShape} pattern={teams.find(t => t.id === viewingTeamId)!.emblemPattern} c1={teams.find(t => t.id === viewingTeamId)!.crestPrimary} c2={teams.find(t => t.id === viewingTeamId)!.crestSecondary} size="w-20 h-20" />
                <div className="flex-1">
                  <DialogTitle className="text-3xl font-black uppercase tracking-tighter">{teams.find(t => t.id === viewingTeamId)!.name}</DialogTitle>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-sm font-black text-accent"><Coins className="w-4 h-4" /> {teams.find(t => t.id === viewingTeamId)!.budget} CR</span>
                    <span className="flex items-center gap-1 text-sm font-black text-primary"><Star className="w-4 h-4 fill-current" /> {teams.find(t => t.id === viewingTeamId)!.rating}</span>
                  </div>
                </div>
              </div>
              <ScrollArea className="flex-1 p-8">
                <div className="space-y-8">
                  <section className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2"><Info className="w-3 h-3" /> HISTORIA DEL CLUB</h4>
                    <p className="text-sm italic leading-relaxed text-muted-foreground">"{teams.find(t => t.id === viewingTeamId)!.description || 'Entidad legendaria de l\'Horta.'}"</p>
                  </section>
                  <section className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2"><Users className="w-3 h-3" /> ROSTER ACTIVO</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {players.filter(p => p.teamId === viewingTeamId).map(p => (
                        <div key={p.id} className="p-4 bg-muted/10 rounded-2xl border flex items-center justify-between">
                          <div><p className="font-bold text-sm uppercase">{p.name}</p><p className="text-[9px] font-black opacity-50">{p.position} • #{p.jerseyNumber}</p></div>
                          <Badge variant="outline" className="font-black text-[9px]">{p.monetaryValue} CR</Badge>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </ScrollArea>
              <div className="p-6 border-t bg-muted/5 flex justify-end"><Button onClick={() => setViewTeamId(null)} className="rounded-xl h-12 px-8 font-black">CERRAR INFORME</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingMatchId} onOpenChange={o => !o && setViewingMatchId(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          {viewingMatch && (
            <div className="flex flex-col">
              <div className="bg-muted/10 p-8 border-b text-center">
                <DialogTitle className="text-xl font-black uppercase mb-2">Detalles del Encuentro</DialogTitle>
                <div className="flex items-center justify-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4" /><span className="text-xs font-bold uppercase">{teams.find(t => t.id === viewingMatch.homeId)?.venueName}</span></div>
              </div>
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-around gap-4">
                  <div className="text-center space-y-3 flex flex-col items-center">
                    <CrestIcon shape={teams.find(t => t.id === viewingMatch.homeId)?.emblemShape!} pattern={teams.find(t => t.id === viewingMatch.homeId)?.emblemPattern!} c1={teams.find(t => t.id === viewingMatch.homeId)?.crestPrimary!} c2={teams.find(t => t.id === viewingMatch.homeId)?.crestSecondary!} size="w-16 h-16" />
                    <span className="font-black text-xs uppercase">{teams.find(t => t.id === viewingMatch.homeId)?.name}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-5xl font-black">{viewingMatch.homeScore ?? '-'} : {viewingMatch.awayScore ?? '-'}</span>
                    <span className="text-[10px] font-black uppercase opacity-30 mt-2">MARCADOR FINAL</span>
                  </div>
                  <div className="text-center space-y-3 flex flex-col items-center">
                    <CrestIcon shape={teams.find(t => t.id === viewingMatch.awayId)?.emblemShape!} pattern={teams.find(t => t.id === viewingMatch.awayId)?.emblemPattern!} c1={teams.find(t => t.id === viewingMatch.awayId)?.crestPrimary!} c2={teams.find(t => t.id === viewingMatch.awayId)?.crestSecondary!} size="w-16 h-16" />
                    <span className="font-black text-xs uppercase">{teams.find(t => t.id === viewingMatch.awayId)?.name}</span>
                  </div>
                </div>
                {viewingMatch.isSimulated && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-center text-muted-foreground tracking-widest border-b pb-2">AGENTES DESTACADOS (MVP)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-center">
                        <UserCircle2 className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <p className="font-black text-[10px] uppercase truncate">{players.find(p => p.id === viewingMatch.homePlayerId)?.name || 'Sin MVP'}</p>
                      </div>
                      <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10 text-center">
                        <UserCircle2 className="w-6 h-6 mx-auto mb-2 text-accent" />
                        <p className="font-black text-[10px] uppercase truncate">{players.find(p => p.id === viewingMatch.awayPlayerId)?.name || 'Sin MVP'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 bg-muted/5 border-t"><Button onClick={() => setViewingMatchId(null)} className="w-full h-12 rounded-xl font-black">VOLVER AL CALENDARIO</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
