
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, RefreshCw, ArrowLeft, Star, Coins, Settings2, Trash2, ChevronRight, UserCircle2, Users, AlertTriangle, Plus, X, Sword, Target, CheckCircle2, LayoutGrid, Info, ShieldAlert, TrendingUp, History, ArrowLeftRight, Play } from 'lucide-react';
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
import { Match, Tournament, ScoringRuleType, Player, Team } from '@/lib/types';
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
      setEditVariability(found.variability || 15);
    }
  }, [tournaments, id]);

  const generateCalculatedScore = (t: Tournament, hTeam?: Team, aTeam?: Team) => {
    let hScore = 0; let aScore = 0; const val = t.scoringValue || 9;
    const hRating = (hTeam?.rating || 50) + 5; 
    const aRating = aTeam?.rating || 50;
    const totalRating = hRating + aRating;
    const chaosFactor = (t.variability || 15) / 100;
    const homeWinProb = (hRating / totalRating) + (Math.random() * chaosFactor - (chaosFactor / 2));

    if (t.scoringRuleType === 'bestOfN') {
      hScore = Math.round(val * homeWinProb); aScore = val - hScore;
    } else if (t.scoringRuleType === 'firstToN') {
      const homeWins = Math.random() < homeWinProb;
      if (homeWins) { hScore = val; aScore = Math.floor(Math.random() * val); } 
      else { aScore = val; hScore = Math.floor(Math.random() * val); }
    } else if (t.scoringRuleType === 'nToNRange') {
      const min = t.nToNRangeMin || 0; const max = t.nToNRangeMax || 10;
      const total = Math.floor(Math.random() * (max - min + 1)) + min;
      hScore = Math.round(total * homeWinProb); aScore = total - hScore;
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

  const standings = useMemo(() => tournament ? getStandings(tournament.matches, tournament.participants) : [], [tournament, teams]);
  const dualStandings = useMemo(() => (tournament && tournament.dualLeagueEnabled) ? getStandings(tournament.dualLeagueMatches || [], tournament.participants) : [], [tournament, teams]);

  const renderStandingsTable = (rows: any[]) => (
    <Table>
      <TableHeader className="bg-muted/20">
        <TableRow>
          <TableHead className="font-black text-[10px] uppercase w-[40px]">POS</TableHead>
          <TableHead className="font-black text-[10px] uppercase">CLUB</TableHead>
          <TableHead className="text-center font-black text-[10px] uppercase">PJ</TableHead>
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
            <TableRow key={`st-row-${row.id}`} className={cn(isPlayoff && "bg-emerald-500/5", isRelegation && "bg-destructive/5")}>
              <TableCell className="font-black text-center"><span className={cn("text-[10px] w-6 h-6 flex items-center justify-center rounded-full mx-auto", isPlayoff ? "bg-emerald-500 text-white" : isRelegation ? "bg-destructive text-white" : "opacity-30")}>{idx + 1}</span></TableCell>
              <TableCell className="font-black flex items-center gap-3"><CrestIcon shape={team?.emblemShape || 'shield'} pattern={team?.emblemPattern || 'none'} c1={team?.crestPrimary || '#000'} c2={team?.crestSecondary || '#fff'} c3={team?.crestTertiary || '#000'} size="w-6 h-6" /><span className={cn("truncate text-xs uppercase", team?.id === tournament?.managedParticipantId && "text-primary font-black")}>{team?.name}</span></TableCell>
              <TableCell className="text-center text-xs">{row.played}</TableCell>
              <TableCell className="text-center text-xs font-bold text-muted-foreground">{row.diff > 0 ? `+${row.diff}` : row.diff}</TableCell>
              <TableCell className="text-center text-xs font-black text-accent">{row.budget.toLocaleString()}</TableCell>
              <TableCell className="text-right font-black text-primary text-sm">{row.points}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  const handleSimulateNormal = (match: Match, isDual: boolean) => {
    if (!tournament) return;
    const hTeam = teams.find(t => t.id === match.homeId);
    const aTeam = teams.find(t => t.id === match.awayId);
    const { hScore, aScore } = generateCalculatedScore(tournament, hTeam, aTeam);
    resolveMatch(tournament.id, match.id, hScore, aScore, isDual);
  };

  const handleSimulateArcade = (match: Match, isDual: boolean) => {
    const opponentTeamId = match.homeId === tournament?.managedParticipantId ? match.awayId : match.homeId;
    const opponentPlayers = players.filter(p => p.teamId === opponentTeamId && p.suspensionMatchdays === 0);
    let aiPlayer: Player | null = null;
    if (opponentPlayers.length > 0) {
      const sorted = [...opponentPlayers].sort((a, b) => b.monetaryValue - a.monetaryValue);
      aiPlayer = Math.random() < 0.7 ? sorted[0] : sorted[Math.floor(Math.random() * sorted.length)];
    }
    setPendingMatch({ match, isDual, aiPlayer });
    setArcadeHomeScore(0); setArcadeAwayScore(0); setSelectedPlayerId('');
  };

  const renderMatchdayList = (matchList: Match[], isDual: boolean = false) => {
    const grouped: Record<number, Match[]> = {};
    matchList.forEach(m => { if (!grouped[m.matchday]) grouped[m.matchday] = []; grouped[m.matchday].push(m); });
    const entries = Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b));
    if (entries.length === 0) return <div className="text-center py-20 bg-muted/10 rounded-[2rem] border-2 border-dashed font-bold text-muted-foreground uppercase text-xs">Sin partidos programados.</div>;
    return (
      <div className="space-y-12">
        {entries.map(([day, dayMatches]) => (
          <div key={`mday-${isDual ? 'd' : 'm'}-${day}`} className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="bg-primary text-white font-black uppercase">JORNADA {day}</Badge>
              <Button size="xs" variant="outline" className="h-6 px-3 text-[8px] font-black uppercase rounded-lg border-primary/30 text-primary hover:bg-primary hover:text-white" onClick={() => simulateMatchday(tournament!.id, Number(day))}>
                <Play className="w-2.5 h-2.5 mr-1 fill-current" /> SIMULAR JORNADA
              </Button>
              <Button size="xs" variant="outline" className="h-6 px-3 text-[8px] font-black uppercase rounded-lg border-destructive/30 text-destructive hover:bg-destructive hover:text-white" onClick={() => resetMatchday(tournament!.id, Number(day))}>
                <RefreshCw className="w-2.5 h-2.5 mr-1" /> REINICIAR RESULTADOS
              </Button>
            </div>
            <div className="grid gap-3">
              {dayMatches.map((m) => {
                const home = teams.find(t => t.id === m.homeId); const away = teams.find(t => t.id === m.awayId);
                if (!home || !away) return null;
                const isArcadeMatch = tournament?.mode === 'arcade' && (m.homeId === tournament.managedParticipantId || m.awayId === tournament.managedParticipantId);
                return (
                  <Card key={`m-card-${m.id}`} onClick={() => m.isSimulated && setSelectedMatchDetail(m)} className={cn("border-none shadow-md transition-all rounded-2xl overflow-hidden cursor-pointer", m.isSimulated && "hover:border-primary/30 border-2 border-transparent")}>
                    <CardContent className="p-4 flex items-center justify-between gap-4 bg-card">
                      <div className="flex-1 flex items-center justify-end gap-2 text-right overflow-hidden">
                        <span className={cn("font-black text-[10px] md:text-xs truncate uppercase", m.homeId === tournament?.managedParticipantId && "text-primary")}>{home.name}</span>
                        <CrestIcon shape={home.emblemShape} pattern={home.emblemPattern} c1={home.crestPrimary} c2={home.crestSecondary} c3={home.crestTertiary || home.crestPrimary} size="w-8 h-8" />
                      </div>
                      <div className="w-20 text-center shrink-0">
                        {m.isSimulated ? ( <div className="text-lg font-black bg-muted/30 py-1 rounded-xl">{m.homeScore} - {m.awayScore}</div> ) : (
                          <Button size="sm" onClick={(e) => { e.stopPropagation(); isArcadeMatch ? handleSimulateArcade(m, isDual) : handleSimulateNormal(m, isDual); }} className="w-full h-10 rounded-xl font-black bg-primary">
                            {isArcadeMatch ? 'TACT' : 'SIM'}
                          </Button>
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
          <Button variant="outline" onClick={() => setIsTransferCenterOpen(true)} className="rounded-xl font-black h-12 border-primary text-primary"><ArrowLeftRight className="w-4 h-4 mr-2" /> TRASPASOS</Button>
          <Button variant="outline" onClick={() => setIsSanctionMenuOpen(true)} className="rounded-xl font-black h-12 border-destructive text-destructive"><ShieldAlert className="w-4 h-4 mr-2" /> SANCIONES</Button>
          <Button variant="outline" onClick={() => setIsEditing(true)} className="rounded-xl font-black h-12 border-primary text-primary"><Settings2 className="w-4 h-4 mr-2" /> AJUSTES PRO</Button>
          <Button variant="outline" onClick={() => resetSchedule(tournament.id)} className="rounded-xl font-black h-12 border-destructive text-destructive"><Trash2 className="w-4 h-4 mr-2" /> REINICIAR TORNEO</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue="matches">
            <TabsList className="bg-muted/20 p-1 rounded-2xl h-14 w-full flex overflow-x-auto scrollbar-hide">
              <TabsTrigger value="matches" className="flex-1 rounded-xl font-black uppercase text-xs">Calendario</TabsTrigger>
              {tournament.dualLeagueEnabled && <TabsTrigger value="dual" className="flex-1 rounded-xl font-black uppercase text-xs">Liga Dual</TabsTrigger>}
              <TabsTrigger value="standings" className="flex-1 rounded-xl font-black uppercase text-xs">Ranking</TabsTrigger>
              <TabsTrigger value="news" className="flex-1 rounded-xl font-black uppercase text-xs">Noticias</TabsTrigger>
            </TabsList>

            <TabsContent value="matches" className="mt-6 space-y-8">
              {tournament.matches.length === 0 ? <div className="text-center py-20 bg-muted/10 rounded-[2rem] border-2 border-dashed"><p className="font-bold text-muted-foreground uppercase text-xs">Sin partidos.</p><Button onClick={() => generateSchedule(tournament.id)} className="mt-4 font-black rounded-xl">GENERAR CALENDARIO</Button></div> : (
                (tournament.leagueType === 'groups' || tournament.leagueType === 'conferences') && tournament.groups ? (
                  <Tabs defaultValue={tournament.groups[0]?.id}>
                    <TabsList className="bg-muted/10 p-1 mb-6 flex overflow-x-auto scrollbar-hide w-full gap-1">{tournament.groups.map((g) => <TabsTrigger key={`cal-tab-${g.id || 'def'}`} value={g.id} className="text-[10px] font-black uppercase flex-1">{g.name}</TabsTrigger>)}</TabsList>
                    {tournament.groups.map((g) => ( <TabsContent key={`cal-cont-${g.id || 'def'}`} value={g.id} className="space-y-8">{renderMatchdayList(tournament.matches.filter(m => g.participantIds.includes(m.homeId) || g.participantIds.includes(m.awayId)))}</TabsContent> ))}
                  </Tabs>
                ) : renderMatchdayList(tournament.matches)
              )}
            </TabsContent>

            <TabsContent value="dual" className="mt-6 space-y-12">
              <div className="space-y-6"><h3 className="text-xl font-black uppercase border-l-4 border-accent pl-4">Ranking Liga Dual</h3><Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">{tournament.groups ? ( <div className="space-y-12 p-6">{tournament.groups.map(group => ( <div key={`d-st-${group.id || 'def'}`} className="space-y-4"><h3 className="text-xl font-black uppercase text-accent">{group.name}</h3>{renderStandingsTable(dualStandings.filter(s => group.participantIds.includes(s.id)))}</div> ))}</div> ) : renderStandingsTable(dualStandings)}</Card></div>
              <div className="space-y-6"><h3 className="text-xl font-black uppercase border-l-4 border-accent pl-4">Calendario Dual (Invertido)</h3>{tournament.groups ? ( <Tabs defaultValue={tournament.groups[0]?.id}><TabsList className="bg-muted/10 p-1 mb-6 flex overflow-x-auto scrollbar-hide w-full gap-1">{tournament.groups.map(g => <TabsTrigger key={`d-cal-tab-${g.id || 'def'}`} value={g.id} className="text-[10px] font-black uppercase flex-1">{g.name}</TabsTrigger>)}</TabsList>{tournament.groups.map(g => ( <TabsContent key={`d-cal-cont-${g.id || 'def'}`} value={g.id} className="space-y-8">{renderMatchdayList(tournament.dualLeagueMatches.filter(m => g.participantIds.includes(m.homeId) || g.participantIds.includes(m.awayId)), true)}</TabsContent> ))}</Tabs> ) : renderMatchdayList(tournament.dualLeagueMatches, true)}</div>
            </TabsContent>

            <TabsContent value="standings" className="mt-6"><Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">{tournament.groups ? ( <div className="space-y-12 p-6">{tournament.groups.map(group => ( <div key={`st-g-${group.id || 'def'}`} className="space-y-4"><div className="flex items-center gap-3 border-l-4 border-primary pl-4"><h3 className="text-xl font-black uppercase">{group.name}</h3><Badge className="bg-primary/10 text-primary border-none text-[9px] font-black">{group.participantIds.length} CLUBES</Badge></div>{renderStandingsTable(standings.filter(s => group.participantIds.includes(s.id)))}</div> ))}</div> ) : renderStandingsTable(standings)}</Card></TabsContent>

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
          <Card className="border-none shadow-xl rounded-[2rem] bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden"><CardHeader className="p-6 pb-0"><CardTitle className="text-2xl font-black uppercase text-white">Leyes de l'Horta</CardTitle></CardHeader><CardContent className="p-6 space-y-4"><div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl"><span className="text-[10px] font-black uppercase">Puntuación</span><span className="text-[10px] font-black uppercase">{tournament.scoringRuleType} ({tournament.scoringValue})</span></div><div className="grid grid-cols-2 gap-3"><div className="bg-black/10 p-3 rounded-xl text-center"><p className="text-[8px] opacity-70 uppercase font-black">PLAYOFFS</p><p className="text-lg font-black">{tournament.playoffSpots}</p></div><div className="bg-black/10 p-3 rounded-xl text-center"><p className="text-[8px] opacity-70 uppercase font-black">DESCENSO</p><p className="text-lg font-black">{tournament.relegationSpots}</p></div></div></CardContent></Card>
          <Card className="border-none shadow-xl rounded-[2rem]"><CardHeader><h3 className="font-black uppercase text-sm flex items-center gap-2"><TrendingUp className="text-emerald-500 w-4 h-4" /> Líderes de l'Horta</h3></CardHeader><CardContent className="space-y-4">{standings.slice(0, 3).map((row: any, idx: number) => { const team = teams.find(t => t.id === row.id); return ( <div key={`podium-${row.id}`} className="flex items-center gap-4 p-3 bg-muted/20 rounded-xl"><div className="w-8 h-8 rounded-full bg-card flex items-center justify-center font-black text-xs">{idx + 1}</div><div className="flex-1 overflow-hidden"><p className="font-black text-xs uppercase truncate">{team?.name}</p><p className="text-[9px] font-bold text-muted-foreground">{row.points} PTS • {row.budget.toLocaleString()} CR</p></div><CrestIcon shape={team?.emblemShape || 'shield'} pattern={team?.emblemPattern || 'none'} c1={team?.crestPrimary || '#000'} c2={team?.crestSecondary || '#fff'} c3={team?.crestTertiary || '#000'} size="w-8 h-8" /></div> ); })}</CardContent></Card>
        </div>
      </div>

      {/* Modales */}
      <Dialog open={!!selectedMatchDetail} onOpenChange={(o) => !o && setSelectedMatchDetail(null)}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          {selectedMatchDetail && (() => {
            const home = teams.find(t => t.id === selectedMatchDetail.homeId); const away = teams.find(t => t.id === selectedMatchDetail.awayId);
            const hPlayer = players.find(p => p.id === selectedMatchDetail.homePlayerId); const aPlayer = players.find(p => p.id === selectedMatchDetail.awayPlayerId);
            return (
              <div className="flex flex-col">
                <div className="bg-muted/10 p-8 border-b text-center space-y-6">
                  <DialogHeader><DialogTitle className="text-xl font-black uppercase text-center">Acta de Competición</DialogTitle><DialogDescription className="text-center font-bold text-[10px] uppercase text-muted-foreground">Informe técnico oficial</DialogDescription></DialogHeader>
                  <div className="flex items-center justify-center gap-8"><div className="flex flex-col items-center gap-2"><CrestIcon shape={home?.emblemShape || 'shield'} pattern={home?.emblemPattern || 'none'} c1={home?.crestPrimary || '#000'} c2={home?.crestSecondary || '#fff'} c3={home?.crestTertiary || '#000'} size="w-16 h-16" /><span className="font-black text-xs uppercase">{home?.name}</span></div><div className="text-5xl font-black">{selectedMatchDetail.homeScore} - {selectedMatchDetail.awayScore}</div><div className="flex flex-col items-center gap-2"><CrestIcon shape={away?.emblemShape || 'shield'} pattern={away?.emblemPattern || 'none'} c1={away?.crestPrimary || '#000'} c2={away?.crestSecondary || '#fff'} c3={away?.crestTertiary || '#000'} size="w-16 h-16" /><span className="font-black text-xs uppercase">{away?.name}</span></div></div>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-card">{[hPlayer, aPlayer].map((p, pi) => ( <div key={`p-rep-${p?.id || pi}`} className="space-y-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary">#{p?.jerseyNumber || '??'}</div><div><p className="font-black uppercase text-sm">{p?.name || 'Agente Invitado'}</p><p className="text-[10px] font-bold text-accent uppercase">{p?.position}</p></div></div>{p?.description && <p className="text-[10px] text-muted-foreground italic bg-muted/20 p-3 rounded-xl">{p.description}</p>}<div className="grid grid-cols-2 gap-2">{p?.attributes.map((a) => (<div key={`stat-${p?.id || pi}-${a.name}`} className="bg-muted/30 p-2 rounded-lg border flex justify-between items-center"><span className="text-[8px] font-black uppercase opacity-50">{a.name}</span><span className="text-[10px] font-black">{a.value}</span></div>))}</div></div> ))}</div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingMatch} onOpenChange={(o) => !o && setPendingMatch(null)}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-card">
          {pendingMatch && (() => {
            const isHome = pendingMatch.match.homeId === tournament.managedParticipantId;
            const opponent = teams.find(t => t.id === (isHome ? pendingMatch.match.awayId : pendingMatch.match.homeId));
            const aiP = pendingMatch.aiPlayer;
            return (
              <div className="flex flex-col h-full max-h-[95vh]">
                <div className="bg-primary p-6 md:p-10 text-white border-b-4 border-black/10"><DialogHeader><DialogTitle className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white">Centro de Tácticas Arcade</DialogTitle><DialogDescription className="text-white/70 font-bold uppercase text-[10px] mt-2">Scouting y Desafío de Jornada {pendingMatch.match.matchday}</DialogDescription></DialogHeader></div>
                <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 scrollbar-hide">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="p-6 bg-muted/30 rounded-[3rem] space-y-8 border-2 border-dashed border-primary/20"><div className="flex flex-col items-center gap-4 text-center"><CrestIcon shape={opponent?.emblemShape || 'shield'} pattern={opponent?.emblemPattern || 'none'} c1={opponent?.crestPrimary || '#000'} c2={opponent?.crestSecondary || '#fff'} c3={opponent?.crestTertiary || '#000'} size="w-24 h-24" /><h3 className="text-2xl font-black uppercase tracking-tighter">{opponent?.name}</h3></div>{aiP && ( <div className="bg-card p-6 rounded-[2rem] shadow-2xl"><div className="flex items-center gap-5 mb-4"><div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl">#{aiP.jerseyNumber}</div><div><p className="font-black uppercase text-xl truncate">{aiP.name}</p><Badge variant="outline" className="text-[10px] font-black">{aiP.position}</Badge></div></div>{aiP.description && <p className="text-[10px] text-muted-foreground italic mb-6 bg-muted/20 p-3 rounded-xl">{aiP.description}</p>}<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{aiP.attributes.map((a) => (<div key={`scout-${a.name}`} className="bg-muted/40 p-2 rounded-xl border flex flex-col items-center gap-1"><span className="text-[8px] font-black uppercase text-muted-foreground">{a.name}</span><span className="text-sm font-black text-primary">{a.value}</span></div>))}</div></div> )}</div>
                    <div className="flex flex-col gap-8 justify-center bg-muted/10 p-6 rounded-[3rem] border"><div className="space-y-4"><Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Designa tu Agente Élite</Label><Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}><SelectTrigger className="h-16 rounded-[2rem] border-4 border-primary/20 text-lg font-black"><SelectValue placeholder="Elegir representante..." /></SelectTrigger><SelectContent className="rounded-[2rem]">{players.filter(p => p.teamId === tournament.managedParticipantId).map(p => (<SelectItem key={`arcade-sel-${p.id}`} value={p.id} className="font-bold uppercase text-xs">#{p.jerseyNumber} {p.name}</SelectItem>))}</SelectContent></Select></div><div className="flex items-center gap-4 justify-center"><Input type="number" value={arcadeHomeScore} onChange={e => setArcadeHomeScore(parseInt(e.target.value) || 0)} className="h-20 w-24 text-4xl font-black text-center rounded-[2rem] border-4" /><span className="text-4xl font-black opacity-10">VS</span><Input type="number" value={arcadeAwayScore} onChange={e => setArcadeAwayScore(parseInt(e.target.value) || 0)} className="h-20 w-24 text-4xl font-black text-center rounded-[2rem] border-4" /></div></div>
                  </div>
                </div>
                <div className="p-6 bg-muted/20 border-t flex flex-col md:flex-row gap-4"><Button variant="ghost" onClick={() => setPendingMatch(null)} className="flex-1 h-16 font-black rounded-3xl">CANCELAR</Button><Button disabled={!selectedPlayerId} onClick={() => { resolveMatch(tournament.id, pendingMatch.match.id, arcadeHomeScore, arcadeAwayScore, pendingMatch.isDual, isHome ? selectedPlayerId : aiP?.id, !isHome ? selectedPlayerId : aiP?.id); setPendingMatch(null); }} className="flex-[2] h-16 font-black rounded-3xl bg-primary text-white">GRABAR RESULTADO</Button></div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={isTransferMenuOpen} onOpenChange={setIsTransferCenterOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-primary p-6 text-white border-b"><DialogHeader><DialogTitle className="text-2xl font-black uppercase flex items-center gap-3"><ArrowLeftRight className="w-6 h-6" /> Oficina de Traspasos</DialogTitle><DialogDescription className="text-white/80 font-bold text-xs uppercase mt-1">Movimientos estratégicos manuales</DialogDescription></DialogHeader></div>
          <div className="p-8 space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><Label>Jugador</Label><Select onValueChange={setSelectedPlayerId}><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Elegir..." /></SelectTrigger><SelectContent>{players.map(p => (<SelectItem key={`tr-p-${p.id}`} value={p.id}>{p.name}</SelectItem>))}</SelectContent></Select></div><div className="space-y-2"><Label>Destino</Label><Select onValueChange={(v) => { if (selectedPlayerId) { transferPlayer(selectedPlayerId, v === 'free' ? undefined : v); setIsTransferCenterOpen(false); toast({ title: "Traspaso OK" }); } }}><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Destino..." /></SelectTrigger><SelectContent><SelectItem value="free">Agente Libre</SelectItem>{teams.map(t => (<SelectItem key={`tr-t-${t.id}`} value={t.id}>{t.name}</SelectItem>))}</SelectContent></Select></div></div></div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSanctionMenuOpen} onOpenChange={setIsSanctionMenuOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-destructive p-6 text-white border-b"><DialogHeader><DialogTitle className="text-2xl font-black uppercase flex items-center gap-3"><ShieldAlert className="w-6 h-6" /> Comité de Disciplina</DialogTitle><DialogDescription className="text-white/80 font-bold text-xs uppercase mt-1">Sanciones y suspensiones</DialogDescription></DialogHeader></div>
          <Tabs defaultValue="team"><TabsList className="grid grid-cols-2 rounded-none h-14"><TabsTrigger value="team" className="font-black text-xs uppercase">Multar Club</TabsTrigger><TabsTrigger value="player" className="font-black text-xs uppercase">Suspender Jugador</TabsTrigger></TabsList>
            <TabsContent value="team" className="p-8 space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><Label>Club</Label><Select onValueChange={setSelectedPlayerId}><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Elegir..." /></SelectTrigger><SelectContent>{teams.map(t => (<SelectItem key={`sanc-t-${t.id}`} value={t.id}>{t.name}</SelectItem>))}</SelectContent></Select></div><div className="space-y-2"><Label>Multa</Label><Input type="number" onKeyDown={(e) => { if (e.key === 'Enter' && selectedPlayerId) { applySanction(tournament.id, 'team', selectedPlayerId, Number((e.target as HTMLInputElement).value)); setIsSanctionMenuOpen(false); } }} className="h-12 rounded-xl" /></div></div></TabsContent>
            <TabsContent value="player" className="p-8 space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><Label>Jugador</Label><Select onValueChange={setSelectedPlayerId}><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Elegir..." /></SelectTrigger><SelectContent>{players.map(p => (<SelectItem key={`sanc-p-${p.id}`} value={p.id}>{p.name}</SelectItem>))}</SelectContent></Select></div><div className="space-y-2"><Label>Jornadas</Label><Input type="number" onKeyDown={(e) => { if (e.key === 'Enter' && selectedPlayerId) { applySanction(tournament.id, 'player', selectedPlayerId, Number((e.target as HTMLInputElement).value)); setIsSanctionMenuOpen(false); } }} className="h-12 rounded-xl" /></div></div></TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="rounded-[2.5rem] max-w-2xl max-h-[90vh] overflow-y-auto border-none shadow-2xl">
          <DialogHeader><DialogTitle className="text-2xl font-black uppercase">Ajustes del Universo</DialogTitle><DialogDescription>Modifica todas las leyes de tu competición.</DialogDescription></DialogHeader>
          <div className="space-y-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><Label>Nombre</Label><Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-xl h-12" /></div><div className="space-y-2"><Label>Deporte</Label><Input value={editSport} onChange={e => setEditSport(e.target.value)} className="rounded-xl h-12" /></div></div>
            <div className="space-y-4"><h4 className="text-[10px] font-black uppercase border-b pb-2 text-primary">Reglas</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="space-y-2 md:col-span-2"><Label>Sistema</Label><Select value={editScoringType} onValueChange={(v: any) => setEditScoringType(v)}><SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bestOfN">Sets Suma Exacta</SelectItem><SelectItem value="firstToN">Primero a N</SelectItem><SelectItem value="nToNRange">Rango puntuación</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Valor Meta</Label><Input type="number" value={editScoringValue} onChange={e => setEditScoringValue(Number(e.target.value))} className="rounded-xl h-12" /></div></div></div>
          </div>
          <DialogFooter className="gap-2"><Button variant="ghost" onClick={() => setIsEditing(false)} className="rounded-xl font-black">CANCELAR</Button><Button onClick={() => { if (!tournament) return; updateTournament({ ...tournament, name: editName, sport: editSport, winPoints: editWinPts, drawPoints: editDrawPts, lossPoints: editLossPts, scoringRuleType: editScoringType, scoringValue: editScoringValue, playoffSpots: editPlayoffSpots, relegationSpots: editRelegationSpots, variability: editVariability }); setIsEditing(false); }} className="font-black rounded-xl px-8 bg-primary">GUARDAR</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
