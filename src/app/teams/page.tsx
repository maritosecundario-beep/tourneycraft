"use client";

import { useState } from 'react';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Search, Trophy, Shield, UserPlus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

export default function TeamsPage() {
  const { teams, addTeam, deleteTeam } = useTournamentStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // New team form state
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [rating, setRating] = useState(50);
  const [stadium, setStadium] = useState('');

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.abbreviation.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddTeam = () => {
    if (!name || abbreviation.length !== 3) {
      toast({ title: "Error", description: "Name is required and Abbreviation must be 3 letters.", variant: "destructive" });
      return;
    }
    
    addTeam({
      id: Math.random().toString(36).substr(2, 9),
      name,
      abbreviation: abbreviation.toUpperCase(),
      rating,
      stadiumName: stadium,
      players: []
    });

    setName('');
    setAbbreviation('');
    setRating(50);
    setStadium('');
    setIsDialogOpen(false);
    
    toast({ title: "Team Created", description: `${name} has been added successfully.` });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground">Manage your clubs and rosters.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> Add Team
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-none">
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Team Name</Label>
                <Input id="name" placeholder="e.g. Madrid Stars" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="abbr">Abbreviation</Label>
                  <Input id="abbr" maxLength={3} placeholder="MDR" value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Overall Rating</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider value={[rating]} onValueChange={(vals) => setRating(vals[0])} max={100} min={1} step={1} className="flex-1" />
                    <span className="font-mono font-bold text-accent min-w-8">{rating}</span>
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stadium">Stadium Name</Label>
                <Input id="stadium" placeholder="e.g. Santiago Arena" value={stadium} onChange={(e) => setStadium(e.target.value)} />
              </div>
              <Button onClick={handleAddTeam} className="w-full">Create Team</Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input 
          className="pl-10 bg-card border-none h-12 text-lg shadow-lg" 
          placeholder="Search teams by name or abbreviation..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="border-none bg-card hover:ring-1 hover:ring-primary transition-all group overflow-hidden shadow-xl">
            <div className="h-24 bg-gradient-to-br from-primary/20 to-accent/10 flex items-end px-6 pb-2">
              <div className="w-16 h-16 bg-card rounded-xl shadow-lg flex items-center justify-center -mb-8 relative z-10">
                <Shield className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardHeader className="pt-10">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{team.name}</CardTitle>
                  <CardDescription className="font-mono font-bold text-accent uppercase">{team.abbreviation}</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Rating</p>
                  <p className="text-2xl font-bold text-primary">{team.rating}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Stadium</span>
                <span className="text-sm font-medium">{team.stadiumName || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Players</span>
                <span className="text-sm font-medium">{team.players.length}</span>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" variant="secondary" size="sm">
                  <UserPlus className="w-4 h-4 mr-2" /> Manage Roster
                </Button>
                <Button variant="destructive" size="icon" onClick={() => deleteTeam(team.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
