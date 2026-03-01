
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
import { Wand2, Trophy, Settings2, Users, ArrowDownToLine, ArrowUpToLine, Coins, Target, User, Layers } from 'lucide-react';
import { aiPoweredTournamentSetup } from '@/ai/flows/ai-powered-tournament-setup';
import { useToast } from '@/hooks/use-toast';
import { TournamentMode, TournamentFormat, ScoringRuleType, TournamentEntryType, LeagueType, Match } from '@/lib/types';
import { cn } from '@/lib/utils';

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
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [dualLeagueEnabled, setDualLeagueEnabled] = useState(false);
  
  // Scoring & Econ
  const [scoringType, setScoringType] = useState<ScoringRuleType>('nToNRange');
  const [scoringValue, setScoringValue] = useState(3);
  const [nToNRangeMin, setNToNRangeMin] = useState(80);
  const [nToNRangeMax, setNToNRangeMax] = useState(150);
  const [winReward, setWinReward] = useState(100);
  const [lossPenalty, setLossPenalty] = useState(20);
  const [drawReward, setDrawReward] = useState(40);
  const [variability, setVariability] = useState(10);
  
  const [playoffSpots, setPlayoffSpots] = useState(4);
  const [relegationSpots, setRelegationSpots] = useState(2);

  const generateDualLeagueMatches = (participants: string[]): Match[] => {
    const matches: Match[] = [];
    let matchId = 1;
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        matches.push({
          id: `dual-${matchId++}`,
          homeId: participants[i],
          awayId: participants[j],
          isSimulated: false,
          matchday: Math.floor(matchId / 2) + 1
        });
      }
    }
    return matches;
  };

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
        scoringRuleType: result.scoringRules.type as ScoringRuleType,
        scoringValue: result.scoringRules.bestOfNValue || result.scoringRules.firstToNValue || 3,
        nToNRangeMin: result.scoringRules.nToNRangeMin,
        nToNRangeMax: result.scoringRules.nToNRangeMax,
        participants: [], 
        dualLeagueEnabled: result.leagueDetails?.dualLeagueEnabled || false,
        dualLeagueMatches: [],
        settingsLocked: !result.allowAdjustmentsAfterCreation,
        winReward: result.initialTeamEconomics.winAmount,
        lossPenalty: result.initialTeamEconomics.lossAmount,
        drawReward: result.initialTeamEconomics.drawAmount,
        variability: result.initialTeamEconomics.maxChangePercentage,
        matches: [],
        playoffSpots: result.hasPlayoffRound ? 4 : 0,
        relegationSpots: 2,
        currentSeason: 1
      };

      addTournament(newTourney as any);
      toast({ title: "Torneo IA Preparado", description: "La IA ha configurado tu universo de competición." });
      router.push(`/tournaments/${newTourney.id}`);
    } catch (e) {
      toast({ title: "Error IA", description: "No se pudo interpretar la descripción del torneo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManual = () => {
    if (!name || selectedParticipants.length < 2) {
      toast({ title: "Error", description: "Nombre y al menos 2 participantes requeridos.", variant: "destructive" });
      return;
    }

    const dualMatches = dualLeagueEnabled ? generateDualLeagueMatches(selectedParticipants) : [];

    const newTourney = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      sport,
      entryType,
      mode,
      format,
      leagueType,
      scoringRuleType: scoringType,
      scoringValue,
      nToNRangeMin: scoringType === 'nToNRange' ? nToNRangeMin : undefined,
      nToNRangeMax: scoringType === 'nToNRange' ? nToNRangeMax : undefined,
      participants: selectedParticipants,
      dualLeagueEnabled,
      dualLeagueMatches: dualMatches,
      settingsLocked: false,
      winReward,
      lossPenalty,
      drawReward,
      variability,
      matches: [],
      playoffSpots: format === 'league' ? playoffSpots : 0,
      relegationSpots: format === 'league' ? relegationSpots : 0,
      currentSeason: 1
    };

    addTournament(newTourney as any);
    toast({ title: "Temporada Lanzada", description: "Competición creada con éxito." });
    router.push(`/tournaments/${newTourney.id}`);
  };

  const toggleParticipant = (id: string) => {
    setSelectedParticipants(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      <header>
        <h1 className="text-4xl font-black flex items-center gap-3 uppercase tracking-tighter">
          <Trophy className="text-primary w-10 h-10" /> Architect Studio
        </h1>
        <p className="text-muted-foreground text-lg">Configura las reglas, economía y participantes de tu universo.</p>
      </header>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-16 bg-card p-1 rounded-3xl border shadow-xl">
          <TabsTrigger value="manual" className="rounded-2xl text-lg font-black data-[state=active]:bg-primary data-[state=active]:text-white">
            DISEÑO MANUAL
          </TabsTrigger>
          <TabsTrigger value="ai" className="rounded-2xl text-lg font-black data-[state=active]:bg-accent data-[state=active]:text-white">
            ASISTENTE IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none bg-card shadow-2xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-muted/20 border-b p-8">
                <CardTitle className="text-xl font-black uppercase">Estructura Base</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label>Nombre de la Competición</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Lliga l'Horta 2024" className="h-12 rounded-xl" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Disciplina</Label>
                    <Input value={sport} onChange={e => setSport(e.target.value)} placeholder="Basketball, Fútbol..." className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Participantes</Label>
                    <Select value={entryType} onValueChange={(v: any) => { setEntryType(v); setSelectedParticipants([]); }}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teams">Clubs (Equipos)</SelectItem>
                        <SelectItem value="players">Agentes (Individual)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Formato</Label>
                    <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="league">Liga (Puntos)</SelectItem>
                        <SelectItem value="knockout">Eliminatoria</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Modo</Label>
                    <Select value={mode} onValueChange={(v: any) => setMode(v)}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Simulado (General)</SelectItem>
                        <SelectItem value="arcade">Arcade (Enfocado)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {mode === 'arcade' && (
                  <div className="flex items-center justify-between p-4 bg-accent/5 rounded-2xl border border-accent/20">
                    <div className="flex items-center gap-3">
                      <Layers className="text-accent" />
                      <div>
                        <p className="text-sm font-black uppercase">Liga Dual Paralela</p>
                        <p className="text-[10px] text-muted-foreground">Simular liga de reservas/B-teams</p>
                      </div>
                    </div>
                    <Switch checked={dualLeagueEnabled} onCheckedChange={setDualLeagueEnabled} />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none bg-card shadow-2xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-primary/5 border-b p-8">
                <CardTitle className="text-xl font-black uppercase flex items-center gap-2">
                  <Target className="text-primary" /> Reglas de Juego
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <Label className="text-xs font-black uppercase text-muted-foreground">Sistema de Puntuación</Label>
                  <Select value={scoringType} onValueChange={(v: any) => setScoringType(v)}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nToNRange">Rango de Puntos (Dual)</SelectItem>
                      <SelectItem value="bestOfN">Al mejor de N (Sets/Periodos)</SelectItem>
                      <SelectItem value="firstToN">Primero en marcar N (Arcade)</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {scoringType === 'nToNRange' && (
                    <div className="grid grid-cols-2 gap-4 animate-in zoom-in-95">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase">Mínimo Suma</Label>
                        <Input type="number" value={nToNRangeMin} onChange={e => setNToNRangeMin(Number(e.target.value))} className="h-10 rounded-lg" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase">Máximo Suma</Label>
                        <Input type="number" value={nToNRangeMax} onChange={e => setNToNRangeMax(Number(e.target.value))} className="h-10 rounded-lg" />
                      </div>
                    </div>
                  )}

                  {(scoringType === 'bestOfN' || scoringType === 'firstToN') && (
                    <div className="flex items-center gap-4 animate-in zoom-in-95">
                      <Label className="shrink-0 font-black uppercase text-xs">Valor de N:</Label>
                      <Input type="number" value={scoringValue} onChange={e => setScoringValue(Number(e.target.value))} className="h-10 w-24 rounded-lg" />
                    </div>
                  )}
                </div>

                <div className="p-6 bg-accent/5 rounded-3xl border space-y-4">
                  <Label className="text-xs font-black uppercase text-accent flex items-center gap-2">
                    <Coins className="w-4 h-4" /> Economía de Temporada
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Victoria (+)</Label>
                      <Input type="number" value={winReward} onChange={e => setWinReward(Number(e.target.value))} className="h-10" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Derrota (-)</Label>
                      <Input type="number" value={lossPenalty} onChange={e => setLossPenalty(Number(e.target.value))} className="h-10" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Empate (=)</Label>
                      <Input type="number" value={drawReward} onChange={e => setDrawReward(Number(e.target.value))} className="h-10" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Variabilidad %</Label>
                      <Input type="number" value={variability} onChange={e => setVariability(Number(e.target.value))} className="h-10" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none bg-card shadow-2xl rounded-[3rem] overflow-hidden">
            <CardHeader className="p-8 border-b">
              <CardTitle className="text-xl font-black uppercase flex items-center gap-3">
                {entryType === 'teams' ? <Users className="text-primary" /> : <User className="text-primary" />}
                Selección de {entryType === 'teams' ? 'Clubs' : 'Agentes'}
              </CardTitle>
              <CardDescription>Selecciona a los protagonistas de la temporada.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {(entryType === 'teams' ? teams : players.filter(p => !p.teamId)).map(p => (
                  <Button 
                    key={p.id}
                    variant={selectedParticipants.includes(p.id) ? "default" : "outline"}
                    className={cn(
                      "h-16 rounded-2xl justify-start px-4 transition-all overflow-hidden",
                      selectedParticipants.includes(p.id) ? "shadow-lg scale-105" : "hover:bg-muted"
                    )}
                    onClick={() => toggleParticipant(p.id)}
                  >
                    <div className="w-8 h-8 bg-muted/50 rounded-lg flex items-center justify-center mr-2 font-black text-[10px] shrink-0">
                      {'abbreviation' in p ? p.abbreviation : p.name.substring(0,2).toUpperCase()}
                    </div>
                    <span className="font-bold text-xs truncate">{p.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleCreateManual}
            disabled={selectedParticipants.length < 2 || !name}
            className="w-full h-20 rounded-[2.5rem] text-2xl font-black shadow-2xl shadow-primary/20 bg-primary hover:bg-primary/90"
          >
            LANZAR TEMPORADA
          </Button>
        </TabsContent>

        <TabsContent value="ai" className="mt-8">
          <Card className="border-none bg-card shadow-2xl rounded-[3rem] overflow-hidden">
            <CardHeader className="bg-accent/10 border-b p-10">
              <CardTitle className="text-3xl font-black uppercase text-accent flex items-center gap-3">
                <Wand2 className="w-8 h-8" /> Generative Architect
              </CardTitle>
              <CardDescription className="text-lg">Describe la liga soñada: premios, descensos, grupos y reglas de puntos.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <textarea 
                className="flex min-h-[250px] w-full rounded-[2rem] border-none bg-muted/20 p-8 text-xl ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all"
                placeholder="Ej: Una liga de 16 equipos dividida en dos grupos. Rango de puntos de 80 a 150. Victoria da 5000 créditos. Activa liga dual..."
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
              />
              <Button 
                onClick={handleCreateAI} 
                disabled={loading || !aiDescription} 
                className="w-full h-20 rounded-[2rem] text-2xl font-black bg-accent hover:bg-accent/90 shadow-2xl shadow-accent/20"
              >
                {loading ? "Calculando Estructura..." : "CREAR UNIVERSO CON IA"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
