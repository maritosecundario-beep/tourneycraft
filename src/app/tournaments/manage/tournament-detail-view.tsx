"use client";

import { useEffect, useState, useMemo } from 'react';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, RefreshCw, ArrowLeft, Star, Coins, Settings2, Trash2, ChevronRight, UserCircle2, Users, AlertTriangle, Plus, X, Sword, Target, CheckCircle2, LayoutGrid, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CrestIcon } from '@/components/ui/crest-icon';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Match, Tournament, ScoringRuleType, Player } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TournamentDetailViewProps {
  id: string;
}

export function TournamentDetailView({ id }: TournamentDetailViewProps) {
  const { tournaments, teams, players, resolveMatch, generateSchedule, resetSchedule, updateTournament, settings } = useTournamentStore();
  const { toast } = useToast();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  
  // Arcade Simulation State
  const [pendingMatch, setPendingMatch] = useState<{ match: Match; isDual: boolean; aiPlayer: Player | null } | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [arcadeHomeScore, setArcadeHomeScore] = useState<number>(0);
  const [arcadeAwayScore, setArcadeAwayScore] = useState<number>(0);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSport, setEditSport] = useState('');
  const [editWinPts, setEditWinPts] = useState(3);
  const [editDrawPts, setEditDrawPts] = useState(1);
  const [editLossPts, setEditLossPts] = useState(0);
  const [editScoringType, setEditScoringType] = useState<ScoringRuleType>('bestOfN');
  const [editScoringValue, setEditScoringValue] = useState(9);
  const [editRangeMin, setEditRangeMin] = useState(0);
  const [editRangeMax, setEditRangeMax] = useState(10);
  const [editPlayoffSpots, setEditPlayoffSpots] = useState(8);
  const [editRelegationSpots, setEditRelegationSpots] = useState(4);
  const [editWinReward, setEditWinReward] = useState(10);
  const [editLossPenalty, setEditLossPenalty] = useState(15);
  const [editDrawReward, setEditDrawReward] = useState(0);
  const [editVariability, setEditVariability] = useState(15);

  useEffect(() => {
    const found = tournaments.find(t => t.id === id);
    if (found) {
      setTournament(found);
      setEditName(found.name);
      setEditSport(found.sport);
      setEditWinPts(found.winPoints || 0);
      setEditDrawPts(found.drawPoints || 0);
      setEditLossPts(found.lossPoints || 0);
      setEditScoringType(found.scoringRuleType);
      setEditScoringValue(found.scoringValue || 9);
      setEditRangeMin(found.nToNRangeMin || 0);
      setEditRangeMax(found.nToNRangeMax || 10);
      setEditPlayoffSpots(found.playoffSpots || 0);
      setEditRelegationSpots(found.relegationSpots || 0);
      setEditWinReward(found.winReward || 0);
      setEditLossPenalty(found.lossPenalty || 0);
      setEditDrawReward(found.drawReward || 0);
      setEditVariability(found.variability || 15);
    }
  }, [tournaments, id]);

  const generateCalculatedScore = (t: Tournament) => {
    let hScore = 0;
    let aScore = 0;
    const val = t.scoringValue || 9;

    if (t.scoringRuleType === 'bestOfN') {
      hScore = Math.floor(Math.random() * (val + 1));
      aScore = val - hScore;
    } else if (t.scoringRuleType === 'firstToN') {
      const winnerIdx = Math.random() > 0.5 ? 0 : 1;
      if (winnerIdx === 0) {
        hScore = val;
        aScore = Math.floor(Math.random() * val);
      } else {
        aScore = val;
        hScore = Math.floor(Math.random() * val);
      }
    } else if (t.scoringRuleType === 'nToNRange') {
      const min = t.nToNRangeMin || 0;
      const max = t.nToNRangeMax || 10;
      const total = Math.floor(Math.random() * (max - min + 1)) + min;
      hScore = Math.floor(Math.random() * (total + 1));
      aScore = total - hScore;
    } else {
      hScore = Math.floor(Math.random() * 5);
      aScore = Math.floor(Math.random() * 5);
    }
    return { hScore, aScore };
  };

  const getStandings = (matchList: Match[], participants: string[]) => {
    const stats: Record<string, any> = {};
    participants.forEach((pId) => {
      stats[pId] = { id: pId, played: 0, win: 0, draw: 0, loss: 0, points: 0 };
    });

    matchList.filter(m => m.isSimulated).forEach(m => {
      if (stats[m.homeId] && stats[m.awayId]) {
        stats[m.homeId].played++;
        stats[m.awayId].played++;
        if (m.homeScore! > m.awayScore!) {
          stats[m.homeId].win++; stats[m.homeId].points += (tournament?.winPoints || 0);
          stats[m.awayId].loss++; stats[m.awayId].points += (tournament?.lossPoints || 0);
        } else if (m.awayScore! > m.homeScore!) {
          stats[m.awayId].win++; stats[m.awayId].points += (tournament?.winPoints || 0);
          stats[m.homeId].loss++; stats[m.homeId].points += (tournament?.lossPoints || 0);
        } else {
          stats[m.homeId].draw++; stats[m.homeId].points += (tournament?.drawPoints || 0);
          stats[m.awayId].draw++; stats[m.awayId].points += (tournament?.drawPoints || 0);
        }
      }
    });

    return Object.values(stats).sort((a: any, b: any) => (b.points || 0) - (a.points || 0));
  };

  const handleSimulateNormal = (match: Match, isDual: boolean) => {
    if (!tournament) return;
    const { hScore, aScore } = generateCalculatedScore(tournament);
    resolveMatch(tournament.id, match.id, hScore, aScore, isDual);
  };

  const handleSimulateArcade = (match: Match, isDual: boolean) => {
    const isUserHome = match.homeId === tournament?.managedParticipantId;
    const opponentTeamId = isUserHome ? match.awayId : match.homeId;
    const opponentPlayers = players.filter(p => p.teamId === opponentTeamId);
    
    let aiPlayer: Player | null = null;
    if (opponentPlayers.length > 0) {
      const sortedOpponents = [...opponentPlayers].sort((a, b) => b.monetaryValue - a.monetaryValue);
      // IA elige al mejor el 70% de las veces
      aiPlayer = Math.random() < 0.7 ? sortedOpponents[0] : sortedOpponents[Math.floor(Math.random() * sortedOpponents.length)];
    }

    setPendingMatch({ match, isDual, aiPlayer });
    setArcadeHomeScore(0);
    setArcadeAwayScore(0);
    setSelectedPlayerId('');
  };

  const handleSimulateMatchday = (matchday: number, matchList: Match[]) => {
    if (!tournament) return;
    matchList.filter(m => m.matchday === matchday && !m.isSimulated).forEach(m => {
      if (tournament.mode === 'arcade' && (m.homeId === tournament.managedParticipantId || m.awayId === tournament.managedParticipantId)) {
        handleSimulateArcade(m, false);
      } else {
        handleSimulateNormal(m, false);
      }
    });
  };

  const executeArcadeDuel = () => {
    if (!pendingMatch || !selectedPlayerId) return;
    resolveMatch(tournament!.id, pendingMatch.match.id, arcadeHomeScore, arcadeAwayScore, pendingMatch.isDual, 
      pendingMatch.match.homeId === tournament?.managedParticipantId ? selectedPlayerId : undefined,
      pendingMatch.match.awayId === tournament?.managedParticipantId ? selectedPlayerId : undefined
    );
    setPendingMatch(null);
    toast({ title: "Duelo Finalizado", description: "Resultado grabado en l'Horta." });
  };

  const handleSaveSettings = () => {
    if (!tournament) return;
    updateTournament({
      ...tournament,
      name: editName,
      sport: editSport,
      winPoints: editWinPts,
      drawPoints: editDrawPts,
      lossPoints: editLossPts,
      scoringRuleType: editScoringType,
      scoringValue: editScoringValue,
      nToNRangeMin: editRangeMin,
      nToNRangeMax: editRangeMax,
      playoffSpots: editPlayoffSpots,
      relegationSpots: editRelegationSpots,
      winReward: editWinReward,
      lossPenalty: editLossPenalty,
      drawReward: editDrawReward,
      variability: editVariability
    });
    setIsEditing(false);
    toast({ title: "Configuración Actualizada" });
  };

  const standings = useMemo(() => {
    if (!tournament) return [];
    return getStandings(tournament.matches, tournament.participants);
  }, [tournament]);

  const renderMatchdayList = (matchList: Match[]) => {
    const grouped: Record<number, Match[]> = {};
    matchList.forEach(m => {
      if (!grouped[m.matchday]) grouped[m.matchday] = [];
      grouped[m.matchday].push(m);
    });

    return Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b)).map(([day, dayMatches]) => (
      <div key={`matchday-block-v3-${day}-${tournament?.id}`} className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <Badge variant="secondary" className="bg-primary text-white font-black uppercase">JORNADA {day}</Badge>
          <Button size="sm" variant="ghost" onClick={() => handleSimulateMatchday(Number(day), matchList)} className="text-[10px] font-black h-8 px-4 border border-primary/20">
            SIMULAR JORNADA <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
        <div className="grid gap-3">
          {dayMatches.map((m) => {
            const home = teams.find(t => t.id === m.homeId);
            const away = teams.find(t => t.id === m.awayId);
            if (!home || !away) return null;
            return (
              <Card key={`match-row-v3-${m.id}`} className="border-none shadow-md hover:shadow-lg transition-all rounded-2xl overflow-hidden group">
                <CardContent className="p-4 flex items-center justify-between gap-4 bg-card">
                  <div className="flex-1 flex items-center justify-end gap-2 text-right overflow-hidden">
                    <span className={cn("font-black text-[10px] md:text-xs truncate uppercase", m.homeId === tournament?.managedParticipantId && "text-primary")}>{home.name}</span>
                    <CrestIcon shape={home.emblemShape} pattern={home.emblemPattern} c1={home.crestPrimary} c2={home.crestSecondary} c3={home.crestTertiary || home.crestPrimary} size="w-8 h-8" />
                  </div>
                  <div className="w-20 text-center shrink-0">
                    {m.isSimulated ? (
                      <div className="text-lg font-black bg-muted/30 py-1 rounded-xl">{m.homeScore} - {m.awayScore}</div>
                    ) : (
                      <Button size="sm" onClick={() => tournament?.mode === 'arcade' && (m.homeId === tournament.managedParticipantId || m.awayId === tournament.managedParticipantId) ? handleSimulateArcade(m, false) : handleSimulateNormal(m, false)} className="w-full h-10 rounded-xl font-black bg-primary">SIM</Button>
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-start gap-2 text-left overflow-hidden">
                    <CrestIcon shape={away.emblemShape} pattern={away.emblemPattern} c1={away.crestPrimary} c2={away.crestSecondary} c3={away.crestTertiary || away.crestPrimary} size="w-8 h-8" />
                    <span className={cn("font-black text-[10px] md:text-xs truncate uppercase", m.awayId === tournament?.managedParticipantId && "text-primary")}>{away.name}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    ));
  };

  if (!tournament) return <div className="p-20 text-center animate-pulse">Cargando Competición...</div>;

  const userTeam = teams.find(t => t.id === tournament.managedParticipantId);
  const userTeamPlayers = players.filter(p => p.teamId === userTeam?.id);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full"><Link href="/tournaments"><ArrowLeft /></Link></Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">{tournament.name}</h1>
            <p className="text-muted-foreground uppercase font-black text-[10px] tracking-widest">{tournament.sport} • {tournament.mode} • Season {tournament.currentSeason}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditing(true)} className="rounded-xl font-black h-12 border-primary text-primary shadow-lg shadow-primary/10"><Settings2 className="w-4 h-4 mr-2" /> AJUSTES PRO</Button>
          <Button variant="outline" onClick={() => { if(confirm("¿Reiniciar calendario?")) resetSchedule(tournament.id); }} className="rounded-xl font-black h-12 border-destructive text-destructive"><Trash2 className="w-4 h-4 mr-2" /> REINICIAR</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue="matches">
            <TabsList className="bg-muted/20 p-1 rounded-2xl h-14 w-full flex overflow-x-auto scrollbar-hide">
              <TabsTrigger value="matches" className="flex-1 rounded-xl font-black uppercase text-xs">Calendario</TabsTrigger>
              {(tournament.leagueType === 'groups' || tournament.leagueType === 'conferences') && tournament.groups && <TabsTrigger value="groups" className="flex-1 rounded-xl font-black uppercase text-xs">Grupos</TabsTrigger>}
              {tournament.dualLeagueEnabled && <TabsTrigger value="dual" className="flex-1 rounded-xl font-black uppercase text-xs">Liga Dual</TabsTrigger>}
              <TabsTrigger value="standings" className="flex-1 rounded-xl font-black uppercase text-xs">Ranking</TabsTrigger>
            </TabsList>

            <TabsContent value="matches" className="mt-6 space-y-8">
              {tournament.matches.length === 0 ? (
                <div className="text-center py-20 bg-muted/10 rounded-[2rem] border-2 border-dashed">
                  <p className="font-bold text-muted-foreground uppercase text-xs">Sin partidos programados.</p>
                  <Button onClick={() => generateSchedule(tournament.id)} className="mt-4 font-black">GENERAR CALENDARIO</Button>
                </div>
              ) : (
                (tournament.leagueType === 'groups' || tournament.leagueType === 'conferences') && tournament.groups ? (
                  <Tabs defaultValue={tournament.groups[0]?.id}>
                    <TabsList className="bg-muted/10 p-1 mb-6 flex overflow-x-auto scrollbar-hide w-full gap-1">
                      {tournament.groups.map((g, idx) => <TabsTrigger key={`cal-group-tab-${g.id || idx}`} value={g.id} className="text-[10px] font-black uppercase flex-1">{g.name}</TabsTrigger>)}
                    </TabsList>
                    {tournament.groups.map((g, idx) => (
                      <TabsContent key={`cal-group-content-${g.id || idx}`} value={g.id} className="space-y-8">
                        {renderMatchdayList(tournament.matches.filter(m => g.participantIds.includes(m.homeId) || g.participantIds.includes(m.awayId)))}
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : renderMatchdayList(tournament.matches)
              )}
            </TabsContent>

            <TabsContent value="groups" className="mt-6 space-y-6">
              <Card className="border-none bg-card shadow-xl rounded-[2.5rem] p-6">
                <div className="flex items-center gap-2 mb-6">
                  <LayoutGrid className="text-primary w-5 h-5" />
                  <h3 className="text-lg font-black uppercase">Organización de Conferencias</h3>
                </div>
                <div className="grid gap-6">
                  {tournament.groups?.map((g, gIdx) => (
                    <div key={`group-manage-${g.id || gIdx}`} className="p-4 bg-muted/20 rounded-2xl border">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-black uppercase text-sm text-primary">{g.name}</span>
                        <Badge variant="secondary" className="font-black">{g.participantIds.length} Clubes</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {g.participantIds.map(pId => {
                          const t = teams.find(team => team.id === pId);
                          return (
                            <Badge key={`p-pill-${pId}`} className="bg-white border text-foreground py-1.5 px-3 rounded-xl gap-2">
                              <CrestIcon shape={t?.emblemShape || 'shield'} pattern={t?.emblemPattern || 'none'} c1={t?.crestPrimary || '#000'} c2={t?.crestSecondary || '#fff'} c3={t?.crestTertiary || '#000'} size="w-4 h-4" />
                              <span className="text-[10px] font-bold uppercase">{t?.name}</span>
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20 flex gap-3">
                  <AlertTriangle className="text-yellow-500 shrink-0 w-5 h-5" />
                  <p className="text-[10px] text-yellow-600 font-bold uppercase leading-relaxed">
                    Si reestructuras los grupos, recuerda usar "Reiniciar Calendario" para que los emparejamientos se actualicen correctamente.
                  </p>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="dual" className="mt-6 space-y-8">
              {renderMatchdayList(tournament.dualLeagueMatches || [])}
            </TabsContent>

            <TabsContent value="standings" className="mt-6">
              <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/20">
                    <TableRow>
                      <TableHead className="font-black text-[10px] uppercase">CLUB</TableHead>
                      <TableHead className="text-center font-black text-[10px] uppercase">PJ</TableHead>
                      <TableHead className="text-center font-black text-[10px] uppercase">V</TableHead>
                      <TableHead className="text-right font-black text-[10px] uppercase">PTS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings.map((row: any, idx: number) => {
                      const team = teams.find(t => t.id === row.id);
                      return (
                        <TableRow key={`standing-v2-row-${row.id || idx}`}>
                          <TableCell className="font-black flex items-center gap-3">
                            <span className="text-[10px] opacity-30">{idx + 1}</span>
                            <CrestIcon shape={team?.emblemShape || 'shield'} pattern={team?.emblemPattern || 'none'} c1={team?.crestPrimary || '#000'} c2={team?.crestSecondary || '#fff'} c3={team?.crestTertiary || '#000'} size="w-6 h-6" />
                            <span className={cn("truncate text-xs uppercase", team?.id === tournament.managedParticipantId && "text-primary font-black")}>{team?.name}</span>
                          </TableCell>
                          <TableCell className="text-center text-xs">{row.played}</TableCell>
                          <TableCell className="text-center text-xs">{row.win}</TableCell>
                          <TableCell className="text-right font-black text-primary text-xs">{row.points}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-xl rounded-[2rem] bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden">
            <CardHeader className="p-6 pb-0"><h3 className="text-2xl font-black uppercase">Leyes del Universo</h3></CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl">
                <span className="text-[10px] font-black uppercase">Puntuación</span>
                <span className="text-[10px] font-black uppercase">{tournament.scoringRuleType} ({tournament.scoringValue})</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/10 p-3 rounded-xl text-center"><p className="text-[8px] opacity-70">PLAYOFFS</p><p className="text-lg font-black">{tournament.playoffSpots}</p></div>
                <div className="bg-black/10 p-3 rounded-xl text-center"><p className="text-[8px] opacity-70">DESCENSO</p><p className="text-lg font-black">{tournament.relegationSpots}</p></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2rem]">
            <CardHeader><h3 className="font-black uppercase text-sm flex items-center gap-2"><Star className="text-accent w-4 h-4" /> Podium l'Horta</h3></CardHeader>
            <CardContent className="space-y-4">
              {standings.slice(0, 3).map((row: any, idx: number) => {
                const team = teams.find(t => t.id === row.id);
                return (
                  <div key={`podium-v3-item-${row.id || idx}`} className="flex items-center gap-4 p-3 bg-muted/20 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center font-black text-xs">{idx + 1}</div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-black text-xs uppercase truncate">{team?.name}</p>
                      <p className="text-[9px] font-bold text-muted-foreground">{row.points} PTS</p>
                    </div>
                    <CrestIcon shape={team?.emblemShape || 'shield'} pattern={team?.emblemPattern || 'none'} c1={team?.crestPrimary || '#000'} c2={team?.crestSecondary || '#fff'} c3={team?.crestTertiary || '#000'} size="w-8 h-8" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CENTRO DE TÁCTICAS ARCADE OPTIMIZADO */}
      <Dialog open={!!pendingMatch} onOpenChange={(o) => !o && setPendingMatch(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-card">
          {pendingMatch && (() => {
            const isHome = pendingMatch.match.homeId === tournament.managedParticipantId;
            const opponentTeamId = isHome ? pendingMatch.match.awayId : pendingMatch.match.homeId;
            const opponentTeam = teams.find(t => t.id === opponentTeamId);
            const opponentRank = standings.findIndex(s => s.id === opponentTeamId) + 1;
            const aiPlayer = pendingMatch.aiPlayer;

            return (
              <div className="flex flex-col h-full max-h-[95vh] md:max-h-[90vh]">
                <div className="bg-gradient-to-r from-primary to-primary/80 p-6 md:p-10 text-white border-b-4 border-black/10">
                  <div className="flex justify-between items-center mb-4">
                    <Badge className="bg-white/20 text-white border-none uppercase text-[10px] tracking-widest font-black">Tactics Center Arcade</Badge>
                    <span className="font-black uppercase text-xs flex items-center gap-2"><Sword className="w-4 h-4" /> Jornada {pendingMatch.match.matchday}</span>
                  </div>
                  <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter">
                    {isHome ? "Local en l'Horta" : "Visitante de l'Horta"}
                  </h2>
                  <div className="flex items-center gap-3 mt-2 text-white/70">
                    <Info className="w-4 h-4" />
                    <p className="text-[10px] font-bold uppercase">Regla: {tournament.scoringRuleType === 'bestOfN' ? `Al mejor de ${tournament.scoringValue}` : tournament.scoringRuleType === 'firstToN' ? `Primero en marcar ${tournament.scoringValue}` : `Rango ${tournament.nToNRangeMin}-${tournament.nToNRangeMax}`}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 scrollbar-hide">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    {/* SCOUTING RIVAL */}
                    <div className="p-6 md:p-8 bg-muted/30 rounded-[2rem] space-y-6 border-2 border-dashed border-primary/20 relative overflow-hidden">
                      <div className="flex flex-col items-center gap-4 text-center">
                        <div className="relative">
                          <CrestIcon shape={opponentTeam?.emblemShape || 'shield'} pattern={opponentTeam?.emblemPattern || 'none'} c1={opponentTeam?.crestPrimary || '#000'} c2={opponentTeam?.crestSecondary || '#fff'} c3={opponentTeam?.crestTertiary || '#000'} size="w-20 h-20 md:w-24 h-24" />
                          <Badge className="absolute -bottom-2 -right-2 bg-black text-white font-black">#{opponentRank}</Badge>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Información Rival</p>
                          <h3 className="text-xl md:text-2xl font-black uppercase">{opponentTeam?.name}</h3>
                        </div>
                      </div>
                      
                      {aiPlayer && (
                        <div className="bg-card p-5 rounded-2xl border-2 border-primary/20 shadow-xl animate-in fade-in zoom-in duration-500">
                          <div className="flex items-center gap-2 mb-3">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <p className="text-[9px] font-black uppercase text-primary tracking-widest">Estrella Designada</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-black text-xl shadow-lg">#{aiPlayer.jerseyNumber}</div>
                            <div className="flex-1 overflow-hidden">
                              <p className="font-black uppercase text-base truncate">{aiPlayer.name}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {aiPlayer.attributes.slice(0, 3).map((attr, aIdx) => (
                                  <Badge key={`opp-att-v3-${aIdx}`} className="text-[8px] font-black bg-muted text-muted-foreground">{attr.name.substring(0,3)}: {attr.value}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* TU ACCIÓN */}
                    <div className="flex flex-col gap-6 justify-center bg-muted/10 p-6 rounded-[2rem] border">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">1. Alinea a tu Agente Élite</Label>
                        <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                          <SelectTrigger className="h-14 md:h-16 rounded-2xl border-2 border-primary/20 bg-card text-base md:text-lg font-black">
                            <SelectValue placeholder="Elegir representante..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl shadow-2xl">
                            {userTeamPlayers.map(p => (
                              <SelectItem key={`arcade-p-v3-${p.id}`} value={p.id} className="h-12 font-bold uppercase text-xs">
                                #{p.jerseyNumber} {p.name} ({p.position})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-6 pt-6 border-t-2 border-dashed border-primary/10">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block text-center">2. Registrar Resultado Final</Label>
                        <div className="flex items-center gap-4 md:gap-8 justify-center">
                          <div className="space-y-2 text-center">
                            <p className="text-[9px] font-black uppercase text-primary">{isHome ? "TU EQUIPO" : opponentTeam?.abbreviation}</p>
                            <Input 
                              type="number" 
                              value={arcadeHomeScore} 
                              onChange={e => setArcadeHomeScore(parseInt(e.target.value) || 0)} 
                              className="h-16 md:h-24 w-20 md:w-28 text-3xl md:text-5xl font-black text-center rounded-[1.5rem] md:rounded-[2rem] border-4 focus-visible:ring-primary shadow-inner" 
                            />
                          </div>
                          <span className="text-3xl md:text-5xl font-black opacity-10 mt-6">-</span>
                          <div className="space-y-2 text-center">
                            <p className="text-[9px] font-black uppercase text-primary">{isHome ? opponentTeam?.abbreviation : "TU EQUIPO"}</p>
                            <Input 
                              type="number" 
                              value={arcadeAwayScore} 
                              onChange={e => setArcadeAwayScore(parseInt(e.target.value) || 0)} 
                              className="h-16 md:h-24 w-20 md:w-28 text-3xl md:text-5xl font-black text-center rounded-[1.5rem] md:rounded-[2rem] border-4 focus-visible:ring-primary shadow-inner" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 md:p-10 bg-muted/20 border-t flex flex-col md:flex-row gap-3">
                  <Button variant="ghost" onClick={() => setPendingMatch(null)} className="flex-1 h-14 font-black rounded-2xl uppercase tracking-widest text-xs">Cancelar Duelo</Button>
                  <Button 
                    disabled={!selectedPlayerId} 
                    onClick={executeArcadeDuel} 
                    className="flex-[2] h-14 md:h-16 font-black rounded-2xl shadow-xl bg-primary text-white text-base md:text-lg flex items-center justify-center gap-3 transition-transform active:scale-95"
                  >
                    <CheckCircle2 className="w-6 h-6" /> CONFIRMAR RESULTADO
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="rounded-[2.5rem] max-w-2xl max-h-[90vh] overflow-y-auto border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Ajustes del Universo</DialogTitle>
            <DialogDescription>Modifica todas las leyes de tu competición de l'Horta.</DialogDescription>
          </DialogHeader>
          <div className="space-y-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label>Nombre del Torneo</Label><Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-xl h-12" /></div>
              <div className="space-y-2"><Label>Deporte</Label><Input value={editSport} onChange={e => setEditSport(e.target.value)} className="rounded-xl h-12" /></div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase border-b pb-2 text-primary">Reglas de Juego</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label>Sistema de Marcador</Label>
                  <Select value={editScoringType} onValueChange={(v: any) => setEditScoringType(v)}>
                    <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bestOfN">Al mejor de N (Suma Exacta)</SelectItem>
                      <SelectItem value="firstToN">Primero en marcar N</SelectItem>
                      <SelectItem value="nToNRange">Rango total (Suma)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editScoringType === 'nToNRange' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1"><Label className="text-[9px]">MIN</Label><Input type="number" value={editRangeMin} onChange={e => setEditRangeMin(Number(e.target.value))} /></div>
                    <div className="space-y-1"><Label className="text-[9px]">MAX</Label><Input type="number" value={editRangeMax} onChange={e => setEditRangeMax(Number(e.target.value))} /></div>
                  </div>
                ) : (
                  <div className="space-y-2"><Label>Meta N</Label><Input type="number" value={editScoringValue} onChange={e => setEditScoringValue(Number(e.target.value))} className="rounded-xl h-12" /></div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase border-b pb-2 text-primary">Estructura de Tabla</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1"><Label className="text-[9px] uppercase font-bold text-center block">PTS Victoria</Label><Input type="number" value={editWinPts} onChange={e => setEditWinPts(Number(e.target.value))} className="text-center h-10" /></div>
                <div className="space-y-1"><Label className="text-[9px] uppercase font-bold text-center block">PTS Empate</Label><Input type="number" value={editDrawPts} onChange={e => setEditDrawPts(Number(e.target.value))} className="text-center h-10" /></div>
                <div className="space-y-1"><Label className="text-[9px] uppercase font-bold text-center block">PTS Derrota</Label><Input type="number" value={editLossPts} onChange={e => setEditLossPts(Number(e.target.value))} className="text-center h-10" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="text-[9px] uppercase font-bold block">Plazas Playoffs</Label><Input type="number" value={editPlayoffSpots} onChange={e => setEditPlayoffSpots(Number(e.target.value))} className="h-10" /></div>
                <div className="space-y-1"><Label className="text-[9px] uppercase font-bold block">Plazas Descenso</Label><Input type="number" value={editRelegationSpots} onChange={e => setEditRelegationSpots(Number(e.target.value))} className="h-10" /></div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase border-b pb-2 text-accent">Economía Regional ({settings.currency})</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1"><Label className="text-[9px] text-center block uppercase font-bold">Bono Ganar</Label><Input type="number" value={editWinReward} onChange={e => setEditWinReward(Number(e.target.value))} className="text-center h-10" /></div>
                <div className="space-y-1"><Label className="text-[9px] text-center block uppercase font-bold">Bono Empate</Label><Input type="number" value={editDrawReward} onChange={e => setEditDrawReward(Number(e.target.value))} className="text-center h-10" /></div>
                <div className="space-y-1"><Label className="text-[9px] text-center block uppercase font-bold">Multa Perder</Label><Input type="number" value={editLossPenalty} onChange={e => setEditLossPenalty(Number(e.target.value))} className="text-center h-10" /></div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsEditing(false)} className="rounded-xl font-black">CANCELAR</Button>
            <Button onClick={handleSaveSettings} className="font-black rounded-xl px-8 shadow-lg shadow-primary/20 bg-primary">GUARDAR TODO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
