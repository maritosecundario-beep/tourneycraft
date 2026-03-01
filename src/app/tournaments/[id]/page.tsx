
"use client";

import { useTournamentStore } from '@/hooks/use-tournament-store';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Calendar, Users, ArrowUpToLine, ArrowDownToLine, Play, CheckCircle2, RefreshCw, Coins, Target, AlertTriangle, ShieldAlert, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { Team, Player, Match } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

export default function TournamentDetailPage() {
  const { id } = useParams();
  const { tournaments, teams, players, updateTournament, settings, applySanction, transferPlayer } = useTournamentStore();
  const { toast } = useToast();
  
  const tournament = tournaments.find(t => t.id === id);
  const [sanctionTargetId, setSanctionTargetId] = useState('');
  const [sanctionValue, setSanctionValue] = useState(1000);

  const participants = useMemo(() => {
    if (!tournament) return [];
    if (tournament.entryType === 'teams') {
      return teams.filter(t => tournament.participants.includes(t.id));
    } else {
      return players.filter(p => tournament.participants.includes(p.id));
    }
  }, [teams, players, tournament]);

  if (!tournament) return <div className="p-20 text-center font-black">TOURNAMENT NOT FOUND</div>;

  const calculateStandings = (list: (Team | Player)[]) => {
    const stats = list.map(item => {
      let played = 0, won = 0, drawn = 0, lost = 0, gf = 0, ga = 0, pts = 0;
      
      tournament.matches.forEach(m => {
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
    if (tournament.leagueType !== 'single-table' && tournament.groups) {
      return tournament.groups.map(group => ({
        name: group.name,
        standings: calculateStandings(participants.filter(p => group.participantIds.includes(p.id)))
      }));
    }
    return [{ name: 'Clasificación General', standings: calculateStandings(participants) }];
  }, [tournament, participants]);

  const simulateMatch = (match: Match) => {
    let h = 0, a = 0;
    const rule = tournament.scoringRuleType;
    const val = tournament.scoringValue || 3;
    let incident = "";

    if (rule === 'bestOfN') {
      // Suma total es N. El ganador tiene la mayoría.
      h = Math.floor(Math.random() * (val + 1));
      a = val - h;
    } else if (rule === 'firstToN') {
      h = Math.random() > 0.5 ? val : Math.floor(Math.random() * val);
      a = h === val ? Math.floor(Math.random() * val) : val;
    } else if (rule === 'nToNRange') {
      const min = tournament.nToNRangeMin || 0;
      const max = tournament.nToNRangeMax || 100;
      const total = Math.floor(Math.random() * (max - min + 1)) + min;
      h = Math.floor(Math.random() * (total + 1));
      a = total - h;
    } else {
      h = Math.floor(Math.random() * 5);
      a = Math.floor(Math.random() * 5);
    }

    // Probabilidad pequeña de sanción automática (5%)
    if (Math.random() < 0.05) {
      const side = Math.random() > 0.5 ? 'home' : 'away';
      const id = side === 'home' ? match.homeId : match.awayId;
      const amount = Math.floor(Math.random() * 5000) + 1000;
      applySanction(id, 'team-budget', amount);
      incident = `INCIDENTE: ${id} multado con ${amount} ${settings.currency}`;
    }

    return { ...match, homeScore: h, awayScore: a, isSimulated: true, incidentLog: incident };
  };

  const handleSimulateAll = () => {
    const updatedMatches = tournament.matches.map(m => m.isSimulated ? m : simulateMatch(m));
    updateTournament({ ...tournament, matches: updatedMatches });
    toast({ title: "Temporada Procesada", description: "Todos los resultados y posibles sanciones han sido registrados." });
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
                S{tournament.currentSeason}
              </Badge>
            </div>
            <p className="text-muted-foreground font-bold uppercase text-xs tracking-[0.3em] mt-1">
              {tournament.sport} • {tournament.format} • {tournament.entryType}
            </p>
          </div>
        </div>
        <Button onClick={handleSimulateAll} size="lg" className="h-16 rounded-2xl px-10 font-black shadow-xl shadow-primary/20 w-full md:w-auto">
          <Play className="w-5 h-5 mr-3 fill-current" /> SIMULAR TEMPORADA
        </Button>
      </header>

      <Tabs defaultValue="table" className="w-full">
        <TabsList className="bg-muted/30 p-1 h-14 rounded-2xl border mb-6">
          <TabsTrigger value="table" className="rounded-xl font-black uppercase text-xs">Clasificación</TabsTrigger>
          <TabsTrigger value="market" className="rounded-xl font-black uppercase text-xs">Mercado Transacciones</TabsTrigger>
          <TabsTrigger value="discipline" className="rounded-xl font-black uppercase text-xs">Justicia Deportiva</TabsTrigger>
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
                          <TableHead className="text-center font-black text-primary">PTS</TableHead>
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
                <CardTitle className="text-lg font-black uppercase mb-6 flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Reglas Vigentes</CardTitle>
                <div className="space-y-4 text-sm font-bold">
                  <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground uppercase text-[10px]">Lógica</span><span>{tournament.scoringRuleType}</span></div>
                  <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground uppercase text-[10px]">Victoria</span><span className="text-accent">+{tournament.winReward} {settings.currency}</span></div>
                  {tournament.scoringRuleType === 'bestOfN' && <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground uppercase text-[10px]">Suma Total Ptos</span><span>{tournament.scoringValue}</span></div>}
                  {tournament.scoringRuleType === 'nToNRange' && <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground uppercase text-[10px]">Rango Suma</span><span>{tournament.nToNRangeMin}-{tournament.nToNRangeMax}</span></div>}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="market" className="space-y-8">
          <Card className="border-none bg-card shadow-2xl rounded-[3rem] p-8">
            <header className="mb-8"><h2 className="text-2xl font-black uppercase flex items-center gap-3"><ShoppingBag className="text-accent" /> Operaciones de Mercado</h2></header>
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
                          toast({ title: "Fichaje Cerrado", description: `${p.name} ahora juega en ${team.name}` });
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
                <h3 className="font-black text-xs uppercase text-muted-foreground tracking-widest border-b pb-2">Finanzas de Clubs</h3>
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
              <header className="mb-6"><h2 className="text-xl font-black uppercase flex items-center gap-3 text-destructive"><ShieldAlert /> Aplicar Sanción Manual</h2></header>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Seleccionar Objetivo</Label>
                  <Select onValueChange={setSanctionTargetId}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Elegir club o jugador..." /></SelectTrigger>
                    <SelectContent>
                      <Badge className="m-2">CLUBS</Badge>
                      {teams.filter(t => tournament.participants.includes(t.id)).map(t => <SelectItem key={t.id} value={t.id}>[Club] {t.name}</SelectItem>)}
                      <Badge className="m-2">JUGADORES</Badge>
                      {players.filter(p => p.teamId && tournament.participants.includes(p.teamId)).map(p => <SelectItem key={p.id} value={p.id}>[Jugador] {p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor de Sanción (Créditos / Jornadas)</Label>
                  <Input type="number" value={sanctionValue} onChange={e => setSanctionValue(Number(e.target.value))} className="h-12 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="destructive" className="h-12 rounded-xl font-black" onClick={() => {
                    if(!sanctionTargetId) return;
                    applySanction(sanctionTargetId, 'team-budget', sanctionValue);
                    toast({ title: "Multa Aplicada", description: `Se han retirado ${sanctionValue} créditos.` });
                  }}>MULTA ECON.</Button>
                  <Button variant="outline" className="h-12 rounded-xl font-black border-destructive text-destructive" onClick={() => {
                    if(!sanctionTargetId) return;
                    applySanction(sanctionTargetId, 'player-suspension', sanctionValue);
                    toast({ title: "Suspensión Confirmada", description: `El jugador se perderá ${sanctionValue} jornadas.` });
                  }}>SUSPENDER</Button>
                </div>
              </div>
            </Card>

            <Card className="border-none bg-card shadow-2xl rounded-[3rem] p-8">
              <header className="mb-6"><h2 className="text-xl font-black uppercase flex items-center gap-3"><AlertTriangle className="text-yellow-500" /> Registro de Incidentes</h2></header>
              <div className="space-y-3">
                {tournament.matches.filter(m => m.incidentLog).slice(0, 10).map(m => (
                  <div key={m.id} className="p-4 bg-destructive/10 rounded-2xl border border-destructive/20 text-[10px] font-black uppercase text-destructive flex items-center gap-2">
                    <ShieldAlert className="w-3 h-3" /> {m.incidentLog}
                  </div>
                ))}
                {tournament.matches.filter(m => m.incidentLog).length === 0 && (
                  <p className="text-center py-12 text-muted-foreground font-bold">Temporada limpia. No hay incidentes registrados.</p>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
