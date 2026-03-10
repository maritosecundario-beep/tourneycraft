
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, RefreshCw, ArrowLeft, Star, Coins, Play, Settings2, Trash2, CheckCircle2, ChevronRight, UserCircle2, ArrowRightLeft, Users, Group, AlertTriangle } from 'lucide-react';
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
import { Match, Team, Player, Tournament, ScoringRuleType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TournamentDetailViewProps {
  id: string;
}

export function TournamentDetailView({ id }: TournamentDetailViewProps) {
  const { tournaments, teams, players, resolveMatch, generateSchedule, resetSchedule, updateTournament, settings } = useTournamentStore();
  const { toast } = useToast();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  
  // Arcade Simulation State
  const [pendingMatch, setPendingMatch] = useState<{ match: Match; isDual: boolean } | null>(null);
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
  const [editScoringVal, setEditScoringVal] = useState(9);
  const [editPlayoffSpots, setEditPlayoffSpots] = useState(8);
  const [editRelegationSpots, setEditRelegationSpots] = useState(4);
  const [editWinReward, setEditWinReward] = useState(10);
  const [editLossPenalty, setEditLossPenalty] = useState(15);
  const [editDrawReward, setEditDrawReward] = useState(0);

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
      setEditScoringVal(found.scoringValue || 9);
      setEditPlayoffSpots(found.playoffSpots || 0);
      setEditRelegationSpots(found.relegationSpots || 0);
      setEditWinReward(found.winReward || 0);
      setEditLossPenalty(found.lossPenalty || 0);
      setEditDrawReward(found.drawReward || 0);
    }
  }, [tournaments, id]);

  const getStandings = (matchList: Match[], participants: string[]) => {
    const stats: Record<string, any> = {};
    participants.forEach((pId) => {
      stats[pId] = { id: pId, played: 0, win: 0, draw: 0, loss: 0, points: 0 };
    });

    const winPts = tournament?.winPoints || 0;
    const drawPts = tournament?.drawPoints || 0;
    const lossPts = tournament?.lossPoints || 0;

    matchList.filter(m => m.isSimulated).forEach(m => {
      if (stats[m.homeId] && stats[m.awayId]) {
        stats[m.homeId].played++;
        stats[m.awayId].played++;
        if (m.homeScore! > m.awayScore!) {
          stats[m.homeId].win++; stats[m.homeId].points += winPts;
          stats[m.awayId].loss++; stats[m.awayId].points += lossPts;
        } else if (m.awayScore! > m.homeScore!) {
          stats[m.awayId].win++; stats[m.awayId].points += winPts;
          stats[m.homeId].loss++; stats[m.homeId].points += lossPts;
        } else {
          stats[m.homeId].draw++; stats[m.homeId].points += drawPts;
          stats[m.awayId].draw++; stats[m.awayId].points += drawPts;
        }
      }
    });

    return Object.values(stats).sort((a: any, b: any) => (b.points || 0) - (a.points || 0));
  };

  const handleSimulateNormal = (match: Match, isDual: boolean) => {
    const max = tournament?.scoringValue || 10;
    const hScore = Math.floor(Math.random() * max);
    const aScore = Math.floor(Math.random() * max);
    resolveMatch(tournament!.id, match.id, hScore, aScore, isDual);
  };

  const handleSimulateArcade = (match: Match, isDual: boolean) => {
    const isUserHome = match.homeId === tournament?.managedParticipantId;
    const isUserAway = match.awayId === tournament?.managedParticipantId;
    
    if (isUserHome || isUserAway) {
      setPendingMatch({ match, isDual });
      setArcadeHomeScore(0);
      setArcadeAwayScore(0);
      setSelectedPlayerId('');
    } else {
      handleSimulateNormal(match, isDual);
    }
  };

  const handleSimulateMatchday = (matchday: number, matches: Match[], isDual: boolean) => {
    matches.filter(m => m.matchday === matchday && !m.isSimulated).forEach(m => {
      if (tournament?.mode === 'arcade' && (m.homeId === tournament.managedParticipantId || m.awayId === tournament.managedParticipantId)) {
        toast({ title: "Atención Arcade", description: `Simula manualmente el duelo contra ${teams.find(t => t.id === (m.homeId === tournament.managedParticipantId ? m.awayId : m.homeId))?.name}` });
      } else {
        handleSimulateNormal(m, isDual);
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
    toast({ title: "Resultado Registrado", description: "El universo se ha actualizado con tu duelo." });
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
      scoringValue: editScoringVal,
      playoffSpots: editPlayoffSpots,
      relegationSpots: editRelegationSpots,
      winReward: editWinReward,
      lossPenalty: editLossPenalty,
      drawReward: editDrawReward
    });
    setIsEditing(false);
    toast({ title: "Torneo Actualizado" });
  };

  const handleGroupUpdate = (teamId: string, newGroupId: string) => {
    if (!tournament || !tournament.groups) return;
    const newGroups = tournament.groups.map(g => {
      const cleanIds = g.participantIds.filter(id => id !== teamId);
      if (g.id === newGroupId) return { ...g, participantIds: [...cleanIds, teamId] };
      return { ...g, participantIds: cleanIds };
    });
    updateTournament({ ...tournament, groups: newGroups });
    toast({ title: "Grupo Actualizado", description: "Reinicia el calendario para aplicar cambios en emparejamientos." });
  };

  const matchesByMatchday = useMemo(() => {
    const grouped: Record<number, Match[]> = {};
    tournament?.matches.forEach(m => {
      if (!grouped[m.matchday]) grouped[m.matchday] = [];
      grouped[m.matchday].push(m);
    });
    return grouped;
  }, [tournament?.matches]);

  const dualMatchesByMatchday = useMemo(() => {
    const grouped: Record<number, Match[]> = {};
    tournament?.dualLeagueMatches?.forEach(m => {
      if (!grouped[m.matchday]) grouped[m.matchday] = [];
      grouped[m.matchday].push(m);
    });
    return grouped;
  }, [tournament?.dualLeagueMatches]);

  if (!tournament) return <div className="p-20 text-center animate-pulse">Cargando...</div>;

  const userTeam = teams.find(t => t.id === tournament.managedParticipantId);
  const userTeamPlayers = players.filter(p => p.teamId === userTeam?.id);
  const standings = getStandings(tournament.matches, tournament.participants);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/tournaments"><ArrowLeft /></Link>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">{tournament.name}</h1>
            <p className="text-muted-foreground uppercase font-black text-[10px] tracking-widest">
              {tournament.sport} • {tournament.mode} • Season {tournament.currentSeason}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditing(true)} className="rounded-xl font-black h-12">
            <Settings2 className="w-4 h-4 mr-2" /> AJUSTES PRO
          </Button>
          <Button variant="outline" onClick={() => { if(confirm("¿Borrar calendario?")) resetSchedule(tournament.id); }} className="rounded-xl font-black h-12 border-destructive text-destructive">
            <Trash2 className="w-4 h-4 mr-2" /> REINICIAR
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue="matches">
            <TabsList className="bg-muted/20 p-1 rounded-2xl h-14 w-full flex overflow-x-auto scrollbar-hide">
              <TabsTrigger value="matches" className="flex-1 rounded-xl font-black uppercase text-xs">Calendario</TabsTrigger>
              {tournament.leagueType === 'groups' && (
                <TabsTrigger value="groups" className="flex-1 rounded-xl font-black uppercase text-xs">Grupos</TabsTrigger>
              )}
              {tournament.dualLeagueEnabled && (
                <TabsTrigger value="dual" className="flex-1 rounded-xl font-black uppercase text-xs">Liga Dual</TabsTrigger>
              )}
              <TabsTrigger value="standings" className="flex-1 rounded-xl font-black uppercase text-xs">Ranking</TabsTrigger>
            </TabsList>

            <TabsContent value="matches" className="mt-6 space-y-8">
              {Object.keys(matchesByMatchday).length === 0 ? (
                <div className="text-center py-20 bg-muted/10 rounded-[2rem] border-2 border-dashed">
                  <p className="font-bold text-muted-foreground uppercase text-xs">No hay partidos generados.</p>
                  <Button onClick={() => generateSchedule(tournament.id)} className="mt-4 font-black">GENERAR CALENDARIO</Button>
                </div>
              ) : (
                Object.entries(matchesByMatchday).sort(([a], [b]) => Number(a) - Number(b)).map(([day, dayMatches]) => (
                  <div key={`matchday-${day}`} className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <h3 className="font-black uppercase text-sm flex items-center gap-2">
                        <Badge variant="secondary" className="bg-primary text-white">JORNADA {day}</Badge>
                      </h3>
                      <Button size="sm" variant="outline" onClick={() => handleSimulateMatchday(Number(day), tournament.matches, false)} className="text-[10px] font-black h-8 px-4">
                        SIMULAR JORNADA <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                    <div className="grid gap-3">
                      {dayMatches.map((m) => {
                        const home = teams.find(t => t.id === m.homeId);
                        const away = teams.find(t => t.id === m.awayId);
                        if (!home || !away) return null;
                        return (
                          <Card key={`match-${m.id}`} className="border-none shadow-md hover:shadow-lg transition-all rounded-2xl overflow-hidden">
                            <CardContent className="p-4 flex items-center justify-between gap-4">
                              <div className="flex-1 flex items-center justify-end gap-3 text-right overflow-hidden">
                                <span className={cn("font-black text-[10px] md:text-xs truncate uppercase", m.homeId === tournament.managedParticipantId && "text-primary")}>{home.name}</span>
                                <CrestIcon shape={home.emblemShape} pattern={home.emblemPattern} c1={home.crestPrimary} c2={home.crestSecondary} c3={home.crestTertiary || home.crestPrimary} size="w-8 h-8" />
                              </div>
                              <div className="w-24 text-center shrink-0">
                                {m.isSimulated ? (
                                  <div className="text-xl font-black bg-muted/30 py-1 rounded-xl">{m.homeScore} - {m.awayScore}</div>
                                ) : (
                                  <Button size="sm" onClick={() => tournament.mode === 'arcade' ? handleSimulateArcade(m, false) : handleSimulateNormal(m, false)} className="w-full h-10 rounded-xl font-black bg-primary">SIM</Button>
                                )}
                              </div>
                              <div className="flex-1 flex items-center justify-start gap-3 text-left overflow-hidden">
                                <CrestIcon shape={away.emblemShape} pattern={away.emblemPattern} c1={away.crestPrimary} c2={away.crestSecondary} c3={away.crestTertiary || away.crestPrimary} size="w-8 h-8" />
                                <span className={cn("font-black text-[10px] md:text-xs truncate uppercase", m.awayId === tournament.managedParticipantId && "text-primary")}>{away.name}</span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="groups" className="mt-6 space-y-6">
              <div className="p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 flex gap-3 mb-6">
                <AlertTriangle className="text-yellow-500 shrink-0" />
                <p className="text-[10px] font-bold text-yellow-600 uppercase">Si cambias equipos de grupo, debes REINICIAR el calendario para aplicar los nuevos emparejamientos.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tournament.groups?.map(g => (
                  <Card key={`group-card-${g.id}`} className="rounded-2xl border bg-card">
                    <CardHeader className="bg-muted/10 p-4 border-b">
                      <CardTitle className="text-sm font-black uppercase">{g.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      {g.participantIds.map((pId, pIdx) => {
                        const team = teams.find(t => t.id === pId);
                        return (
                          <div key={`group-team-${g.id}-${pId}-${pIdx}`} className="flex items-center justify-between p-2 bg-muted/20 rounded-xl">
                            <div className="flex items-center gap-2">
                              <CrestIcon shape={team?.emblemShape || 'shield'} pattern={team?.emblemPattern || 'none'} c1={team?.crestPrimary || '#000'} c2={team?.crestSecondary || '#fff'} c3={team?.crestTertiary || '#000'} size="w-5 h-5" />
                              <span className="text-xs font-black uppercase">{team?.name}</span>
                            </div>
                            <Select onValueChange={(val) => handleGroupUpdate(pId, val)}>
                              <SelectTrigger className="h-8 w-32 text-[10px] font-black uppercase">
                                <SelectValue placeholder="Mover a..." />
                              </SelectTrigger>
                              <SelectContent>
                                {tournament.groups?.filter(other => other.id !== g.id).map(other => (
                                  <SelectItem key={`move-to-${other.id}`} value={other.id}>{other.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="dual" className="mt-6 space-y-8">
              {Object.entries(dualMatchesByMatchday).sort(([a], [b]) => Number(a) - Number(b)).map(([day, dayMatches]) => (
                <div key={`dual-matchday-${day}`} className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="font-black uppercase text-sm flex items-center gap-2">
                      <Badge variant="outline" className="border-accent text-accent">ESPEJO JORNADA {day}</Badge>
                    </h3>
                  </div>
                  <div className="grid gap-3 opacity-80">
                    {dayMatches.map((m) => {
                      const home = teams.find(t => t.id === m.homeId);
                      const away = teams.find(t => t.id === m.awayId);
                      if (!home || !away) return null;
                      return (
                        <Card key={`dual-match-${m.id}`} className="border-none shadow-sm rounded-2xl">
                          <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div className="flex-1 flex items-center justify-end gap-3 text-right">
                              <span className="font-bold text-[10px] uppercase truncate">{home.name}</span>
                              <CrestIcon shape={home.emblemShape} pattern={home.emblemPattern} c1={home.crestPrimary} c2={home.crestSecondary} c3={home.crestTertiary || home.crestPrimary} size="w-7 h-7" />
                            </div>
                            <div className="w-20 text-center">
                              {m.isSimulated ? (
                                <div className="text-lg font-black bg-muted/20 py-0.5 rounded-lg">{m.homeScore} - {m.awayScore}</div>
                              ) : (
                                <span className="text-[10px] font-black uppercase text-muted-foreground">Pendiente</span>
                              )}
                            </div>
                            <div className="flex-1 flex items-center justify-start gap-3 text-left">
                              <CrestIcon shape={away.emblemShape} pattern={away.emblemPattern} c1={away.crestPrimary} c2={away.crestSecondary} c3={away.crestTertiary || away.crestPrimary} size="w-7 h-7" />
                              <span className="font-bold text-[10px] uppercase truncate">{away.name}</span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="standings" className="mt-6">
              <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/20">
                    <TableRow>
                      <TableHead className="font-black text-[10px] uppercase">CLUB</TableHead>
                      <TableHead className="text-center font-black text-[10px] uppercase">PJ</TableHead>
                      <TableHead className="text-center font-black text-[10px] uppercase">V</TableHead>
                      <TableHead className="text-center font-black text-[10px] uppercase">E</TableHead>
                      <TableHead className="text-center font-black text-[10px] uppercase">D</TableHead>
                      <TableHead className="text-right font-black text-[10px] uppercase">PTS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings.map((row: any, idx: number) => {
                      const team = teams.find(t => t.id === row.id);
                      return (
                        <TableRow key={`standing-row-${row.id || idx}`}>
                          <TableCell className="font-black flex items-center gap-3">
                            <span className="text-[10px] opacity-30">{idx + 1}</span>
                            <CrestIcon shape={team?.emblemShape || 'shield'} pattern={team?.emblemPattern || 'none'} c1={team?.crestPrimary || '#000'} c2={team?.crestSecondary || '#fff'} c3={team?.crestTertiary || '#000'} size="w-6 h-6" />
                            <span className={cn("truncate text-xs", team?.id === tournament.managedParticipantId && "text-primary font-black")}>{team?.name}</span>
                          </TableCell>
                          <TableCell className="text-center text-xs">{row.played || 0}</TableCell>
                          <TableCell className="text-center text-xs">{row.win || 0}</TableCell>
                          <TableCell className="text-center text-xs">{row.draw || 0}</TableCell>
                          <TableCell className="text-center text-xs">{row.loss || 0}</TableCell>
                          <TableCell className="text-right font-black text-primary text-xs">{row.points || 0}</TableCell>
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
            <CardHeader className="p-6">
              <p className="text-[10px] font-black uppercase opacity-80 tracking-widest">Competición</p>
              <h3 className="text-2xl font-black uppercase">Reglas Activas</h3>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl">
                <span className="text-[10px] font-black uppercase">Sistema</span>
                <span className="text-sm font-black">{tournament.scoringRuleType}</span>
              </div>
              <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl">
                <span className="text-[10px] font-black uppercase">Valor N</span>
                <span className="text-sm font-black">{tournament.scoringValue}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/10 p-3 rounded-xl text-center">
                  <p className="text-[8px] opacity-70">PLAYOFFS</p>
                  <p className="text-lg font-black">{tournament.playoffSpots}</p>
                </div>
                <div className="bg-black/10 p-3 rounded-xl text-center">
                  <p className="text-[8px] opacity-70">DESCENSO</p>
                  <p className="text-lg font-black">{tournament.relegationSpots}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2rem]">
            <CardHeader><h3 className="font-black uppercase text-sm flex items-center gap-2"><Star className="text-accent w-4 h-4" /> Podium l'Horta</h3></CardHeader>
            <CardContent className="space-y-4">
              {standings.slice(0, 3).map((row: any, idx: number) => {
                const team = teams.find(t => t.id === row.id);
                return (
                  <div key={`podium-item-${row.id || idx}`} className="flex items-center gap-4 p-3 bg-muted/20 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center font-black text-xs">{idx + 1}</div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-black text-xs uppercase truncate">{team?.name}</p>
                      <p className="text-[9px] font-bold text-muted-foreground">{row.points || 0} PTS</p>
                    </div>
                    <CrestIcon shape={team?.emblemShape || 'shield'} pattern={team?.emblemPattern || 'none'} c1={team?.crestPrimary || '#000'} c2={team?.crestSecondary || '#fff'} c3={team?.crestTertiary || '#000'} size="w-8 h-8" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Arcade Duel Modal */}
      <Dialog open={!!pendingMatch} onOpenChange={(o) => !o && setPendingMatch(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          {pendingMatch && (() => {
            const isHome = pendingMatch.match.homeId === tournament.managedParticipantId;
            const opponentTeamId = isHome ? pendingMatch.match.awayId : pendingMatch.match.homeId;
            const opponentTeam = teams.find(t => t.id === opponentTeamId);
            const opponentPlayers = players.filter(p => p.teamId === opponentTeamId);
            
            const sortedOpponents = [...opponentPlayers].sort((a, b) => b.monetaryValue - a.monetaryValue);
            const aiPlayer = Math.random() < 0.7 ? sortedOpponents[0] : sortedOpponents[Math.floor(Math.random() * sortedOpponents.length)];
            const opponentRank = standings.findIndex(s => s.id === opponentTeamId) + 1;

            return (
              <div className="flex flex-col h-full max-h-[90vh]">
                <div className="bg-primary p-6 text-white">
                  <div className="flex justify-between items-center mb-4">
                    <Badge className="bg-white/20 text-white border-none uppercase text-[10px]">Centro de Tácticas</Badge>
                    <span className="font-black uppercase text-xs">Jornada {pendingMatch.match.matchday}</span>
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter">
                    {isHome ? "Local en l'Horta" : "Visitante de l'Horta"}
                  </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="p-8 bg-muted/20 rounded-[2.5rem] space-y-6 border">
                      <div className="flex flex-col items-center gap-4 text-center">
                        <CrestIcon shape={opponentTeam?.emblemShape || 'shield'} pattern={opponentTeam?.emblemPattern || 'none'} c1={opponentTeam?.crestPrimary || '#000'} c2={opponentTeam?.crestSecondary || '#fff'} c3={opponentTeam?.crestTertiary || '#000'} size="w-24 h-24" />
                        <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground">Oponente</p>
                          <h3 className="text-2xl font-black uppercase">{opponentTeam?.name}</h3>
                          <p className="text-xs font-bold text-primary">Rango: #{opponentRank} en la tabla</p>
                        </div>
                      </div>
                      
                      {aiPlayer && (
                        <div className="bg-card p-4 rounded-2xl border-2 border-primary/20">
                          <p className="text-[9px] font-black uppercase text-primary mb-3">Jugador Clave Rival</p>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center font-black text-xl">#{aiPlayer.jerseyNumber}</div>
                            <div>
                              <p className="font-black uppercase text-sm">{aiPlayer.name}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {aiPlayer.attributes.slice(0, 3).map((attr, aIdx) => (
                                  <Badge key={`opponent-attr-${aiPlayer.id}-${attr.name}-${aIdx}`} variant="outline" className="text-[8px] font-black">{attr.name}: {attr.value}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">1. Elige tu Agente para el Duelo</Label>
                        <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                          <SelectTrigger className="h-14 rounded-2xl border-2"><SelectValue placeholder="Seleccionar jugador..." /></SelectTrigger>
                          <SelectContent>
                            {userTeamPlayers.map(p => (
                              <SelectItem key={`arcade-select-${p.id}`} value={p.id}>{p.name} (#{p.jerseyNumber} - {p.position})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4 pt-4">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">2. Resultado del Partido</Label>
                        <div className="flex items-center gap-6 justify-center">
                          <div className="space-y-2 text-center">
                            <p className="text-[9px] font-black uppercase opacity-50">{isHome ? "Tú (Local)" : opponentTeam?.abbreviation}</p>
                            <Input type="number" value={arcadeHomeScore} onChange={e => setArcadeHomeScore(Number(e.target.value))} className="h-16 w-20 text-3xl font-black text-center rounded-2xl" />
                          </div>
                          <span className="text-2xl font-black opacity-20 mt-6">-</span>
                          <div className="space-y-2 text-center">
                            <p className="text-[9px] font-black uppercase opacity-50">{isHome ? opponentTeam?.abbreviation : "Tú (Local)"}</p>
                            <Input type="number" value={arcadeAwayScore} onChange={e => setArcadeAwayScore(Number(e.target.value))} className="h-16 w-20 text-3xl font-black text-center rounded-2xl" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-muted/10 border-t flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setPendingMatch(null)} className="h-12 px-8 font-black rounded-xl">ABORTAR</Button>
                  <Button disabled={!selectedPlayerId} onClick={executeArcadeDuel} className="h-12 px-10 font-black rounded-xl shadow-lg shadow-primary/20">CONFIRMAR RESULTADO</Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Settings Dialog Expanded */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="rounded-[2.5rem] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Ajustes del Universo</DialogTitle>
            <DialogDescription>Modifica todas las leyes de tu competición.</DialogDescription>
          </DialogHeader>
          <div className="space-y-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label>Nombre del Torneo</Label><Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-2"><Label>Deporte</Label><Input value={editSport} onChange={e => setEditSport(e.target.value)} className="rounded-xl" /></div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase border-b pb-2 text-primary">Reglas de Juego</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Sistema de Marcador</Label>
                  <Select value={editScoringType} onValueChange={(v: any) => setEditScoringType(v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bestOfN">El mejor de N (Sets)</SelectItem>
                      <SelectItem value="firstToN">Primero en marcar N</SelectItem>
                      <SelectItem value="nToNRange">Rango total</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Valor N / Max Puntos</Label><Input type="number" value={editScoringVal} onChange={e => setEditScoringVal(Number(e.target.value))} className="rounded-xl" /></div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase border-b pb-2 text-primary">Estructura de Tabla</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1"><Label className="text-[9px] uppercase font-bold text-center block">PTS Victoria</Label><Input type="number" value={editWinPts} onChange={e => setEditWinPts(Number(e.target.value))} className="text-center" /></div>
                <div className="space-y-1"><Label className="text-[9px] uppercase font-bold text-center block">PTS Empate</Label><Input type="number" value={editDrawPts} onChange={e => setEditDrawPts(Number(e.target.value))} className="text-center" /></div>
                <div className="space-y-1"><Label className="text-[9px] uppercase font-bold text-center block">PTS Derrota</Label><Input type="number" value={editLossPts} onChange={e => setEditLossPts(Number(e.target.value))} className="text-center" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="text-[9px] uppercase font-bold block">Plazas Playoffs</Label><Input type="number" value={editPlayoffSpots} onChange={e => setEditPlayoffSpots(Number(e.target.value))} /></div>
                <div className="space-y-1"><Label className="text-[9px] uppercase font-bold block">Plazas Descenso</Label><Input type="number" value={editRelegationSpots} onChange={e => setEditRelegationSpots(Number(e.target.value))} /></div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase border-b pb-2 text-accent">Economía Regional ({settings.currency})</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1"><Label className="text-[9px] uppercase font-bold text-center block">Bono Ganar</Label><Input type="number" value={editWinReward} onChange={e => setEditWinReward(Number(e.target.value))} className="text-center" /></div>
                <div className="space-y-1"><Label className="text-[9px] uppercase font-bold text-center block">Bono Empate</Label><Input type="number" value={editDrawReward} onChange={e => setEditDrawReward(Number(e.target.value))} className="text-center" /></div>
                <div className="space-y-1"><Label className="text-[9px] uppercase font-bold text-center block">Multa Perder</Label><Input type="number" value={editLossPenalty} onChange={e => setEditLossPenalty(Number(e.target.value))} className="text-center" /></div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsEditing(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSaveSettings} className="font-black rounded-xl px-8 shadow-lg shadow-primary/20">GUARDAR TODO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
