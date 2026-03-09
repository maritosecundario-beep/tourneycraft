"use client";

import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users, UserPlus, PlayCircle, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { teams, players, tournaments } = useTournamentStore();

  const stats = [
    { name: 'Total Teams', value: teams.length, icon: Users, color: 'text-primary' },
    { name: 'Active Players', value: players.length, icon: UserPlus, color: 'text-accent' },
    { name: 'Tournaments', value: tournaments.length, icon: Trophy, color: 'text-yellow-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">Manage your competitive ecosystem and simulate greatness.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/teams">
              <Plus className="w-4 h-4 mr-2" /> New Team
            </Link>
          </Button>
          <Button asChild className="shadow-lg shadow-primary/20">
            <Link href="/tournaments/new">
              <PlayCircle className="w-4 h-4 mr-2" /> Create Tournament
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="border-none shadow-xl bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                {stat.name}
              </CardTitle>
              <stat.icon className={stat.color} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none bg-card shadow-xl">
          <CardHeader>
            <CardTitle>Recent Tournaments</CardTitle>
          </CardHeader>
          <CardContent>
            {tournaments.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-muted mx-auto mb-4" />
                <p className="text-muted-foreground">No active tournaments. Start by creating one!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tournaments.slice(0, 5).map((t) => (
                  <Link key={t.id} href={`/tournaments/manage?id=${t.id}`} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-bold">{t.name}</p>
                      <p className="text-xs text-muted-foreground uppercase">{t.sport} • {t.format}</p>
                    </div>
                    <Button size="sm" variant="ghost">View</Button>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-xl">
          <CardHeader>
            <CardTitle>Top Rated Teams</CardTitle>
          </CardHeader>
          <CardContent>
            {teams.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted mx-auto mb-4" />
                <p className="text-muted-foreground">No teams created yet. Build your first roster!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[...teams].sort((a, b) => b.rating - a.rating).slice(0, 5).map((team) => (
                  <div key={team.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                    <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center font-bold text-primary">
                      {team.abbreviation}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{team.name}</p>
                      <div className="w-full bg-muted h-1.5 rounded-full mt-2">
                        <div 
                          className="bg-accent h-full rounded-full" 
                          style={{ width: `${team.rating}%` }} 
                        />
                      </div>
                    </div>
                    <span className="font-mono font-bold text-accent">{team.rating}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}