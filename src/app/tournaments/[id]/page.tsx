
"use client";

import { useTournamentStore } from '@/hooks/use-tournament-store';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Calendar, Users, Play, ShieldAlert, ShoppingBag, Layers, Target, ChevronRight, Star, Sword, Zap, Info, Coins, LayoutGrid, Sparkles, RefreshCw, Brackets, Group, Trash2, Settings2 } from 'lucide-react';
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
  const [viewingTeamId, setViewTeamId] = useState<string | null>(null);

  const tournament = tournaments.find(t => t.id === id);

  const isSeasonOver = useMemo(() => {
    if (!tournament || tournament.matches.length === 0) return false;
    return tournament.matches.every(m => m.isSimulated);
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
        const mirror = tournament.dualLeagueMatches.find(x => x.matchday === m.matchday && ((x.homeId === m.awayId && x.awayId === m.homeId) || (x.homeId === m.homeId && x.awayId === m.awayId)));
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
      const mirrorMatch = tournament.dualLeagueMatches.find(m => m.matchday === tournament.currentMatchday && ((m.homeId === selectedMatch.awayId && m.awayId === selectedMatch.homeId) || (m.homeId === selectedMatch.homeId && m.awayId === selectedMatch.awayId)));
      if (mirrorMatch) {
        const { hScore: mh, aScore: ma, hPlayerId: hp, aPlayerId: ap } = simulateMatchLogic(mirrorMatch);
        resolveMatch(tournament.id, mirrorMatch.id, mh, ma, true, hp, ap);
      }
    }

    setIsPreviewOpen(false);
    toast({ title: "¡Partido Finalizado!", description: `${hScore} - ${aScore}` });
  };

  const handleDeleteTournament = () => {
    if (confirm("¿Seguro que quieres borrar este universo competitivo?")) {
      deleteTournament(tournament!.id);
      router.push('/tournaments');
      toast({ title: "Universo Eliminado" });
    }
  };

  const handleManualGenerate = () => {
    generateSchedule(tournament!.id);
    toast({ title: "Calendario Generado", description: "Se han programado todos los encuentros." });
  };

  if (!tournament) return <div className="p-20 text-center font-black">TORNEO NO ENCONTRADO</div>;

  const hasMatches = tournament.matches.length > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-32 px-4 md:px-0">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-primary rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shadow-2xl shrink-0">
            <Trophy className="text-white w-8 h-8 md:w-10 md:h-10" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter truncate max-w-[200px] md:max-w-none">{tournament.name}</h1>
            <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest mt-1">{tournament.sport} • SEASON {tournament.currentSeason} • JORNADA {tournament.currentMatchday}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {!isSeasonOver && hasMatches && (
            <Button onClick={handleSimulateMatchday} size="lg" className="flex-1 md:flex-none h-14 md:h-16 rounded-2xl px-10 font-black shadow-xl shadow-primary/20">
              <Play className="w-5 h-5 mr-3 fill-current" /> SIGUIENTE JORNADA
            </Button>
          )}
          <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-destructive/20 text-destructive" onClick={handleDeleteTournament}>
            <Trash2 className="w-6 h-6" />
          </Button>
        </div>
      </header>

      {!hasMatches && (
        <Card className="border-none bg-yellow-500/10 border-2 border-yellow-500/20 rounded-[2rem] p-8 text-center space-y-6 animate-in fade-in zoom-in">
          <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <Calendar className="text-yellow-500 w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase text-yellow-600">Calendario no programado</h2>
            <p className="text-sm font-bold text-muted-foreground mt-2">Este torneo aún no tiene encuentros definidos. Genera el calendario para empezar la temporada.</p>
          </div>
          <Button onClick={handleManualGenerate} size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-black h-14 px-10 rounded-xl shadow-xl shadow-yellow-500/20">
            <RefreshCw className="w-5 h-5 mr-2" /> GENERAR CALENDARIO AHORA
          </Button>
        </Card>
      )}

      {isSeasonOver && (
        <Card className="border-none bg-accent/10 border-2 border-accent/20 rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-xl md:text-3xl font-black uppercase text-accent mb-2">¡TEMPORADA FINALIZADA!</h2>
              <p className="font-bold text-muted-foreground uppercase text-[10px]">El comisionado ha cerrado las actas. Es hora de decidir el futuro.</p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center w-full md:w-auto">
              <Button onClick={() => advanceSeason(tournament.id)} className="flex-1 md:flex-none rounded-xl h-12 font-black shadow-lg">
                <RefreshCw className="w-4 h-4 mr-2" /> NUEVA TEMP.
              </Button>
              {tournament.format === 'league' && (
                <>
                  <Button onClick={() => createKnockoutFromStandings(tournament.id, 'playoff')} variant="secondary" className="flex-1 md:flex-none rounded-xl h-12 font-black">
                    <Brackets className="w-4 h-4 mr-2" /> PLAYOFFS
                  </Button>
                  <Button onClick={() => createKnockoutFromStandings(tournament.id, 'relegation')} variant="destructive" className="flex-1 md:flex-none rounded-xl h-12 font-black">
                    <ShieldAlert className="w-4 h-4 mr-2" /> DESCENSO
                  </Button>
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
              <CardHeader className="bg-muted/10 border-b p-6 md:p-8 flex flex-row items-center gap-3">
                <Group className="text-primary w-5 h-5 md:w-6 md:h-6" />
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
                      {group.data.map((item, idx) => {
                        const isPlayoff = idx < (tournament.playoffSpots || 0);
                        const isRelegation = idx >= (group.data.length - (tournament.relegationSpots || 0));
                        return (
                          <TableRow 
                            key={item.id} 
                            className={cn(
                              "h-14 md:h-16 cursor-pointer hover:bg-primary/5 transition-colors",
                              tournament.managedParticipantId === item.id && "bg-primary/5 border-l-4 border-l-primary",
                              isPlayoff && "bg-green-500/5",
                              isRelegation && "bg-red-500/5"
                            )} 
                            onClick={() => setViewTeamId(item.id)}
                          >
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-black text-base md:text-lg leading-none">{idx + 1}</span>
                                {isPlayoff && <span className="text-[7px] font-black text-green-500 uppercase mt-1">PO</span>}
                                {isRelegation && <span className="text-[7px] font-black text-red-500 uppercase mt-1">DE</span>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 md:gap-3">
                                <CrestIcon shape={item.emblemShape} pattern={item.emblemPattern} c1={item.crestPrimary} c2={item.crestSecondary} size="w-6 h-6 md:w-8 md:h-8" />
                                <span className="font-bold text-xs md:text-sm truncate max-w-[80px] md:max-w-none">{item.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-bold text-xs">{item.played}</TableCell>
                            <TableCell className={cn("text-center font-bold text-xs", item.gd >= 0 ? "text-green-500" : "text-destructive")}>{item.gd > 0 ? `+${item.gd}` : item.gd}</TableCell>
                            <TableCell className="text-center font-bold text-accent text-xs">{('budget' in item) ? item.budget : '-'}</TableCell>
                            <TableCell className="text-center font-black text-lg md:text-xl text-primary">{item.pts}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6 md:space-y-8">
          <Card className="border-none bg-card shadow-2xl rounded-[1.5rem] md:rounded-[3rem] overflow-hidden p-6 md:p-8">
            <header className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase">Encuentros Programados</h2>
              <Button variant="ghost" size="sm" onClick={handleManualGenerate} className="text-accent hover:text-accent hover:bg-accent/10 font-black">
                <RefreshCw className="w-4 h-4 mr-2" /> RE-GENERAR
              </Button>
            </header>
            <ScrollArea className="h-[600px] pr-4">
              <div className="divide-y divide-muted/10 space-y-8">
                {Array.from({ length: tournament.matches.length > 0 ? Math.max(...tournament.matches.map(m => m.matchday)) : 0 }).map((_, i) => (
                  <div key={i} className="pt-8 first:pt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="font-black uppercase text-accent tracking-widest text-[10px] md:text-sm mb-4">JORNADA {i+1}</h3>
                    <div className="space-y-3 max-w-2xl mx-auto">
                      {tournament.matches.filter(m => m.matchday === i+1).map(m => {
                        const h = teams.find(t => t.id === m.homeId);
                        const a = teams.find(t => t.id === m.awayId);
                        if(!h || !a) return null;
                        return (
                          <div key={m.id} className={cn("flex items-center gap-2 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl border shadow-sm", m.isSimulated && "opacity-60")}>
                            <div className="flex-1 flex items-center gap-2 md:gap-3 overflow-hidden">
                              <CrestIcon shape={h.emblemShape} pattern={h.emblemPattern} c1={h.crestPrimary} c2={h.crestSecondary} size="w-6 h-6 md:w-8 md:h-8" />
                              <span className="font-black text-sm md:text-lg">{h.abbreviation}</span>
                            </div>
                            <div className="flex items-center gap-1 md:gap-2">
                              <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg font-black text-sm md:text-xl bg-muted/50 border">{m.homeScore ?? '-'}</div>
                              <span className="font-black opacity-30">:</span>
                              <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg font-black text-sm md:text-xl bg-muted/50 border">{m.awayScore ?? '-'}</div>
                            </div>
                            <div className="flex-1 flex items-center gap-2 md:gap-3 justify-end overflow-hidden">
                              <span className="font-black text-sm md:text-lg">{a.abbreviation}</span>
                              <CrestIcon shape={a.emblemShape} pattern={a.emblemPattern} c1={a.crestPrimary} c2={a.crestSecondary} size="w-6 h-6 md:w-8 md:h-8" />
                            </div>
                            <div className="ml-2 border-l pl-2">
                              {!m.isSimulated && <Button size="icon" variant="ghost" className="text-primary h-8 w-8" onClick={() => handleSimulateSingleMatch(m.id)}><Zap className="w-4 h-4 fill-current" /></Button>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {!hasMatches && <p className="text-center py-20 text-muted-foreground italic">No hay partidos programados...</p>}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* ... Rest of the tabs content ... */}
        <TabsContent value="dual" className="space-y-6 md:space-y-8">
          <Card className="border-none bg-card shadow-2xl rounded-[1.5rem] md:rounded-[3rem] p-6 md:p-8">
            <header className="mb-6 md:mb-8"><h2 className="text-lg md:text-2xl font-black uppercase flex items-center gap-3"><Layers className="text-accent" /> Liga de Reservas</h2></header>
            <div className="grid gap-3 max-w-2xl mx-auto">
              {tournament.dualLeagueMatches.filter(m => m.matchday === tournament.currentMatchday).map(m => {
                const h = teams.find(t => t.id === m.homeId);
                const a = teams.find(t => t.id === m.awayId);
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 md:p-4 bg-muted/20 rounded-xl md:rounded-2xl border">
                    <div className="flex items-center gap-2"><CrestIcon shape={h?.emblemShape!} pattern={h?.emblemPattern!} c1={h?.crestPrimary!} c2={h?.crestSecondary!} size="w-6 h-6" /><span className="font-black text-xs md:text-sm">{h?.abbreviation}</span></div>
                    <div className="flex items-center gap-3 font-mono font-black text-sm md:text-xl"><span>{m.homeScore ?? '-'}</span><span>:</span><span>{m.awayScore ?? '-'}</span></div>
                    <div className="flex items-center gap-2 justify-end"><span className="font-black text-xs md:text-sm">{a?.abbreviation}</span><CrestIcon shape={a?.emblemShape!} pattern={a?.emblemPattern!} c1={a?.crestPrimary!} c2={a?.crestSecondary!} size="w-6 h-6" /></div>
                  </div>
                );
              })}
              {tournament.dualLeagueMatches.filter(m => m.matchday === tournament.currentMatchday).length === 0 && (
                <p className="text-center text-muted-foreground text-xs py-10 italic">No hay partidos de reserva programados para esta jornada.</p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="market" className="space-y-6 md:space-y-8">
          <Card className="border-none bg-card shadow-2xl rounded-[1.5rem] md:rounded-[3rem] p-6 md:p-8">
            <header className="mb-6 md:mb-8"><h2 className="text-lg md:text-2xl font-black uppercase flex items-center gap-3"><ShoppingBag className="text-accent" /> Dinámica de Mercado</h2></header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-4">
                <h3 className="font-black text-[10px] uppercase text-muted-foreground border-b pb-2">Valores de l'Horta</h3>
                <ScrollArea className="h-[400px]">
                  <div className="grid gap-2 pr-2">
                    {players.filter(p => tournament.participants.includes(p.teamId || '') || !p.teamId).sort((a,b) => b.monetaryValue - a.monetaryValue).map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 md:p-4 bg-muted/20 rounded-xl md:rounded-2xl border">
                        <div className="overflow-hidden">
                          <p className="font-black text-xs md:text-sm truncate">{p.name}</p>
                          <p className="text-[9px] font-bold text-accent uppercase">{teams.find(t => t.id === p.teamId)?.name || 'Agente Libre'}</p>
                        </div>
                        <span className="font-black text-xs md:text-sm text-primary">{p.monetaryValue} CR</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div className="p-6 bg-accent/5 rounded-2xl md:rounded-3xl border border-accent/20 flex flex-col items-center justify-center text-center">
                <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-accent mb-4" />
                <h4 className="text-lg md:text-xl font-black uppercase mb-2">Simulación de Fichajes</h4>
                <p className="text-[10px] md:text-sm text-muted-foreground">La IA de los clubes rivales realiza ajustes estratégicos tras cada jornada según su presupuesto y rendimiento.</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="discipline" className="space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <Card className="rounded-[1.5rem] md:rounded-[3rem] p-6 md:p-8 shadow-2xl">
              <h2 className="text-lg md:text-xl font-black uppercase text-destructive flex items-center gap-3 mb-6"><ShieldAlert /> Aplicar Sanción</h2>
              <div className="space-y-4 md:space-y-6">
                <div className="space-y-2"><Label>Tipo de Multa</Label><Select value={sanctionType} onValueChange={(v: any) => setSanctionType(v)}><SelectTrigger className="h-10 md:h-12 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="club">Multa Económica (Club)</SelectItem><SelectItem value="player">Suspensión (Agente)</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Infractor</Label><Select onValueChange={setSanctionTargetId}><SelectTrigger className="h-10 md:h-12 rounded-xl"><SelectValue placeholder="Elegir..." /></SelectTrigger><SelectContent>{sanctionType === 'club' ? teams.filter(t => tournament.participants.includes(t.id)).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>) : players.filter(p => p.teamId && tournament.participants.includes(p.teamId)).map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({teams.find(t => t.id === p.teamId)?.abbreviation})</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Cuantía (CR / Jornadas)</Label><Input type="number" value={sanctionValue} onChange={e => setSanctionValue(Number(e.target.value))} className="h-10 md:h-12 rounded-xl" /></div>
                <Button variant="destructive" className="w-full h-12 rounded-xl font-black" onClick={() => { if(!sanctionTargetId) return; applySanction(sanctionTargetId, sanctionType === 'club' ? 'team-budget' : 'player-suspension', sanctionValue); toast({ title: "Sanción Aplicada" }); }}>SANCIONAR</Button>
              </div>
            </Card>
            <Card className="rounded-[1.5rem] md:rounded-[3rem] p-6 md:p-8 shadow-2xl">
              <h2 className="text-lg md:text-xl font-black uppercase flex items-center gap-3 mb-6"><ChevronRight className="text-yellow-500" /> Historial</h2>
              <ScrollArea className="h-[250px] md:h-[300px]">
                <div className="space-y-3">
                  {players.filter(p => p.suspensionMatchdays > 0).map(p => (
                    <div key={p.id} className="p-3 md:p-4 bg-destructive/10 rounded-xl md:rounded-2xl border border-destructive/20 flex justify-between items-center">
                      <div><p className="font-black uppercase text-xs md:text-sm">{p.name}</p><p className="text-[9px] font-bold opacity-50 uppercase">{teams.find(t => t.id === p.teamId)?.name}</p></div>
                      <Badge variant="destructive" className="font-black text-[10px]">{p.suspensionMatchdays} J.</Badge>
                    </div>
                  ))}
                  {players.filter(p => p.suspensionMatchdays > 0).length === 0 && <p className="text-center text-muted-foreground text-xs italic py-10">Sin sanciones activas.</p>}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-2xl rounded-[1.5rem] md:rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden">
          {arcadeMatch && (
            <div className="flex flex-col">
              <div className="bg-primary p-6 md:p-10 text-white flex flex-col md:flex-row items-center gap-6 md:gap-8">
                {(() => {
                  const opId = arcadeMatch.homeId === tournament.managedParticipantId ? arcadeMatch.awayId : arcadeMatch.homeId;
                  const opponent = teams.find(t => t.id === opId);
                  return (
                    <>
                      <CrestIcon shape={opponent?.emblemShape!} pattern={opponent?.emblemPattern!} c1={opponent?.crestPrimary!} c2={opponent?.crestSecondary!} size="w-20 h-20 md:w-24 md:h-24" />
                      <div className="text-center md:text-left">
                        <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter">vs {opponent?.name}</h2>
                        <p className="text-white/80 font-bold uppercase tracking-widest flex items-center justify-center md:justify-start gap-2 mt-2">
                          <Target className="w-4 h-4" /> DUELO ARCADE
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="p-6 md:p-10 space-y-6 md:space-y-8">
                <section className="space-y-4">
                  <h3 className="font-black text-[10px] uppercase text-muted-foreground tracking-widest border-b pb-2">Selecciona tu Líder</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {players.filter(p => p.teamId === tournament.managedParticipantId && p.suspensionMatchdays === 0).map(p => (
                      <button key={p.id} onClick={() => setSelectedPlayerId(p.id)} className={cn("p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all flex flex-col items-center text-center gap-1", selectedPlayerId === p.id ? "bg-primary/10 border-primary shadow-lg scale-105" : "bg-card border-transparent hover:bg-muted/50")}>
                        <p className="font-black text-[9px] md:text-[10px] uppercase truncate w-full">{p.name}</p>
                        <p className="text-[9px] font-bold text-primary">{p.monetaryValue} CR</p>
                      </button>
                    ))}
                  </div>
                </section>
                <Button disabled={!selectedPlayerId} onClick={playArcadeMatch} className="w-full h-14 md:h-16 rounded-2xl text-lg md:text-xl font-black bg-primary shadow-xl shadow-primary/20"><Sword className="w-6 h-6 mr-3" /> SALTAR A LA PISTA</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingTeamId} onOpenChange={(o) => !o && setViewTeamId(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-3xl rounded-[1.5rem] md:rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          {teams.find(t => t.id === viewingTeamId) && (
            <div className="flex flex-col h-[80vh] md:h-auto md:max-h-[85vh]">
              <div className="p-6 md:p-8 bg-muted/10 border-b flex items-center gap-4 md:gap-6">
                <CrestIcon shape={teams.find(t => t.id === viewingTeamId)!.emblemShape} pattern={teams.find(t => t.id === viewingTeamId)!.emblemPattern} c1={teams.find(t => t.id === viewingTeamId)!.crestPrimary} c2={teams.find(t => t.id === viewingTeamId)!.crestSecondary} size="w-16 h-16 md:w-20 md:h-20" />
                <div className="flex-1 overflow-hidden">
                  <h2 className="text-xl md:text-3xl font-black uppercase tracking-tighter truncate">{teams.find(t => t.id === viewingTeamId)!.name}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-[10px] md:text-sm font-black text-accent"><Coins className="w-3 h-3 md:w-4 md:h-4" /> {teams.find(t => t.id === viewingTeamId)!.budget} CR</span>
                    <span className="flex items-center gap-1 text-[10px] md:text-sm font-black text-primary"><Star className="w-3 h-3 md:w-4 md:h-4 fill-current" /> {teams.find(t => t.id === viewingTeamId)!.rating}</span>
                  </div>
                </div>
              </div>
              <ScrollArea className="flex-1 p-6 md:p-8">
                <div className="space-y-6 md:space-y-8">
                  <section className="space-y-2">
                    <h4 className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2"><Info className="w-3 h-3" /> Perfil del Club</h4>
                    <p className="text-xs md:text-sm italic leading-relaxed text-muted-foreground">&quot;{teams.find(t => t.id === viewingTeamId)!.description || "Entidad deportiva histórica de l'Horta."}&quot;</p>
                  </section>
                  <section className="space-y-4">
                    <h4 className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2"><LayoutGrid className="w-3 h-3" /> Jugadores Registrados</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                      {players.filter(p => p.teamId === viewingTeamId).map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-xl border">
                          <div className="overflow-hidden">
                            <p className="font-bold text-xs md:text-sm truncate">{p.name}</p>
                            <p className="text-[8px] md:text-[9px] font-black uppercase opacity-50">{p.position} • #{p.jerseyNumber}</p>
                          </div>
                          <Badge variant="outline" className="font-black text-[9px] h-5">{p.monetaryValue} CR</Badge>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </ScrollArea>
              <div className="p-4 md:p-6 border-t bg-muted/5 flex justify-end">
                <Button onClick={() => setViewTeamId(null)} className="w-full md:w-auto rounded-xl font-black h-12 px-8">CERRAR</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
