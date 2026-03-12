
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, RefreshCw, ArrowLeft, Star, Coins, Settings2, Trash2, ChevronRight, UserCircle2, Users, AlertTriangle, Plus, X, Sword, Target, CheckCircle2, LayoutGrid, Info, ShieldAlert } from 'lucide-react';
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
import { Match, Tournament, ScoringRuleType, Player, TournamentGroup } from '@/lib/types';
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
      // 70% de probabilidad de elegir al mejor
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

  // Group Management Helpers
  const addGroup = () => {
    if (!tournament) return;
    const newGroups = [...(tournament.groups || [])];
    newGroups.push({ id: `g-${Date.now()}`, name: `Nuevo Grupo ${newGroups.length + 1}`, participantIds: [] });
    updateTournament({ ...tournament, groups: newGroups });
    toast({ title: "Conferencia Añadida" });
  };

  const removeGroup = (groupId: string) => {
    if (!tournament) return;
    const newGroups = (tournament.groups || []).filter(g => g.id !== groupId);
    updateTournament({ ...tournament, groups: newGroups });
    toast({ title: "Conferencia Eliminada" });
  };

  const moveTeamToGroup = (participantId: string, toGroupId: string | null) => {
    if (!tournament) return;
    const newGroups = (tournament.groups || []).map(g => {
      const filtered = g.participantIds.filter(id => id !== participantId);
      if (g.id === toGroupId) filtered.push(participantId);
      return { ...g, participantIds: filtered };
    });
    updateTournament({ ...tournament, groups: newGroups });
  };

  const standings = useMemo(() => {
    if (!tournament) return [];
    return getStandings(tournament.matches, tournament.participants);
  }, [tournament]);

  const unassignedTeams = useMemo(() => {
    if (!tournament || !tournament.groups) return [];
    const assignedIds = tournament.groups.flatMap(g => g.participantIds);
    return tournament.participants.filter(id => !assignedIds.includes(id));
  }, [tournament]);

  const renderMatchdayList = (matchList: Match[]) => {
    const grouped: Record<number, Match[]> = {};
    matchList.forEach(m => {
      if (!grouped[m.matchday]) grouped[m.matchday] = [];
      grouped[m.matchday].push(m);
    });

    const entries = Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b));

    if (entries.length === 0) {
      return (
        <div className="text-center py-20 bg-muted/10 rounded-[2rem] border-2 border-dashed">
          <p className="font-bold text-muted-foreground uppercase text-xs">Sin partidos para esta selección.</p>
        </div>
      );
    }

    return entries.map(([day, dayMatches]) => (
      <div key={`matchday-block-v4-${day}-${tournament?.id}`} className="space-y-4">
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
              <Card key={`match-row-v4-${m.id}`} className="border-none shadow-md hover:shadow-lg transition-all rounded-2xl overflow-hidden group">
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
                (tournament.leagueType === 'groups' || tournament.leagueType === 'conferences') && tournament.groups && tournament.groups.length > 0 ? (
                  <Tabs defaultValue={tournament.groups[0].id}>
                    <TabsList className="bg-muted/10 p-1 mb-6 flex overflow-x-auto scrollbar-hide w-full gap-1">
                      {tournament.groups.map((g, idx) => <TabsTrigger key={`cal-group-tab-v4-${g.id || idx}`} value={g.id} className="text-[10px] font-black uppercase flex-1">{g.name}</TabsTrigger>)}
                    </TabsList>
                    {tournament.groups.map((g, idx) => (
                      <TabsContent key={`cal-group-content-v4-${g.id || idx}`} value={g.id} className="space-y-8">
                        {renderMatchdayList(tournament.matches.filter(m => g.participantIds.includes(m.homeId) || g.participantIds.includes(m.awayId)))}
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : renderMatchdayList(tournament.matches)
              )}
            </TabsContent>

            <TabsContent value="groups" className="mt-6 space-y-6">
              <Card className="border-none bg-card shadow-xl rounded-[2.5rem] p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="text-primary w-5 h-5" />
                    <h3 className="text-lg font-black uppercase">Organización de Conferencias</h3>
                  </div>
                  <Button onClick={addGroup} size="sm" className="font-black rounded-xl bg-accent text-accent-foreground">
                    <Plus className="w-4 h-4 mr-2" /> AÑADIR GRUPO
                  </Button>
                </div>

                {unassignedTeams.length > 0 && (
                  <div className="mb-8 p-4 bg-muted/30 rounded-2xl border-2 border-dashed border-primary/20">
                    <p className="text-[10px] font-black uppercase text-primary mb-3">Clubes sin Conferencia</p>
                    <div className="flex flex-wrap gap-2">
                      {unassignedTeams.map(id => {
                        const t = teams.find(team => team.id === id);
                        return (
                          <Badge key={`unassigned-v4-${id}`} className="bg-white border py-1.5 px-3 rounded-xl gap-2 text-foreground">
                            <CrestIcon shape={t?.emblemShape || 'shield'} pattern={t?.emblemPattern || 'none'} c1={t?.crestPrimary || '#000'} c2={t?.crestSecondary || '#fff'} c3={t?.crestTertiary || '#000'} size="w-4 h-4" />
                            <span className="text-[10px] font-bold">{t?.name}</span>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid gap-6">
                  {tournament.groups?.map((g, gIdx) => (
                    <div key={`group-manage-v4-${g.id || gIdx}`} className="p-6 bg-muted/20 rounded-3xl border group relative">
                      <div className="flex justify-between items-center mb-6">
                        <Input 
                          value={g.name} 
                          onChange={(e) => {
                            const next = (tournament.groups || []).map(group => group.id === g.id ? {...group, name: e.target.value} : group);
                            updateTournament({...tournament, groups: next});
                          }}
                          className="font-black uppercase text-sm text-primary bg-transparent border-none focus-visible:ring-0 p-0 w-auto"
                        />
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="font-black">{g.participantIds.length} Clubes</Badge>
                          <Button variant="ghost" size="icon" onClick={() => removeGroup(g.id)} className="text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-6">
                        {g.participantIds.map(pId => {
                          const t = teams.find(team => team.id === pId);
                          return (
                            <Badge key={`p-pill-v4-${pId}`} className="bg-white border text-foreground py-1.5 px-3 rounded-xl gap-2 relative pr-8">
                              <CrestIcon shape={t?.emblemShape || 'shield'} pattern={t?.emblemPattern || 'none'} c1={t?.crestPrimary || '#000'} c2={t?.crestSecondary || '#fff'} c3={t?.crestTertiary || '#000'} size="w-4 h-4" />
                              <span className="text-[10px] font-bold uppercase">{t?.name}</span>
                              <X className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer hover:text-destructive" onClick={() => moveTeamToGroup(pId, null)} />
                            </Badge>
                          );
                        })}
                      </div>

                      <div className="pt-4 border-t border-primary/10">
                        <Select onValueChange={(val) => moveTeamToGroup(val, g.id)}>
                          <SelectTrigger className="h-9 rounded-xl border-dashed bg-card text-[10px] font-bold uppercase">
                            <SelectValue placeholder="Incorporar Club..." />
                          </SelectTrigger>
                          <SelectContent>
                            {unassignedTeams.map(id => (
                              <SelectItem key={`add-to-g-${g.id}-${id}`} value={id} className="text-xs font-bold uppercase">
                                {teams.find(t => t.id === id)?.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-yellow-500/10 rounded-[2rem] border-2 border-dashed border-yellow-500/20 flex gap-4">
                  <ShieldAlert className="text-yellow-500 shrink-0 w-6 h-6" />
                  <div>
                    <p className="text-xs text-yellow-700 font-black uppercase mb-1">Aviso de Estructura</p>
                    <p className="text-[10px] text-yellow-600 font-bold uppercase leading-relaxed">
                      Cualquier cambio en la distribución de grupos requiere usar "Reiniciar Calendario" para que los enfrentamientos sean coherentes con la nueva estructura.
                    </p>
                  </div>
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
                        <TableRow key={`standing-v4-row-${row.id || idx}`}>
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
            <CardHeader className="p-6 pb-0">
              <DialogTitle className="text-2xl font-black uppercase text-white">Leyes del Universo</DialogTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl">
                <span className="text-[10px] font-black uppercase">Puntuación</span>
                <span className="text-[10px] font-black uppercase">{tournament.scoringRuleType} ({tournament.scoringValue})</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/10 p-3 rounded-xl text-center"><p className="text-[8px] opacity-70 uppercase font-black">PLAYOFFS</p><p className="text-lg font-black">{tournament.playoffSpots}</p></div>
                <div className="bg-black/10 p-3 rounded-xl text-center"><p className="text-[8px] opacity-70 uppercase font-black">DESCENSO</p><p className="text-lg font-black">{tournament.relegationSpots}</p></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2rem]">
            <CardHeader><h3 className="font-black uppercase text-sm flex items-center gap-2"><Star className="text-accent w-4 h-4" /> Podium l'Horta</h3></CardHeader>
            <CardContent className="space-y-4">
              {standings.slice(0, 3).map((row: any, idx: number) => {
                const team = teams.find(t => t.id === row.id);
                return (
                  <div key={`podium-v4-item-${row.id || idx}`} className="flex items-center gap-4 p-3 bg-muted/20 rounded-xl">
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

      {/* CENTRO DE TÁCTICAS ARCADE OPTIMIZADO V5 - FULL ATRIBUTES */}
      <Dialog open={!!pendingMatch} onOpenChange={(o) => !o && setPendingMatch(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-5xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-card">
          {pendingMatch && (() => {
            const isHome = pendingMatch.match.homeId === tournament.managedParticipantId;
            const opponentTeamId = isHome ? pendingMatch.match.awayId : pendingMatch.match.homeId;
            const opponentTeam = teams.find(t => t.id === opponentTeamId);
            const opponentRank = standings.findIndex(s => s.id === opponentTeamId) + 1;
            const aiPlayer = pendingMatch.aiPlayer;

            return (
              <div className="flex flex-col h-full max-h-[95vh] md:max-h-[90vh]">
                <DialogHeader className="bg-gradient-to-r from-primary to-primary/80 p-6 md:p-10 text-white border-b-4 border-black/10 shrink-0">
                  <div className="flex justify-between items-center mb-4">
                    <Badge className="bg-white/20 text-white border-none uppercase text-[10px] tracking-widest font-black px-4 py-1">Tactics Center Arcade</Badge>
                    <span className="font-black uppercase text-xs flex items-center gap-2 text-white/90"><Sword className="w-4 h-4" /> Jornada {pendingMatch.match.matchday}</span>
                  </div>
                  <DialogTitle className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white">
                    {isHome ? "Local en l'Horta" : "Visitante de l'Horta"}
                  </DialogTitle>
                  <DialogDescription className="text-white/70 font-bold uppercase text-[10px] mt-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Regla: {tournament.scoringRuleType === 'bestOfN' ? `Al mejor de ${tournament.scoringValue}` : tournament.scoringRuleType === 'firstToN' ? `Primero en marcar ${tournament.scoringValue}` : `Rango ${tournament.nToNRangeMin}-${tournament.nToNRangeMax}`}
                  </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 scrollbar-hide">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* SCOUTING RIVAL INTEGRAL */}
                    <div className="p-6 md:p-8 bg-muted/30 rounded-[3rem] space-y-8 border-2 border-dashed border-primary/20 relative overflow-hidden">
                      <div className="flex flex-col items-center gap-4 text-center">
                        <div className="relative">
                          <CrestIcon shape={opponentTeam?.emblemShape || 'shield'} pattern={opponentTeam?.emblemPattern || 'none'} c1={opponentTeam?.crestPrimary || '#000'} c2={opponentTeam?.crestSecondary || '#fff'} c3={opponentTeam?.crestTertiary || '#000'} size="w-24 h-24 md:w-32 h-32" />
                          <Badge className="absolute -bottom-2 -right-2 bg-black text-white font-black text-lg p-2 px-4 shadow-2xl">Rank #{opponentRank}</Badge>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1">Información Rival</p>
                          <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">{opponentTeam?.name}</h3>
                        </div>
                      </div>
                      
                      {aiPlayer && (
                        <div className="bg-card p-6 rounded-[2rem] border-2 border-primary/20 shadow-2xl animate-in fade-in zoom-in duration-500">
                          <div className="flex items-center gap-3 mb-6 border-b pb-4">
                            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                              <Star className="w-5 h-5 text-yellow-500 fill-current" />
                            </div>
                            <p className="text-[10px] font-black uppercase text-primary tracking-widest">Estrella Designada: Scout Completo</p>
                          </div>
                          
                          <div className="flex items-center gap-5 mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-primary/20 shrink-0">#{aiPlayer.jerseyNumber}</div>
                            <div className="flex-1 overflow-hidden">
                              <p className="font-black uppercase text-xl truncate tracking-tight">{aiPlayer.name}</p>
                              <Badge variant="outline" className="text-[10px] font-black border-primary/30 mt-1 uppercase">{aiPlayer.position}</Badge>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest border-l-2 border-primary pl-2">Desglose de Atributos</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {aiPlayer.attributes.map((attr, aIdx) => (
                                <div key={`opp-full-att-${aIdx}`} className="bg-muted/40 p-2 rounded-xl border flex flex-col items-center justify-center gap-1 group hover:bg-primary/5 transition-colors">
                                  <span className="text-[8px] font-black uppercase text-muted-foreground text-center truncate w-full">{attr.name}</span>
                                  <span className="text-sm font-black text-primary">{attr.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* TU COMANDO TÁCTICO */}
                    <div className="flex flex-col gap-8 justify-center bg-muted/10 p-6 md:p-10 rounded-[3rem] border border-primary/10 shadow-inner">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] ml-2 block mb-2">1. Selecciona tu Agente Élite</Label>
                        <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                          <SelectTrigger className="h-16 md:h-20 rounded-[2rem] border-4 border-primary/20 bg-card text-lg md:text-xl font-black shadow-xl focus:ring-accent">
                            <SelectValue placeholder="Elegir representante..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-[2rem] shadow-2xl">
                            {userTeamPlayers.map(p => (
                              <SelectItem key={`arcade-p-v4-${p.id}`} value={p.id} className="h-14 font-bold uppercase text-xs">
                                #{p.jerseyNumber} {p.name} ({p.position}) - Val: {p.monetaryValue}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-8 pt-8 border-t-2 border-dashed border-primary/10">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] block text-center">2. Registrar Marcador Final</Label>
                        <div className="flex items-center gap-4 md:gap-12 justify-center">
                          <div className="space-y-3 text-center group">
                            <p className="text-[10px] font-black uppercase text-primary tracking-widest">{isHome ? "TU EQUIPO" : opponentTeam?.abbreviation}</p>
                            <Input 
                              type="number" 
                              value={arcadeHomeScore} 
                              onChange={e => setArcadeHomeScore(parseInt(e.target.value) || 0)} 
                              className="h-20 md:h-32 w-24 md:w-32 text-4xl md:text-6xl font-black text-center rounded-[2rem] md:rounded-[2.5rem] border-4 focus-visible:ring-primary shadow-2xl group-hover:scale-105 transition-transform" 
                            />
                          </div>
                          <span className="text-4xl md:text-6xl font-black opacity-10 mt-8">VS</span>
                          <div className="space-y-3 text-center group">
                            <p className="text-[10px] font-black uppercase text-primary tracking-widest">{isHome ? opponentTeam?.abbreviation : "TU EQUIPO"}</p>
                            <Input 
                              type="number" 
                              value={arcadeAwayScore} 
                              onChange={e => setArcadeAwayScore(parseInt(e.target.value) || 0)} 
                              className="h-20 md:h-32 w-24 md:w-32 text-4xl md:text-6xl font-black text-center rounded-[2rem] md:rounded-[2.5rem] border-4 focus-visible:ring-primary shadow-2xl group-hover:scale-105 transition-transform" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 md:p-10 bg-muted/20 border-t flex flex-col md:flex-row gap-4 shrink-0">
                  <Button variant="ghost" onClick={() => setPendingMatch(null)} className="flex-1 h-16 font-black rounded-3xl uppercase tracking-[0.2em] text-[10px]">Abandonar Duelo</Button>
                  <Button 
                    disabled={!selectedPlayerId} 
                    onClick={executeArcadeDuel} 
                    className="flex-[2] h-16 md:h-20 font-black rounded-3xl shadow-2xl bg-primary text-white text-lg md:text-xl flex items-center justify-center gap-4 transition-all active:scale-95 hover:shadow-primary/40"
                  >
                    <CheckCircle2 className="w-7 h-7" /> GRABAR EN L'HORTA
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
