
"use client";

import { useTournamentStore } from '@/hooks/use-tournament-store';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Calendar, Users, ArrowUpToLine, ArrowDownToLine, Play, CheckCircle2, RefreshCw, Coins, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { Team, Player, Match } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function TournamentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { tournaments, teams, players, updateTournament, addTournament } = useTournamentStore();
  const { toast } = useToast();
  
  const tournament = tournaments.find(t => t.id === id);
  
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

  const isFinished = tournament.matches.length > 0 && tournament.matches.every(m => m.isSimulated);

  const simulateMatch = (match: Match) => {
    let h = 0, a = 0;
    const rule = tournament.scoringRuleType;
    const val = tournament.scoringValue || 3;

    if (rule === 'bestOfN') {
      const target = Math.ceil(val / 2);
      h = Math.random() > 0.5 ? target : Math.floor(Math.random() * target);
      a = h === target ? Math.floor(Math.random() * target) : target;
    } else if (rule === 'firstToN') {
      h = Math.random() > 0.5 ? val : Math.floor(Math.random() * val);
      a = h === val ? Math.floor(Math.random() * val) : val;
    } else {
      h = Math.floor(Math.random() * 5); // Simulación básica de goles
      a = Math.floor(Math.random() * 5);
    }

    return { ...match, homeScore: h, awayScore: a, isSimulated: true };
  };

  const handleSimulateMatch = (matchId: string) => {
    const updatedMatches = tournament.matches.map(m => m.id === matchId ? simulateMatch(m) : m);
    updateTournament({ ...tournament, matches: updatedMatches });
  };

  const handleSimulateAll = () => {
    const updatedMatches = tournament.matches.map(m => m.isSimulated ? m : simulateMatch(m));
    updateTournament({ ...tournament, matches: updatedMatches });
    toast({ title: "Simulación Completa", description: "Todos los encuentros han sido procesados." });
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
              {tournament.sport} • {tournament.format} • {tournament.participants.length} {tournament.entryType === 'teams' ? 'Clubs' : 'Agentes'}
            </p>
          </div>
        </div>
        {!isFinished && (
          <Button onClick={handleSimulateAll} size="lg" className="h-16 rounded-2xl px-10 font-black shadow-xl shadow-primary/20 w-full md:w-auto">
            <Play className="w-5 h-5 mr-3 fill-current" /> SIMULAR TODO
          </Button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 md:px-0">
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
                      <TableHead className="text-center font-black">PJ</TableHead>
                      <TableHead className="text-center font-black text-primary">PTS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.standings.map((item, idx) => {
                      const isPlayoff = idx < (tournament.playoffSpots || 0);
                      const isRelegation = idx >= (group.standings.length - (tournament.relegationSpots || 0));
                      const isManaged = item.id === tournament.managedParticipantId;
                      
                      return (
                        <TableRow key={item.id} className={cn(
                          "h-16 transition-colors",
                          isPlayoff && "bg-accent/5",
                          isRelegation && "bg-destructive/5",
                          isManaged && "ring-2 ring-accent ring-inset"
                        )}>
                          <TableCell className="text-center font-black text-lg">
                            <div className="relative flex items-center justify-center">
                              {idx + 1}
                              {isPlayoff && <div className="absolute left-0 w-1 h-8 bg-accent rounded-full" />}
                              {isRelegation && <div className="absolute left-0 w-1 h-8 bg-destructive rounded-full" />}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-black text-[10px]">
                                {'abbreviation' in item ? item.abbreviation : item.name.substring(0,2).toUpperCase()}
                              </div>
                              <span className={cn("font-bold truncate max-w-[150px]", isManaged && "text-accent")}>{item.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-medium">{item.played}</TableCell>
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

        <div className="space-y-8">
          <Card className="border-none bg-card shadow-2xl rounded-[3rem] overflow-hidden">
            <CardHeader className="p-8 border-b bg-primary/5">
              <CardTitle className="text-lg font-black uppercase flex items-center gap-2">
                <Target className="w-5 h-5" /> Configuración Élite
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-xs font-bold text-muted-foreground uppercase">Regla</span>
                <Badge variant="secondary" className="uppercase">{tournament.scoringRuleType}</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-xs font-bold text-muted-foreground uppercase">Premio Victoria</span>
                <span className="font-black text-accent">+{tournament.winReward} CR</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-xs font-bold text-muted-foreground uppercase">Variabilidad</span>
                <span className="font-black">{tournament.variability}%</span>
              </div>
            </CardContent>
          </Card>

          {isFinished && (
            <Card className="border-none bg-primary text-primary-foreground shadow-2xl rounded-[3rem] animate-in slide-in-from-right-10">
              <CardHeader className="p-8">
                <CardTitle className="text-xl font-black uppercase flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6" /> Temporada Finalizada
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-3">
                <Button className="w-full h-14 rounded-2xl bg-white text-primary font-black shadow-xl hover:bg-white/90">
                  <RefreshCw className="w-4 h-4 mr-2" /> REPETIR LIGA
                </Button>
                {tournament.playoffSpots > 0 && (
                  <Button variant="secondary" className="w-full h-14 rounded-2xl font-black bg-accent text-white hover:bg-accent/90">
                    <Trophy className="w-4 h-4 mr-2" /> LANZAR PLAYOFFS
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
