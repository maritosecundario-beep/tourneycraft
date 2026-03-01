"use client";

import { useTournamentStore } from '@/hooks/use-tournament-store';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Calendar, Users, Play, ShieldAlert, ShoppingBag, Layers, Target, ChevronRight, UserCircle2, Star, Sword } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMemo, useState, useEffect } from 'react';
import { Team, Player, Match } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function TournamentDetailPage() {
  const { id } = useParams();
  const { tournaments, teams, players, updateTournament, settings, applySanction, transferPlayer, resolveMatch, generateSchedule } = useTournamentStore();
  const { toast } = useToast();
  
  const tournament = tournaments.find(t => t.id === id);
  const [sanctionTargetId, setSanctionTargetId] = useState('');
  const [sanctionType, setSanctionType] = useState<'club' | 'player'>('club');
  const [sanctionValue, setSanctionValue] = useState(1000);
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');

  const participants = useMemo(() => {
    if (!tournament) return [];
    if (tournament.entryType === 'teams') {
      return teams.filter(t => tournament.participants.includes(t.id));
    } else {
      return players.filter(p => tournament.participants.includes(p.id));
    }
  }, [teams, players, tournament]);

  const currentMatchdayMatches = useMemo(() => {
    if (!tournament) return [];
    return tournament.matches.filter(m => m.matchday === tournament.currentMatchday);
  }, [tournament]);

  const arcadeMatch = useMemo(() => {
    if (!tournament || tournament.mode !== 'arcade' || !tournament.managedParticipantId) return null;
    return currentMatchdayMatches.find(m => m.homeId === tournament.managedParticipantId || m.awayId === tournament.managedParticipantId);
  }, [tournament, currentMatchdayMatches]);

  const calculateStandings = (list: (Team | Player)[], isDual: boolean = false) => {
    if (!tournament) return [];
    const matchesToUse = isDual ? tournament.dualLeagueMatches : tournament.matches;
    
    const stats = list.map(item => {
      let played = 0, won = 0, drawn = 0, lost = 0, gf = 0, ga = 0, pts = 0;
      
      matchesToUse.forEach(m => {
        if (!m.isSimulated || m.homeScore === undefined || m.awayScore === undefined) return;
        
        if (m.homeId === item.id) {
          played++;
          gf += m.homeScore;
          ga += m.awayScore;
          if (m.homeScore > m.awayScore) { won++; pts += 3; }
          else if (m.homeScore === m.awayScore) { drawn++; pts += 1; }
          else lost++;
        } else if (m.awayId === item.id) {
          played++;
          gf += m.awayScore;
          ga += m.homeScore;
          if (m.awayScore > m.homeScore) { won++; pts += 3; }
          else if (m.awayScore === m.homeScore) { drawn++; pts += 1; }
          else lost++;
        }
      });
      
      return { ...item, played, won, drawn, lost, gf, ga, gd: gf - ga, pts };
    });
    
    return stats.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  };

  const groupedStandings = useMemo(() => {
    if (!tournament) return [];
    if (tournament.leagueType === 'groups' && tournament.groups) {
      return tournament.groups.map(group => ({
        name: group.name,
        standings: calculateStandings(participants.filter(p => group.participantIds.includes(p.id)))
      }));
    }
    return [{ name: 'Clasificación General', standings: calculateStandings(participants) }];
  }, [tournament, participants]);

  const dualStandings = useMemo(() => {
    if (!tournament || !tournament.dualLeagueEnabled) return [];
    return [{ name: 'Liga Dual (Reservas)', standings: calculateStandings(participants, true) }];
  }, [tournament, participants]);

  if (!tournament) return <div className="p-20 text-center font-black">TOURNAMENT NOT FOUND</div>;

  const simulateMatchLogic = (m: Match, isDual: boolean = false) => {
    let hScore = 0, aScore = 0;
    const rule = tournament.scoringRuleType;
    const val = tournament.scoringValue || 3;

    // AI Player Selection
    const homePlayers = players.filter(p => p.teamId === m.homeId).sort((a, b) => b.monetaryValue - a.monetaryValue);
    const awayPlayers = players.filter(p => p.teamId === m.awayId).sort((a, b) => b.monetaryValue - a.monetaryValue);
    
    let hPlayerId = homePlayers[0]?.id;
    let aPlayerId = awayPlayers[0]?.id;

    if (!isDual) {
      // 70% chance best player plays in main league
      if (Math.random() > 0.7) hPlayerId = homePlayers[1]?.id || hPlayerId;
      if (Math.random() > 0.7) aPlayerId = awayPlayers[1]?.id || aPlayerId;
    } else {
      // If it's dual, they use the ones not used in main (simplified here)
      hPlayerId = homePlayers[1]?.id || hPlayerId;
      aPlayerId = awayPlayers[1]?.id || aPlayerId;
    }

    if (rule === 'bestOfN') {
      hScore = Math.floor(Math.random() * (val + 1));
      aScore = val - hScore;
    } else if (rule === 'firstToN') {
      hScore = Math.random() > 0.5 ? val : Math.floor(Math.random() * val);
      aScore = hScore === val ? Math.floor(Math.random() * val) : val;
    } else if (rule === 'nToNRange') {
      const min = tournament.nToNRangeMin || 80;
      const max = tournament.nToNRangeMax || 150;
      const targetSum = Math.floor(Math.random() * (max - min + 1)) + min;
      hScore = Math.floor(Math.random() * (targetSum + 1));
      aScore = targetSum - hScore;
    }

    return { hScore, aScore, hPlayerId, aPlayerId };
  };

  const handleSimulateMatchday = () => {
    if (tournament.mode === 'arcade' && arcadeMatch && !arcadeMatch.isSimulated) {
      setSelectedMatch(arcadeMatch);
      setIsPreviewOpen(true);
      return;
    }

    // Simulate others
    currentMatchdayMatches.forEach(m => {
      if (m.isSimulated) return;
      const { hScore, aScore, hPlayerId, aPlayerId } = simulateMatchLogic(m);
      resolveMatch(tournament.id, m.id, hScore, aScore, false, hPlayerId, aPlayerId);
      
      if (tournament.dualLeagueEnabled) {
        const dualMatch = tournament.dualLeagueMatches.find(dm => dm.matchday === m.matchday && dm.homeId === m.awayId && dm.awayId === m.homeId);
        if (dualMatch) {
          const { hScore: dh, aScore: da, hPlayerId: dhp, aPlayerId: dap } = simulateMatchLogic(dualMatch, true);
          resolveMatch(tournament.id, dualMatch.id, dh, da, true, dhp, dap);
        }
      }
    });

    const nextMatchday = tournament.currentMatchday + 1;
    updateTournament({ ...tournament, currentMatchday: nextMatchday });
    toast({ title: "Jornada Finalizada", description: `Se han procesado los resultados de la jornada ${tournament.currentMatchday}.` });
  };

  const handlePlayArcadeMatch = () => {
    if (!selectedMatch || !selectedPlayerId) return;

    const { hScore, aScore } = simulateMatchLogic(selectedMatch);
    
    // User influence: boost score based on chosen player
    const player = players.find(p => p.id === selectedPlayerId);
    const playerBonus = (player?.monetaryValue || 0) / 10000;
    
    let finalH = hScore;
    let finalA = aScore;

    if (selectedMatch.homeId === tournament.managedParticipantId) {
      finalH += Math.floor(playerBonus);
    } else {
      finalA += Math.floor(playerBonus);
    }

    resolveMatch(tournament.id, selectedMatch.id, finalH, finalA, false, selectedPlayerId);

    // Mirror Dual Match
    if (tournament.dualLeagueEnabled) {
      const dualMatch = tournament.dualLeagueMatches.find(dm => dm.matchday === selectedMatch.matchday && dm.homeId === selectedMatch.awayId && dm.awayId === selectedMatch.homeId);
      if (dualMatch) {
        const teamPlayers = players.filter(p => p.teamId === tournament.managedParticipantId).sort((a, b) => b.monetaryValue - a.monetaryValue);
        const nextBestPlayer = teamPlayers.find(p => p.id !== selectedPlayerId) || teamPlayers[0];
        const { hScore: dh, aScore: da } = simulateMatchLogic(dualMatch, true);
        resolveMatch(tournament.id, dualMatch.id, dh, da, true, nextBestPlayer?.id);
      }
    }

    // Resolve others in matchday
    currentMatchdayMatches.forEach(m => {
      if (m.isSimulated || m.id === selectedMatch.id) return;
      const { hScore: hs, aScore: as, hPlayerId, aPlayerId } = simulateMatchLogic(m);
      resolveMatch(tournament.id, m.id, hs, as, false, hPlayerId, aPlayerId);
      
      if (tournament.dualLeagueEnabled) {
        const dm = tournament.dualLeagueMatches.find(d => d.matchday === m.matchday && d.homeId === m.awayId && d.awayId === m.homeId);
        if (dm) {
          const { hScore: dh, aScore: da, hPlayerId: dhp, aPlayerId: dap } = simulateMatchLogic(dm, true);
          resolveMatch(tournament.id, dm.id, dh, da, true, dhp, dap);
        }
      }
    });

    updateTournament({ ...tournament, currentMatchday: tournament.currentMatchday + 1 });
    setIsPreviewOpen(false);
    toast({ title: "Victoria Heroica", description: "Tu partido ha finalizado. Clasificación actualizada." });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4 md:px-0">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/20">
            <Trophy className="text-white w-10 h-10" />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">{tournament.name}</h1>
            <p className="text-muted-foreground font-bold uppercase text-xs tracking-[0.3em] mt-1">
              {tournament.sport} • JORNADA {tournament.currentMatchday}
            </p>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          {tournament.matches.length === 0 ? (
            <Button onClick={() => generateSchedule(tournament.id)} size="lg" className="h-16 rounded-2xl px-10 font-black">
              GENERAR CALENDARIO
            </Button>
          ) : (
            <Button onClick={handleSimulateMatchday} size="lg" className="h-16 rounded-2xl px-10 font-black shadow-xl shadow-primary/20 flex-1 md:flex-none">
              <Play className="w-5 h-5 mr-3 fill-current" /> SIGUIENTE JORNADA
            </Button>
          )}
        </div>
      </header>

      <Tabs defaultValue="table" className="w-full">
        <TabsList className="bg-muted/30 p-1 h-14 rounded-2xl border mb-6 flex overflow-x-auto scrollbar-hide">
          <TabsTrigger value="table" className="rounded-xl font-black uppercase text-xs">Clasificación</TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-xl font-black uppercase text-xs">Calendario</TabsTrigger>
          {tournament.dualLeagueEnabled && (
            <TabsTrigger value="dual" className="rounded-xl font-black uppercase text-xs">Liga Dual</TabsTrigger>
          )}
          <TabsTrigger value="market" className="rounded-xl font-black uppercase text-xs">Mercado</TabsTrigger>
          <TabsTrigger value="discipline" className="rounded-xl font-black uppercase text-xs">Disciplina</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {groupedStandings.map((group, gIdx) => (
                <Card key={gIdx} className="border-none bg-card shadow-2xl rounded-[3rem] overflow-hidden">
                  <CardHeader className="bg-muted/10 border-b p-8">
                    <CardTitle className="text-xl font-black uppercase">{group.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-muted/5">
                        <TableRow className="hover:bg-transparent border-b">
                          <TableHead className="w-16 text-center font-black">#</TableHead>
                          <TableHead className="font-black uppercase">Participante</TableHead>
                          <TableHead className="text-center font-black">P</TableHead>
                          <TableHead className="text-center font-black text-primary">PTS</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.standings.map((item, idx) => (
                          <TableRow key={item.id} className={cn("h-16", tournament.managedParticipantId === item.id && "bg-primary/5")}>
                            <TableCell className="text-center font-black text-lg">{idx + 1}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-black text-[10px]">
                                  {'abbreviation' in item ? item.abbreviation : item.name.substring(0,2).toUpperCase()}
                                </div>
                                <span className={cn("font-bold", tournament.managedParticipantId === item.id && "text-primary")}>
                                  {item.name} {tournament.managedParticipantId === item.id && "(MANAGER)"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-bold">{item.played}</TableCell>
                            <TableCell className="text-center font-black text-xl text-primary">{item.pts}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-6">
              <Card className="border-none bg-card shadow-2xl rounded-[3rem] p-8">
                <CardTitle className="text-lg font-black uppercase mb-6 flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Reglas del Universo</CardTitle>
                <div className="space-y-4 text-sm font-bold">
                  <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground uppercase text-[10px]">Lógica</span><span>{tournament.scoringRuleType}</span></div>
                  {tournament.scoringRuleType === 'nToNRange' && (
                    <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground uppercase text-[10px]">Suma Total</span><span className="text-accent">{tournament.nToNRangeMin} - {tournament.nToNRangeMax}</span></div>
                  )}
                  <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground uppercase text-[10px]">Victoria</span><span className="text-primary">+{tournament.winReward} {settings.currency}</span></div>
                </div>
              </Card>

              {arcadeMatch && (
                <Card className="border-none bg-primary text-primary-foreground shadow-2xl rounded-[3rem] p-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <Sword className="w-10 h-10 animate-pulse" />
                    <h3 className="text-2xl font-black uppercase">Próximo Duelo</h3>
                    <div className="flex items-center gap-4 py-4">
                      <div className="font-black text-2xl">
                        {teams.find(t => t.id === arcadeMatch.homeId)?.abbreviation}
                      </div>
                      <span className="text-primary-foreground/50 font-black">VS</span>
                      <div className="font-black text-2xl">
                        {teams.find(t => t.id === arcadeMatch.awayId)?.abbreviation}
                      </div>
                    </div>
                    <Button onClick={handleSimulateMatchday} variant="secondary" className="w-full h-12 rounded-xl font-black text-primary">
                      PREPARAR PARTIDO
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-8">
          <Card className="border-none bg-card shadow-2xl rounded-[3rem] overflow-hidden">
            <CardHeader className="bg-muted/10 border-b p-8">
              <CardTitle className="text-xl font-black uppercase">Calendario de Temporada</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="divide-y">
                  {Array.from({ length: Math.max(...tournament.matches.map(m => m.matchday), 0) }).map((_, i) => {
                    const matchday = i + 1;
                    const matches = tournament.matches.filter(m => m.matchday === matchday);
                    return (
                      <div key={matchday} className="p-8">
                        <h3 className="text-sm font-black uppercase text-accent mb-6 flex items-center gap-2">
                          <Calendar className="w-4 h-4" /> JORNADA {matchday}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {matches.map(m => (
                            <div key={m.id} className={cn(
                              "flex items-center justify-between p-4 rounded-2xl border",
                              m.isSimulated ? "bg-muted/10 opacity-70" : "bg-card shadow-sm"
                            )}>
                              <div className="flex-1 text-right font-black uppercase text-xs">
                                {teams.find(t => t.id === m.homeId)?.name}
                              </div>
                              <div className="mx-6 flex items-center gap-2">
                                <div className="w-8 h-8 flex items-center justify-center bg-muted rounded-lg font-black">
                                  {m.homeScore ?? '-'}
                                </div>
                                <span className="font-black opacity-20">:</span>
                                <div className="w-8 h-8 flex items-center justify-center bg-muted rounded-lg font-black">
                                  {m.awayScore ?? '-'}
                                </div>
                              </div>
                              <div className="flex-1 text-left font-black uppercase text-xs">
                                {teams.find(t => t.id === m.awayId)?.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {tournament.dualLeagueEnabled && (
          <TabsContent value="dual" className="space-y-8">
            {dualStandings.map((group, gIdx) => (
              <Card key={gIdx} className="border-none bg-card shadow-2xl rounded-[3rem] overflow-hidden">
                <CardHeader className="bg-accent/10 border-b p-8">
                  <div className="flex items-center gap-3">
                    <Layers className="text-accent" />
                    <CardTitle className="text-xl font-black uppercase">{group.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/5">
                      <TableRow className="hover:bg-transparent border-b">
                        <TableHead className="w-16 text-center font-black">#</TableHead>
                        <TableHead className="font-black uppercase">Equipo (Reservas)</TableHead>
                        <TableHead className="text-center font-black">P</TableHead>
                        <TableHead className="text-center font-black text-accent">PTS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.standings.map((item, idx) => (
                        <TableRow key={item.id} className="h-16">
                          <TableCell className="text-center font-black text-lg">{idx + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-black text-[10px]">
                                {'abbreviation' in item ? item.abbreviation : item.name.substring(0,2).toUpperCase()}
                              </div>
                              <span className="font-bold">{item.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-bold">{item.played}</TableCell>
                          <TableCell className="text-center font-black text-xl text-accent">{item.pts}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}

        <TabsContent value="market" className="space-y-8">
          <Card className="border-none bg-card shadow-2xl rounded-[3rem] p-8">
            <header className="mb-8"><h2 className="text-2xl font-black uppercase flex items-center gap-3"><ShoppingBag className="text-accent" /> Mercado de Fichajes</h2></header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-black text-xs uppercase text-muted-foreground tracking-widest border-b pb-2">Agentes Disponibles</h3>
                <div className="grid gap-3">
                  {players.filter(p => !p.teamId).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border">
                      <div>
                        <p className="font-black">{p.name}</p>
                        <p className="text-[10px] font-bold text-accent">{p.monetaryValue.toLocaleString()} {settings.currency}</p>
                      </div>
                      <Select onValueChange={(tId) => {
                        const team = teams.find(t => t.id === tId);
                        if (team && team.budget >= p.monetaryValue) {
                          transferPlayer(p.id, tId);
                          toast({ title: "Operación Confirmada", description: `${p.name} se une a ${team.name}` });
                        } else {
                          toast({ title: "Fondo Insuficiente", variant: "destructive" });
                        }
                      }}>
                        <SelectTrigger className="w-32 h-9 rounded-xl font-black text-[10px]"><SelectValue placeholder="FICHAR" /></SelectTrigger>
                        <SelectContent>
                          {teams.filter(t => tournament.participants.includes(t.id)).map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name} ({t.budget})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-black text-xs uppercase text-muted-foreground tracking-widest border-b pb-2">Economía de Clubs</h3>
                <div className="grid gap-3">
                  {teams.filter(t => tournament.participants.includes(t.id)).map(t => (
                    <div key={t.id} className="flex items-center justify-between p-4 bg-accent/5 rounded-2xl border border-accent/20">
                      <span className="font-black text-sm">{t.name}</span>
                      <span className="font-black text-accent">{t.budget.toLocaleString()} {settings.currency}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="discipline" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-none bg-card shadow-2xl rounded-[3rem] p-8">
              <header className="mb-6"><h2 className="text-xl font-black uppercase flex items-center gap-3 text-destructive"><ShieldAlert /> Aplicar Sanción</h2></header>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Tipo de Sanción</Label>
                  <Select value={sanctionType} onValueChange={(v: any) => setSanctionType(v)}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="club">Multa a Club (Dinero)</SelectItem>
                      <SelectItem value="player">Suspensión a Jugador (Jornadas)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{sanctionType === 'club' ? 'Club Objetivo' : 'Jugador Objetivo'}</Label>
                  <Select onValueChange={setSanctionTargetId}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {sanctionType === 'club' ? (
                        teams.filter(t => tournament.participants.includes(t.id)).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)
                      ) : (
                        players.filter(p => p.teamId && tournament.participants.includes(p.teamId)).map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({teams.find(t => t.id === p.teamId)?.abbreviation})</SelectItem>)
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{sanctionType === 'club' ? `Cantidad (${settings.currency})` : 'Jornadas de Suspensión'}</Label>
                  <Input type="number" value={sanctionValue} onChange={e => setSanctionValue(Number(e.target.value))} className="h-12 rounded-xl" />
                </div>
                <Button 
                  variant="destructive" 
                  className="w-full h-12 rounded-xl font-black" 
                  onClick={() => {
                    if(!sanctionTargetId) return;
                    applySanction(sanctionTargetId, sanctionType === 'club' ? 'team-budget' : 'player-suspension', sanctionValue);
                    toast({ 
                      title: sanctionType === 'club' ? "Multa Aplicada" : "Suspensión Confirmada", 
                      description: sanctionType === 'club' ? `Deducidos ${sanctionValue} créditos.` : `Sancionado por ${sanctionValue} jornadas.`
                    });
                  }}
                >
                  CONFIRMAR SANCIÓN
                </Button>
              </div>
            </Card>

            <Card className="border-none bg-card shadow-2xl rounded-[3rem] p-8">
              <header className="mb-6"><h2 className="text-xl font-black uppercase flex items-center gap-3"><ChevronRight className="text-yellow-500" /> Jugadores Suspendidos</h2></header>
              <div className="space-y-3">
                {players.filter(p => p.suspensionMatchdays > 0 && p.teamId && tournament.participants.includes(p.teamId)).map(p => (
                  <div key={p.id} className="p-4 bg-destructive/10 rounded-2xl border border-destructive/20 flex justify-between items-center">
                    <div>
                      <p className="font-black text-sm uppercase">{p.name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{teams.find(t => t.id === p.teamId)?.name}</p>
                    </div>
                    <Badge variant="destructive" className="font-black">{p.suspensionMatchdays} JORNADAS</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ARCADE MATCH PREVIEW DIALOG */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-card">
          {selectedMatch && (
            <div className="flex flex-col h-[85vh]">
              <div className="p-8 bg-primary text-primary-foreground flex flex-col items-center gap-6">
                <div className="flex items-center gap-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-24 h-24 bg-primary-foreground/10 rounded-3xl flex items-center justify-center border-2 border-dashed border-primary-foreground/30">
                      <span className="text-4xl font-black">{teams.find(t => t.id === selectedMatch.homeId)?.abbreviation}</span>
                    </div>
                    <span className="font-black text-sm uppercase tracking-tighter">{teams.find(t => t.id === selectedMatch.homeId)?.name}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-primary-foreground/50 font-black uppercase text-[10px] tracking-widest mb-2">Jornada {tournament.currentMatchday}</span>
                    <span className="text-5xl font-black">VS</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-24 h-24 bg-primary-foreground/10 rounded-3xl flex items-center justify-center border-2 border-dashed border-primary-foreground/30">
                      <span className="text-4xl font-black">{teams.find(t => t.id === selectedMatch.awayId)?.abbreviation}</span>
                    </div>
                    <span className="font-black text-sm uppercase tracking-tighter">{teams.find(t => t.id === selectedMatch.awayId)?.name}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-2 gap-12">
                  {/* Stats Comparison */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                      <Star className="w-3 h-3" /> Perfil del Rival
                    </h4>
                    {(() => {
                      const rivalId = selectedMatch.homeId === tournament.managedParticipantId ? selectedMatch.awayId : selectedMatch.homeId;
                      const rival = teams.find(t => t.id === rivalId);
                      return rival ? (
                        <div className="bg-muted/10 p-6 rounded-3xl border space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black uppercase">Rating Global</span>
                            <span className="text-xl font-black text-primary">{rival.rating}</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                              <span>CAPACIDAD SEDE</span>
                              <span>{rival.venueCapacity.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                              <span>SUPERFICIE</span>
                              <span className="uppercase">{rival.venueSurface}</span>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {/* Player Selection */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-accent tracking-widest flex items-center gap-2">
                      <UserCircle2 className="w-3 h-3" /> Selección de Protagonista
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Elige al jugador que liderará el equipo en este encuentro. Su valoración influirá directamente en las probabilidades de éxito.
                    </p>
                    <ScrollArea className="h-48 rounded-2xl border bg-muted/5 p-4">
                      <div className="grid gap-2">
                        {players.filter(p => p.teamId === tournament.managedParticipantId).map(p => (
                          <Button
                            key={p.id}
                            variant={selectedPlayerId === p.id ? "default" : "outline"}
                            className={cn(
                              "justify-between h-12 rounded-xl border-none font-bold",
                              selectedPlayerId === p.id ? "bg-accent text-white" : "bg-card"
                            )}
                            onClick={() => setSelectedPlayerId(p.id)}
                          >
                            <span className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[9px] font-black">{p.position}</Badge>
                              {p.name}
                            </span>
                            <span className="text-[10px] font-black">{p.monetaryValue.toLocaleString()} {settings.currency}</span>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-muted/20 border-t flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsPreviewOpen(false)} className="rounded-2xl h-14 px-8 font-black">CANCELAR</Button>
                <Button 
                  onClick={handlePlayArcadeMatch} 
                  disabled={!selectedPlayerId}
                  className="rounded-2xl h-14 px-12 font-black shadow-2xl shadow-primary/20 bg-primary hover:bg-primary/90"
                >
                  DISPUTAR PARTIDO
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
