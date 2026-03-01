
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wand2, Trophy, Settings2, Users, ArrowDownToLine, ArrowUpToLine } from 'lucide-react';
import { aiPoweredTournamentSetup } from '@/ai/flows/ai-powered-tournament-setup';
import { useToast } from '@/hooks/use-toast';
import { TournamentMode, TournamentFormat, ScoringRuleType } from '@/lib/types';

export default function NewTournamentPage() {
  const router = useRouter();
  const { addTournament, teams } = useTournamentStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [aiDescription, setAiDescription] = useState('');

  // Manual Form State
  const [name, setName] = useState('');
  const [sport, setSport] = useState('Football');
  const [mode, setMode] = useState<TournamentMode>('normal');
  const [format, setFormat] = useState<TournamentFormat>('league');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [playoffSpots, setPlayoffSpots] = useState(4);
  const [relegationSpots, setRelegationSpots] = useState(3);

  const handleCreateAI = async () => {
    if (!aiDescription) return;
    setLoading(true);
    try {
      const result = await aiPoweredTournamentSetup({ tournamentDescription: aiDescription });
      
      const newTourney = {
        id: Math.random().toString(36).substr(2, 9),
        name: result.tournamentName,
        sport: result.sport,
        mode: result.mode,
        format: result.format,
        scoringRuleType: result.scoringRules.type as ScoringRuleType,
        teams: [], 
        settingsLocked: !result.allowAdjustmentsAfterCreation,
        winReward: result.initialTeamEconomics.winAmount,
        lossPenalty: result.initialTeamEconomics.lossAmount,
        drawReward: result.initialTeamEconomics.drawAmount,
        variability: result.initialTeamEconomics.maxChangePercentage,
        matches: [],
        playoffSpots: result.hasPlayoffRound ? 4 : 0,
        relegationSpots: 3,
        currentSeason: 1
      };

      addTournament(newTourney as any);
      toast({ title: "Tournament Ready", description: "AI has pre-configured your tournament." });
      router.push(`/tournaments/${newTourney.id}`);
    } catch (e) {
      toast({ title: "AI Error", description: "Failed to parse description.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManual = () => {
    if (!name || selectedTeams.length < 2) {
      toast({ title: "Error", description: "Name and at least 2 teams are required.", variant: "destructive" });
      return;
    }

    const newTourney = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      sport,
      mode,
      format,
      scoringRuleType: 'nToNRange',
      teams: selectedTeams,
      settingsLocked: false,
      winReward: 100,
      lossPenalty: 25,
      drawReward: 40,
      variability: 10,
      matches: [],
      playoffSpots: format === 'league' ? playoffSpots : 0,
      relegationSpots: format === 'league' ? relegationSpots : 0,
      currentSeason: 1
    };

    addTournament(newTourney as any);
    toast({ title: "Tournament Created", description: "Setting up your matches now." });
    router.push(`/tournaments/${newTourney.id}`);
  };

  const toggleTeam = (id: string) => {
    setSelectedTeams(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      <header>
        <h1 className="text-4xl font-black flex items-center gap-3">
          <Trophy className="text-primary w-10 h-10" /> Tournament Architect
        </h1>
        <p className="text-muted-foreground text-lg">Define the structure of your next competitive season.</p>
      </header>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-16 bg-card p-1 rounded-3xl border shadow-sm">
          <TabsTrigger value="manual" className="rounded-2xl text-lg font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <Settings2 className="w-5 h-5 mr-2" /> Manual Setup
          </TabsTrigger>
          <TabsTrigger value="ai" className="rounded-2xl text-lg font-bold data-[state=active]:bg-accent data-[state=active]:text-accent-foreground transition-all">
            <Wand2 className="w-5 h-5 mr-2" /> AI Assistant
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-none bg-card shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-muted/20 border-b p-8">
              <CardTitle className="text-2xl font-black uppercase">Core Foundation</CardTitle>
              <CardDescription>Basic rules and identification.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tournament Name</Label>
                  <Input placeholder="e.g. World Super League" value={name} onChange={(e) => setName(e.target.value)} className="h-14 rounded-2xl text-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Sport Discipline</Label>
                  <Select value={sport} onValueChange={setSport}>
                    <SelectTrigger className="h-14 rounded-2xl text-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Football">⚽ Football</SelectItem>
                      <SelectItem value="Basketball">🏀 Basketball</SelectItem>
                      <SelectItem value="Tennis">🎾 Tennis</SelectItem>
                      <SelectItem value="E-Sports">🎮 E-Sports</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Operating Mode</Label>
                  <Select value={mode} onValueChange={(v: any) => setMode(v)}>
                    <SelectTrigger className="h-14 rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal (Simulated)</SelectItem>
                      <SelectItem value="arcade">Arcade (Player Focus)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Format</Label>
                  <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                    <SelectTrigger className="h-14 rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="league">League (Standings)</SelectItem>
                      <SelectItem value="knockout">Knockout (Bracket)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {format === 'league' && (
                <div className="grid gap-6 md:grid-cols-2 p-6 bg-accent/5 rounded-3xl border border-accent/20 animate-in zoom-in-95">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-black uppercase text-accent">
                      <ArrowUpToLine className="w-4 h-4" /> Playoff Spots
                    </Label>
                    <Input type="number" value={playoffSpots} onChange={e => setPlayoffSpots(Number(e.target.value))} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-black uppercase text-destructive">
                      <ArrowDownToLine className="w-4 h-4" /> Relegation Spots
                    </Label>
                    <Input type="number" value={relegationSpots} onChange={e => setRelegationSpots(Number(e.target.value))} className="h-12 rounded-xl" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none bg-card shadow-2xl rounded-[2.5rem]">
            <CardHeader className="p-8 border-b">
              <CardTitle className="text-2xl font-black uppercase flex items-center gap-3">
                <Users className="w-6 h-6 text-primary" /> Roster Selection
              </CardTitle>
              <CardDescription>Choose at least 2 teams to participate.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {teams.map(team => (
                  <Button 
                    key={team.id} 
                    variant={selectedTeams.includes(team.id) ? "default" : "outline"}
                    className={cn(
                      "h-16 rounded-2xl justify-start px-4 transition-all",
                      selectedTeams.includes(team.id) ? "shadow-lg scale-105" : "hover:bg-muted"
                    )}
                    onClick={() => toggleTeam(team.id)}
                  >
                    <div className="w-10 h-10 bg-muted/50 rounded-xl flex items-center justify-center mr-3 font-black text-xs">
                      {team.abbreviation}
                    </div>
                    <span className="font-bold truncate">{team.name}</span>
                  </Button>
                ))}
              </div>
              {teams.length === 0 && (
                <div className="text-center py-12 bg-muted/10 rounded-[2rem] border-2 border-dashed">
                  <p className="text-muted-foreground">No clubs found. Create some teams first!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Button onClick={handleCreateManual} className="w-full h-20 rounded-[2rem] text-2xl font-black shadow-2xl shadow-primary/20 bg-primary hover:bg-primary/90">
            LAUNCH SEASON
          </Button>
        </TabsContent>

        <TabsContent value="ai" className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-none bg-card shadow-2xl rounded-[3rem] overflow-hidden">
            <CardHeader className="bg-accent/10 border-b p-10">
              <CardTitle className="text-3xl font-black uppercase text-accent flex items-center gap-3">
                <Wand2 className="w-8 h-8" /> Generative Architect
              </CardTitle>
              <CardDescription className="text-lg">Describe the competition and let the AI build the rules, rewards, and spots.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="space-y-4">
                <Label className="text-sm font-black uppercase text-muted-foreground">Natural Language Brief</Label>
                <textarea 
                  className="flex min-h-[250px] w-full rounded-[2rem] border-none bg-muted/20 p-8 text-xl ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all"
                  placeholder="e.g. A 20-team European Super League. Top 4 go to playoffs, bottom 3 are relegated. High monetary rewards for wins..."
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleCreateAI} 
                disabled={loading || !aiDescription} 
                className="w-full h-20 rounded-[2rem] text-2xl font-black bg-accent hover:bg-accent/90 text-accent-foreground shadow-2xl shadow-accent/20"
              >
                {loading ? "Architecting Universe..." : "GENERATE TOURNAMENT"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
