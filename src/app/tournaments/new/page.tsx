
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Wand2, Trophy, Users, Coins, Target, User, Layers, ShieldCheck, Plus, Trash2, Group } from 'lucide-react';
import { aiPoweredTournamentSetup } from '@/ai/flows/ai-powered-tournament-setup';
import { useToast } from '@/hooks/use-toast';
import { TournamentMode, TournamentFormat, ScoringRuleType, TournamentEntryType, LeagueType, TournamentGroup } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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
        currentSeason: 1,
        currentMatchday: 1
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

    // Process groups to remove empty ones or assign properly
    const finalGroups = leagueType === 'groups' ? groups.map(g => ({
      ...g,
      participantIds: g.participantIds.filter(id => selectedParticipants.includes(id))
    })).filter(g => g.participantIds.length > 0) : undefined;

    const newTourney = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      sport,
      entryType,
      mode,
      format,
      leagueType,
      groupIsolation,
      managedParticipantId: mode === 'arcade' ? managedParticipantId : undefined,
      scoringRuleType: scoringType,
      scoringValue,
      nToNRangeMin: scoringType === 'nToNRange' ? nToNRangeMin : undefined,
      nToNRangeMax: scoringType === 'nToNRange' ? nToNRangeMax : undefined,
      participants: selectedParticipants,
      groups: finalGroups,
      dualLeagueEnabled,
      dualLeagueMatches: [],
      settingsLocked: false,
      winReward,
      lossPenalty,
      drawReward,
      variability,
      matches: [],
      playoffSpots: format === 'league' ? playoffSpots : 0,
      relegationSpots: format === 'league' ? relegationSpots : 0,
      currentSeason: 1,
      currentMatchday: 1
    };

    addTournament(newTourney as any);
    toast({ title: "Temporada Lanzada", description: "Competición creada con éxito." });
    router.push(`/tournaments/${newTourney.id}`);
  };

  const toggleParticipant = (id: string) => {
    setSelectedParticipants(prev => {
      const isSelected = prev.includes(id);
      if (isSelected) {
        // Remove from groups as well
        setGroups(gPrev => gPrev.map(g => ({
          ...g,
          participantIds: g.participantIds.filter(pId => pId !== id)
        })));
        return prev.filter(pId => pId !== id);
      } else {
        // Add to first group by default if groups enabled
        if (leagueType === 'groups' && groups.length > 0) {
          setGroups(gPrev => {
            const newGroups = [...gPrev];
            newGroups[0].participantIds.push(id);
            return newGroups;
          });
        }
        return [...prev, id];
      }
    });
  };

  const addGroup = () => {
    setGroups([...groups, { name: `Grupo ${String.fromCharCode(65 + groups.length)}`, participantIds: [] }]);
  };

  const removeGroup = (index: number) => {
    if (groups.length <= 1) return;
    setGroups(groups.filter((_, i) => i !== index));
  };

  const updateGroupName = (index: number, newName: string) => {
    setGroups(groups.map((g, i) => i === index ? { ...g, name: newName } : g));
  };

  const assignParticipantToGroup = (participantId: string, groupIndex: number) => {
    setGroups(prev => prev.map((g, i) => {
      // Remove from all other groups
      const filtered = g.participantIds.filter(id => id !== participantId);
      // Add to target group
      if (i === groupIndex) {
        return { ...g, participantIds: [...filtered, participantId] };
      }
      return { ...g, participantIds: filtered };
    }));
  };

  const availableParticipants = entryType === 'teams' ? teams : players.filter(p => !p.teamId);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      <header>
        <h1 className="text-4xl font-black flex items-center gap-3 uppercase tracking-tighter">
          <Trophy className="text-primary w-10 h-10" /> Architect Studio
        </h1>
        <p className="text-muted-foreground text-lg">Diseña las reglas y estructura de tu universo competitivo.</p>
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
                <div className="space-y-2">
                  <Label>Nombre de la Competición</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Lliga l'Horta 2024" className="h-12 rounded-xl" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Disciplina / Deporte</Label>
                    <Input value={sport} onChange={e => setSport(e.target.value)} placeholder="Basketball, Fútbol..." className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Participantes</Label>
                    <Select value={entryType} onValueChange={(v: any) => { setEntryType(v); setSelectedParticipants([]); setGroups(groups.map(g => ({...g, participantIds: []}))); }}>
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
                        <SelectItem value="league">Liga (Round Robin)</SelectItem>
                        <SelectItem value="knockout">Eliminatoria</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Modo de Juego</Label>
                    <Select value={mode} onValueChange={(v: any) => setMode(v)}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Simulación General</SelectItem>
                        <SelectItem value="arcade">Arcade (Control Directo)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {format === 'league' && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label>Tipo de Liga</Label>
                      <Select value={leagueType} onValueChange={(v: any) => setLeagueType(v)}>
                        <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single-table">Tabla Única</SelectItem>
                          <SelectItem value="groups">Por Grupos (Manual)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/20">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="text-primary" />
                        <div>
                          <p className="text-sm font-black uppercase">Grupos Aislados</p>
                          <p className="text-[10px] text-muted-foreground">Solo jugar con equipos de tu grupo</p>
                        </div>
                      </div>
                      <Switch checked={groupIsolation} onCheckedChange={setGroupIsolation} />
                    </div>
                  </div>
                )}

                {mode === 'arcade' && (
                  <div className="space-y-4 animate-in slide-in-from-top-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label className="text-accent font-black">Tu Equipo Gestionado</Label>
                      <Select value={managedParticipantId} onValueChange={setManagedParticipantId}>
                        <SelectTrigger className="h-12 rounded-xl border-accent"><SelectValue placeholder="Elegir equipo..." /></SelectTrigger>
                        <SelectContent>
                          {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-accent/5 rounded-2xl border border-accent/20">
                      <div className="flex items-center gap-3">
                        <Layers className="text-accent" />
                        <div>
                          <p className="text-sm font-black uppercase">Liga Dual Paralela</p>
                          <p className="text-[10px] text-muted-foreground">Activa liga de reservas (espejo)</p>
                        </div>
                      </div>
                      <Switch checked={dualLeagueEnabled} onCheckedChange={setDualLeagueEnabled} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none bg-card shadow-2xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-primary/5 border-b p-8">
                <CardTitle className="text-xl font-black uppercase flex items-center gap-2">
                  <Target className="text-primary" /> Reglas de Puntuación
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <Label className="text-xs font-black uppercase text-muted-foreground">Lógica de Resultados</Label>
                  <Select value={scoringType} onValueChange={(v: any) => setScoringType(v)}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nToNRange">Rango de Puntos (Suma N-N)</SelectItem>
                      <SelectItem value="bestOfN">Al mejor de N (Suma N)</SelectItem>
                      <SelectItem value="firstToN">Primero en marcar N</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {scoringType === 'nToNRange' && (
                    <div className="grid grid-cols-2 gap-4">
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
                    <div className="flex items-center gap-4">
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

          {format === 'league' && leagueType === 'groups' && selectedParticipants.length > 0 && (
            <Card className="border-none bg-card shadow-2xl rounded-[3rem] overflow-hidden">
              <CardHeader className="p-8 border-b bg-accent/5">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl font-black uppercase flex items-center gap-3">
                      <Group className="text-accent" /> Configuración de Grupos
                    </CardTitle>
                    <CardDescription>Asigna los participantes seleccionados a cada grupo.</CardDescription>
                  </div>
                  <Button onClick={addGroup} variant="outline" size="sm" className="rounded-xl border-accent text-accent font-black">
                    <Plus className="w-4 h-4 mr-2" /> AÑADIR GRUPO
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups.map((group, gIdx) => (
                    <div key={gIdx} className="p-6 bg-muted/20 rounded-[2rem] border-2 border-dashed border-accent/20 flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <Input 
                          value={group.name} 
                          onChange={(e) => updateGroupName(gIdx, e.target.value)}
                          className="font-black uppercase bg-transparent border-none text-accent p-0 h-auto focus-visible:ring-0 text-lg"
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeGroup(gIdx)} className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-[10px] font-black uppercase text-muted-foreground mb-2">
                        {group.participantIds.length} Participantes
                      </div>
                      <ScrollArea className="h-40 pr-2">
                        <div className="space-y-2">
                          {group.participantIds.map(pId => {
                            const p = availableParticipants.find(ap => ap.id === pId);
                            return p ? (
                              <div key={pId} className="flex items-center justify-between p-2 bg-card rounded-xl text-xs font-bold border shadow-sm">
                                <span className="truncate">{p.name}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => assignParticipantToGroup(pId, -1)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-none bg-card shadow-2xl rounded-[3rem] overflow-hidden">
            <CardHeader className="p-8 border-b">
              <CardTitle className="text-xl font-black uppercase flex items-center gap-3">
                {entryType === 'teams' ? <Users className="text-primary" /> : <User className="text-primary" />}
                Selección de Participantes
              </CardTitle>
              <CardDescription>Escoge a los competidores. {leagueType === 'groups' ? 'Después asígnalos a un grupo.' : ''}</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {availableParticipants.map(p => {
                  const isSelected = selectedParticipants.includes(p.id);
                  const assignedGroupIdx = groups.findIndex(g => g.participantIds.includes(p.id));
                  
                  return (
                    <div key={p.id} className="space-y-2">
                      <Button 
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "w-full h-16 rounded-2xl justify-start px-4 transition-all overflow-hidden flex flex-col items-start gap-0",
                          isSelected ? "shadow-lg scale-105" : "hover:bg-muted"
                        )}
                        onClick={() => toggleParticipant(p.id)}
                      >
                        <span className="font-black text-xs truncate w-full">{p.name}</span>
                        {isSelected && assignedGroupIdx !== -1 && (
                          <span className="text-[8px] uppercase font-black opacity-70">{groups[assignedGroupIdx].name}</span>
                        )}
                      </Button>
                      {isSelected && leagueType === 'groups' && (
                        <Select 
                          value={assignedGroupIdx.toString()} 
                          onValueChange={(v) => assignParticipantToGroup(p.id, parseInt(v))}
                        >
                          <SelectTrigger className="h-8 rounded-lg text-[9px] font-black uppercase">
                            <SelectValue placeholder="Asignar Grupo" />
                          </SelectTrigger>
                          <SelectContent>
                            {groups.map((g, i) => <SelectItem key={i} value={i.toString()}>{g.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleCreateManual}
            disabled={selectedParticipants.length < 2 || !name}
            className="w-full h-20 rounded-[2.5rem] text-2xl font-black shadow-2xl shadow-primary/20 bg-primary hover:bg-primary/90"
          >
            CREAR UNIVERSO
          </Button>
        </TabsContent>

        <TabsContent value="ai" className="mt-8">
          <Card className="border-none bg-card shadow-2xl rounded-[3rem] overflow-hidden">
            <CardHeader className="bg-accent/10 border-b p-10">
              <CardTitle className="text-3xl font-black uppercase text-accent flex items-center gap-3">
                <Wand2 className="w-8 h-8" /> Generative Architect
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <textarea 
                className="flex min-h-[250px] w-full rounded-[2rem] border-none bg-muted/20 p-8 text-xl ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all"
                placeholder="Describe la liga soñada: premios, grupos regionales, modo arcade con el Alaquàs..."
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
              />
              <Button 
                onClick={handleCreateAI} 
                disabled={loading || !aiDescription} 
                className="w-full h-20 rounded-[2rem] text-2xl font-black bg-accent hover:bg-accent/90 shadow-2xl shadow-accent/20"
              >
                {loading ? "Preparando Estructura..." : "CREAR UNIVERSO CON IA"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
