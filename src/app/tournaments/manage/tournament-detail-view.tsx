"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
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
import { Match, Tournament, ScoringRuleType, Player, ChallengeSport, Team } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TournamentDetailViewProps {
  id: string;
}

export function TournamentDetailView({ id }: TournamentDetailViewProps) {
  const { tournaments, teams, players, resolveMatch, simulateMatchday, generateSchedule, resetSchedule, resetMatchday, updateTournament, settings, processIncidentDecision, transferPlayer, applySanction } = useTournamentStore();
  const { toast } = useToast();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  
  // UI State
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMatchDetail, setSelectedMatchDetail] = useState<Match | null>(null);
  const [manualMatch, setManualMatch] = useState<Match | null>(null);
  const [mHomeScore, setMHomeScore] = useState(0);
  const [mAwayScore, setMAwayScore] = useState(0);
  const [mUserPlayerId, setMUserPlayerId] = useState<string>('');
  const [mAiPlayerId, setMAiPlayerId] = useState<string>('');
  const [showDualStandings, setShowDualStandings] = useState(false);

  // Market & Sanction State
  const [transferPlayerId, setTransferPlayerId] = useState('');
  const [transferToTeamId, setTransferToTeamId] = useState('');
  const [sanctionType, setSanctionType] = useState<'team' | 'player'>('team');
  const [sanctionTargetId, setSanctionTargetId] = useState('');
  const [sanctionValue, setSanctionValue] = useState(0);

  // Challenge Match State
  const [challengeMatch, setChallengeMatch] = useState<{ match: Match; sport: ChallengeSport } | null>(null);
  const [cHomeScore, setCHomeScore] = useState(0);
  const [cAwayScore, setCAwayScore] = useState(0);
  const [cWinner, setCWinner] = useState<'home' | 'away' | 'draw' | null>(null);
  const [cStatus, setCStatus] = useState<'waiting' | 'playing' | 'rest' | 'finished'>('waiting');
  const [cPeriod, setCPeriod] = useState(1);
  const [cTime, setCTime] = useState(0);

  // Edit State
  const [editName, setEditName] = useState('');
  const [editSport, setEditSport] = useState('');
  const [editPlayoffSpots, setEditPlayoffSpots] = useState(0);
  const [editRelegationSpots, setEditRelegationSpots] = useState(0);
  const [editChallengeSports, setEditChallengeSports] = useState<ChallengeSport[]>([]);
  const [editArcadeMaxBrokeMatchdays, setEditArcadeMaxBrokeMatchdays] = useState(0);
  const [editArcadeSanctionPoints, setEditArcadeSanctionPoints] = useState(0);

  // Match edit state
  const [isEditingResult, setIsEditingResult] = useState(false);
  const [editedHomeScore, setEditedHomeScore] = useState(0);
  const [editedAwayScore, setEditedAwayScore] = useState(0);

  useEffect(() => {
    const found = tournaments.find(t => t.id === id);
    if (found) {
      setTournament(found);
      setEditName(found.name);
      setEditSport(found.sport);
      setEditPlayoffSpots(found.playoffSpots || 0);
      setEditRelegationSpots(found.relegationSpots || 0);
      setEditChallengeSports(found.challengeSports ? [...found.challengeSports] : []);
      setEditArcadeMaxBrokeMatchdays(found.arcadeMaxBrokeMatchdays || 2);
      setEditArcadeSanctionPoints(found.arcadeSanctionPoints || 3);
    }
  }, [tournaments, id]);

  const triggerAlert = useCallback((type: 'beep' | 'period-end' | 'break-end' = 'beep') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'beep') navigator.vibrate(100);
      else navigator.vibrate([300, 100, 300, 100, 300]);
    }
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const context = new AudioContext();
        const playTone = (freq: number, dur: number, vol: number) => {
          const osc = context.createOscillator();
          const g = context.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, context.currentTime);
          g.gain.setValueAtTime(0, context.currentTime);
          g.gain.linearRampToValueAtTime(vol, context.currentTime + 0.05);
          g.gain.linearRampToValueAtTime(0, context.currentTime + dur);
          osc.connect(g);
          g.connect(context.destination);
          osc.start();
          osc.stop(context.currentTime + dur);
        };

        if (type === 'beep') {
          playTone(880, 0.2, 0.1);
        } else if (type === 'period-end') {
          playTone(440, 0.4, 0.2);
          setTimeout(() => playTone(880, 0.6, 0.3), 200);
        } else if (type === 'break-end') {
          playTone(880, 0.4, 0.2);
          setTimeout(() => playTone(440, 0.6, 0.3), 200);
        }
      }
    } catch (e) {
      console.warn('Alerta sonora bloqueada');
    }
  }, []);

  useEffect(() => {
    if (challengeMatch) {
      setCHomeScore(0);
      setCAwayScore(0);
      setCWinner(null);
      setCStatus('waiting');
      setCPeriod(1);
      setCTime(challengeMatch.sport.periodDuration || 0);
    }
  }, [challengeMatch]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if ((cStatus === 'playing' || cStatus === 'rest') && challengeMatch?.sport.hasPeriods) {
      timer = setInterval(() => {
        setCTime(prev => {
          if (prev <= 4 && prev > 1) {
            triggerAlert('beep');
          }
          if (prev <= 1) {
            triggerAlert(cStatus === 'playing' ? 'period-end' : 'break-end');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cStatus, triggerAlert, challengeMatch]);

  useEffect(() => {
    if (cTime === 0 && (cStatus === 'playing' || cStatus === 'rest') && challengeMatch?.sport.hasPeriods) {
      if (cStatus === 'playing') {
        const num = challengeMatch?.sport.numPeriods || 1;
        if (cPeriod < num) {
          setCStatus('rest');
          setCTime(challengeMatch?.sport.restDuration || 0);
        } else {
          setCStatus('finished');
        }
      } else if (cStatus === 'rest') {
        setCStatus('playing');
        setCPeriod(p => p + 1);
        setCTime(challengeMatch?.sport.periodDuration || 0);
      }
    }
  }, [cTime, cStatus, cPeriod, challengeMatch]);

  const { mainStandings, dualStandings } = useMemo(() => {
    if (!tournament) return { mainStandings: [], dualStandings: [] };
    
    const calculateStats = (mList: Match[]) => {
      const stats: Record<string, any> = {};
      tournament.participants.forEach(pId => {
        const teamObj = teams.find(t => t.id === pId) || players.find(p => p.id === pId);
        stats[pId] = { id: pId, played: 0, win: 0, draw: 0, loss: 0, points: 0, gf: 0, ga: 0, diff: 0, budget: (teamObj as any)?.budget || 0 };
      });
      mList.filter(m => m.isSimulated).forEach(m => {
        if (stats[m.homeId] && stats[m.awayId]) {
          stats[m.homeId].played++; stats[m.awayId].played++;
          stats[m.homeId].gf += (m.homeScore || 0); stats[m.homeId].ga += (m.awayScore || 0);
          stats[m.awayId].gf += (m.awayScore || 0); stats[m.awayId].ga += (m.homeScore || 0);
          if (m.homeScore! > m.awayScore!) { 
            stats[m.homeId].win++; stats[m.homeId].points += (tournament.winPoints || 0); 
            stats[m.awayId].loss++; stats[m.awayId].points += (tournament.lossPoints || 0); 
          } else if (m.awayScore! > m.homeScore!) { 
            stats[m.awayId].win++; stats[m.awayId].points += (tournament.winPoints || 0); 
            stats[m.homeId].loss++; stats[m.homeId].points += (tournament.lossPoints || 0); 
          } else { 
            stats[m.homeId].draw++; stats[m.homeId].points += (tournament.drawPoints || 0); 
            stats[m.awayId].draw++; stats[m.awayId].points += (tournament.drawPoints || 0); 
          }
        }
      });
      return Object.values(stats).map((s: any) => ({ ...s, diff: s.gf - s.ga })).sort((a: any, b: any) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.diff - a.diff;
      });
    };

    return { 
      mainStandings: calculateStats(tournament.matches), 
      dualStandings: calculateStats(tournament.dualLeagueMatches || []) 
    };
  }, [tournament, teams, players]);

  const handleStartChallenge = (m: Match) => {
    const sport = tournament?.challengeSports?.find(s => s.id === m.challengeSportId);
    if (!sport) return;
    setChallengeMatch({ match: m, sport });
    setCHomeScore(0); setCAwayScore(0); setCWinner(null); setCPeriod(1);
    setCStatus('playing');
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
              <TableCell className="font-black text-center">
                <span className={cn("text-[10px] w-6 h-6 flex items-center justify-center rounded-full mx-auto", 
                  isPlayoff ? "bg-emerald-500 text-white" : isRelegation ? "bg-destructive text-white" : "opacity-30")}>
                  {idx + 1}
                </span>
              </TableCell>
              <TableCell className="font-black flex items-center gap-3">
                {team ? (
                  <CrestIcon shape={team.emblemShape || 'shield'} pattern={team.emblemPattern || 'none'} c1={team.crestPrimary || '#000'} c2={team.crestSecondary || '#fff'} c3={team.crestTertiary || '#000'} size="w-6 h-6" />
                ) : (
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-[8px]">#{agent?.jerseyNumber}</div>
                )}
                <span className={cn("truncate text-xs uppercase", (team?.id === tournament?.managedParticipantId || agent?.id === tournament?.managedParticipantId) && "text-primary font-black")}>
                  {team?.name || agent?.name}
                </span>
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
                  <Button size="sm" variant="outline" className="h-8 px-3 text-[10px] font-black uppercase rounded-lg border-primary/30 text-primary hover:bg-primary" onClick={() => simulateMatchday(tournament!.id, Number(day))}>
                    <Play className="w-3 h-3 mr-1 fill-current" /> SIMULAR JORNADA
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 px-3 text-[10px] font-black uppercase rounded-lg border-destructive/30 text-destructive hover:bg-destructive" onClick={() => resetMatchday(tournament!.id, Number(day))}>
                    <RefreshCw className="w-3 h-3 mr-1" /> REINICIAR
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
                          <Button size="sm" onClick={(e) => { 
                            e.stopPropagation(); 
                            const isUser = tournament?.mode === 'arcade' && (m.homeId === tournament.managedParticipantId || m.awayId === tournament.managedParticipantId);
                            if (tournament?.mode === 'challenge') {
                              handleStartChallenge(m);
                            } else if (isUser) {
                              setManualMatch(m);
                              setMHomeScore(0);
                              setMAwayScore(0);
                              
                              const userTeamId = m.homeId === tournament.managedParticipantId ? m.homeId : m.awayId;
                              const aiTeamId = m.homeId === tournament.managedParticipantId ? m.awayId : m.homeId;
                              
                              const userPlayers = players.filter(p => p.teamId === userTeamId && p.suspensionMatchdays === 0);
                              setMUserPlayerId(userPlayers[0]?.id || '');
                              
                              const aiPlayers = players.filter(p => p.teamId === aiTeamId && p.suspensionMatchdays === 0).sort((a,b) => b.monetaryValue - a.monetaryValue);
                              let aiChoice = aiPlayers[0]?.id || '';
                              if (aiPlayers.length > 0) {
                                 const r = Math.random();
                                 if (r < 0.7) aiChoice = aiPlayers[0].id;
                                 else if (r < 0.9 && aiPlayers.length > 1) aiChoice = aiPlayers[1].id;
                                 else if (aiPlayers.length > 2) aiChoice = aiPlayers[2 + Math.floor(Math.random() * (aiPlayers.length - 2))].id;
                              }
                              setMAiPlayerId(aiChoice);
                            } else {
                              resolveMatch(tournament!.id, m.id, 0, 0, false, undefined, undefined, true); 
                            }
                          }} className="w-full h-10 rounded-xl font-black bg-primary">
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
          <Button variant="outline" onClick={() => generateSchedule(tournament.id)} className="rounded-xl font-black h-12 border-primary text-primary"><RefreshCw className="w-4 h-4 mr-2" /> REGENERAR CALENDARIO</Button>
          <Button variant="outline" onClick={() => setIsEditing(true)} className="rounded-xl font-black h-12 border-primary text-primary"><Settings2 className="text-primary w-4 h-4 mr-2" /> AJUSTES PRO</Button>
          <Button variant="outline" onClick={() => resetSchedule(tournament.id)} className="rounded-xl font-black h-12 border-destructive text-destructive"><Trash2 className="w-4 h-4 mr-2" /> REINICIAR</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue="matches">
            <TabsList className="bg-muted/20 p-1 rounded-2xl h-14 w-full flex overflow-x-auto scrollbar-hide">
              <TabsTrigger value="matches" className="flex-1 rounded-xl font-black uppercase text-xs">Calendario</TabsTrigger>
              <TabsTrigger value="standings" className="flex-1 rounded-xl font-black uppercase text-xs">Ranking</TabsTrigger>
              {tournament.mode !== 'challenge' && <TabsTrigger value="market" className="flex-1 rounded-xl font-black uppercase text-xs">Mercado / Disciplina</TabsTrigger>}
              {tournament.mode !== 'challenge' && <TabsTrigger value="news" className="flex-1 rounded-xl font-black uppercase text-xs">Noticias</TabsTrigger>}
            </TabsList>

            <TabsContent value="matches" className="mt-6">
              {renderMatchdayList(tournament.matches)}
            </TabsContent>

            <TabsContent value="standings" className="mt-6 space-y-6">
              {tournament.dualLeagueEnabled && (
                <div className="flex justify-end mb-4 bg-muted/20 p-2 rounded-2xl w-max ml-auto shadow-inner">
                    <Button variant={!showDualStandings ? 'default' : 'ghost'} onClick={() => setShowDualStandings(false)} className="rounded-xl h-8 text-[10px] font-black uppercase">Liga Principal</Button>
                    <Button variant={showDualStandings ? 'default' : 'ghost'} onClick={() => setShowDualStandings(true)} className="rounded-xl h-8 text-[10px] font-black uppercase">Liga Secundaria</Button>
                </div>
              )}
              
              {(() => {
                const activeStandings = showDualStandings ? dualStandings : mainStandings;
                if (tournament.leagueType === 'groups' && tournament.groups && tournament.groups.length > 0) {
                  return tournament.groups.map((g, i) => {
                    const groupRows = activeStandings.filter(s => g.participantIds.includes(s.id));
                    return (
                      <Card key={g.id} className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden p-6 mb-6">
                        <h3 className="font-black uppercase mb-4 text-primary tracking-widest">{g.name || `Grupo ${i+1}`}</h3>
                        {renderStandingsTable(groupRows)}
                      </Card>
                    );
                  });
                }
                return (
                  <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden p-6">
                    {renderStandingsTable(activeStandings)}
                  </Card>
                );
              })()}
            </TabsContent>

            <TabsContent value="news" className="mt-6 space-y-4">
              {tournament.incidents?.length === 0 ? <div className="text-center py-20 bg-muted/10 rounded-[2rem] border-2 border-dashed font-bold text-muted-foreground uppercase text-xs">Sin noticias.</div> : (
                [...(tournament.incidents || [])].reverse().map((inc) => (
                  <Card key={`news-card-${inc.id}`} className="border-none shadow-sm rounded-2xl overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", inc.type === 'transfer' ? "bg-accent/10 text-accent" : inc.type === 'sanction' ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>{inc.type === 'transfer' ? <ArrowLeftRight className="w-5 h-5" /> : inc.type === 'sanction' ? <ShieldAlert className="w-5 h-5" /> : <Info className="w-5 h-5" />}</div>
                      <div className="flex-1">
                        <p className="text-xs font-black uppercase opacity-50 mb-0.5">{inc.date}</p>
                        <p className="text-sm font-bold">{inc.message}</p>
                        {inc.status === 'pending' && ( 
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" className="bg-accent text-white font-black text-[10px]" onClick={() => processIncidentDecision(tournament.id, inc.id, true)}>ACEPTAR</Button>
                            <Button size="sm" variant="outline" className="text-[10px] font-black" onClick={() => processIncidentDecision(tournament.id, inc.id, false)}>RECHAZAR</Button>
                          </div> 
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="market" className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-none shadow-xl rounded-[2rem]">
                  <CardHeader><CardTitle className="font-black uppercase text-accent flex items-center gap-2"><ArrowLeftRight className="w-5 h-5" /> Mercado de Fichajes</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase">Jugador a Transferir</Label>
                       <Select value={transferPlayerId} onValueChange={setTransferPlayerId}>
                         <SelectTrigger className="rounded-xl bg-card"><SelectValue placeholder="Seleccionar jugador" /></SelectTrigger>
                         <SelectContent>{players.map(p => <SelectItem key={p.id} value={p.id} className="text-xs font-black">{p.name} ({p.monetaryValue} CR) #{p.jerseyNumber}</SelectItem>)}</SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase">Equipo Destino</Label>
                       <Select value={transferToTeamId} onValueChange={setTransferToTeamId}>
                         <SelectTrigger className="rounded-xl bg-card"><SelectValue placeholder="Seleccionar equipo" /></SelectTrigger>
                         <SelectContent>{tournament.participants.map(tid => {
                           const t = teams.find(x => x.id === tid);
                           return t ? <SelectItem key={tid} value={tid} className="text-xs font-black">{t.name} ({t.budget.toLocaleString()} CR)</SelectItem> : null;
                         })}</SelectContent>
                       </Select>
                    </div>
                    <Button className="w-full rounded-xl bg-accent text-white font-black h-12" onClick={() => {
                        if (!transferPlayerId || !transferToTeamId) return;
                        transferPlayer(transferPlayerId, transferToTeamId);
                        toast({ title: "Fichaje Completado" });
                        setTransferPlayerId(''); setTransferToTeamId('');
                    }}>EJECUTAR FICHAJE</Button>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-xl rounded-[2rem]">
                  <CardHeader><CardTitle className="font-black uppercase text-destructive flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> Disciplina</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase">Tipo de Sanción</Label>
                       <Select value={sanctionType} onValueChange={(v: 'team'|'player') => { setSanctionType(v); setSanctionTargetId(''); setSanctionValue(0); }}>
                         <SelectTrigger className="rounded-xl bg-card"><SelectValue /></SelectTrigger>
                         <SelectContent><SelectItem value="team" className="text-xs font-black">Económica (Equipo)</SelectItem><SelectItem value="player" className="text-xs font-black">Deportiva (Jugador)</SelectItem></SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase">Objetivo</Label>
                       <Select value={sanctionTargetId} onValueChange={setSanctionTargetId}>
                         <SelectTrigger className="rounded-xl bg-card"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                         <SelectContent>
                           {sanctionType === 'team' ? tournament.participants.map(tid => {
                              const t = teams.find(x => x.id === tid);
                              return t ? <SelectItem key={tid} value={tid} className="text-xs font-black">{t.name}</SelectItem> : null;
                           }) : players.map(p => <SelectItem key={p.id} value={p.id} className="text-xs font-black">{p.name}</SelectItem>)}
                         </SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase">{sanctionType === 'team' ? 'Multa (Créditos)' : 'Partidos de Suspensión'}</Label>
                       <Input type="number" value={sanctionValue} onChange={e => setSanctionValue(Number(e.target.value))} className="rounded-xl bg-card font-black" />
                    </div>
                    <Button className="w-full rounded-xl bg-destructive text-white font-black h-12" onClick={() => {
                        if (!sanctionTargetId || sanctionValue <= 0) return;
                        applySanction(tournament.id, sanctionType, sanctionTargetId, sanctionValue);
                        toast({ title: "Sanción Aplicada" });
                        setSanctionTargetId(''); setSanctionValue(0);
                    }}>APLICAR SANCIÓN</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-xl rounded-[2rem] bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden">
            <CardHeader className="p-6 pb-0"><CardTitle className="text-2xl font-black uppercase text-white">{tournament.mode === 'challenge' ? 'Challenge Rules' : "Leyes de l'Horta"}</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl">
                <span className="text-[10px] font-black uppercase">Puntuación V/E/D</span>
                <span className="text-[10px] font-black uppercase">{tournament.winPoints}/{tournament.drawPoints}/{tournament.lossPoints}</span>
              </div>
              {tournament.mode !== 'challenge' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/10 p-3 rounded-xl text-center"><p className="text-[8px] opacity-70 uppercase font-black">PLAYOFFS</p><p className="text-lg font-black">{tournament.playoffSpots}</p></div>
                  <div className="bg-black/10 p-3 rounded-xl text-center"><p className="text-[8px] opacity-70 uppercase font-black">DESCENSO</p><p className="text-lg font-black">{tournament.relegationSpots}</p></div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-none shadow-xl rounded-[2rem]">
            <CardHeader><h3 className="font-black uppercase text-sm flex items-center gap-2"><TrendingUp className="text-emerald-500 w-4 h-4" /> Podium l'Horta</h3></CardHeader>
            <CardContent className="space-y-4">
              {mainStandings.slice(0, 3).map((row: any, idx: number) => { 
                const team = teams.find(t => t.id === row.id); 
                const agent = players.find(p => p.id === row.id);
                return ( 
                  <div key={`podium-${row.id || idx}`} className="flex items-center gap-4 p-3 bg-muted/20 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center font-black text-xs">{idx + 1}</div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-black text-xs uppercase truncate">{team?.name || agent?.name}</p>
                      <p className="text-[9px] font-bold text-muted-foreground">{row.points} PTS {tournament.mode !== 'challenge' ? `• ${row.budget.toLocaleString()} CR` : ''}</p>
                    </div>
                    {team ? <CrestIcon shape={team.emblemShape || 'shield'} pattern={team.emblemPattern || 'none'} c1={team.crestPrimary || '#000'} c2={team.crestSecondary || '#fff'} c3={team.crestTertiary || '#000'} size="w-8 h-8" /> : <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-[10px] font-black">#{agent?.jerseyNumber}</div>}
                  </div> 
                ); 
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Manual Match Arcade Center */}
      <Dialog open={!!manualMatch} onOpenChange={(o) => !o && setManualMatch(null)}>
        <DialogContent className="max-w-3xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Centro de Tácticas</DialogTitle>
          {manualMatch && (() => {
            const home = teams.find(t => t.id === manualMatch.homeId) || players.find(p => p.id === manualMatch.homeId);
            const away = teams.find(t => t.id === manualMatch.awayId) || players.find(p => p.id === manualMatch.awayId);
            const isHomeUser = manualMatch.homeId === tournament?.managedParticipantId;
            const rival = isHomeUser ? away : home;
            const rivalRank = mainStandings.findIndex(s => s.id === rival?.id) + 1;
            const stadium = (home as Team)?.venueName || 'Campo Neutral';
            const surface = (home as Team)?.venueSurface || 'Césped';
            
            const userTeamId = isHomeUser ? manualMatch.homeId : manualMatch.awayId;
            const userPlayers = players.filter(p => p.teamId === userTeamId && p.suspensionMatchdays === 0);
            const aiPlayerObj = players.find(p => p.id === mAiPlayerId);
            const homeAgent = isHomeUser ? players.find(p => p.id === mUserPlayerId) : aiPlayerObj;
            const awayAgent = isHomeUser ? aiPlayerObj : players.find(p => p.id === mUserPlayerId);
            
            return (
              <div className="flex flex-col bg-card">
                <div className="p-6 bg-primary text-white border-b flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black uppercase flex items-center gap-2"><MapPin className="w-5 h-5" /> Centro de Tácticas</h3>
                    <p className="text-[10px] font-bold opacity-80 uppercase">{stadium} ({surface}) • Jornada {manualMatch.matchday}</p>
                  </div>
                  <div className="text-right bg-white/10 px-4 py-2 rounded-2xl max-w-[200px]">
                    <p className="text-[8px] font-black uppercase opacity-70">Info Rival (Rank #{rivalRank})</p>
                    <p className="text-[10px] font-bold truncate">{rival?.description || 'Sin descripción.'}</p>
                  </div>
                </div>

                <div className="p-10 space-y-10">
                  <div className="bg-muted/30 p-4 rounded-3xl flex items-center justify-center gap-4">
                    <Label className="font-black uppercase text-xs">Jugador a alinear:</Label>
                    <Select value={mUserPlayerId} onValueChange={setMUserPlayerId}>
                      <SelectTrigger className="w-[300px] font-black h-12 rounded-xl text-xs"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                      <SelectContent>
                        {userPlayers.map(p => <SelectItem key={p.id} value={p.id} className="font-bold text-xs">{p.name} ({p.monetaryValue} CR) #{p.jerseyNumber}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-center gap-12">
                    <div className="text-center space-y-4 w-48">
                      {home && 'abbreviation' in home ? <CrestIcon shape={(home as any).emblemShape} pattern={(home as any).emblemPattern} c1={(home as any).crestPrimary} c2={(home as any).crestSecondary} c3={(home as any).crestTertiary || (home as any).crestPrimary} size="w-24 h-24 mx-auto" /> : <div className="w-24 h-24 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center text-5xl font-black">#{(home as any)?.jerseyNumber}</div>}
                      <p className="font-black text-sm uppercase truncate">{home?.name}</p>
                      {homeAgent && <Badge variant="outline" className="text-[10px] uppercase truncate max-w-full block">#{homeAgent.jerseyNumber} {homeAgent.name}</Badge>}
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <Button size="icon" variant="outline" onClick={() => setMHomeScore(Math.max(0, mHomeScore - 1))} className="h-8 w-8 rounded-lg">-</Button>
                        <span className="text-4xl font-black w-12">{mHomeScore}</span>
                        <Button size="icon" variant="outline" onClick={() => setMHomeScore(mHomeScore + 1)} className="h-8 w-8 rounded-lg">+</Button>
                      </div>
                    </div>
                    
                    <div className="text-4xl font-black opacity-20">VS</div>

                    <div className="text-center space-y-4 w-48">
                      {away && 'abbreviation' in away ? <CrestIcon shape={(away as any).emblemShape} pattern={(away as any).emblemPattern} c1={(away as any).crestPrimary} c2={(away as any).crestSecondary} c3={(away as any).crestTertiary || (away as any).crestPrimary} size="w-24 h-24 mx-auto" /> : <div className="w-24 h-24 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center text-5xl font-black">#{(away as any)?.jerseyNumber}</div>}
                      <p className="font-black text-sm uppercase truncate">{away?.name}</p>
                      {awayAgent && <Badge variant="outline" className="text-[10px] uppercase truncate max-w-full block">#{awayAgent.jerseyNumber} {awayAgent.name}</Badge>}
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <Button size="icon" variant="outline" onClick={() => setMAwayScore(Math.max(0, mAwayScore - 1))} className="h-8 w-8 rounded-lg">-</Button>
                        <span className="text-4xl font-black w-12">{mAwayScore}</span>
                        <Button size="icon" variant="outline" onClick={() => setMAwayScore(mAwayScore + 1)} className="h-8 w-8 rounded-lg">+</Button>
                      </div>
                    </div>
                  </div>

                  {aiPlayerObj && (
                    <Card className="bg-muted/20 border-none rounded-3xl p-4">
                      <div className="flex items-center gap-4 mb-4 border-b pb-4 border-dashed">
                        <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center font-black text-lg">#{aiPlayerObj.jerseyNumber}</div>
                        <div>
                           <p className="font-black uppercase text-sm">{aiPlayerObj.name}</p>
                           <p className="text-[10px] uppercase font-bold text-muted-foreground">{aiPlayerObj.description || 'Jugador Rival'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {aiPlayerObj.attributes.map(at => (
                          <div key={at.name} className="flex justify-between items-center text-[10px]">
                            <span className="font-bold opacity-60 uppercase">{at.name}</span>
                            <div className="flex-1 mx-3 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${at.value}%` }} /></div>
                            <span className="font-black">{at.value}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  <Button 
                    className="w-full h-16 rounded-2xl font-black text-lg bg-primary shadow-xl shadow-primary/20"
                    onClick={() => {
                      // Main logic already resolves Dual map inside update 
                      resolveMatch(tournament!.id, manualMatch.id, mHomeScore, mAwayScore, false, isHomeUser ? mUserPlayerId : mAiPlayerId, isHomeUser ? mAiPlayerId : mUserPlayerId, false);
                      setManualMatch(null);
                      toast({ title: "Resultado Confirmado" });
                    }}
                  >
                    GUARDAR RESULTADO FINAL
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Challenge Match Interface */}
      <Dialog open={!!challengeMatch} onOpenChange={(o) => !o && setChallengeMatch(null)}>
        <DialogContent className="max-w-4xl rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-background">
          <DialogTitle className="sr-only">Duelo Challenge</DialogTitle>
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
                  <div 
                    className="flex-1 group cursor-pointer relative overflow-hidden transition-all hover:bg-primary/5 border-r border-dashed"
                    onClick={() => {
                      if (cStatus === 'waiting' || cStatus === 'rest') return;
                      if (sport.isNumeric) setCHomeScore(s => s + 1);
                      else if (cStatus === 'playing') { setCWinner('home'); setCStatus('finished'); }
                    }}
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center gap-6">
                      <div className="w-32 h-32 rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-5xl font-black group-hover:scale-110 transition-transform">#{hAgent?.jerseyNumber}</div>
                      <h4 className="text-2xl font-black uppercase leading-tight">{hAgent?.name}</h4>
                      <div className="flex flex-col items-center">
                        <div className="text-7xl font-black text-primary">{sport.isNumeric ? cHomeScore : (cWinner === 'home' ? 'WIN' : '')}</div>
                        {sport.isNumeric && cStatus === 'finished' && (
                          <Button variant="secondary" size="sm" className="mt-4 rounded-full w-12 h-12 p-0 text-xl font-black" onClick={(e) => { e.stopPropagation(); setCHomeScore(Math.max(0, cHomeScore - 1)); }}>-1</Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="w-48 bg-muted/10 flex flex-col items-center justify-center gap-8 border-x border-dashed">
                    {sport.hasPeriods && (
                      <div className="text-center w-full px-6">
                        <div className={cn("text-5xl font-black font-mono tracking-tighter mb-2", cTime < 10 && "text-destructive animate-pulse")}>
                          {Math.floor(cTime / 60)}:{(cTime % 60).toString().padStart(2, '0')}
                        </div>
                        <div className="h-2 w-full bg-muted/20 rounded-full overflow-hidden mb-1">
                          <div 
                            className={cn("h-full transition-all duration-1000", cTime < 10 ? "bg-destructive" : "bg-primary")} 
                            style={{ width: `${(cTime / (cStatus === 'rest' ? (sport.restDuration || 1) : (sport.periodDuration || 1))) * 100}%` }} 
                          />
                        </div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground">{cStatus === 'rest' ? 'BREAK' : 'REMAINING'}</p>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-3 w-full px-4">
                      {cStatus === 'waiting' && <Button onClick={() => setCStatus('playing')} className="h-14 font-black uppercase rounded-2xl bg-primary shadow-xl">INICIAR</Button>}
                      {cStatus === 'playing' && !sport.hasPeriods && sport.isNumeric && <Button onClick={() => setCStatus('finished')} className="h-14 font-black uppercase rounded-2xl bg-destructive text-white shadow-xl">FINALIZAR</Button>}
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

                  <div 
                    className="flex-1 group cursor-pointer relative overflow-hidden transition-all hover:bg-primary/5"
                    onClick={() => {
                      if (cStatus === 'waiting' || cStatus === 'rest') return;
                      if (sport.isNumeric) setCAwayScore(s => s + 1);
                      else if (cStatus === 'playing') { setCWinner('away'); setCStatus('finished'); }
                    }}
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center gap-6">
                      <div className="w-32 h-32 rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-5xl font-black group-hover:scale-110 transition-transform">#{aAgent?.jerseyNumber}</div>
                      <h4 className="text-2xl font-black uppercase leading-tight">{aAgent?.name}</h4>
                      <div className="flex flex-col items-center">
                        <div className="text-7xl font-black text-primary">{sport.isNumeric ? cAwayScore : (cWinner === 'away' ? 'WIN' : '')}</div>
                        {sport.isNumeric && cStatus === 'finished' && (
                          <Button variant="secondary" size="sm" className="mt-4 rounded-full w-12 h-12 p-0 text-xl font-black" onClick={(e) => { e.stopPropagation(); setCAwayScore(Math.max(0, cAwayScore - 1)); }}>-1</Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-muted/20 text-center text-[10px] font-black uppercase opacity-50 border-t">
                  Haz click en un jugador para puntuar o declarar ganador
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Match Details Acta */}
      <Dialog open={!!selectedMatchDetail} onOpenChange={(o) => {
        if (!o) { setSelectedMatchDetail(null); setIsEditingResult(false); }
      }}>
        <DialogContent className="rounded-[2.5rem] max-w-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogTitle className="sr-only">Acta de Partido</DialogTitle>
          {selectedMatchDetail && (() => {
            const m = selectedMatchDetail;
            const home = teams.find(t => t.id === m.homeId) || players.find(p => p.id === m.homeId);
            const away = teams.find(t => t.id === m.awayId) || players.find(p => p.id === m.awayId);
            const hPlayer = players.find(p => p.id === m.homePlayerId);
            const aPlayer = players.find(p => p.id === m.awayPlayerId);

            return (
              <div className="flex flex-col max-h-[90vh]">
                <div className="p-6 bg-primary text-white border-b flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black uppercase">Acta de Partido</h3>
                    <p className="text-[10px] font-bold opacity-80 uppercase">Jornada {m.matchday} • {tournament.name}</p>
                  </div>
                  <History className="w-8 h-8 opacity-20" />
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10">
                  <div className="flex items-center justify-center gap-12 py-6 border-b border-dashed relative">
                    {!isEditingResult && (
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 rounded-full hidden md:flex" onClick={() => { setIsEditingResult(true); setEditedHomeScore(m.homeScore || 0); setEditedAwayScore(m.awayScore || 0); }}>
                        <Settings2 className="w-4 h-4 opacity-50" />
                      </Button>
                    )}
                    <div className="text-center space-y-3">
                      {home && 'abbreviation' in home ? <CrestIcon shape={(home as any).emblemShape} pattern={(home as any).emblemPattern} c1={(home as any).crestPrimary} c2={(home as any).crestSecondary} c3={(home as any).crestTertiary || (home as any).crestPrimary} size="w-16 h-16" /> : <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-black">#{(home as any)?.jerseyNumber}</div>}
                      <p className="font-black text-sm uppercase">{home?.name}</p>
                    </div>
                    {isEditingResult ? (
                      <div className="flex items-center gap-4">
                        <Input type="number" className="w-20 text-center text-4xl font-black h-16 rounded-2xl" value={editedHomeScore} onChange={e => setEditedHomeScore(Number(e.target.value))} />
                        <span className="text-4xl font-black">-</span>
                        <Input type="number" className="w-20 text-center text-4xl font-black h-16 rounded-2xl" value={editedAwayScore} onChange={e => setEditedAwayScore(Number(e.target.value))} />
                      </div>
                    ) : (
                      <div className="text-6xl font-black">{m.homeScore} - {m.awayScore}</div>
                    )}
                    <div className="text-center space-y-3">
                      {away && 'abbreviation' in away ? <CrestIcon shape={(away as any).emblemShape} pattern={(away as any).emblemPattern} c1={(away as any).crestPrimary} c2={(away as any).crestSecondary} c3={(away as any).crestTertiary || (away as any).crestPrimary} size="w-16 h-16" /> : <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-black">#{(away as any)?.jerseyNumber}</div>}
                      <p className="font-black text-sm uppercase">{away?.name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 border-l-4 border-accent pl-3">
                        <UserCheck className="text-accent" />
                        <h4 className="font-black uppercase text-sm">Estrella Local</h4>
                      </div>
                      {hPlayer ? (
                        <Card className="bg-muted/20 border-none rounded-2xl p-4">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center font-black text-lg">#{hPlayer.jerseyNumber}</div>
                            <div><p className="font-black uppercase">{hPlayer.name}</p><Badge variant="outline" className="text-[8px] h-4">{hPlayer.position}</Badge></div>
                          </div>
                          <div className="space-y-2">
                            {hPlayer.attributes.slice(0, 4).map(at => (
                              <div key={at.name} className="flex justify-between items-center text-[10px]">
                                <span className="font-bold opacity-60 uppercase">{at.name}</span>
                                <div className="flex-1 mx-3 h-1 bg-muted rounded-full overflow-hidden"><div className="h-full bg-accent" style={{ width: `${at.value}%` }} /></div>
                                <span className="font-black">{at.value}</span>
                              </div>
                            ))}
                          </div>
                        </Card>
                      ) : <p className="text-[10px] italic opacity-50">Sin datos de jugador.</p>}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 border-l-4 border-primary pl-3">
                        <UserCheck className="text-primary" />
                        <h4 className="font-black uppercase text-sm">Estrella Visitante</h4>
                      </div>
                      {aPlayer ? (
                        <Card className="bg-muted/20 border-none rounded-2xl p-4">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center font-black text-lg">#{aPlayer.jerseyNumber}</div>
                            <div><p className="font-black uppercase">{aPlayer.name}</p><Badge variant="outline" className="text-[8px] h-4">{aPlayer.position}</Badge></div>
                          </div>
                          <div className="space-y-2">
                            {aPlayer.attributes.slice(0, 4).map(at => (
                              <div key={at.name} className="flex justify-between items-center text-[10px]">
                                <span className="font-bold opacity-60 uppercase">{at.name}</span>
                                <div className="flex-1 mx-3 h-1 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${at.value}%` }} /></div>
                                <span className="font-black">{at.value}</span>
                              </div>
                            ))}
                          </div>
                        </Card>
                      ) : <p className="text-[10px] italic opacity-50">Sin datos de jugador.</p>}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted/30 border-t flex items-center justify-between">
                  <div>
                    {!isEditingResult ? (
                      <Button variant="outline" onClick={() => { setIsEditingResult(true); setEditedHomeScore(m.homeScore || 0); setEditedAwayScore(m.awayScore || 0); }} className="rounded-xl font-black text-xs h-10 hidden max-md:flex">EDITAR RESULTADO</Button>
                    ) : (
                      <Button onClick={() => {
                        const isDual = tournament.dualLeagueMatches?.some(dm => dm.id === m.id) || false;
                        resolveMatch(tournament.id, m.id, editedHomeScore, editedAwayScore, isDual, m.homePlayerId, m.awayPlayerId, false);
                        setSelectedMatchDetail({ ...m, homeScore: editedHomeScore, awayScore: editedAwayScore });
                        setIsEditingResult(false);
                        toast({ title: "Resultado actualizado" });
                      }} className="rounded-xl font-black bg-primary h-10 px-6">GUARDAR REVISIÓN</Button>
                    )}
                  </div>
                  <Button onClick={() => { setSelectedMatchDetail(null); setIsEditingResult(false); }} className="rounded-xl font-black px-8 h-10">CERRAR INFORME</Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="rounded-[2.5rem] max-w-2xl max-h-[90vh] overflow-y-auto border-none shadow-2xl">
          <DialogHeader><DialogTitle className="text-2xl font-black uppercase">Ajustes del Universo</DialogTitle></DialogHeader>
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
              <>
                <div className="grid grid-cols-2 gap-6"><div className="space-y-2"><Label>Plazas Playoff (Verde)</Label><Input type="number" value={editPlayoffSpots} onChange={e => setEditPlayoffSpots(Number(e.target.value))} className="rounded-xl h-12" /></div><div className="space-y-2"><Label>Plazas Descenso (Rojo)</Label><Input type="number" value={editRelegationSpots} onChange={e => setEditRelegationSpots(Number(e.target.value))} className="rounded-xl h-12" /></div></div>
                {tournament.mode === 'arcade' && (
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Sanciones Económicas Arcade</h4>
                    <div className="grid grid-cols-2 gap-6"><div className="space-y-2"><Label>Max Jornadas sin Fondos</Label><Input type="number" value={editArcadeMaxBrokeMatchdays} onChange={e => setEditArcadeMaxBrokeMatchdays(Number(e.target.value))} className="rounded-xl h-12" /></div><div className="space-y-2"><Label>Puntos de Sanción (Otorgados a rivales)</Label><Input type="number" value={editArcadeSanctionPoints} onChange={e => setEditArcadeSanctionPoints(Number(e.target.value))} className="rounded-xl h-12" /></div></div>
                  </div>
                )}
              </>
            )}
            
            {tournament.mode === 'challenge' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="text-[10px] font-black uppercase text-primary tracking-widest">Deportes Activos</h4>
                  <Button variant="outline" size="sm" onClick={() => {
                    const newId = `sport-${Date.now()}`;
                    setEditChallengeSports([...editChallengeSports, { id: newId, name: 'Nuevo Deporte', isNumeric: true, hasPeriods: false }]);
                  }} className="h-6 text-[10px] font-black"><Plus className="w-3 h-3 mr-1" /> AÑADIR</Button>
                </div>
                <div className="space-y-3">
                  {editChallengeSports.map((sp, idx) => (
                    <div key={sp.id} className="p-3 bg-muted/20 rounded-xl space-y-3 relative group">
                      <Button variant="ghost" size="icon" onClick={() => setEditChallengeSports(editChallengeSports.filter(s => s.id !== sp.id))} className="absolute top-2 right-2 w-6 h-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></Button>
                      <div className="grid grid-cols-[1fr_80px_80px] gap-2 mr-6">
                        <div className="space-y-1"><Label className="text-[10px] uppercase">Nombre</Label><Input value={sp.name} onChange={e => setEditChallengeSports(editChallengeSports.map(s => s.id === sp.id ? { ...s, name: e.target.value } : s))} className="h-8 text-xs font-bold" /></div>
                        <div className="flex items-center space-x-2 pt-5"><input type="checkbox" id={`isNumeric-${sp.id}`} checked={sp.isNumeric} onChange={e => setEditChallengeSports(editChallengeSports.map(s => s.id === sp.id ? { ...s, isNumeric: e.target.checked } : s))} className="rounded border-gray-300 text-primary" /><label htmlFor={`isNumeric-${sp.id}`} className="text-[10px] uppercase font-bold">Puntos</label></div>
                        <div className="flex items-center space-x-2 pt-5"><input type="checkbox" id={`hasPeriods-${sp.id}`} checked={sp.hasPeriods} onChange={e => setEditChallengeSports(editChallengeSports.map(s => s.id === sp.id ? { ...s, hasPeriods: e.target.checked } : s))} className="rounded border-gray-300 text-primary" /><label htmlFor={`hasPeriods-${sp.id}`} className="text-[10px] uppercase font-bold">Tiempos</label></div>
                      </div>
                      {sp.hasPeriods && (
                        <div className="grid grid-cols-3 gap-2 border-t pt-2">
                          <div className="space-y-1"><Label className="text-[10px] uppercase">Periodos</Label><Input type="number" value={sp.numPeriods || 2} onChange={e => setEditChallengeSports(editChallengeSports.map(s => s.id === sp.id ? { ...s, numPeriods: Number(e.target.value) } : s))} className="h-8 text-xs font-bold" /></div>
                          <div className="space-y-1"><Label className="text-[10px] uppercase">Dur. (s)</Label><Input type="number" value={sp.periodDuration || 300} onChange={e => setEditChallengeSports(editChallengeSports.map(s => s.id === sp.id ? { ...s, periodDuration: Number(e.target.value) } : s))} className="h-8 text-xs font-bold" /></div>
                          <div className="space-y-1"><Label className="text-[10px] uppercase">Desc. (s)</Label><Input type="number" value={sp.restDuration || 60} onChange={e => setEditChallengeSports(editChallengeSports.map(s => s.id === sp.id ? { ...s, restDuration: Number(e.target.value) } : s))} className="h-8 text-xs font-bold" /></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2"><Button variant="ghost" onClick={() => setIsEditing(false)} className="rounded-xl font-black">CANCELAR</Button><Button onClick={() => { if (!tournament) return; updateTournament({ ...tournament, name: editName, sport: editSport, playoffSpots: editPlayoffSpots, relegationSpots: editRelegationSpots, challengeSports: editChallengeSports, arcadeMaxBrokeMatchdays: editArcadeMaxBrokeMatchdays, arcadeSanctionPoints: editArcadeSanctionPoints }); setIsEditing(false); toast({ title: "Ajustes Guardados" }); }} className="font-black rounded-xl px-8 bg-primary">GUARDAR</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
