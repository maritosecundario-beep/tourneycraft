
"use client";

import { useEffect, useState } from 'react';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Trophy, RefreshCw, ArrowLeft, Star, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CrestIcon } from '@/components/ui/crest-icon';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TournamentDetailViewProps {
  id: string;
}

export function TournamentDetailView({ id }: TournamentDetailViewProps) {
  const { tournaments, teams, resolveMatch, generateSchedule, settings } = useTournamentStore();
  const [tournament, setTournament] = useState<any>(null);

  useEffect(() => {
    const found = tournaments.find(t => t.id === id);
    if (found) setTournament(found);
  }, [tournaments, id]);

  if (!tournament) return (
    <div className="p-20 text-center space-y-4">
      <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
        <Trophy className="text-muted w-8 h-8" />
      </div>
      <p className="font-black uppercase text-muted-foreground tracking-tighter">Preparando Cancha...</p>
      <Button asChild variant="outline" className="rounded-xl font-black">
        <Link href="/tournaments">VOLVER AL PANEL</Link>
      </Button>
    </div>
  );

  const getStandings = (matchList: any[]) => {
    const stats: Record<string, any> = {};
    tournament.participants.forEach((pId: string) => {
      stats[pId] = { id: pId, played: 0, win: 0, draw: 0, loss: 0, points: 0 };
    });

    const winPts = tournament.winPoints || 0;
    const drawPts = tournament.drawPoints || 0;
    const lossPts = tournament.lossPoints || 0;

    matchList.filter(m => m.isSimulated).forEach(m => {
      if (stats[m.homeId] && stats[m.awayId]) {
        stats[m.homeId].played++;
        stats[m.awayId].played++;
        if (m.homeScore > m.awayScore) {
          stats[m.homeId].win++; stats[m.homeId].points += winPts;
          stats[m.awayId].loss++; stats[m.awayId].points += lossPts;
        } else if (m.awayScore > m.homeScore) {
          stats[m.awayId].win++; stats[m.awayId].points += winPts;
          stats[m.homeId].loss++; stats[m.homeId].points += lossPts;
        } else {
          stats[m.homeId].draw++; stats[m.homeId].points += drawPts;
          stats[m.awayId].draw++; stats[m.awayId].points += drawPts;
        }
      }
    });

    return Object.values(stats).sort((a: any, b: any) => b.points - a.points);
  };

  const handleSimulate = (match: any, isDual: boolean) => {
    const hScore = Math.floor(Math.random() * 10);
    const aScore = Math.floor(Math.random() * 10);
    resolveMatch(tournament.id, match.id, hScore, aScore, isDual);
  };

  const mainStandings = getStandings(tournament.matches);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/tournaments"><ArrowLeft /></Link>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">{tournament.name}</h1>
            <p className="text-muted-foreground uppercase font-black text-[10px] tracking-widest">{tournament.sport} • Season {tournament.currentSeason || 1}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => generateSchedule(tournament.id)} className="rounded-xl font-black h-12 border-primary text-primary">
          <RefreshCw className="w-4 h-4 mr-2" /> REGENERAR CALENDARIO
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue="matches">
            <TabsList className="bg-muted/20 p-1 rounded-2xl h-14 w-full md:w-auto">
              <TabsTrigger value="matches" className="flex-1 md:flex-none rounded-xl h-12 px-8 font-black uppercase text-xs">Calendario</TabsTrigger>
              <TabsTrigger value="standings" className="flex-1 md:flex-none rounded-xl h-12 px-8 font-black uppercase text-xs">Clasificación</TabsTrigger>
            </TabsList>

            <TabsContent value="matches" className="mt-6">
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {tournament.matches.length === 0 ? (
                    <div className="text-center py-20 bg-muted/10 rounded-[2rem] border-2 border-dashed">
                      <p className="font-bold text-muted-foreground uppercase text-xs">Sin partidos programados en esta fase.</p>
                    </div>
                  ) : (
                    tournament.matches.map((m: any, idx: number) => {
                      const home = teams.find(t => t.id === m.homeId);
                      const away = teams.find(t => t.id === m.awayId);
                      if (!home || !away) return null;
                      return (
                        <Card key={`match-view-${m.id || idx}`} className="border-none shadow-lg rounded-2xl overflow-hidden group">
                          <CardContent className="p-4 flex items-center justify-between gap-4 bg-card">
                            <div className="flex-1 flex items-center justify-end gap-3 overflow-hidden text-right">
                              <span className="font-black text-[10px] md:text-xs uppercase truncate">{home.name}</span>
                              <CrestIcon shape={home.emblemShape} pattern={home.emblemPattern} c1={home.crestPrimary} c2={home.crestSecondary} c3={home.crestTertiary || home.crestPrimary} size="w-8 h-8 md:w-10 md:h-10" />
                            </div>
                            
                            <div className="w-20 md:w-24 text-center shrink-0">
                              {m.isSimulated ? (
                                <div className="text-xl md:text-2xl font-black bg-muted/30 py-1 rounded-xl">{m.homeScore} - {m.awayScore}</div>
                              ) : (
                                <Button size="sm" onClick={() => handleSimulate(m, false)} className="w-full h-10 rounded-xl font-black bg-primary text-white shadow-lg shadow-primary/20">SIM</Button>
                              )}
                              <p className="text-[8px] font-black uppercase text-muted-foreground mt-1">Jornada {m.matchday}</p>
                            </div>

                            <div className="flex-1 flex items-center justify-start gap-3 overflow-hidden text-left">
                              <CrestIcon shape={away.emblemShape} pattern={away.emblemPattern} c1={away.crestPrimary} c2={away.crestSecondary} c3={away.crestTertiary || away.crestPrimary} size="w-8 h-8 md:w-10 md:h-10" />
                              <span className="font-black text-[10px] md:text-xs uppercase truncate">{away.name}</span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="standings" className="mt-6">
              <Card className="border-none shadow-2xl rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/20">
                    <TableRow>
                      <TableHead className="font-black text-[10px] uppercase">CLUB</TableHead>
                      <TableHead className="text-center font-black text-[10px] uppercase">PJ</TableHead>
                      <TableHead className="text-center font-black text-[10px] uppercase">V</TableHead>
                      <TableHead className="text-center font-black text-[10px] uppercase">E</TableHead>
                      <TableHead className="text-center font-black text-[10px] uppercase">D</TableHead>
                      <TableHead className="text-right font-black text-[10px] uppercase">PTS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mainStandings.map((row: any, idx: number) => {
                      const team = teams.find(t => t.id === row.id);
                      return (
                        <TableRow key={`standing-view-row-${row.id || idx}`}>
                          <TableCell className="font-black flex items-center gap-3">
                            <span className="text-[10px] opacity-30">{idx + 1}</span>
                            <CrestIcon shape={team?.emblemShape || 'shield'} pattern={team?.emblemPattern || 'none'} c1={team?.crestPrimary || '#000'} c2={team?.crestSecondary || '#fff'} c3={team?.crestTertiary || '#000'} size="w-6 h-6" />
                            <span className="truncate max-w-[100px] md:max-w-none text-xs">{team?.name || 'Invitado'}</span>
                          </TableCell>
                          <TableCell className="text-center text-xs">{row.played || 0}</TableCell>
                          <TableCell className="text-center text-xs">{row.win || 0}</TableCell>
                          <TableCell className="text-center text-xs">{row.draw || 0}</TableCell>
                          <TableCell className="text-center text-xs">{row.loss || 0}</TableCell>
                          <TableCell className="text-right font-black text-primary text-xs">{row.points || 0}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-xl rounded-[2rem] bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden">
            <CardHeader className="p-6 pb-0">
              <p className="text-[10px] font-black uppercase opacity-80 tracking-widest">Estado Competición</p>
              <h3 className="text-2xl font-black uppercase">Claves de Temporada</h3>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-between items-end border-b border-white/20 pb-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-black opacity-70">RECOMPENSA VICTORIA</p>
                  <p className="text-xl font-black">{tournament.winReward || 0} {settings.currency}</p>
                </div>
                <Coins className="w-8 h-8 opacity-30" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-4 rounded-2xl">
                  <p className="text-[8px] font-black opacity-70">PLAYOFFS</p>
                  <p className="text-lg font-black">{tournament.playoffSpots || 0} PLAZAS</p>
                </div>
                <div className="bg-black/10 p-4 rounded-2xl">
                  <p className="text-[8px] font-black opacity-70">DESCENSO</p>
                  <p className="text-lg font-black">{tournament.relegationSpots || 0} PLAZAS</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2rem]">
            <CardHeader><h3 className="font-black uppercase text-sm flex items-center gap-2"><Star className="text-accent w-4 h-4" /> Podium l'Horta</h3></CardHeader>
            <CardContent className="space-y-4">
              {mainStandings.slice(0, 3).map((row: any, idx: number) => {
                const team = teams.find(t => t.id === row.id);
                return (
                  <div key={`podium-view-item-${row.id || idx}`} className="flex items-center gap-4 p-3 bg-muted/20 rounded-xl group hover:bg-muted/40 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center font-black text-xs shadow-sm">{idx + 1}</div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-black text-xs uppercase truncate">{team?.name}</p>
                      <p className="text-[9px] font-bold text-muted-foreground">{row.points || 0} PUNTOS</p>
                    </div>
                    <CrestIcon shape={team?.emblemShape || 'shield'} pattern={team?.emblemPattern || 'none'} c1={team?.crestPrimary || '#000'} c2={team?.crestSecondary || '#fff'} c3={team?.crestTertiary || '#000'} size="w-8 h-8" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
