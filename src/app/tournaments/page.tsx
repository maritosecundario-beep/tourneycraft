"use client";

import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Plus, Calendar, Play, Users, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TournamentsPage() {
  const { tournaments } = useTournamentStore();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tighter">Tournaments</h1>
          <p className="text-muted-foreground">Gestiona las competiciones activas de l'Horta y el ranking global.</p>
        </div>
        <Button asChild className="shadow-lg shadow-primary/20 rounded-xl font-black">
          <Link href="/tournaments/new">
            <Plus className="w-4 h-4 mr-2" /> NUEVA TEMPORADA
          </Link>
        </Button>
      </header>

      {tournaments.length === 0 ? (
        <Card className="border-none bg-card shadow-xl p-12 text-center rounded-[3rem]">
          <Trophy className="w-16 h-16 text-muted mx-auto mb-6" />
          <h2 className="text-2xl font-black mb-2 uppercase">Sin competiciones</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 font-medium">
            Crea tu primer torneo usando el asistente de IA o configúralo manualmente con reglas personalizadas.
          </p>
          <Button asChild size="lg" className="rounded-2xl font-black h-14 px-10">
            <Link href="/tournaments/new">LANZAR COMPETICIÓN</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="border-none bg-card hover:ring-2 hover:ring-primary transition-all shadow-xl group overflow-hidden rounded-[2.5rem]">
              <div className="h-2 bg-primary w-full" />
              <CardHeader className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1 overflow-hidden">
                    <CardTitle className="text-xl mb-1 truncate font-black uppercase tracking-tight">{tournament.name}</CardTitle>
                    <CardDescription className="uppercase font-black tracking-[0.2em] text-[10px] text-accent">
                      {tournament.sport} • {tournament.format}
                    </CardDescription>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-2xl shrink-0">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between text-xs font-bold uppercase">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" /> Participantes
                    </span>
                    <span className="font-black text-foreground">
                      {tournament.participants?.length || 0} {tournament.entryType === 'teams' ? 'Clubs' : 'Agentes'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold uppercase">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Progreso
                    </span>
                    <span className="font-black text-primary">Season {tournament.currentSeason}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button asChild className="flex-1 h-12 rounded-xl font-black shadow-lg">
                    <Link href={`/tournaments/manage?id=${tournament.id}`}>
                      <Play className="w-4 h-4 mr-2 fill-current" /> GESTIONAR
                    </Link>
                  </Button>
                  <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-muted">
                    <Settings2 className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}