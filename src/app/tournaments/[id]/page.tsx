
"use client";

import { useTournamentStore } from '@/hooks/use-tournament-store';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Calendar, Users, ArrowUpToLine, ArrowDownToLine, Play, CheckCircle2, RefreshCw, Coins, Target, AlertTriangle, ShieldAlert, ShoppingBag, Layers } from 'lucide-react';
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export default function TournamentDetailPage() {
  const { id } = useParams();
  const { tournaments, teams, players, updateTournament, settings, applySanction, transferPlayer } = useTournamentStore();
  const { toast } = useToast();
  
  const tournament = tournaments.find(t => t.id === id);
  const [sanctionTargetId, setSanctionTargetId] = useState('');
  const [sanctionType, setSanctionType] = useState<'club' | 'player'>('club');
  const [sanctionValue, setSanctionValue] = useState(1000);

  const participants = useMemo(() => {
    if (!tournament) return [];
    if (tournament.entryType === 'teams') {
      return teams.filter(t => tournament.participants.includes(t.id));
    } else {
      return players.filter(p => tournament.participants.includes(p.id));
    }
  }, [teams, players, tournament]);

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
    if (tournament.leagueType !== 'single-table' && tournament.groups) {
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

  const simulateMatch = (match: Match, isDual: boolean = false) => {
    let h = 0, a = 0;
    const rule = tournament.scoringRuleType;
    const val = tournament.scoringValue || 3;
    let incident = "";

    // Adjust team rating based on suspensions if it's the main league
    let homeSuspensionPenalty = 0;
    let awaySuspensionPenalty = 0;

    if (!isDual) {
      const homePlayers = players.filter(p => p.teamId === match.homeId);
      const awayPlayers = players.filter(p => p.teamId === match.awayId);
      homeSuspensionPenalty = homePlayers.filter(p => p.suspensionMatchdays > 0).length * 10;
      awaySuspensionPenalty = awayPlayers.filter(p => p.suspensionMatchdays > 0).length * 10;
    }

    if (rule === 'bestOfN') {
      const totalPoints = val;
      h = Math.floor(Math.random() * (totalPoints + 1));
      a = totalPoints - h;
    } else if (rule === 'firstToN') {
      h = Math.random() > 0.5 ? val : Math.floor(Math.random() * val);
      a = h === val ? Math.floor(Math.random() * val) : val;
    } else if (rule === 'nToNRange') {
      const min = tournament.nToNRangeMin || 80;
      const max = tournament.nToNRangeMax || 150;
      const targetSum = Math.floor(Math.random() * (max - min + 1)) + min;
      h = Math.floor(Math.random() * (targetSum + 1));
      a = targetSum - h;
    } else {
      h = Math.floor(Math.random() * 5);
      a = Math.floor(Math.random() * 5);
    }

    // Apply suspension penalties to scores
    if (homeSuspensionPenalty > 0) h = Math.max(0, h - Math.floor(h * (homeSuspensionPenalty / 100)));
    if (awaySuspensionPenalty > 0) a = Math.max(0, a - Math.floor(a * (awaySuspensionPenalty / 100)));

    if (!isDual && Math.random() < 0.05) {
      const side = Math.random() > 0.5 ? 'home' : 'away';
      const targetId = side === 'home' ? match.homeId : match.awayId;
      const amount = Math.floor(Math.random() * 5000) + 1000;
      applySanction(targetId, 'team-budget', amount);
      incident = `INCIDENTE: ${targetId} sancionado con ${amount} ${settings.currency}`;
    }

    return { ...match, homeScore: h, awayScore: a, isSimulated: true, incidentLog: incident };
  };

  const handleSimulateAll = () => {
    const updatedMatches = tournament.matches.map(m => m.isSimulated ? m : simulateMatch(m));
    const updatedDualMatches = tournament.dualLeagueEnabled 
      ? tournament.dualLeagueMatches.map(m => m.isSimulated ? m : simulateMatch(m, true))
      : [];
    
    updateTournament({ 
      ...tournament, 
      matches: updatedMatches,
      dualLeagueMatches: updatedDualMatches
    });
    toast({ title: "Temporada Procesada", description: "Todos los resultados y sanciones se han registrado." });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4 md:px-0">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/20">
            <Trophy className="text-white w-10 h-10" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black uppercase tracking-tighter">{tournament.name}</h1>
              <Badge variant="outline" className="rounded-full px-4 border-primary text-primary font-black uppercase text-[10px]">
                Season {tournament.currentSeason}
              </Badge>
            </div>
            <p className="text-muted-foreground font-bold uppercase text-xs tracking-[0.3em] mt-1">
              {tournament.sport} • {tournament.format} • {tournament.mode === 'arcade' ? 'ARCADE MODE' : 'SIMULATION'}
            </p>
          </div>
        </div>
        <Button onClick={handleSimulateAll} size="lg" className="h-16 rounded-2xl px-10 font-black shadow-xl shadow-primary/20 w-full md:w-auto">
          <Play className="w-5 h-5 mr-3 fill-current" /> SIMULAR TODO
        </Button>
      </header>

      <Tabs defaultValue="table" className="w-full">
        <TabsList className="bg-muted/30 p-1 h-14 rounded-2xl border mb-6 flex overflow-x-auto scrollbar-hide">
          <TabsTrigger value="table" className="rounded-xl font-black uppercase text-xs">Clasificación</TabsTrigger>
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
                        {group.standings.map((item, idx) => {
                          const isManaged = tournament.managedParticipantId === item.id;
                          return (
                            <TableRow key={item.id} className={cn("h-16", isManaged && "bg-primary/5")}>
                              <TableCell className="text-center font-black text-lg">{idx + 1}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-black text-[10px]">
                                    {'abbreviation' in item ? item.abbreviation : item.name.substring(0,2).toUpperCase()}
                                  </div>
                                  <span className={cn("font-bold", isManaged && "text-primary")}>{item.name} {isManaged && "(PLAYER)"}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-bold">{item.played}</TableCell>
                              <TableCell className="text-center font-black text-xl text-primary">{item.pts}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-none bg-card shadow-2xl rounded-[3rem] p-8 h-fit">
              <CardTitle className="text-lg font-black uppercase mb-6 flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Reglas del Universo</CardTitle>
              <div className="space-y-4 text-sm font-bold">
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground uppercase text-[10px]">Lógica</span><span>{tournament.scoringRuleType}</span></div>
                {tournament.scoringRuleType === 'nToNRange' && (
                  <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground uppercase text-[10px]">Suma Total</span><span className="text-accent">{tournament.nToNRangeMin} - {tournament.nToNRangeMax}</span></div>
                )}
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground uppercase text-[10px]">Victoria</span><span className="text-primary">+{tournament.winReward} {settings.currency}</span></div>
              </div>
            </Card>
          </div>
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
              <header className="mb-6"><h2 className="text-xl font-black uppercase flex items-center gap-3"><AlertTriangle className="text-yellow-500" /> Jugadores Suspendidos</h2></header>
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
                {players.filter(p => p.suspensionMatchdays > 0 && p.teamId && tournament.participants.includes(p.teamId)).length === 0 && (
                  <p className="text-center py-12 text-muted-foreground font-bold italic">Limpio de suspensiones.</p>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
