
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
import { Wand2, Trophy, Users, Coins, Target, User, Layers, ShieldCheck, Plus, Trash2, Group, Brackets, ShieldAlert } from 'lucide-react';
import { aiPoweredTournamentSetup } from '@/ai/flows/ai-powered-tournament-setup';
import { useToast } from '@/hooks/use-toast';
import { TournamentMode, TournamentFormat, ScoringRuleType, TournamentEntryType, LeagueType, TournamentGroup } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CrestIcon } from '@/components/ui/crest-icon';

export default function NewTournamentPage() {
  const router = useRouter();
  const { addTournament, teams, players } = useTournamentStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [aiDescription, setAiDescription] = useState('');

  // Manual Form State
  const [name, setName] = useState('');
  const [sport, setSport] = useState('Basketball');
  const [entryType, setEntryType] = useState<TournamentEntryType>('teams');
  const [mode, setMode] = useState<TournamentMode>('normal');
  const [format, setFormat] = useState<TournamentFormat>('league');
  const [leagueType, setLeagueType] = useState<LeagueType>('single-table');
  const [groupIsolation, setGroupIsolation] = useState(true);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [dualLeagueEnabled, setDualLeagueEnabled] = useState(false);
  const [managedParticipantId, setManagedParticipantId] = useState('');
  
  // Group Management
  const [groups, setGroups] = useState<TournamentGroup[]>([
    { name: 'Grupo A', participantIds: [] },
    { name: 'Grupo B', participantIds: [] }
  ]);
  
  // Scoring & Econ
  const [scoringType, setScoringType] = useState<ScoringRuleType>('bestOfN');
  const [scoringValue, setScoringValue] = useState(9);
  
  // Economic Values
  const [winReward, setWinReward] = useState(10);
  const [lossPenalty, setLossPenalty] = useState(15);
  const [drawReward, setDrawReward] = useState(0);
  
  // Points System
  const [winPoints, setWinPoints] = useState(1);
  const [lossPoints, setLossPoints] = useState(0);
  const [drawPoints, setDrawPoints] = useState(0);
  const [variability, setVariability] = useState(10);
  
  const [playoffSpots, setPlayoffSpots] = useState(8);
  const [relegationSpots, setRelegationSpots] = useState(4);

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
        entryType: 'teams',
        format: result.format,
        groupIsolation: true,
        scoringRuleType: result.scoringRules.type as ScoringRuleType,
        scoringValue: result.scoringRules.bestOfNValue || result.scoringRules.firstToNValue || 9,
        participants: [], 
        dualLeagueEnabled: result.leagueDetails?.dualLeagueEnabled || false,
        dualLeagueMatches: [],
        winReward: result.initialTeamEconomics.winAmount,
        lossPenalty: result.initialTeamEconomics.lossAmount,
        drawReward: result.initialTeamEconomics.drawAmount,
        winPoints: 1, lossPoints: 0, drawPoints: 0,
        variability: result.initialTeamEconomics.maxChangePercentage,
        matches: [],
        playoffSpots: 8,
        relegationSpots: 4,
        currentSeason: 1,
        currentMatchday: 1
      };
      addTournament(newTourney as any);
      toast({ title: "Torneo IA Preparado" });
      router.push(`/tournaments/${newTourney.id}`);
    } catch (e) {
      toast({ title: "Error IA", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManual = () => {
    if (!name || selectedParticipants.length < 2) {
      toast({ title: "Error", description: "Nombre y al menos 2 participantes requeridos.", variant: "destructive" });
      return;
    }
    const finalGroups = leagueType === 'groups' ? groups.map(g => ({
      ...g, participantIds: g.participantIds.filter(id => selectedParticipants.includes(id))
    })).filter(g => g.participantIds.length > 0) : undefined;

    const newTourney = {
      id: Math.random().toString(36).substr(2, 9),
      name, sport, entryType, mode, format, leagueType, groupIsolation,
      managedParticipantId: mode === 'arcade' ? managedParticipantId : undefined,
      scoringRuleType: scoringType, scoringValue,
      participants: selectedParticipants, groups: finalGroups,
      dualLeagueEnabled, dualLeagueMatches: [], winReward, lossPenalty, drawReward,
      winPoints, lossPoints, drawPoints,
      variability, matches: [], playoffSpots, relegationSpots, currentSeason: 1, currentMatchday: 1
    };
    addTournament(newTourney as any);
    toast({ title: "Competición Creada" });
    router.push(`/tournaments/${newTourney.id}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      <header>
        <h1 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-3">
          <Trophy className="text-primary w-10 h-10" /> Architect Studio
        </h1>
        <p className="text-muted-foreground">Configura los puntos, créditos y reglas de tu liga.</p>
      </header>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-16 bg-card p-1 rounded-3xl border shadow-xl">
          <TabsTrigger value="manual" className="rounded-2xl text-lg font-black">DISEÑO MANUAL</TabsTrigger>
          <TabsTrigger value="ai" className="rounded-2xl text-lg font-black">ASISTENTE IA</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none bg-card shadow-2xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-muted/20 border-b p-8">
                <CardTitle className="text-xl font-black uppercase">Estructura Base</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2"><Label>Nombre</Label><Input value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Deporte</Label><Input value={sport} onChange={e => setSport(e.target.value)} className="h-12 rounded-xl" /></div>
                  <div className="space-y-2">
                    <Label>Modo</Label>
                    <Select value={mode} onValueChange={(v: any) => setMode(v)}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="normal">Simulación</SelectItem><SelectItem value="arcade">Arcade</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Brackets className="w-3 h-3 text-green-500" /> Playoff Spots</Label>
                    <Input type="number" value={playoffSpots} onChange={e => setPlayoffSpots(Number(e.target.value))} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><ShieldAlert className="w-3 h-3 text-red-500" /> Relegation Spots</Label>
                    <Input type="number" value={relegationSpots} onChange={e => setRelegationSpots(Number(e.target.value))} className="h-12 rounded-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-card shadow-2xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-primary/5 border-b p-8"><CardTitle className="text-xl font-black uppercase flex items-center gap-2"><Target className="text-primary" /> Reglas de Competición</CardTitle></CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1"><Label className="text-[10px]">Puntos G.</Label><Input type="number" value={winPoints} onChange={e => setWinPoints(Number(e.target.value))} /></div>
                  <div className="space-y-1"><Label className="text-[10px]">Puntos P.</Label><Input type="number" value={lossPoints} onChange={e => setLossPoints(Number(e.target.value))} /></div>
                  <div className="space-y-1"><Label className="text-[10px]">Puntos E.</Label><Input type="number" value={drawPoints} onChange={e => setDrawPoints(Number(e.target.value))} /></div>
                </div>
                <div className="p-6 bg-accent/5 rounded-3xl border space-y-4">
                  <Label className="text-xs font-black uppercase text-accent flex items-center gap-2"><Coins className="w-4 h-4" /> Economía (CR)</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1"><Label className="text-[10px]">Win (+)</Label><Input type="number" value={winReward} onChange={e => setWinReward(Number(e.target.value))} /></div>
                    <div className="space-y-1"><Label className="text-[10px]">Loss (-)</Label><Input type="number" value={lossPenalty} onChange={e => setLossPenalty(Number(e.target.value))} /></div>
                    <div className="space-y-1"><Label className="text-[10px]">Draw</Label><Input type="number" value={drawReward} onChange={e => setDrawReward(Number(e.target.value))} /></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="p-8 bg-card border-2 border-dashed rounded-[3rem] space-y-6">
            <header className="flex justify-between items-center">
              <h2 className="text-xl font-black uppercase flex items-center gap-2"><Users className="text-primary" /> Inscripción de Equipos ({selectedParticipants.length})</h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedParticipants(teams.map(t => t.id))} className="text-[10px] font-black uppercase">TODOS</Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedParticipants([])} className="text-[10px] font-black uppercase">NINGUNO</Button>
              </div>
            </header>
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pr-4">
                {teams.map(team => {
                  const isSelected = selectedParticipants.includes(team.id);
                  return (
                    <button 
                      key={team.id} 
                      onClick={() => setSelectedParticipants(prev => isSelected ? prev.filter(id => id !== team.id) : [...prev, team.id])}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all text-left group relative",
                        isSelected ? "bg-primary/10 border-primary" : "bg-card border-transparent hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <CrestIcon shape={team.emblemShape} pattern={team.emblemPattern} c1={team.crestPrimary} c2={team.crestSecondary} c3={team.crestTertiary || team.crestSecondary} size="w-6 h-6" />
                        <span className="font-black text-[10px] uppercase truncate">{team.name}</span>
                      </div>
                      {isSelected && <Plus className="absolute top-2 right-2 w-3 h-3 text-primary rotate-45" />}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <Button onClick={handleCreateManual} disabled={selectedParticipants.length < 2 || !name} className="w-full h-20 rounded-[2.5rem] text-2xl font-black bg-primary">CREAR UNIVERSO</Button>
        </TabsContent>

        <TabsContent value="ai" className="mt-8">
          <Card className="rounded-[3rem] overflow-hidden">
            <CardHeader className="bg-accent/10 p-10"><CardTitle className="text-3xl font-black uppercase text-accent">Generative Architect</CardTitle></CardHeader>
            <CardContent className="p-10 space-y-8">
              <textarea className="min-h-[250px] w-full rounded-[2rem] border-none bg-muted/20 p-8 text-xl focus-visible:ring-2 focus-visible:ring-accent" placeholder="Describe tu liga..." value={aiDescription} onChange={(e) => setAiDescription(e.target.value)} />
              <Button onClick={handleCreateAI} disabled={loading || !aiDescription} className="w-full h-20 rounded-[2rem] text-2xl font-black bg-accent">CREAR CON IA</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
