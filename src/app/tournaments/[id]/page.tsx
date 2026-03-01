
"use client";

import { useTournamentStore } from '@/hooks/use-tournament-store';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Calendar, Users, ArrowRight, Play, CheckCircle2, AlertCircle, PlusCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import { Tournament, Team, Match } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function TournamentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { tournaments, teams, updateTournament, addTournament } = useTournamentStore();
  const { toast } = useToast();
  
  const tournament = tournaments.find(t => t.id === id);
  const tTeams = useMemo(() => teams.filter(t => tournament?.teams.includes(t.id)), [teams, tournament]);

  if (!tournament) return <div className="p-20 text-center font-black">TOURNAMENT NOT FOUND</div>;

  const standings = useMemo(() => {
    if (tournament.format !== 'league') return [];
    
    const stats = tTeams.map(team => {
      let played = 0, won = 0, drawn = 0, lost = 0, gf = 0, ga = 0, pts = 0;
      
      tournament.matches.forEach(m => {
        if (m.homeScore === undefined || m.awayScore === undefined) return;
        
        if (m.homeTeamId === team.id) {
          played++;
          gf += m.homeScore;
          ga += m.awayScore;
          if (m.homeScore > m.awayScore) { won++; pts += 3; }
          else if (m.homeScore === m.awayScore) { drawn++; pts += 1; }
          else lost++;
        } else if (m.awayTeamId === team.id) {
          played++;
          gf += m.awayScore;
          ga += m.homeScore;
          if (m.awayScore > m.homeScore) { won++; pts += 3; }
          else if (m.awayScore === m.homeScore) { drawn++; pts += 1; }
          else lost++;
        }
      });
      
      return { ...team, played, won, drawn, lost, gf, ga, gd: gf - ga, pts };
    });
    
    return stats.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  }, [tournament, tTeams]);

  const isFinished = tournament.matches.length > 0 && tournament.matches.every(m => m.isSimulated);

  const handleSimulateMatch = (matchId: string) => {
    const updatedMatches = tournament.matches.map(m => {
      if (m.id === matchId) {
        const h = Math.floor(Math.random() * 5);
        const a = Math.floor(Math.random() * 5);
        return { ...m, homeScore: h, awayScore: a, isSimulated: true };
      }
      return m;
    });
    updateTournament({ ...tournament, matches: updatedMatches });
  };

  const handleSimulateAll = () => {
    const updatedMatches = tournament.matches.map(m => {
      if (m.isSimulated) return m;
      const h = Math.floor(Math.random() * 5);
      const a = Math.floor(Math.random() * 5);
      return { ...m, homeScore: h, awayScore: a, isSimulated: true };
    });
    updateTournament({ ...tournament, matches: updatedMatches });
    toast({ title: "Season Completed", description: "All matches have been simulated." });
  };

  const handleCreatePostSeason = (type: 'playoff' | 'relegation') => {
    const count = type === 'playoff' ? (tournament.playoffSpots || 4) : (tournament.relegationSpots || 3);
    const sortedIds = standings.map(s => s.id);
    const selectedIds = type === 'playoff' ? sortedIds.slice(0, count) : sortedIds.slice(-count);
    
    const newId = Math.random().toString(36).substr(2, 9);
    const postSeason = {
      ...tournament,
      id: newId,
      name: `${tournament.name} - ${type.toUpperCase()}`,
      format: 'knockout',
      teams: selectedIds,
      matches: [],
      currentSeason: tournament.currentSeason,
      settingsLocked: false
    };
    
    addTournament(postSeason as any);
    toast({ title: "Tournament Created", description: `Created ${type} with selected teams.` });
    router.push(`/tournaments/${newId}`);
  };

  const handleNextSeason = () => {
    const nextSeason = {
      ...tournament,
      id: Math.random().toString(36).substr(2, 9),
      name: `${tournament.name} - Season ${tournament.currentSeason + 1}`,
      matches: [],
      currentSeason: tournament.currentSeason + 1,
      settingsLocked: false
    };
    addTournament(nextSeason as any);
    toast({ title: "New Season Initialized", description: "Welcome to Season " + (tournament.currentSeason + 1) });
    router.push(`/tournaments/${nextSeason.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/20">
            <Trophy className="text-white w-10 h-10" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black uppercase tracking-tighter">{tournament.name}</h1>
              <Badge variant="outline" className="rounded-full px-4 border-primary text-primary font-black uppercase tracking-widest text-[10px]">
                Season {tournament.currentSeason}
              </Badge>
            </div>
            <p className="text-muted-foreground font-bold uppercase text-xs tracking-[0.3em] mt-1">
              {tournament.sport} • {tournament.format} • {tournament.teams.length} Teams
            </p>
          </div>
        </div>
        {!isFinished && (
          <Button onClick={handleSimulateAll} size="lg" className="h-16 rounded-2xl px-10 font-black shadow-xl shadow-primary/20">
            <Play className="w-5 h-5 mr-3 fill-current" /> SIMULATE ALL
          </Button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none bg-card shadow-2xl rounded-[3rem] overflow-hidden">
            <CardHeader className="bg-muted/10 border-b p-8">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-black uppercase">Clasificación General</CardTitle>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-accent rounded-full" /> <span className="text-[10px] font-black uppercase">Playoff</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-destructive rounded-full" /> <span className="text-[10px] font-black uppercase">Descenso</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/5">
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="w-16 text-center font-black">#</TableHead>
                    <TableHead className="font-black">CLUB</TableHead>
                    <TableHead className="text-center font-black">PJ</TableHead>
                    <TableHead className="text-center font-black">G</TableHead>
                    <TableHead className="text-center font-black">E</TableHead>
                    <TableHead className="text-center font-black">P</TableHead>
                    <TableHead className="text-center font-black">DG</TableHead>
                    <TableHead className="text-center font-black text-primary">PTS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standings.map((team, idx) => {
                    const isPlayoff = idx < (tournament.playoffSpots || 0);
                    const isRelegation = idx >= (standings.length - (tournament.relegationSpots || 0));
                    
                    return (
                      <TableRow key={team.id} className={cn(
                        "h-16 transition-colors",
                        isPlayoff && "bg-accent/5",
                        isRelegation && "bg-destructive/5"
                      )}>
                        <TableCell className="text-center font-black text-lg">
                          <div className="flex items-center justify-center relative">
                            {idx + 1}
                            {isPlayoff && <div className="absolute left-0 w-1 h-8 bg-accent rounded-full" />}
                            {isRelegation && <div className="absolute left-0 w-1 h-8 bg-destructive rounded-full" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-black text-[10px]">
                              {team.abbreviation}
                            </div>
                            <span className="font-bold">{team.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">{team.played}</TableCell>
                        <TableCell className="text-center font-medium">{team.won}</TableCell>
                        <TableCell className="text-center font-medium">{team.drawn}</TableCell>
                        <TableCell className="text-center font-medium">{team.lost}</TableCell>
                        <TableCell className={cn("text-center font-bold", team.gd > 0 ? "text-green-500" : "text-destructive")}>
                          {team.gd > 0 ? `+${team.gd}` : team.gd}
                        </TableCell>
                        <TableCell className="text-center font-black text-xl text-primary">{team.pts}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-none bg-card shadow-2xl rounded-[3rem]">
            <CardHeader className="p-8 border-b">
              <CardTitle className="text-xl font-black uppercase">Calendario & Resultados</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {tournament.matches.length === 0 ? (
                <div className="text-center py-20 bg-muted/5 rounded-[2rem] border-2 border-dashed">
                  <Calendar className="w-12 h-12 text-muted mx-auto mb-4" />
                  <p className="font-bold text-muted-foreground">Generating schedule...</p>
                  <Button variant="outline" className="mt-4 rounded-xl">AUTO-GENERATE MATCHDAYS</Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {tournament.matches.map(match => {
                    const hTeam = tTeams.find(t => t.id === match.homeTeamId);
                    const aTeam = tTeams.find(t => t.id === match.awayTeamId);
                    
                    return (
                      <div key={match.id} className="flex items-center justify-between p-6 bg-muted/10 rounded-2xl hover:bg-muted/20 transition-all border group">
                        <div className="flex-1 flex items-center justify-end gap-4">
                          <span className="font-black text-lg uppercase truncate">{hTeam?.name}</span>
                          <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center font-black text-xs">{hTeam?.abbreviation}</div>
                        </div>
                        
                        <div className="mx-8 flex items-center gap-3">
                          {match.isSimulated ? (
                            <div className="flex items-center gap-4 bg-primary/10 px-6 py-3 rounded-2xl border border-primary/20">
                              <span className="text-3xl font-black">{match.homeScore}</span>
                              <span className="text-muted-foreground font-black">VS</span>
                              <span className="text-3xl font-black">{match.awayScore}</span>
                            </div>
                          ) : (
                            <Button onClick={() => handleSimulateMatch(match.id)} variant="outline" className="h-14 px-8 rounded-2xl font-black gap-2 hover:bg-primary hover:text-white transition-all">
                              <Play className="w-4 h-4" /> SIMULAR
                            </Button>
                          )}
                        </div>

                        <div className="flex-1 flex items-center justify-start gap-4">
                          <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center font-black text-xs">{aTeam?.abbreviation}</div>
                          <span className="font-black text-lg uppercase truncate">{aTeam?.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {isFinished && (
            <Card className="border-none bg-primary text-primary-foreground shadow-2xl rounded-[3rem] animate-in slide-in-from-right-10 duration-700">
              <CardHeader className="p-8">
                <CardTitle className="text-2xl font-black uppercase flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8" /> Fin de Temporada
                </CardTitle>
                <CardDescription className="text-primary-foreground/80">La temporada {tournament.currentSeason} ha finalizado. Define el siguiente paso.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-4">
                <Button onClick={handleNextSeason} className="w-full h-16 rounded-2xl bg-white text-primary font-black text-lg hover:bg-white/90">
                  <RefreshCw className="w-5 h-5 mr-3" /> SIGUIENTE TEMPORADA
                </Button>
                
                {tournament.playoffSpots > 0 && (
                  <Button onClick={() => handleCreatePostSeason('playoff')} variant="secondary" className="w-full h-16 rounded-2xl font-black text-lg">
                    <ArrowUpToLine className="w-5 h-5 mr-3" /> CREAR PLAYOFFS
                  </Button>
                )}
                
                {tournament.relegationSpots > 0 && (
                  <Button onClick={() => handleCreatePostSeason('relegation')} variant="outline" className="w-full h-16 rounded-2xl font-black text-lg border-white/50 hover:bg-white/10">
                    <ArrowDownToLine className="w-5 h-5 mr-3" /> TORNEO DE DESCENSO
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-none bg-card shadow-2xl rounded-[3rem]">
            <CardHeader className="p-8">
              <CardTitle className="text-xl font-black uppercase">Tournament Stats</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="p-4 bg-muted/10 rounded-2xl border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Play className="text-primary w-5 h-5" />
                  <span className="text-xs font-black uppercase text-muted-foreground">Progreso</span>
                </div>
                <span className="font-black">
                  {Math.round((tournament.matches.filter(m => m.isSimulated).length / tournament.matches.length) * 100 || 0)}%
                </span>
              </div>
              <div className="p-4 bg-muted/10 rounded-2xl border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="text-accent w-5 h-5" />
                  <span className="text-xs font-black uppercase text-muted-foreground">Clubs</span>
                </div>
                <span className="font-black">{tournament.teams.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
