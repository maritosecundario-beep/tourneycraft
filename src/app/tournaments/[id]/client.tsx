
"use client";

import { useTournamentStore } from '@/hooks/use-tournament-store';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Calendar, Users, Play, ShieldAlert, ShoppingBag, Layers, Target, Sword, Zap, Info, Coins, Sparkles, Trash2, MapPin, UserCircle2 } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CrestIcon } from '@/components/ui/crest-icon';

export default function TournamentDetailClient() {
  const { id } = useParams();
  const router = useRouter();
  const { tournaments, teams, players, updateTournament, deleteTournament, resolveMatch, triggerMarketMoves, applySanction, generateSchedule } = useTournamentStore();
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
    if (!tournament || (tournament.matches || []).length === 0) return false;
    return tournament.matches.every(m => m.isSimulated);
  }, [tournament]);

  const userGroup = useMemo(() => {
    if (!tournament || !tournament.managedParticipantId || tournament.leagueType !== 'groups') return null;
    return tournament.groups?.find(g => g.participantIds.includes(tournament.managedParticipantId!));
  }, [tournament]);

  const getStandingsForParticipants = (participantIds: string[], isDual: boolean = false) => {
    if (!tournament) return [];
    const matchList = isDual ? (tournament.dualLeagueMatches || []) : (tournament.matches || []);
    
    return (participantIds || []).map(pId => {
      const item = teams.find(t => t.id === pId) || players.find(p => p.id === pId);
      if (!item) return null;
      
      let played = 0, won = 0, lost = 0, draw = 0, gf = 0, ga = 0, pts = 0;
      const winPts = Number(tournament.winPoints) || 0;
      const lossPts = Number(tournament.lossPoints) || 0;
      const drawPts = Number(tournament.drawPoints) || 0;

      matchList.forEach(m => {
        if (!m.isSimulated || m.homeScore === undefined || m.awayScore === undefined) return;
        if (m.homeId === pId || m.awayId === pId) {
          played++;
          const isHome = m.homeId === pId;
          const myScore = isHome ? m.homeScore : m.awayScore;
          const opScore = isHome ? m.awayScore : m.homeScore;
          gf += myScore; ga += opScore;
          if (myScore > opScore) { won++; pts += winPts; }
          else if (myScore < opScore) { lost++; pts += lossPts; }
          else { draw++; pts += drawPts; }
        }
      });
      return { ...item, played, won, lost, draw, gf, ga, gd: gf - ga, pts, budget: (item as any).budget || 0 };
    })
    .filter((x): x is any => x !== null)
    .sort((a, b) => (Number(b.pts) || 0) - (Number(a.pts) || 0) || (b.gd || 0) - (a.gd || 0));
  };

  const tournamentStandings = useMemo(() => {
    if (!tournament) return [];
    if (tournament.leagueType === 'groups' && tournament.groups && tournament.groups.length > 0) {
      return tournament.groups.map((g, idx) => ({
        id: g.id || `g-stand-${idx}`,
        name: g.name,
        data: getStandingsForParticipants(g.participantIds)
      }));
    }
    return [{ id: 'general-stand', name: "Clasificación General", data: getStandingsForParticipants(tournament.participants) }];
  }, [tournament, teams, players]);

  const dualStandings = useMemo(() => {
    if (!tournament) return [];
    return getStandingsForParticipants(tournament.participants, true);
  }, [tournament, teams, players]);

  const currentMatchdayMatches = useMemo(() => {
    if (!tournament) return [];
    return (tournament.matches || []).filter(m => m.matchday === tournament.currentMatchday);
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
    const hVal = hPlayers.reduce((acc, p) => acc + (p.monetaryValue || 0), 0) + (hTeam?.rating || 50) * 5;
    const aVal = aPlayers.reduce((acc, p) => acc + (p.monetaryValue || 0), 0) + (aTeam?.rating || 50) * 5;
    let hPower = Math.pow(hVal, 1.8) * 1.05; 
    let aPower = Math.pow(aVal, 1.8);
    const total = hPower + aPower;
    const hProb = hPower / (total || 1);
    let hScore = 0, aScore = 0;
    const rule = tournament?.scoringRuleType;
    const maxVal = tournament?.scoringValue || 9;
    if (total === 0) { hScore = 0; aScore = 0; } 
    else if (rule === 'bestOfN') {
      const rolls = Array.from({ length: maxVal }, () => Math.random() < hProb ? 'h' : 'a');
      hScore = rolls.filter(r => r === 'h').length;
      aScore = maxVal - hScore;
    } else {
      const base = 2 + Math.floor(Math.random() * 3);
      hScore = Math.round(base * hProb * (1 + Math.random()));
      aScore = Math.round(base * (1 - hProb) * (1 + Math.random()));
    }
    const getSelection = (pList: Player[]) => {
      if (pList.length === 0) return undefined;
      const sorted = [...pList].sort((a, b) => (b.monetaryValue || 0) - (a.monetaryValue || 0));
      return Math.random() < 0.7 ? sorted[0]?.id : sorted[Math.floor(Math.random() * sorted.length)]?.id;
    };
    return { hScore, aScore, hPlayerId: getSelection(hPlayers), aPlayerId: getSelection(aPlayers) };
  };

  const handleSimulateMatchday = () => {
    if (!tournament) return;
    const matchesToSimulate = currentMatchdayMatches.filter(m => {
      if (tournament.mode === 'arcade' && (m.homeId === tournament.managedParticipantId || m.awayId === tournament.managedParticipantId)) return false;
      if (userGroup) return userGroup.participantIds.includes(m.homeId) || userGroup.participantIds.includes(m.awayId);
      return true;
    });
    matchesToSimulate.forEach(m => {
      if (m.isSimulated) return;
      const { hScore, aScore, hPlayerId, aPlayerId } = simulateMatchLogic(m);
      resolveMatch(tournament.id, m.id, hScore, aScore, false, hPlayerId, aPlayerId);
      if (tournament.dualLeagueEnabled) {
        const dualMatch = (tournament.dualLeagueMatches || []).find(dm => dm.matchday === m.matchday && dm.homeId === m.awayId && dm.awayId === m.homeId);
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
      const maxMatchday = (tournament.matches || []).length > 0 ? Math.max(...tournament.matches.map(m => m.matchday)) : 0;
      if (nextMatchday <= maxMatchday) updateTournament({ ...tournament, currentMatchday: nextMatchday });
      toast({ title: "Jornada Finalizada" });
    }
  };

  const simulateOtherGroups = () => {
    if (!tournament || !userGroup) return;
    const otherGroupsMatches = (tournament.matches || []).filter(m => {
      const isUserMatch = userGroup.participantIds.includes(m.homeId) || userGroup.participantIds.includes(m.awayId);
      return !isUserMatch && !m.isSimulated;
    });
    otherGroupsMatches.forEach(m => {
      const { hScore, aScore, hPlayerId, aPlayerId } = simulateMatchLogic(m);
      resolveMatch(tournament.id, m.id, hScore, aScore, false, hPlayerId, aPlayerId);
      if (tournament.dualLeagueEnabled) {
        const dualMatch = (tournament.dualLeagueMatches || []).find(dm => dm.matchday === m.matchday && dm.homeId === m.awayId && dm.awayId === m.homeId);
        if (dualMatch && !dualMatch.isSimulated) {
          const { hScore: dh, aScore: da, hPlayerId: dhp, aPlayerId: dap } = simulateMatchLogic(dualMatch);
          resolveMatch(tournament.id, dualMatch.id, dh, da, true, dhp, dap);
        }
      }
    });
    toast({ title: "Simulación Completa", description: "Otros grupos simulados." });
  };

  const playArcadeMatch = () => {
    if (!selectedMatch || !selectedPlayerId || !tournament) return;
    const hScore = parseInt(userHomeScore) || 0;
    const aScore = parseInt(userAwayScore) || 0;
    const isHome = selectedMatch.homeId === tournament.managedParticipantId;
    const oppId = isHome ? selectedMatch.awayId : selectedMatch.homeId;
    const oppPlayers = players.filter(p => p.teamId === oppId);
    const sortedOpp = [...oppPlayers].sort((a,b) => (b.monetaryValue || 0) - (a.monetaryValue || 0));
    const oppMvpId = Math.random() < 0.7 ? sortedOpp[0]?.id : sortedOpp[Math.floor(Math.random() * sortedOpp.length)]?.id;
    const hP = isHome ? selectedPlayerId : oppMvpId;
    const aP = !isHome ? selectedPlayerId : oppMvpId;
    resolveMatch(tournament.id, selectedMatch.id, hScore, aScore, false, hP, aP);
    if (tournament.dualLeagueEnabled) {
      const dualMatch = (tournament.dualLeagueMatches || []).find(dm => dm.matchday === tournament.currentMatchday && dm.homeId === selectedMatch.awayId && dm.awayId === selectedMatch.homeId);
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
    return [...(tournament.matches || []), ...(tournament.dualLeagueMatches || [])].find(m => m.id === viewingMatchId);
  }, [viewingMatchId, tournament]);

  const getTeamStanding = (teamId: string) => {
    for (const group of tournamentStandings) {
      const idx = group.data.findIndex(t => t.id === teamId);
      if (idx !== -1) return { pos: idx + 1, groupName: group.name };
    }
    return null;
  };

  if (!tournament) return <div className="p-20 text-center font-black uppercase">Torneo no encontrado</div>;

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
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {userGroup && (
            <Button variant="outline" onClick={simulateOtherGroups} className="flex-1 md:flex-none h-14 md:h-16 rounded-2xl px-6 font-black border-primary/20 text-primary">
              <Zap className="w-4 h-4 mr-2" /> OTROS GRUPOS
            </Button>
          )}
          {!isSeasonOver && (tournament.matches || []).length > 0 && (
            <Button onClick={handleSimulateMatchday} size="lg" className="flex-1 md:flex-none h-14 md:h-16 rounded-2xl px-10 font-black shadow-xl shadow-primary/20">
              <Play className="w-5 h-5 mr-3 fill-current" /> {tournament.mode === 'arcade' ? 'JUGAR JORNADA' : 'SIGUIENTE JORNADA'}
            </Button>
          )}
          <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-destructive/20 text-destructive" onClick={() => { if(confirm("¿Borrar torneo?")) { deleteTournament(tournament.id); router.push('/tournaments'); } }}>
            <Trash2 className="w-6 h-6" />
          </Button>
        </div>
      </header>

      {(tournament.matches || []).length === 0 && (
        <Card className="border-none bg-yellow-500/10 border-2 border-yellow-500/20 rounded-[2rem] p-8 text-center space-y-6">
          <Calendar className="text-yellow-500 w-12 h-12 mx-auto" />
          <h2 className="text-2xl font-black uppercase text-yellow-600">Calendario Pendiente</h2>
          <Button onClick={() => generateSchedule(tournament.id)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-black h-14 px-10 rounded-xl">GENERAR CALENDARIO AHORA</Button>
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
          {tournamentStandings.map((group) => (
            <Card key={`standings-view-${group.id || Math.random()}`} className="border-none bg-card shadow-2xl rounded-[1.5rem] md:rounded-[3rem] overflow-hidden">
              <CardHeader className="bg-muted/10 border-b p-6 flex flex-row items-center gap-3">
                <Target className="text-primary w-6 h-6" />
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
                      {(group.data || []).map((item: any, idx: number) => (
                        <TableRow key={`row-st-${item.id || idx}`} className="h-14 md:h-16 cursor-pointer hover:bg-primary/5 transition-colors" onClick={() => setViewTeamId(item.id)}>
                          <TableCell className="text-center"><span className="font-black text-base md:text-lg">{idx + 1}</span></TableCell>
                          <TableCell><div className="flex items-center gap-2 md:gap-3"><CrestIcon shape={item.emblemShape} pattern={item.emblemPattern} c1={item.crestPrimary} c2={item.crestSecondary} c3={item.crestTertiary || item.crestPrimary} size="w-6 h-6 md:w-8 md:h-8" /><span className="font-bold text-xs md:text-sm truncate max-w-[80px] md:max-w-none">{item.name}</span></div></TableCell>
                          <TableCell className="text-center font-bold text-xs">{item.played || 0}</TableCell>
                          <TableCell className={cn("text-center font-bold text-xs", (item.gd || 0) >= 0 ? "text-green-500" : "text-destructive")}>{(item.gd || 0) > 0 ? `+${item.gd}` : (item.gd || 0)}</TableCell>
                          <TableCell className="text-center font-bold text-accent text-xs">{item.budget || 0}</TableCell>
                          <TableCell className="text-center font-black text-lg md:text-xl text-primary">{item.pts || 0}</TableCell>
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
          {tournamentStandings.map((group) => (
            <div key={`calendar-group-view-${group.id || Math.random()}`} className="space-y-6">
              <h2 className="text-xl font-black uppercase text-primary flex items-center gap-3 px-4"><Calendar className="w-5 h-5" /> Calendario {group.name}</h2>
              <Card className="border-none bg-card shadow-2xl rounded-[1.5rem] p-6 md:p-8">
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-12">
                    {Array.from({ length: Math.max(...(tournament.matches || []).map(m => m.matchday), 0) }).map((_, i) => {
                      const matchdayMatches = (tournament.matches || []).filter(m => m.matchday === i + 1 && (group.id.includes('general') || (group.data || []).some((t: any) => t.id === m.homeId)));
                      if (matchdayMatches.length === 0) return null;
                      return (
                        <div key={`matchday-main-${group.id}-${i}`}>
                          <h3 className="font-black uppercase text-accent tracking-widest text-[10px] mb-4 border-b pb-2">JORNADA {i + 1}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {matchdayMatches.map(m => {
                              const h = teams.find(t => t.id === m.homeId);
                              const a = teams.find(t => t.id === m.awayId);
                              if (!h || !a) return null;
                              return (
                                <div key={`match-card-${m.id}`} className={cn("flex flex-col p-3 md:p-4 rounded-xl border transition-all cursor-pointer hover:bg-muted/30", m.isSimulated ? "bg-muted/10" : "bg-card")} onClick={() => setViewingMatchId(m.id)}>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2"><MapPin className="w-3 h-3 text-muted-foreground" /><span className="text-[9px] font-bold uppercase text-muted-foreground truncate max-w-[120px]">{h.venueName}</span></div>
                                    {m.isSimulated && <Badge variant="secondary" className="text-[8px] h-4 bg-green-500/10 text-green-600 border-none">JUGADO</Badge>}
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="flex-1 flex items-center gap-2 md:gap-3"><CrestIcon shape={h.emblemShape} pattern={h.emblemPattern} c1={h.crestPrimary} c2={h.crestSecondary} c3={h.crestTertiary || h.crestPrimary} size="w-6 h-6 md:w-8 md:h-8" /><span className="font-black text-sm md:text-base">{h.abbreviation}</span></div>
                                    <div className="flex items-center gap-2"><div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg font-black text-sm md:text-lg bg-muted/50 border">{m.homeScore ?? '-'}</div><span className="opacity-30">:</span><div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg font-black text-sm md:text-lg bg-muted/50 border">{m.awayScore ?? '-'}</div></div>
                                    <div className="flex-1 flex items-center gap-2 md:gap-3 justify-end"><span className="font-black text-sm md:text-base">{a.abbreviation}</span><CrestIcon shape={a.emblemShape} pattern={a.emblemPattern} c1={a.crestPrimary} c2={a.crestSecondary} c3={a.crestTertiary || a.crestPrimary} size="w-6 h-6 md:w-8 md:h-8" /></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </Card>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="dual" className="space-y-8">
          <Card className="border-none bg-card shadow-2xl rounded-[1.5rem] md:rounded-[3rem] overflow-hidden">
            <CardHeader className="bg-accent/10 border-b p-6 flex flex-row items-center gap-3">
              <Layers className="text-accent w-6 h-6" />
              <div>
                <CardTitle className="text-lg md:text-xl font-black uppercase">Clasificación Liga Dual Global</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold">Unificación de canteras de todos los grupos</CardDescription>
              </div>
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
                      <TableHead className="text-center font-black text-accent">PTS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(dualStandings || []).map((item: any, idx: number) => (
                      <TableRow key={`row-dual-${item.id || idx}`} className="h-14 md:h-16">
                        <TableCell className="text-center font-black text-base">{idx + 1}</TableCell>
                        <TableCell><div className="flex items-center gap-2 md:gap-3"><CrestIcon shape={item.emblemShape} pattern={item.emblemPattern} c1={item.crestPrimary} c2={item.crestSecondary} c3={item.crestTertiary || item.crestPrimary} size="w-6 h-6 md:w-8 md:h-8" /><span className="font-bold text-xs md:text-sm truncate">{item.name}</span></div></TableCell>
                        <TableCell className="text-center font-bold text-xs">{item.played || 0}</TableCell>
                        <TableCell className={cn("text-center font-bold text-xs", (item.gd || 0) >= 0 ? "text-green-500" : "text-destructive")}>{(item.gd || 0) > 0 ? `+${item.gd}` : (item.gd || 0)}</TableCell>
                        <TableCell className="text-center font-black text-lg md:text-xl text-accent">{item.pts || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
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
                    {players.filter(p => !p.teamId || (tournament.participants || []).includes(p.teamId)).sort((a,b) => (b.monetaryValue || 0) - (a.monetaryValue || 0)).map(p => (
                      <div key={`market-${p.id}`} className="flex items-center justify-between p-3 bg-muted/10 rounded-xl border">
                        <div><p className="font-black text-xs">{p.name}</p><p className="text-[8px] font-bold text-accent uppercase">{teams.find(t => t.id === p.teamId)?.name || 'Agente Libre'}</p></div>
                        <span className="font-black text-xs text-primary">{p.monetaryValue || 0} CR</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div className="bg-accent/5 p-6 rounded-3xl border border-dashed flex flex-col items-center justify-center text-center">
                <Sparkles className="w-12 h-12 text-accent mb-4" />
                <h4 className="text-lg font-black uppercase mb-2">Simulación Dinámica</h4>
                <p className="text-xs text-muted-foreground italic">El mercado se mueve cada jornada con un 40% de probabilidad.</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="discipline" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 md:p-8 rounded-[2rem] shadow-xl">
            <h2 className="text-xl font-black uppercase text-destructive flex items-center gap-2 mb-6"><ShieldAlert /> SANCIONAR</h2>
            <div className="space-y-4">
              <Select value={sanctionType} onValueChange={(v: any) => setSanctionType(v)}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="club">Multa a Club (CR)</SelectItem><SelectItem value="player">Suspensión Agente (J.)</SelectItem></SelectContent></Select>
              <Select onValueChange={setSanctionTargetId}><SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{sanctionType === 'club' ? teams.filter(t => (tournament.participants || []).includes(t.id)).map(t => <SelectItem key={`sanct-t-${t.id}`} value={t.id}>{t.name}</SelectItem>) : players.filter(p => p.teamId && (tournament.participants || []).includes(p.teamId)).map(p => <SelectItem key={`sanct-p-${p.id}`} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
              <Input type="number" value={sanctionValue} onChange={e => setSanctionValue(Number(e.target.value))} className="rounded-xl" />
              <Button variant="destructive" className="w-full h-12 rounded-xl font-black" onClick={() => { if(sanctionTargetId) { applySanction(sanctionTargetId, sanctionType === 'club' ? 'team-budget' : 'player-suspension', sanctionValue); toast({ title: "Sanción Aplicada" }); } }}>CONFIRMAR SANCION</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
          <div className="p-6 bg-muted/20 border-b flex justify-between items-center"><DialogTitle className="font-black uppercase">Previo del Encuentro</DialogTitle></div>
          {arcadeMatch && (
            <div className="flex flex-col max-h-[80vh] overflow-y-auto scrollbar-hide">
              <div className="bg-primary p-10 text-white flex flex-col md:flex-row items-center gap-8">
                {(() => {
                  const oppId = selectedMatch?.homeId === tournament.managedParticipantId ? selectedMatch?.awayId : selectedMatch?.homeId;
                  const opp = teams.find(t => t.id === oppId);
                  const oppStats = getTeamStanding(oppId || '');
                  const oppPlayers = players.filter(p => p.teamId === oppId);
                  const bestOppPlayer = [...oppPlayers].sort((a,b) => (b.monetaryValue || 0) - (a.monetaryValue || 0))[0];
                  if (!opp) return null;
                  return (
                    <>
                      <CrestIcon shape={opp.emblemShape} pattern={opp.emblemPattern} c1={opp.crestPrimary} c2={opp.crestSecondary} c3={opp.crestTertiary || opp.crestPrimary} size="w-24 h-24" />
                      <div className="text-center md:text-left flex-1">
                        <h2 className="text-3xl font-black uppercase">vs {opp.name}</h2>
                        <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                          <Badge variant="secondary" className="bg-white/20 text-white border-none font-black">POS: #{oppStats?.pos || '?'}</Badge>
                          <Badge variant="secondary" className="bg-white/20 text-white border-none font-black uppercase text-[8px]">{opp.venueName}</Badge>
                        </div>
                        {bestOppPlayer && (
                          <div className="mt-4 p-4 bg-black/20 rounded-2xl border border-white/10 space-y-3">
                            <div className="flex justify-between items-center border-b border-white/10 pb-2"><div><p className="text-[8px] font-black uppercase text-white/60">Estrella Rival</p><p className="font-black text-sm uppercase">{bestOppPlayer.name}</p></div><Badge className="bg-white text-primary font-black">{bestOppPlayer.position}</Badge></div>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">{(bestOppPlayer.attributes || []).map((attr, ai) => (<div key={`arcade-attr-${ai}`} className="text-center"><p className="text-[7px] font-black uppercase opacity-60">{attr.name.substring(0, 5)}</p><p className="text-xs font-black">{attr.value || 50}</p></div>))}</div>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="p-10 space-y-8 bg-card">
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-muted-foreground border-b pb-2 flex items-center gap-2"><UserCircle2 className="w-3 h-3" /> Selecciona tu Agente</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {players.filter(p => p.teamId === tournament.managedParticipantId && (p.suspensionMatchdays || 0) === 0).map(p => (
                      <button key={`sel-agent-${p.id}`} onClick={() => setSelectedPlayerId(p.id)} className={cn("p-4 rounded-2xl border-2 transition-all text-center", selectedPlayerId === p.id ? "bg-primary/10 border-primary scale-105 shadow-lg" : "bg-muted/20 border-transparent hover:bg-muted/50")}>
                        <p className="font-black text-xs uppercase truncate">{p.name}</p>
                        <p className="text-[9px] font-bold text-primary">{p.monetaryValue || 0} CR</p>
                      </button>
                    ))}
                  </div>
                </section>
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-muted-foreground border-b pb-2 flex items-center gap-2"><Sword className="w-3 h-3" /> Marcador Final</h3>
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center space-y-2"><Label className="text-[10px] font-black uppercase">TU CLUB</Label><Input type="number" value={userHomeScore} onChange={e => setUserHomeScore(e.target.value)} className="w-20 h-16 text-3xl font-black text-center rounded-2xl bg-muted/20 border-none" /></div>
                    <span className="text-4xl font-black opacity-20">:</span>
                    <div className="text-center space-y-2"><Label className="text-[10px] font-black uppercase">RIVAL</Label><Input type="number" value={userAwayScore} onChange={e => setUserAwayScore(e.target.value)} className="w-20 h-16 text-3xl font-black text-center rounded-2xl bg-muted/20 border-none" /></div>
                  </div>
                </section>
                <Button disabled={!selectedPlayerId} onClick={playArcadeMatch} className="w-full h-16 rounded-2xl text-xl font-black bg-primary shadow-xl hover:translate-y-[-2px] transition-transform"><Zap className="w-6 h-6 mr-2 fill-current" /> REGISTRAR RESULTADO</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingTeamId} onOpenChange={o => !o && setViewTeamId(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
          <div className="p-6 bg-muted/20 border-b flex justify-between items-center"><DialogTitle className="font-black uppercase">Perfil del Club</DialogTitle></div>
          {(() => {
            const team = teams.find(t => t.id === viewingTeamId);
            if (!team) return null;
            return (
              <div className="flex flex-col max-h-[80vh] bg-card">
                <div className="p-8 bg-muted/10 border-b flex items-center gap-6">
                  <CrestIcon shape={team.emblemShape} pattern={team.emblemPattern} c1={team.crestPrimary} c2={team.crestSecondary} c3={team.crestTertiary || team.crestPrimary} size="w-20 h-20" />
                  <div className="flex-1">
                    <h2 className="text-3xl font-black uppercase tracking-tighter">{team.name}</h2>
                    <div className="flex items-center gap-4 mt-2"><span className="flex items-center gap-1 text-sm font-black text-accent"><Coins className="w-4 h-4" /> {team.budget || 0} CR</span><span className="flex items-center gap-1 text-sm font-black text-primary"><Target className="w-4 h-4" /> {team.rating || 0}</span></div>
                  </div>
                </div>
                <ScrollArea className="flex-1 p-8">
                  <div className="space-y-8">
                    <section className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2"><Users className="w-3 h-3" /> Jugadores</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{players.filter(p => p.teamId === viewingTeamId).map(p => (<div key={`roster-${p.id}`} className="p-4 bg-muted/10 rounded-2xl border flex items-center justify-between"><div><p className="font-bold text-sm uppercase">{p.name}</p><p className="text-[9px] font-black opacity-50">{p.position} • #{p.jerseyNumber}</p></div><Badge variant="outline" className="font-black text-[9px]">{p.monetaryValue || 0} CR</Badge></div>))}</div>
                    </section>
                  </div>
                </ScrollArea>
                <div className="p-6 border-t bg-muted/5 flex justify-end"><Button onClick={() => setViewTeamId(null)} className="rounded-xl h-12 px-8 font-black">CERRAR</Button></div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
