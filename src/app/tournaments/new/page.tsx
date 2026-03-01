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
import { Switch } from '@/components/ui/switch';
import { Wand2, Trophy, Settings2, Users } from 'lucide-react';
import { aiPoweredTournamentSetup } from '@/ai/flows/ai-powered-tournament-setup';
import { useToast } from '@/hooks/use-toast';
import { TournamentMode, TournamentFormat, ScoringRuleType } from '@/lib/types';

export default function NewTournamentPage() {
  const router = useRouter();
  const { addTournament, teams, settings } = useTournamentStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [aiDescription, setAiDescription] = useState('');

  // Manual Form State
  const [name, setName] = useState('');
  const [sport, setSport] = useState('Football');
  const [mode, setMode] = useState<TournamentMode>('normal');
  const [format, setFormat] = useState<TournamentFormat>('league');
  const [scoringType, setScoringType] = useState<ScoringRuleType>('nToNRange');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

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
        teams: [], // User needs to pick teams manually or AI picks top ratings
        settingsLocked: !result.allowAdjustmentsAfterCreation,
        winReward: result.initialTeamEconomics.winAmount,
        lossPenalty: result.initialTeamEconomics.lossAmount,
        drawReward: result.initialTeamEconomics.drawAmount,
        variability: result.initialTeamEconomics.maxChangePercentage,
        matches: []
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
      scoringRuleType: scoringType,
      teams: selectedTeams,
      settingsLocked: false,
      winReward: 100,
      lossPenalty: 25,
      drawReward: 40,
      variability: 10,
      matches: []
    };

    addTournament(newTourney as any);
    toast({ title: "Tournament Created", description: "Setting up your matches now." });
    router.push(`/tournaments/${newTourney.id}`);
  };

  const toggleTeam = (id: string) => {
    setSelectedTeams(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Trophy className="text-primary" /> Setup New Tournament
        </h1>
        <p className="text-muted-foreground">Choose your method of creation.</p>
      </header>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-14 bg-card p-1 rounded-2xl">
          <TabsTrigger value="manual" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Settings2 className="w-4 h-4 mr-2" /> Manual Setup
          </TabsTrigger>
          <TabsTrigger value="ai" className="rounded-xl data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <Wand2 className="w-4 h-4 mr-2" /> AI Assistant
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-6 space-y-6">
          <Card className="border-none bg-card shadow-xl">
            <CardHeader>
              <CardTitle>Core Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="tname">Tournament Name</Label>
                  <Input id="tname" placeholder="e.g. Champions League 2024" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sport">Sport Type</Label>
                  <Select value={sport} onValueChange={setSport}>
                    <SelectTrigger id="sport">
                      <SelectValue placeholder="Select Sport" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Football">Football</SelectItem>
                      <SelectItem value="Basketball">Basketball</SelectItem>
                      <SelectItem value="Tennis">Tennis</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Mode</Label>
                  <Select value={mode} onValueChange={(v: any) => setMode(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal (Fully Simulated)</SelectItem>
                      <SelectItem value="arcade">Arcade (Player Controlled)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Format</Label>
                  <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="league">League (Round Robin)</SelectItem>
                      <SelectItem value="knockout">Knockout (Bracket)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-card shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" /> Select Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {teams.map(team => (
                  <Button 
                    key={team.id} 
                    variant={selectedTeams.includes(team.id) ? "default" : "outline"}
                    className="justify-start truncate"
                    onClick={() => toggleTeam(team.id)}
                  >
                    <span className="w-8 h-8 bg-muted rounded flex items-center justify-center mr-2 text-xs">
                      {team.abbreviation}
                    </span>
                    {team.name}
                  </Button>
                ))}
              </div>
              {teams.length === 0 && <p className="text-center py-8 text-muted-foreground">No teams found. Create teams first!</p>}
            </CardContent>
          </Card>

          <Button onClick={handleCreateManual} className="w-full h-12 text-lg shadow-lg shadow-primary/20">
            Finalize Tournament
          </Button>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <Card className="border-none bg-card shadow-xl">
            <CardHeader>
              <CardTitle>AI Tournament Architect</CardTitle>
              <CardDescription>Describe your tournament in natural language and we'll handle the rest.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="aidec">Describe your tournament</Label>
                <textarea 
                  id="aidec" 
                  className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  placeholder="e.g. A 16-team soccer league with a playoff round. Win gives 150 CR, loss removes 50. High variability matches."
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                />
              </div>
              <Button onClick={handleCreateAI} disabled={loading || !aiDescription} className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/20">
                {loading ? "Architecting..." : "Generate Tournament Design"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
