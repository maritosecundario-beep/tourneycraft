
"use client";

import { useTournamentStore } from '@/hooks/use-tournament-store';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Calendar, Users, Play, ShieldAlert, ShoppingBag, Layers, Target, ChevronRight, UserCircle2, Star, Sword, Zap, Info, Coins, LayoutGrid } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CrestIcon } from '@/components/ui/crest-icon';

export default function TournamentDetailPage() {
  const { id } = useParams();
  const { tournaments, teams, players, updateTournament, settings, applySanction, transferPlayer, resolveMatch, generateSchedule } = useTournamentStore();
  const { toast } = useToast();
  
  const tournament = tournaments.find(t => t.id === id);
  const [sanctionTargetId, setSanctionTargetId] = useState('');
  const [sanctionType, setSanctionType] = useState<'club' | 'player'>('club');
  const [sanctionValue, setSanctionValue] = useState(1);
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [viewingTeamId, setViewTeamId] = useState<string | null>(null);

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
          gf += m.homeScore; ga += m.awayScore;
          if (m.homeScore > m.awayScore) { won++; pts += 10; }
          else lost++; 
        } else if (m.awayId === item.id) {
          played++;
          gf += m.awayScore; ga += m.homeScore;
          if (m.awayScore > m.homeScore) { won++; pts += 10; }
          else lost++;
        }
      });

      // Special rule: -15 for each loss
      pts -= lost * 15;
      
      return { ...item, played, won, lost, gf, ga, gd: gf - ga, pts };
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

  const viewingTeam = useMemo(() => {
    if (!viewingTeamId) return null;
    const team = teams.find(t => t.id === viewingTeamId);
    if (!team) return null;
    
    // Find standing stats
    let stats = null;
    for (const group of groupedStandings) {
      const s = group.standings.find(st => st.id === viewingTeamId);
      if (s) { stats = s; break; }
    }
    
    const teamPlayers = players.filter(p => p.teamId === viewingTeamId);
    return { ...team, stats, teamPlayers };
  }, [viewingTeamId, teams, players, groupedStandings]);

  if (!tournament) return <div className="p-20 text-center font-black">TOURNAMENT NOT FOUND</div>;

  const simulateMatchLogic = (m: Match, isDual: boolean = false) => {
    let hScore = 0, aScore = 0;
    const rule = tournament.scoringRuleType;
    const val = tournament.scoringValue || 9;

    if (rule === 'bestOfN') {
      hScore = Math.floor(Math.random() * (val + 1));
      aScore = val - hScore;
    } else {
      hScore = Math.floor(Math.random() * 5);
      aScore = Math.floor(Math.random() * 5);
    }

    const homePlayers = players.filter(p => p.teamId === m.homeId).sort((a, b) => b.monetaryValue - a.monetaryValue);
    const awayPlayers = players.filter(p => p.teamId === m.awayId).sort((a, b) => b.monetaryValue - a.monetaryValue);
    
    return { hScore, aScore, hPlayerId: homePlayers[0]?.id, aPlayerId: awayPlayers[0]?.id };
  };

  const handleSimulateSingleMatch = (matchId: string, isDual: boolean = false) => {
    const m = (isDual ? tournament.dualLeagueMatches : tournament.matches).find(x => x.id === matchId);
    if (!m || m.isSimulated) return;
    const { hScore, aScore, hPlayerId, aPlayerId } = simulateMatchLogic(m, isDual);
    resolveMatch(tournament.id, m.id, hScore, aScore, isDual, hPlayerId, aPlayerId);
    toast({ title: "Encuentro Finalizado", description: `Resultado: ${hScore} - ${aScore}` });
  };

  const handleSimulateMatchday = () => {
    if (tournament.mode === 'arcade' && arcadeMatch && !arcadeMatch.isSimulated) {
      setSelectedMatch(arcadeMatch);
      setIsPreviewOpen(true);
      return;
    }

    currentMatchdayMatches.forEach(m => {
      if (m.isSimulated) return;
      const { hScore, aScore, hPlayerId, aPlayerId } = simulateMatchLogic(m);
      resolveMatch(tournament.id, m.id, hScore, aScore, false, hPlayerId, aPlayerId);
    });

    updateTournament({ ...tournament, currentMatchday: tournament.currentMatchday + 1 });
    toast({ title: "Jornada Finalizada" });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4 md:px-0">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center shadow-2xl">
            <Trophy className="text-white w-10 h-10" />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">{tournament.name}</h1>
            <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest mt-1">
              {tournament.sport} • JORNADA {tournament.currentMatchday}
            </p>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          {tournament.matches.length === 0 ? (
            <Button onClick={() => generateSchedule(tournament.id)} size="lg" className="h-16 rounded-2xl px-10 font-black">GENERAR CALENDARIO</Button>
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
          <TabsTrigger value="market" className="rounded-xl font-black uppercase text-xs">Mercado</TabsTrigger>
          <TabsTrigger value="discipline" className="rounded-xl font-black uppercase text-xs">Disciplina</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {groupedStandings.map((group, gIdx) => (
                <Card key={gIdx} className="border-none bg-card shadow-2xl rounded-[3rem] overflow-hidden">
                  <CardHeader className="bg-muted/10 border-b p-8"><CardTitle className="text-xl font-black uppercase">{group.name}</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-muted/5">
                        <TableRow className="hover:bg-transparent border-b">
                          <TableHead className="w-12 text-center font-black">#</TableHead>
                          <TableHead className="font-black uppercase">Participante</TableHead>
                          <TableHead className="text-center font-black">P</TableHead>
                          <TableHead className="text-center font-black">DIF</TableHead>
                          <TableHead className="text-center font-black">CR</TableHead>
                          <TableHead className="text-center font-black text-primary">PTS</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.standings.map((item, idx) => (
                          <TableRow key={item.id} className={cn("h-16 cursor-pointer hover:bg-primary/5 transition-colors", tournament.managedParticipantId === item.id && "bg-primary/5")} onClick={() => setViewTeamId(item.id)}>
                            <TableCell className="text-center font-black text-lg">{idx + 1}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-black text-[10px]">
                                  {'abbreviation' in item ? item.abbreviation : item.name.substring(0,2).toUpperCase()}
                                </div>
                                <span className={cn("font-bold truncate max-w-[120px]", tournament.managedParticipantId === item.id && "text-primary")}>{item.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-bold">{item.played}</TableCell>
                            <TableCell className={cn("text-center font-bold", item.gd >= 0 ? "text-green-500" : "text-destructive")}>{item.gd > 0 ? `+${item.gd}` : item.gd}</TableCell>
                            <TableCell className="text-center font-bold text-accent">{'budget' in item ? item.budget : '-'}</TableCell>
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
                <CardTitle className="text-lg font-black uppercase mb-6 flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Reglas de l'Horta</CardTitle>
                <div className="space-y-4 text-sm font-bold">
                  <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground uppercase text-[10px]">Lógica</span><span className="uppercase">{tournament.scoringRuleType} {tournament.scoringValue}</span></div>
                  <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground uppercase text-[10px]">Victoria</span><span className="text-green-500">+10 PTS</span></div>
                  <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground uppercase text-[10px]">Derrota</span><span className="text-destructive">-15 PTS</span></div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-8">
          <Card className="border-none bg-card shadow-2xl rounded-[3rem] overflow-hidden">
            <CardContent className="p-0">
              <ScrollArea className="h-[700px]">
                <div className="divide-y divide-muted/10">
                  {Array.from({ length: Math.max(...tournament.matches.map(m => m.matchday), 0) }).map((_, i) => {
                    const matchday = i + 1;
                    const matches = tournament.matches.filter(m => m.matchday === matchday);
                    return (
                      <div key={matchday} className="p-8">
                        <header className="flex justify-between items-center mb-8">
                          <h3 className="text-sm font-black uppercase text-accent flex items-center gap-2 tracking-widest"><Calendar className="w-4 h-4" /> JORNADA {matchday}</h3>
                          {matchday === tournament.currentMatchday && <Badge className="bg-accent font-black">ACTUAL</Badge>}
                        </header>
                        <div className="space-y-4 max-w-2xl mx-auto">
                          {matches.map(m => {
                            const homeTeam = teams.find(t => t.id === m.homeId);
                            const awayTeam = teams.find(t => t.id === m.awayId);
                            if (!homeTeam || !awayTeam) return null;
                            return (
                              <div key={m.id} className={cn("grid grid-cols-[1fr_auto_1fr_auto] items-center gap-6 p-6 rounded-3xl border transition-all", m.isSimulated ? "bg-muted/5 opacity-60" : "bg-card shadow-lg hover:border-primary/30")}>
                                <div className="flex flex-col items-center gap-2">
                                  <CrestIcon shape={homeTeam.emblemShape} pattern={homeTeam.emblemPattern} c1={homeTeam.crestPrimary} c2={homeTeam.crestSecondary} c3={homeTeam.crestTertiary || homeTeam.crestSecondary} size="w-12 h-12" />
                                  <span className="font-black text-lg">{homeTeam.abbreviation}</span>
                                </div>
                                <div className="flex items-center gap-3 px-6">
                                  <div className="w-12 h-12 flex items-center justify-center rounded-xl font-black text-xl border-2">{m.homeScore ?? '-'}</div>
                                  <span className="font-black opacity-30 text-2xl">:</span>
                                  <div className="w-12 h-12 flex items-center justify-center rounded-xl font-black text-xl border-2">{m.awayScore ?? '-'}</div>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                  <CrestIcon shape={awayTeam.emblemShape} pattern={awayTeam.emblemPattern} c1={awayTeam.crestPrimary} c2={awayTeam.crestSecondary} c3={awayTeam.crestTertiary || awayTeam.crestSecondary} size="w-12 h-12" />
                                  <span className="font-black text-lg">{awayTeam.abbreviation}</span>
                                </div>
                                <div className="pl-4 border-l border-muted/20">
                                  {!m.isSimulated && <Button size="icon" variant="ghost" className="text-primary" onClick={() => handleSimulateSingleMatch(m.id)}><Zap className="w-5 h-5 fill-current" /></Button>}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market" className="space-y-8">
          <Card className="border-none bg-card shadow-2xl rounded-[3rem] p-8">
            <header className="mb-8"><h2 className="text-2xl font-black uppercase flex items-center gap-3"><ShoppingBag className="text-accent" /> Mercado de Fichajes</h2></header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-black text-xs uppercase text-muted-foreground tracking-widest border-b pb-2">Agentes Libres</h3>
                <div className="grid gap-3">
                  {players.filter(p => !p.teamId).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border">
                      <div><p className="font-black">{p.name}</p><p className="text-[10px] font-bold text-accent">{p.monetaryValue.toLocaleString()} {settings.currency}</p></div>
                      <Select onValueChange={(tId) => {
                        const team = teams.find(t => t.id === tId);
                        if (team && team.budget >= p.monetaryValue) { transferPlayer(p.id, tId); toast({ title: "Fichaje Confirmado" }); }
                        else toast({ title: "Sin Fondos", variant: "destructive" });
                      }}>
                        <SelectTrigger className="w-32 h-9 rounded-xl font-black text-[10px]"><SelectValue placeholder="FICHAR" /></SelectTrigger>
                        <SelectContent>{teams.filter(t => tournament.participants.includes(t.id)).map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.budget})</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-black text-xs uppercase text-muted-foreground tracking-widest border-b pb-2">Economía Local</h3>
                <div className="grid gap-3">
                  {teams.filter(t => tournament.participants.includes(t.id)).map(t => (
                    <div key={t.id} className="flex items-center justify-between p-4 bg-accent/5 rounded-2xl border border-accent/20">
                      <div className="flex items-center gap-3"><CrestIcon shape={t.emblemShape} pattern={t.emblemPattern} c1={t.crestPrimary} c2={t.crestSecondary} c3={t.crestTertiary || t.crestSecondary} size="w-6 h-6" /><span className="font-black text-sm">{t.name}</span></div>
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
                <div className="space-y-2"><Label>Tipo de Sanción</Label><Select value={sanctionType} onValueChange={(v: any) => setSanctionType(v)}><SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="club">Multa Económica (Club)</SelectItem><SelectItem value="player">Suspensión por Jornadas (Jugador)</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Objetivo</Label><Select onValueChange={setSanctionTargetId}><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{sanctionType === 'club' ? teams.filter(t => tournament.participants.includes(t.id)).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>) : players.filter(p => p.teamId && tournament.participants.includes(p.teamId)).map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({teams.find(t => t.id === p.teamId)?.abbreviation})</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Valor ({sanctionType === 'club' ? settings.currency : 'Jornadas'})</Label><Input type="number" value={sanctionValue} onChange={e => setSanctionValue(Number(e.target.value))} className="h-12 rounded-xl" /></div>
                <Button variant="destructive" className="w-full h-12 rounded-xl font-black" onClick={() => { if(!sanctionTargetId) return; applySanction(sanctionTargetId, sanctionType === 'club' ? 'team-budget' : 'player-suspension', sanctionValue); toast({ title: "Sanción Aplicada" }); }}>CONFIRMAR SANCIÓN</Button>
              </div>
            </Card>
            <Card className="border-none bg-card shadow-2xl rounded-[3rem] p-8">
              <header className="mb-6"><h2 className="text-xl font-black uppercase flex items-center gap-3"><ChevronRight className="text-yellow-500" /> Jugadores Suspendidos</h2></header>
              <div className="space-y-3">{players.filter(p => p.suspensionMatchdays > 0 && p.teamId && tournament.participants.includes(p.teamId)).map(p => (<div key={p.id} className="p-4 bg-destructive/10 rounded-2xl border border-destructive/20 flex justify-between items-center"><div><p className="font-black text-sm uppercase">{p.name}</p><p className="text-[10px] font-bold text-muted-foreground uppercase">{teams.find(t => t.id === p.teamId)?.name}</p></div><Badge variant="destructive" className="font-black">{p.suspensionMatchdays} JORNADAS</Badge></div>))}</div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!viewingTeamId} onOpenChange={(o) => !o && setViewTeamId(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          {viewingTeam && (
            <div className="flex flex-col h-[85vh]">
              <div className="p-8 bg-muted/10 border-b flex items-center gap-6">
                <CrestIcon shape={viewingTeam.emblemShape} pattern={viewingTeam.emblemPattern} c1={viewingTeam.crestPrimary} c2={viewingTeam.crestSecondary} c3={viewingTeam.crestTertiary || viewingTeam.crestSecondary} size="w-20 h-20" />
                <div className="flex-1">
                  <DialogTitle className="text-3xl font-black uppercase tracking-tighter">{viewingTeam.name} ({viewingTeam.abbreviation})</DialogTitle>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-sm font-black text-accent"><Coins className="w-4 h-4" /> {viewingTeam.budget} {settings.currency}</span>
                    <span className="flex items-center gap-1 text-sm font-black text-primary"><Star className="w-4 h-4 fill-current" /> {viewingTeam.rating} RATING</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <section className="space-y-3"><h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2"><Info className="w-3 h-3" /> Historia del Club</h4><p className="text-sm leading-relaxed text-muted-foreground italic">"{viewingTeam.description || 'Sin descripción disponible.'}"</p></section>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/20 p-4 rounded-2xl text-center"><p className="text-[9px] font-black uppercase opacity-50">Victorias</p><p className="text-2xl font-black text-green-500">{viewingTeam.stats?.won || 0}</p></div>
                  <div className="bg-muted/20 p-4 rounded-2xl text-center"><p className="text-[9px] font-black uppercase opacity-50">Derrotas</p><p className="text-2xl font-black text-destructive">{viewingTeam.stats?.lost || 0}</p></div>
                  <div className="bg-muted/20 p-4 rounded-2xl text-center"><p className="text-[9px] font-black uppercase opacity-50">GF / GA</p><p className="text-lg font-black">{viewingTeam.stats?.gf || 0} / {viewingTeam.stats?.ga || 0}</p></div>
                  <div className="bg-muted/20 p-4 rounded-2xl text-center"><p className="text-[9px] font-black uppercase opacity-50">Diferencia</p><p className="text-2xl font-black text-primary">{viewingTeam.stats?.gd || 0}</p></div>
                </div>
                <section className="space-y-4"><h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2"><LayoutGrid className="w-3 h-3" /> Plantilla Actual</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{viewingTeam.teamPlayers.map(p => (<div key={p.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-xl border"><div><p className="font-bold text-sm">{p.name}</p><p className="text-[9px] font-black uppercase opacity-50">{p.position} • #{p.jerseyNumber}</p></div><Badge variant="outline" className="font-black text-[9px]">{p.monetaryValue} CR</Badge></div>))}</div></section>
              </div>
              <div className="p-6 border-t bg-muted/5 flex justify-end"><Button onClick={() => setViewTeamId(null)} className="rounded-xl font-black">CERRAR INFORME</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
