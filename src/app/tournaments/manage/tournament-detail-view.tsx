"use client";

import { useEffect, useState, useMemo } from 'react';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, RefreshCw, ArrowLeft, Star, Coins, Settings2, Trash2, UserCircle2, Users, Plus, X, ArrowLeftRight, Play, MapPin, ShieldAlert, History, UserCheck, TrendingUp, Info, Activity, Clock, Timer, CheckCircle2, ChevronRight } from 'lucide-react';
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
import { Match, Tournament, ScoringRuleType, Player, ChallengeSport } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TournamentDetailViewProps {
  id: string;
}

export function TournamentDetailView({ id }: TournamentDetailViewProps) {
  const { tournaments, teams, players, resolveMatch, simulateMatchday, generateSchedule, resetSchedule, resetMatchday, updateTournament, settings, transferPlayer, applySanction, processIncidentDecision } = useTournamentStore();
  const { toast } = useToast();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  
  // Menus State
  const [isTransferMenuOpen, setIsTransferCenterOpen] = useState(false);
  const [isSanctionMenuOpen, setIsSanctionMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Challenge Match State
  const [challengeMatch, setChallengeMatch] = useState<{ match: Match; sport: ChallengeSport } | null>(null);
  const [cHomeScore, setCHomeScore] = useState(0);
  const [cAwayScore, setCAwayScore] = useState(0);
  const [cWinner, setCWinner] = useState<'home' | 'away' | 'draw' | null>(null);
  const [cStatus, setCStatus] = useState<'waiting' | 'playing' | 'rest' | 'finished'>('waiting');
  const [cPeriod, setCPeriod] = useState(1);
  const [cTime, setCTime] = useState(0);

  // Simulation/Arcade State
  const [pendingMatch, setPendingMatch] = useState<{ match: Match; isDual: boolean; aiPlayer: Player | null } | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [arcadeHomeScore, setArcadeHomeScore] = useState<number>(0);
  const [arcadeAwayScore, setArcadeAwayScore] = useState<number>(0);
  const [selectedMatchDetail, setSelectedMatchDetail] = useState<Match | null>(null);
  
  // Edit State
  const [editName, setEditName] = useState('');
  const [editSport, setEditSport] = useState('');
  const [editScoringType, setEditScoringType] = useState<ScoringRuleType>('bestOfN');
  const [editScoringValue, setEditScoringValue] = useState(9);
  const [editPlayoffSpots, setEditPlayoffSpots] = useState(8);
  const [editRelegationSpots, setEditRelegationSpots] = useState(4);

  useEffect(() => {
    const found = tournaments.find(t => t.id === id);
    if (found) {
      setTournament(found);
      setEditName(found.name);
      setEditSport(found.sport);
      setEditScoringType(found.scoringRuleType);
      setEditScoringValue(found.scoringValue || 9);
      setEditPlayoffSpots(found.playoffSpots || 0);
      setEditRelegationSpots(found.relegationSpots || 0);
    }
  }, [tournaments, id]);

  // Challenge Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cStatus === 'playing' || cStatus === 'rest') {
      timer = setInterval(() => {
        setCTime(prev => {
          if (prev <= 1) {
            if (cStatus === 'playing') {
              if (cPeriod < (challengeMatch?.sport.numPeriods || 1)) {
                setCStatus('rest');
                return challengeMatch?.sport.restDuration || 0;
              } else {
                setCStatus('finished');
                return 0;
              }
            } else {
              setCStatus('playing');
              setCPeriod(p => p + 1);
              return challengeMatch?.sport.periodDuration || 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cStatus, cPeriod, challengeMatch]);

  const getStandings = (matchList: Match[], participants: string[]) => {
    const stats: Record<string, any> = {};
    participants.forEach((pId) => {
      const teamObj = teams.find(t => t.id === pId) || players.find(p => p.id === pId);
      stats[pId] = { id: pId, played: 0, win: 0, draw: 0, loss: 0, points: 0, gf: 0, ga: 0, diff: 0, budget: (teamObj as any)?.budget || 0 };
    });
    matchList.filter(m => m.isSimulated).forEach(m => {
      if (stats[m.homeId] && stats[m.awayId]) {
        stats[m.homeId].played++; stats[m.awayId].played++;
        stats[m.homeId].gf += (m.homeScore || 0); stats[m.homeId].ga += (m.awayScore || 0);
        stats[m.awayId].gf += (m.awayScore || 0); stats[m.awayId].ga += (m.homeScore || 0);
        if (m.homeScore! > m.awayScore!) { stats[m.homeId].win++; stats[m.homeId].points += (tournament?.winPoints || 0); stats[m.awayId].loss++; stats[m.awayId].points += (tournament?.lossPoints || 0); } 
        else if (m.awayScore! > m.homeScore!) { stats[m.awayId].win++; stats[m.awayId].points += (tournament?.winPoints || 0); stats[m.homeId].loss++; stats[m.homeId].points += (tournament?.lossPoints || 0); } 
        else { stats[m.homeId].draw++; stats[m.homeId].points += (tournament?.drawPoints || 0); stats[m.awayId].draw++; stats[m.awayId].points += (tournament?.drawPoints || 0); }
      }
    });
    return Object.values(stats).map((s: any) => ({ ...s, diff: s.gf - s.ga })).sort((a: any, b: any) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.diff - a.diff;
    });
  };

  const standings = useMemo(() => tournament ? getStandings(tournament.matches, tournament.participants) : [], [tournament, teams, players]);

  const handleStartChallenge = (m: Match) => {
    const sport = tournament?.challengeSports?.find(s => s.id === m.challengeSportId);
    if (!sport) return;
    setChallengeMatch({ match: m, sport });
    setCHomeScore(0); setCAwayScore(0); setCWinner(null); setCPeriod(1);
    setCStatus(sport.hasPeriods ? 'playing' : 'playing');
    setCTime(sport.periodDuration || 0);
  };

  const renderStandingsTable = (rows: any[]) => (
    <Table>
      <TableHeader className="bg-muted/20">
        <TableRow>
          <TableHead className="font-black text-[10px] uppercase w-[40px]">POS</TableHead>
          <TableHead className="font-black text-[10px] uppercase">PARTICIPANTE</TableHead>
          <TableHead className="text-center font-black text-[10px] uppercase">PJ</TableHead>
          <TableHead className="text-center font-black text-[10px] uppercase">DG</TableHead>
          {tournament?.mode !== 'challenge' && <TableHead className="text-center font-black text-[10px] uppercase">ECON</TableHead>}
          <TableHead className="text-right font-black text-[10px] uppercase">PTS</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row: any, idx: number) => {
          const team = teams.find(t => t.id === row.id);
          const agent = players.find(p => p.id === row.id);
          const isPlayoff = tournament?.mode !== 'challenge' && idx < (tournament?.playoffSpots || 0);
          const isRelegation = tournament?.mode !== 'challenge' && idx >= rows.length - (tournament?.relegationSpots || 0);
          return (
            <TableRow key={`st-row-${row.id}`} className={cn(isPlayoff && "bg-emerald-500/5", isRelegation && "bg-destructive/5")}>
              <TableCell className="font-black text-center"><span className={cn("text-[10px] w-6 h-6 flex items-center justify-center rounded-full mx-auto", isPlayoff ? "bg-emerald-500 text-white" : isRelegation ? "bg-destructive text-white" : "opacity-30")}>{idx + 1}</span></TableCell>
              <TableCell className="font-black flex items-center gap-3">
                {team ? (
                  <CrestIcon shape={team.emblemShape || 'shield'} pattern={team.emblemPattern || 'none'} c1={team.crestPrimary || '#000'} c2={team.crestSecondary || '#fff'} c3={team.crestTertiary || '#000'} size="w-6 h-6" />
                ) : (
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-[8px]">#{agent?.jerseyNumber}</div>
                )}
                <span className={cn("truncate text-xs uppercase", (team?.id === tournament?.managedParticipantId || agent?.id === tournament?.managedParticipantId) && "text-primary font-black")}>{team?.name || agent?.name}</span>
              </TableCell>
              <TableCell className="text-center text-xs">{row.played}</TableCell>
              <TableCell className="text-center text-xs font-bold text-muted-foreground">{row.diff > 0 ? `+${row.diff}` : row.diff}</TableCell>
              {tournament?.mode !== 'challenge' && <TableCell className="text-center text-xs font-black text-accent">{row.budget.toLocaleString()}</TableCell>}
              <TableCell className="text-right font-black text-primary text-sm">{row.points}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  const renderMatchdayList = (matchList: Match[]) => {
    const grouped: Record<number, Match[]> = {};
    matchList.forEach(m => { if (!grouped[m.matchday]) grouped[m.matchday] = []; grouped[m.matchday].push(m); });
    const entries = Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b));
    if (entries.length === 0) return <div className="text-center py-20 bg-muted/10 rounded-[2rem] border-2 border-dashed font-bold text-muted-foreground uppercase text-xs">Sin partidos programados.</div>;
    return (
      <div className="space-y-12">
        {entries.map(([day, dayMatches]) => (
          <div key={`mday-m-${day}`} className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="bg-primary text-white font-black uppercase">JORNADA {day}</Badge>
              {tournament?.mode !== 'challenge' && (
                <>
                  <Button size="sm" variant="outline" className="h-8 px-3 text-[10px] font-black uppercase rounded-lg border-primary/30 text-primary hover:bg-primary hover:text-white" onClick={() => simulateMatchday(tournament!.id, Number(day))}>
                    <Play className="w-3 h-3 mr-1 fill-current" /> SIMULAR JORNADA
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 px-3 text-[10px] font-black uppercase rounded-lg border-destructive/30 text-destructive hover:bg-destructive hover:text-white" onClick={() => resetMatchday(tournament!.id, Number(day))}>
                    <RefreshCw className="w-3 h-3 mr-1" /> REINICIAR RESULTADOS
                  </Button>
                </>
              )}
            </div>
            <div className="grid gap-3">
              {dayMatches.map((m) => {
                const home = teams.find(t => t.id === m.homeId) || players.find(p => p.id === m.homeId);
                const away = teams.find(t => t.id === m.awayId) || players.find(p => p.id === m.awayId);
                if (!home || !away) return null;
                const sport = tournament?.challengeSports?.find(s => s.id === m.challengeSportId);
                return (
                  <Card key={`m-card-${m.id}`} onClick={() => m.isSimulated && setSelectedMatchDetail(m)} className={cn("border-none shadow-md transition-all rounded-2xl overflow-hidden cursor-pointer", m.isSimulated && "hover:border-primary/30 border-2 border-transparent")}>
                    <CardContent className="p-4 flex items-center justify-between gap-4 bg-card">
                      <div className="flex-1 flex items-center justify-end gap-2 text-right overflow-hidden">
                        <span className={cn("font-black text-[10px] md:text-xs truncate uppercase", m.homeId === tournament?.managedParticipantId && "text-primary")}>{home.name}</span>
                        {'abbreviation' in home ? <CrestIcon shape={(home as any).emblemShape} pattern={(home as any).emblemPattern} c1={(home as any).crestPrimary} c2={(home as any).crestSecondary} c3={(home as any).crestTertiary || (home as any).crestPrimary} size="w-8 h-8" /> : <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center font-black text-[10px]">#{(home as any).jerseyNumber}</div>}
                      </div>
                      <div className="w-32 text-center shrink-0">
                        {m.isSimulated ? ( 
                          <div className="text-lg font-black bg-muted/30 py-1 rounded-xl">
                            {sport && !sport.isNumeric ? (m.homeScore! > m.awayScore! ? 'WIN' : m.homeScore! < m.awayScore! ? 'LOSS' : 'DRAW') : `${m.homeScore} - ${m.awayScore}`}
                          </div> 
                        ) : (
                          <Button size="sm" onClick={(e) => { e.stopPropagation(); tournament?.mode === 'challenge' ? handleStartChallenge(m) : resolveMatch(tournament!.id, m.id, 0, 0, false, undefined, undefined, true); }} className="w-full h-10 rounded-xl font-black bg-primary">
                            {tournament?.mode === 'challenge' ? 'DUELO' : 'SIM'}
                          </Button>
                        )}
                        {sport && <p className="text-[8px] font-black uppercase text-accent mt-1">{sport.name}</p>}
                      </div>
                      <div className="flex-1 flex items-center justify-start gap-2 text-left overflow-hidden">
                        {'abbreviation' in away ? <CrestIcon shape={(away as any).emblemShape} pattern={(away as any).emblemPattern} c1={(away as any).crestPrimary} c2={(away as any).crestSecondary} c3={(away as any).crestTertiary || (away as any).crestPrimary} size="w-8 h-8" /> : <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center font-black text-[10px]">#{(away as any).jerseyNumber}</div>}
                        <span className={cn("font-black text-[10px] md:text-xs truncate uppercase", m.awayId === tournament?.managedParticipantId && "text-primary")}>{away.name}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!tournament) return <div className="p-20 text-center animate-pulse font-black uppercase text-muted-foreground">Cargando Competición...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full"><Link href="/tournaments"><ArrowLeft /></Link></Button>
          <div><h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">{tournament.name}</h1><p className="text-muted-foreground uppercase font-black text-[10px] tracking-widest">{tournament.sport} • Season {tournament.currentSeason}</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {tournament.mode !== 'challenge' && (
            <>
              <Button variant="outline" onClick={() => setIsTransferCenterOpen(true)} className="rounded-xl font-black h-12 border-primary text-primary"><ArrowLeftRight className="w-4 h-4 mr-2" /> TRASPASOS</Button>
              <Button variant="outline" onClick={() => setIsSanctionMenuOpen(true)} className="rounded-xl font-black h-12 border-destructive text-destructive"><ShieldAlert className="w-4 h-4 mr-2" /> SANCIONES</Button>
            </>
          )}
          <Button variant="outline" onClick={() => setIsEditing(true)} className="rounded-xl font-black h-12 border-primary text-primary"><Settings2 className="w-4 h-4 mr-2" /> AJUSTES PRO</Button>
          <Button variant="outline" onClick={() => resetSchedule(tournament.id)} className="rounded-xl font-black h-12 border-destructive text-destructive"><Trash2 className="w-4 h-4 mr-2" /> REINICIAR TORNEO</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue="matches">
            <TabsList className="bg-muted/20 p-1 rounded-2xl h-14 w-full flex overflow-x-auto scrollbar-hide">
              <TabsTrigger value="matches" className="flex-1 rounded-xl font-black uppercase text-xs">Calendario</TabsTrigger>
              <TabsTrigger value="standings" className="flex-1 rounded-xl font-black uppercase text-xs">Ranking</TabsTrigger>
              {tournament.mode !== 'challenge' && <TabsTrigger value="news" className="flex-1 rounded-xl font-black uppercase text-xs">Noticias</TabsTrigger>}
            </TabsList>

            <TabsContent value="matches" className="mt-6 space-y-8">
              {tournament.matches.length === 0 ? <div className="text-center py-20 bg-muted/10 rounded-[2rem] border-2 border-dashed"><p className="font-bold text-muted-foreground uppercase text-xs">Sin partidos.</p><Button onClick={() => generateSchedule(tournament.id)} className="mt-4 font-black rounded-xl">GENERAR CALENDARIO</Button></div> : renderMatchdayList(tournament.matches)}
            </TabsContent>

            <TabsContent value="standings" className="mt-6"><Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">{tournament.groups ? ( <div className="space-y-12 p-6">{tournament.groups.map((group, idx) => ( <div key={`st-g-${group.id || idx}`} className="space-y-4"><div className="flex items-center gap-3 border-l-4 border-primary pl-4"><h3 className="text-xl font-black uppercase">{group.name}</h3><Badge className="bg-primary/10 text-primary border-none text-[9px] font-black">{group.participantIds.length} CLUBES</Badge></div>{renderStandingsTable(standings.filter(s => group.participantIds.includes(s.id)))}</div> ))}</div> ) : <div className="p-6">{renderStandingsTable(standings)}</div>}</Card></TabsContent>

            <TabsContent value="news" className="mt-6 space-y-4">
              {tournament.incidents?.length === 0 ? <div className="text-center py-20 bg-muted/10 rounded-[2rem] border-2 border-dashed font-bold text-muted-foreground uppercase text-xs">Sin noticias.</div> : (
                [...(tournament.incidents || [])].reverse().map((inc) => (
                  <Card key={`news-card-${inc.id}`} className="border-none shadow-sm rounded-2xl overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", inc.type === 'transfer' ? "bg-accent/10 text-accent" : inc.type === 'sanction' ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>{inc.type === 'transfer' ? <ArrowLeftRight className="w-5 h-5" /> : inc.type === 'sanction' ? <ShieldAlert className="w-5 h-5" /> : <Info className="w-5 h-5" />}</div>
                      <div className="flex-1"><p className="text-xs font-black uppercase opacity-50 mb-0.5">{inc.date}</p><p className="text-sm font-bold">{inc.message}</p>{inc.status === 'pending' && ( <div className="flex gap-2 mt-3"><Button size="sm" className="bg-accent text-white font-black text-[10px]" onClick={() => processIncidentDecision(tournament.id, inc.id, true)}>ACEPTAR FONDOS</Button><Button size="sm" variant="outline" className="text-[10px] font-black" onClick={() => processIncidentDecision(tournament.id, inc.id, false)}>RECHAZAR</Button></div> )}</div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-xl rounded-[2rem] bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden"><CardHeader className="p-6 pb-0"><CardTitle className="text-2xl font-black uppercase text-white">{tournament.mode === 'challenge' ? 'Challenge Rules' : "Leyes de l'Horta"}</CardTitle></CardHeader><CardContent className="p-6 space-y-4"><div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl"><span className="text-[10px] font-black uppercase">Puntuación V/E/D</span><span className="text-[10px] font-black uppercase">{tournament.winPoints}/{tournament.drawPoints}/{tournament.lossPoints}</span></div>{tournament.mode !== 'challenge' && <div className="grid grid-cols-2 gap-3"><div className="bg-black/10 p-3 rounded-xl text-center"><p className="text-[8px] opacity-70 uppercase font-black">PLAYOFFS</p><p className="text-lg font-black">{tournament.playoffSpots}</p></div><div className="bg-black/10 p-3 rounded-xl text-center"><p className="text-[8px] opacity-70 uppercase font-black">DESCENSO</p><p className="text-lg font-black">{tournament.relegationSpots}</p></div></div>}</CardContent></Card>
          <Card className="border-none shadow-xl rounded-[2rem]"><CardHeader><h3 className="font-black uppercase text-sm flex items-center gap-2"><TrendingUp className="text-emerald-500 w-4 h-4" /> Podium l'Horta</h3></CardHeader><CardContent className="space-y-4">{standings.slice(0, 3).map((row: any, idx: number) => { 
            const team = teams.find(t => t.id === row.id); 
            const agent = players.find(p => p.id === row.id);
            return ( <div key={`podium-${row.id || idx}`} className="flex items-center gap-4 p-3 bg-muted/20 rounded-xl"><div className="w-8 h-8 rounded-full bg-card flex items-center justify-center font-black text-xs">{idx + 1}</div><div className="flex-1 overflow-hidden"><p className="font-black text-xs uppercase truncate">{team?.name || agent?.name}</p><p className="text-[9px] font-bold text-muted-foreground">{row.points} PTS {tournament.mode !== 'challenge' ? `• ${row.budget.toLocaleString()} CR` : ''}</p></div>{team ? <CrestIcon shape={team.emblemShape || 'shield'} pattern={team.emblemPattern || 'none'} c1={team.crestPrimary || '#000'} c2={team.crestSecondary || '#fff'} c3={team.crestTertiary || '#000'} size="w-8 h-8" /> : <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-[10px] font-black">#{agent?.jerseyNumber}</div>}</div> ); 
          })}</CardContent></Card>
        </div>
      </div>

      {/* Challenge Match Interface */}
      <Dialog open={!!challengeMatch} onOpenChange={(o) => !o && setChallengeMatch(null)}>
        <DialogContent className="max-w-4xl rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-background">
          {challengeMatch && (() => {
            const hAgent = players.find(p => p.id === challengeMatch.match.homeId);
            const aAgent = players.find(p => p.id === challengeMatch.match.awayId);
            const sport = challengeMatch.sport;
            
            return (
              <div className="flex flex-col h-[90vh]">
                <div className="bg-accent p-6 text-white text-center border-b-4 border-black/10">
                  <h3 className="text-3xl font-black uppercase tracking-tighter flex items-center justify-center gap-3"><Activity /> {sport.name} CHALLENGE</h3>
                  <div className="flex justify-center gap-4 mt-2">
                    <Badge className="bg-white/20 text-white border-none font-black text-[10px] uppercase">Jornada {challengeMatch.match.matchday}</Badge>
                    {sport.hasPeriods && <Badge className="bg-white/20 text-white border-none font-black text-[10px] uppercase">{cStatus === 'rest' ? 'DESCANSO' : `PERIODO ${cPeriod}/${sport.numPeriods}`}</Badge>}
                  </div>
                </div>

                <div className="flex-1 flex flex-row items-stretch overflow-hidden">
                  {/* Left Player */}
                  <div 
                    className="flex-1 group cursor-pointer relative overflow-hidden transition-all hover:bg-primary/5 border-r border-dashed"
                    onClick={() => {
                      if (cStatus !== 'playing' && sport.hasPeriods) return;
                      if (sport.isNumeric) setCHomeScore(s => s + 1);
                      else { setCWinner('home'); setCStatus('finished'); }
                    }}
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center gap-6">
                      <div className="w-32 h-32 rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-5xl font-black group-hover:scale-110 transition-transform">#{hAgent?.jerseyNumber}</div>
                      <h4 className="text-2xl font-black uppercase leading-tight">{hAgent?.name}</h4>
                      <div className="text-7xl font-black text-primary">{sport.isNumeric ? cHomeScore : (cWinner === 'home' ? 'WIN' : '')}</div>
                    </div>
                    {sport.isNumeric && <div className="absolute top-4 right-4 bg-primary/20 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Plus className="text-primary" /></div>}
                  </div>

                  {/* Central Control */}
                  <div className="w-48 bg-muted/10 flex flex-col items-center justify-center gap-8 border-x border-dashed">
                    {sport.hasPeriods && (
                      <div className="text-center">
                        <div className={cn("text-5xl font-black font-mono tracking-tighter", cTime < 10 && "text-destructive animate-pulse")}>
                          {Math.floor(cTime / 60)}:{(cTime % 60).toString().padStart(2, '0')}
                        </div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground mt-1">Countdown</p>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-3 w-full px-4">
                      {cStatus === 'waiting' && <Button onClick={() => setCStatus('playing')} className="h-14 font-black uppercase rounded-2xl bg-primary shadow-xl">INICIAR</Button>}
                      {cStatus === 'finished' && (
                        <Button 
                          onClick={() => {
                            resolveMatch(tournament.id, challengeMatch.match.id, cHomeScore, cAwayScore, false, hAgent?.id, aAgent?.id);
                            setChallengeMatch(null);
                            toast({ title: "Resultado Grabado" });
                          }} 
                          className="h-14 font-black uppercase rounded-2xl bg-emerald-500 shadow-xl"
                        >GUARDAR ACTA</Button>
                      )}
                      {!sport.isNumeric && cStatus !== 'finished' && (
                        <Button variant="outline" onClick={() => { setCWinner('draw'); setCStatus('finished'); setCHomeScore(1); setCAwayScore(1); }} className="h-12 text-[10px] font-black rounded-xl border-dashed">DECLARAR EMPATE</Button>
                      )}
                    </div>
                  </div>

                  {/* Right Player */}
                  <div 
                    className="flex-1 group cursor-pointer relative overflow-hidden transition-all hover:bg-primary/5"
                    onClick={() => {
                      if (cStatus !== 'playing' && sport.hasPeriods) return;
                      if (sport.isNumeric) setCAwayScore(s => s + 1);
                      else { setCWinner('away'); setCStatus('finished'); }
                    }}
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center gap-6">
                      <div className="w-32 h-32 rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-5xl font-black group-hover:scale-110 transition-transform">#{aAgent?.jerseyNumber}</div>
                      <h4 className="text-2xl font-black uppercase leading-tight">{aAgent?.name}</h4>
                      <div className="text-7xl font-black text-primary">{sport.isNumeric ? cAwayScore : (cWinner === 'away' ? 'WIN' : '')}</div>
                    </div>
                    {sport.isNumeric && <div className="absolute top-4 left-4 bg-primary/20 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Plus className="text-primary" /></div>}
                  </div>
                </div>
                
                <div className="p-4 bg-muted/20 text-center text-[10px] font-black uppercase opacity-50 border-t">
                  Haz click en un jugador para sumar puntos o declararlo vencedor
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="rounded-[2.5rem] max-w-2xl max-h-[90vh] overflow-y-auto border-none shadow-2xl">
          <DialogHeader><DialogTitle className="text-2xl font-black uppercase">Ajustes del Universo</DialogTitle><DialogDescription>Modifica todas las leyes de tu competición en tiempo real.</DialogDescription></DialogHeader>
          <div className="space-y-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><Label>Nombre del Torneo</Label><Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-xl h-12" /></div><div className="space-y-2"><Label>Deporte</Label><Input value={editSport} onChange={e => setEditSport(e.target.value)} className="rounded-xl h-12" /></div></div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase border-b pb-2 text-primary tracking-widest">Reglas de Competición</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1"><Label className="text-center block text-[10px] uppercase font-bold">Victoria</Label><Input type="number" value={tournament.winPoints} onChange={e => updateTournament({...tournament, winPoints: Number(e.target.value)})} /></div>
                <div className="space-y-1"><Label className="text-center block text-[10px] uppercase font-bold">Empate</Label><Input type="number" value={tournament.drawPoints} onChange={e => updateTournament({...tournament, drawPoints: Number(e.target.value)})} /></div>
                <div className="space-y-1"><Label className="text-center block text-[10px] uppercase font-bold">Derrota</Label><Input type="number" value={tournament.lossPoints} onChange={e => updateTournament({...tournament, lossPoints: Number(e.target.value)})} /></div>
              </div>
            </div>
            {tournament.mode !== 'challenge' && (
              <div className="grid grid-cols-2 gap-6"><div className="space-y-2"><Label>Plazas Playoff (Verde)</Label><Input type="number" value={editPlayoffSpots} onChange={e => setEditPlayoffSpots(Number(e.target.value))} className="rounded-xl h-12" /></div><div className="space-y-2"><Label>Plazas Descenso (Rojo)</Label><Input type="number" value={editRelegationSpots} onChange={e => setEditRelegationSpots(Number(e.target.value))} className="rounded-xl h-12" /></div></div>
            )}
          </div>
          <DialogFooter className="gap-2"><Button variant="ghost" onClick={() => setIsEditing(false)} className="rounded-xl font-black">CANCELAR</Button><Button onClick={() => { if (!tournament) return; updateTournament({ ...tournament, name: editName, sport: editSport, scoringRuleType: editScoringType, scoringValue: editScoringValue, playoffSpots: editPlayoffSpots, relegationSpots: editRelegationSpots }); setIsEditing(false); toast({ title: "Ajustes Guardados" }); }} className="font-black rounded-xl px-8 bg-primary">GUARDAR LEYES</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}