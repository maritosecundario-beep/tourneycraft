
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, RefreshCw, ArrowLeft, Star, Coins, Settings2, Trash2, ChevronRight, UserCircle2, Users, AlertTriangle, Plus, X, Sword, Target, CheckCircle2, LayoutGrid, Info, ShieldAlert, TrendingUp, History } from 'lucide-react';
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
import { Match, Tournament, ScoringRuleType, Player, TournamentGroup, Team } from '@/lib/types';
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

  // Match Details State
  const [selectedMatchDetail, setSelectedMatchDetail] = useState<Match | null>(null);
  
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

  const generateCalculatedScore = (t: Tournament, hTeam?: Team, aTeam?: Team) => {
    let hScore = 0;
    let aScore = 0;
    const val = t.scoringValue || 9;

    // Lógica de rating con ventaja de local y factor caos
    const hRating = (hTeam?.rating || 50) + 5; // +5 Local advantage
    const aRating = aTeam?.rating || 50;
    const totalRating = hRating + aRating;
    const chaosFactor = (t.variability || 15) / 100;
    
    // Probabilidad base de ganar
    const homeWinProb = (hRating / totalRating) + (Math.random() * chaosFactor - (chaosFactor / 2));

    if (t.scoringRuleType === 'bestOfN') {
      const homeSets = Math.random() < homeWinProb ? Math.ceil(val / 2) + Math.floor(Math.random() * (val / 2)) : Math.floor(Math.random() * (val / 2));
      hScore = Math.min(val, homeSets);
      aScore = val - hScore;
    } else if (t.scoringRuleType === 'firstToN') {
      const winnerIdx = Math.random() < homeWinProb ? 0 : 1;
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
      hScore = Math.round(total * homeWinProb);
      aScore = total - hScore;
    }
    
    return { hScore, aScore };
  };

  const getStandings = (matchList: Match[], participants: string[]) => {
    const stats: Record<string, any> = {};
    participants.forEach((pId) => {
      stats[pId] = { id: pId, played: 0, win: 0, draw: 0, loss: 0, points: 0, gf: 0, ga: 0, diff: 0, budget: teams.find(t => t.id === pId)?.budget || 0 };
    });

    matchList.filter(m => m.isSimulated).forEach(m => {
      if (stats[m.homeId] && stats[m.awayId]) {
        stats[m.homeId].played++;
        stats[m.awayId].played++;
        stats[m.homeId].gf += (m.homeScore || 0);
        stats[m.homeId].ga += (m.awayScore || 0);
        stats[m.awayId].gf += (m.awayScore || 0);
        stats[m.awayId].ga += (m.homeScore || 0);

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

    return Object.values(stats).map((s: any) => ({ ...s, diff: s.gf - s.ga })).sort((a: any, b: any) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.diff - a.diff;
    });
  };

  const handleSimulateNormal = (match: Match, isDual: boolean) => {
    if (!tournament) return;
    const hTeam = teams.find(t => t.id === match.homeId);
    const aTeam = teams.find(t => t.id === match.awayId);
    const { hScore, aScore } = generateCalculatedScore(tournament, hTeam, aTeam);
    
    // Asignación de jugadores estrella (70% mejor jugador)
    const getBestPlayerId = (teamId: string) => {
      const teamPlayers = players.filter(p => p.teamId === teamId);
      if (teamPlayers.length === 0) return undefined;
      const sorted = [...teamPlayers].sort((a, b) => b.monetaryValue - a.monetaryValue);
      return Math.random() < 0.7 ? sorted[0].id : sorted[Math.floor(Math.random() * sorted.length)].id;
    };

    resolveMatch(tournament.id, match.id, hScore, aScore, isDual, getBestPlayerId(match.homeId), getBestPlayerId(match.awayId));
  };

  const handleSimulateArcade = (match: Match, isDual: boolean) => {
    const isUserHome = match.homeId === tournament?.managedParticipantId;
    const opponentTeamId = isUserHome ? match.awayId : match.homeId;
    const opponentPlayers = players.filter(p => p.teamId === opponentTeamId);
    
    let aiPlayer: Player | null = null;
    if (opponentPlayers.length > 0) {
      const sortedOpponents = [...opponentPlayers].sort((a, b) => b.monetaryValue - a.monetaryValue);
      aiPlayer = Math.random() < 0.7 ? sortedOpponents[0] : sortedOpponents[Math.floor(Math.random() * opponentPlayers.length)];
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
    const isUserHome = pendingMatch.match.homeId === tournament?.managedParticipantId;
    
    resolveMatch(tournament!.id, pendingMatch.match.id, arcadeHomeScore, arcadeAwayScore, pendingMatch.isDual, 
      isUserHome ? selectedPlayerId : pendingMatch.aiPlayer?.id,
      !isUserHome ? selectedPlayerId : pendingMatch.aiPlayer?.id
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
  }, [tournament, teams]);

  const unassignedTeams = useMemo(() => {
    if (!tournament || !tournament.groups) return [];
    const assignedIds = tournament.groups.flatMap(g => g.participantIds);
    return tournament.participants.filter(id => !assignedIds.includes(id));
  }, [tournament]);

  const renderStandingsTable = (rows: any[]) => {
    return (
      <Table>
        <TableHeader className="bg-muted/20">
          <TableRow>
            <TableHead className="font-black text-[10px] uppercase w-[40px]">POS</TableHead>
            <TableHead className="font-black text-[10px] uppercase">CLUB</TableHead>
            <TableHead className="text-center font-black text-[10px] uppercase">PJ</TableHead>
            <TableHead className="text-center font-black text-[10px] uppercase">V</TableHead>
            <TableHead className="text-center font-black text-[10px] uppercase">DG</TableHead>
            <TableHead className="text-center font-black text-[10px] uppercase">ECON</TableHead>
            <TableHead className="text-right font-black text-[10px] uppercase">PTS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row: any, idx: number) => {
            const team = teams.find(t => t.id === row.id);
            const isPlayoff = idx < (tournament?.playoffSpots || 0);
            const isRelegation = idx >= rows.length - (tournament?.relegationSpots || 0);
            
            return (
              <TableRow key={`standing-v5-${row.id || idx}`} className={cn(
                isPlayoff && "bg-emerald-500/5 hover:bg-emerald-500/10",
                isRelegation && "bg-destructive/5 hover:bg-destructive/10"
              )}>
                <TableCell className="font-black text-center">
                  <span className={cn(
                    "text-[10px] w-6 h-6 flex items-center justify-center rounded-full mx-auto",
                    isPlayoff ? "bg-emerald-500 text-white" : isRelegation ? "bg-destructive text-white" : "opacity-30"
                  )}>{idx + 1}</span>
                </TableCell>
                <TableCell className="font-black flex items-center gap-3">
                  <CrestIcon shape={team?.emblemShape || 'shield'} pattern={team?.emblemPattern || 'none'} c1={team?.crestPrimary || '#000'} c2={team?.crestSecondary || '#fff'} c3={team?.crestTertiary || '#000'} size="w-6 h-6" />
                  <span className={cn("truncate text-xs uppercase", team?.id === tournament?.managedParticipantId && "text-primary font-black")}>{team?.name}</span>
                </TableCell>
                <TableCell className="text-center text-xs">{row.played}</TableCell>
                <TableCell className="text-center text-xs">{row.win}</TableCell>
                <TableCell className="text-center text-xs font-bold text-muted-foreground">{row.diff > 0 ? `+${row.diff}` : row.diff}</TableCell>
                <TableCell className="text-center text-xs font-black text-accent">{row.budget.toLocaleString()}</TableCell>
                <TableCell className="text-right font-black text-primary text-sm">{row.points}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

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
      <div key={`matchday-block-v5-${day}-${tournament?.id}`} className="space-y-4">
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
              <Card 
                key={`match-row-v5-${m.id}`} 
                onClick={() => m.isSimulated && setSelectedMatchDetail(m)}
                className={cn(
                  "border-none shadow-md hover:shadow-lg transition-all rounded-2xl overflow-hidden group cursor-pointer",
                  m.isSimulated && "hover:border-primary/30 border-2 border-transparent"
                )}
              >
                <CardContent className="p-4 flex items-center justify-between gap-4 bg-card">
                  <div className="flex-1 flex items-center justify-end gap-2 text-right overflow-hidden">
                    <span className={cn("font-black text-[10px] md:text-xs truncate uppercase", m.homeId === tournament?.managedParticipantId && "text-primary")}>{home.name}</span>
                    <CrestIcon shape={home.emblemShape} pattern={home.emblemPattern} c1={home.crestPrimary} c2={home.crestSecondary} c3={home.crestTertiary || home.crestPrimary} size="w-8 h-8" />
                  </div>
                  <div className="w-20 text-center shrink-0">
                    {m.isSimulated ? (
                      <div className="text-lg font-black bg-muted/30 py-1 rounded-xl group-hover:bg-primary/10 transition-colors">{m.homeScore} - {m.awayScore}</div>
                    ) : (
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); tournament?.mode === 'arcade' && (m.homeId === tournament.managedParticipantId || m.awayId === tournament.managedParticipantId) ? handleSimulateArcade(m, false) : handleSimulateNormal(m, false); }} className="w-full h-10 rounded-xl font-black bg-primary">SIM</Button>
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
                      {tournament.groups.map((g, idx) => <TabsTrigger key={`cal-tab-${g.id}`} value={g.id} className="text-[10px] font-black uppercase flex-1">{g.name}</TabsTrigger>)}
                    </TabsList>
                    {tournament.groups.map((g) => (
                      <TabsContent key={`cal-content-${g.id}`} value={g.id} className="space-y-8">
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

                <div className="grid gap-6">
                  {tournament.groups?.map((g) => (
                    <div key={`group-man-${g.id}`} className="p-6 bg-muted/20 rounded-3xl border group relative">
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
                            <Badge key={`p-pill-${pId}`} className="bg-white border text-foreground py-1.5 px-3 rounded-xl gap-2 relative pr-8">
                              <CrestIcon shape={t?.emblemShape || 'shield'} pattern={t?.emblemPattern || 'none'} c1={t?.crestPrimary || '#000'} c2={t?.crestSecondary || '#fff'} c3={t?.crestTertiary || '#000'} size="w-4 h-4" />
                              <span className="text-[10px] font-bold uppercase">{t?.name}</span>
                              <X className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer hover:text-destructive" onClick={() => moveTeamToGroup(pId, null)} />
                            </Badge>
                          );
                        })}
                      </div>

                      <Select onValueChange={(val) => moveTeamToGroup(val, g.id)}>
                        <SelectTrigger className="h-9 rounded-xl border-dashed bg-card text-[10px] font-bold uppercase">
                          <SelectValue placeholder="Incorporar Club..." />
                        </SelectTrigger>
                        <SelectContent>
                          {unassignedTeams.map(id => (
                            <SelectItem key={`add-to-g-${id}`} value={id} className="text-xs font-bold uppercase">
                              {teams.find(t => t.id === id)?.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="standings" className="mt-6">
              <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                {tournament.groups && tournament.groups.length > 0 ? (
                  <div className="space-y-12 p-6">
                    {tournament.groups.map(group => {
                      const groupStandings = standings.filter(s => group.participantIds.includes(s.id));
                      return (
                        <div key={`stand-group-${group.id}`} className="space-y-4">
                          <div className="flex items-center gap-3 border-l-4 border-primary pl-4">
                            <h3 className="text-xl font-black uppercase tracking-tighter">{group.name}</h3>
                            <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black">{group.participantIds.length} CLUBES</Badge>
                          </div>
                          {renderStandingsTable(groupStandings)}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  renderStandingsTable(standings)
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-xl rounded-[2rem] bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden">
            <CardHeader className="p-6 pb-0">
              <CardTitle className="text-2xl font-black uppercase text-white">Leyes del Universo</CardTitle>
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
            <CardHeader><h3 className="font-black uppercase text-sm flex items-center gap-2"><TrendingUp className="text-emerald-500 w-4 h-4" /> Líderes de l'Horta</h3></CardHeader>
            <CardContent className="space-y-4">
              {standings.slice(0, 3).map((row: any, idx: number) => {
                const team = teams.find(t => t.id === row.id);
                return (
                  <div key={`podium-v5-${row.id}`} className="flex items-center gap-4 p-3 bg-muted/20 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center font-black text-xs">{idx + 1}</div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-black text-xs uppercase truncate">{team?.name}</p>
                      <p className="text-[9px] font-bold text-muted-foreground">{row.points} PTS • {row.budget.toLocaleString()} CR</p>
                    </div>
                    <CrestIcon shape={team?.emblemShape || 'shield'} pattern={team?.emblemPattern || 'none'} c1={team?.crestPrimary || '#000'} c2={team?.crestSecondary || '#fff'} c3={team?.crestTertiary || '#000'} size="w-8 h-8" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MATCH DETAIL DIALOG */}
      <Dialog open={!!selectedMatchDetail} onOpenChange={(o) => !o && setSelectedMatchDetail(null)}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          {selectedMatchDetail && (() => {
            const home = teams.find(t => t.id === selectedMatchDetail.homeId);
            const away = teams.find(t => t.id === selectedMatchDetail.awayId);
            const hPlayer = players.find(p => p.id === selectedMatchDetail.homePlayerId);
            const aPlayer = players.find(p => p.id === selectedMatchDetail.awayPlayerId);

            return (
              <div className="flex flex-col">
                <div className="bg-muted/10 p-8 border-b text-center space-y-6">
                  <DialogHeader>
                    <DialogTitle className="hidden">Detalles del Partido</DialogTitle>
                    <DialogDescription className="hidden">Resumen técnico de las estrellas que disputaron el encuentro.</DialogDescription>
                  </DialogHeader>
                  <div className="flex items-center justify-center gap-8">
                    <div className="flex flex-col items-center gap-2">
                      <CrestIcon shape={home?.emblemShape || 'shield'} pattern={home?.emblemPattern || 'none'} c1={home?.crestPrimary || '#000'} c2={home?.crestSecondary || '#fff'} c3={home?.crestTertiary || '#000'} size="w-16 h-16" />
                      <span className="font-black text-xs uppercase">{home?.name}</span>
                    </div>
                    <div className="text-5xl font-black">{selectedMatchDetail.homeScore} - {selectedMatchDetail.awayScore}</div>
                    <div className="flex flex-col items-center gap-2">
                      <CrestIcon shape={away?.emblemShape || 'shield'} pattern={away?.emblemPattern || 'none'} c1={away?.crestPrimary || '#000'} c2={away?.crestSecondary || '#fff'} c3={away?.crestTertiary || '#000'} size="w-16 h-16" />
                      <span className="font-black text-xs uppercase">{away?.name}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-black">JORNADA {selectedMatchDetail.matchday}</Badge>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-card">
                  {[hPlayer, aPlayer].map((p, pIdx) => (
                    <div key={`match-player-stat-${p?.id || pIdx}`} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary">#{p?.jerseyNumber}</div>
                        <div>
                          <p className="font-black uppercase text-sm">{p?.name || 'Agente Reservado'}</p>
                          <p className="text-[10px] font-bold text-accent uppercase">{p?.position}</p>
                        </div>
                      </div>
                      {p?.description && <p className="text-[10px] text-muted-foreground italic leading-relaxed">{p.description}</p>}
                      <div className="grid grid-cols-2 gap-2">
                        {p?.attributes.map((attr, aIdx) => (
                          <div key={`att-v5-${aIdx}`} className="bg-muted/30 p-2 rounded-lg border flex justify-between items-center">
                            <span className="text-[8px] font-black uppercase opacity-50">{attr.name}</span>
                            <span className="text-[10px] font-black">{attr.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-muted/10 border-t flex justify-center">
                  <Button variant="ghost" onClick={() => setSelectedMatchDetail(null)} className="rounded-xl font-black uppercase text-xs">Cerrar Informe</Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* TACTICS CENTER ARCADE */}
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
                        <div className="bg-card p-6 rounded-[2rem] border-2 border-primary/20 shadow-2xl">
                          <div className="flex items-center gap-3 mb-6 border-b pb-4">
                            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                              <Star className="w-5 h-5 text-yellow-500 fill-current" />
                            </div>
                            <p className="text-[10px] font-black uppercase text-primary tracking-widest">Estrella Designada</p>
                          </div>
                          
                          <div className="flex items-center gap-5 mb-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-3xl shrink-0">#{aiPlayer.jerseyNumber}</div>
                            <div className="flex-1 overflow-hidden">
                              <p className="font-black uppercase text-xl truncate">{aiPlayer.name}</p>
                              <Badge variant="outline" className="text-[10px] font-black border-primary/30 mt-1 uppercase">{aiPlayer.position}</Badge>
                            </div>
                          </div>

                          {aiPlayer.description && (
                            <p className="text-[10px] text-muted-foreground italic mb-6 bg-muted/20 p-3 rounded-xl">{aiPlayer.description}</p>
                          )}

                          <div className="space-y-4">
                            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest border-l-2 border-primary pl-2">Desglose de Atributos</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {aiPlayer.attributes.map((attr, aIdx) => (
                                <div key={`opp-att-${aIdx}`} className="bg-muted/40 p-2 rounded-xl border flex flex-col items-center justify-center gap-1 group hover:bg-primary/5 transition-colors">
                                  <span className="text-[8px] font-black uppercase text-muted-foreground text-center truncate w-full">{attr.name}</span>
                                  <span className="text-sm font-black text-primary">{attr.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-8 justify-center bg-muted/10 p-6 md:p-10 rounded-[3rem] border border-primary/10 shadow-inner">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] ml-2 block mb-2">1. Selecciona tu Agente Élite</Label>
                        <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                          <SelectTrigger className="h-16 md:h-20 rounded-[2rem] border-4 border-primary/20 bg-card text-lg md:text-xl font-black shadow-xl focus:ring-accent">
                            <SelectValue placeholder="Elegir representante..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-[2rem] shadow-2xl">
                            {userTeamPlayers.map(p => (
                              <SelectItem key={`arcade-sel-p-${p.id}`} value={p.id} className="h-14 font-bold uppercase text-xs">
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
                              className="h-20 md:h-32 w-24 md:w-32 text-4xl md:text-6xl font-black text-center rounded-[2rem] md:rounded-[2.5rem] border-4 focus-visible:ring-primary shadow-2xl" 
                            />
                          </div>
                          <span className="text-4xl md:text-6xl font-black opacity-10 mt-8">VS</span>
                          <div className="space-y-3 text-center group">
                            <p className="text-[10px] font-black uppercase text-primary tracking-widest">{isHome ? opponentTeam?.abbreviation : "TU EQUIPO"}</p>
                            <Input 
                              type="number" 
                              value={arcadeAwayScore} 
                              onChange={e => setArcadeAwayScore(parseInt(e.target.value) || 0)} 
                              className="h-20 md:h-32 w-24 md:w-32 text-4xl md:text-6xl font-black text-center rounded-[2rem] md:rounded-[2.5rem] border-4 focus-visible:ring-primary shadow-2xl" 
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
                    className="flex-[2] h-16 md:h-20 font-black rounded-3xl shadow-2xl bg-primary text-white text-lg md:text-xl flex items-center justify-center gap-4 transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-7 h-7" /> GRABAR EN L'HORTA
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* SETTINGS DIALOG */}
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
