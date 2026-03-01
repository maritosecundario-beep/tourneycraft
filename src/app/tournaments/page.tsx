"use client";

import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Plus, Calendar, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TournamentsPage() {
  const { tournaments } = useTournamentStore();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tournaments</h1>
          <p className="text-muted-foreground">Manage ongoing and finished competitions.</p>
        </div>
        <Button asChild className="shadow-lg shadow-primary/20">
          <Link href="/tournaments/new">
            <Plus className="w-4 h-4 mr-2" /> Start New
          </Link>
        </Button>
      </header>

      {tournaments.length === 0 ? (
        <Card className="border-none bg-card shadow-xl p-12 text-center">
          <Trophy className="w-16 h-16 text-muted mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2">No Tournaments Yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Create your first tournament using our AI assistant or set one up manually with custom rules.
          </p>
          <Button asChild size="lg">
            <Link href="/tournaments/new">Launch Competition</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="border-none bg-card hover:ring-2 hover:ring-primary transition-all shadow-xl group overflow-hidden">
              <div className="h-2 bg-primary w-full" />
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-1">{tournament.name}</CardTitle>
                    <CardDescription className="uppercase font-bold tracking-widest text-xs text-accent">
                      {tournament.sport} • {tournament.format}
                    </CardDescription>
                  </div>
                  <div className="p-2 bg-secondary rounded-lg">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" /> Participants
                    </span>
                    <span className="font-bold">{tournament.teams.length} Teams</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Progress
                    </span>
                    <span className="font-bold">0% Completed</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <Link href={`/tournaments/${tournament.id}`}>
                      <Play className="w-4 h-4 mr-2 fill-current" /> Manage
                    </Link>
                  </Button>
                  <Button variant="outline" size="icon">
                    <Settings2 className="w-4 h-4" />
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

import { Users, Settings2 } from 'lucide-react';
