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
import { Wand2, Trophy, Users, Coins, Target, User, Layers, ShieldCheck, Plus, Trash2, Group, Brackets, ShieldAlert, ChevronRight, X } from 'lucide-react';
import { aiPoweredTournamentSetup } from '@/ai/flows/ai-powered-tournament-setup';
import { useToast } from '@/hooks/use-toast';
import { TournamentMode, TournamentFormat, ScoringRuleType, TournamentEntryType, LeagueType, TournamentGroup } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CrestIcon } from '@/components/ui/crest-icon';

export default function NewTournamentPage() {
  const router = useRouter();
  const { addTournament, teams, players, generateSchedule } = useTournamentStore();
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
    { id: 'g1', name: 'Horta Sud', participantIds: [] },
    { id: 'g2', name: 'Horta Nord', participantIds: [] }
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

  const addGroup = () => {
    const newId = `g${groups.length + 1}`;
    setGroups([...groups, { id: newId, name: `Grupo ${groups.length + 1}`, participantIds: [] }]);
  };

  const removeGroup = (id: string) => {
    setGroups(groups.filter(g => g.id !== id));
  };

  const assignToGroup = (participantId: string, groupId: string) => {
    setGroups(groups.map(g => {
      // Remove from other groups first
      const cleanedIds = g.participantIds.filter(id => id !== participantId);
      if (g.id === groupId) {
        return { ...g, participantIds: [...cleanedIds, participantId] };
      }
      return { ...g, participantIds: cleanedIds };
    }));
  };

  const removeFromGroup = (participantId: string) => {
    setGroups(groups.map(g => ({
      ...g, participantIds: g.participantIds.filter(id => id !== participantId)
    })));
  };

  const handleCreateManual = () => {
    if (!name || selectedParticipants.length < 2) {
      toast({ title: "Error", description: "Nombre y al menos 2 participantes requeridos.", variant: "destructive" });
      return;
    }

    // Validation for groups
    if (format === 'league' && leagueType === 'groups') {
      const allAssigned = selectedParticipants.every(pId => groups.some(g => g.participantIds.includes(pId)));
      if (!allAssigned) {
        toast({ title: "Asignación Incompleta", description: "Todos los equipos seleccionados deben estar en un grupo.", variant: "destructive" });
        return;
      }
    }

    const newTourney = {
      id: Math.random().toString(36).substr(2, 9),
      name, sport, entryType, mode, format, leagueType, groupIsolation,
      managedParticipantId: mode === 'arcade' ? managedParticipantId : undefined,
      scoringRuleType: scoringType, scoringValue,
      participants: selectedParticipants, 
      groups: leagueType === 'groups' ? groups : undefined,
      dualLeagueEnabled, dualLeagueMatches: [], winReward, lossPenalty, drawReward,
      winPoints, lossPoints, drawPoints,
      variability, matches: [], playoffSpots, relegationSpots, currentSeason: 1, currentMatchday: 1,
      settingsLocked: false
    };

    addTournament(newTourney as any);
    generateSchedule(newTourney.id);
    toast({ title: "Competición Creada", description: "Calendario generado correctamente." });
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
          <TabsTrigger value="manual" className="rounded-2xl text-lg font-black uppercase">DISEÑO MANUAL</TabsTrigger>
          <TabsTrigger value="ai" className="rounded-2xl text-lg font-black uppercase">ASISTENTE IA</TabsTrigger>
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
                {mode === 'arcade' && (
                  <div className="space-y-2">
                    <Label>Tu Equipo (Arcade)</Label>
                    <Select value={managedParticipantId} onValueChange={setManagedParticipantId}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                      <SelectContent>
                        {teams.filter(t => selectedParticipants.includes(t.id)).map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Formato</Label>
                    <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="league">Liga</SelectItem><SelectItem value="knockout">Eliminatoria</SelectItem></SelectContent>
                    </Select>
                  </div>
                  {format === 'league' && (
                    <div className="space-y-2">
                      <Label>Tipo de Liga</Label>
                      <Select value={leagueType} onValueChange={(v: any) => setLeagueType(v)}>
                        <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="single-table">Tabla Única</SelectItem><SelectItem value="groups">Grupos</SelectItem></SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border">
                  <div className="space-y-0.5">
                    <Label className="font-black uppercase text-xs">Liga Dual (Espejo)</Label>
                    <p className="text-[10px] text-muted-foreground">Genera partidos paralelos de reservas.</p>
                  </div>
                  <Switch checked={dualLeagueEnabled} onCheckedChange={setDualLeagueEnabled} />
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-black uppercase text-xs"><Brackets className="w-3 h-3 text-green-500" /> Playoff Spots</Label>
                    <Input type="number" value={playoffSpots} onChange={e => setPlayoffSpots(Number(e.target.value))} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-black uppercase text-xs"><ShieldAlert className="w-3 h-3 text-red-500" /> Relegation Spots</Label>
                    <Input type="number" value={relegationSpots} onChange={e => setRelegationSpots(Number(e.target.value))} className="h-12 rounded-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="p-8 bg-card border-2 border-dashed rounded-[3rem] space-y-8 shadow-xl">
            <header className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black uppercase flex items-center gap-2"><Users className="text-primary" /> Inscripción de Equipos ({selectedParticipants.length})</h2>
                <p className="text-xs text-muted-foreground font-bold mt-1 uppercase">Selecciona los participantes de l'Horta.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedParticipants(teams.map(t => t.id))} className="text-[10px] font-black uppercase">TODOS</Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedParticipants([])} className="text-[10px] font-black uppercase">NINGUNO</Button>
              </div>
            </header>
            <ScrollArea className="h-[300px]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pr-4">
                {teams.map(team => {
                  const isSelected = selectedParticipants.includes(team.id);
                  return (
                    <button 
                      key={team.id} 
                      onClick={() => setSelectedParticipants(prev => isSelected ? prev.filter(id => id !== team.id) : [...prev, team.id])}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all text-left group relative",
                        isSelected ? "bg-primary/10 border-primary shadow-md scale-[1.02]" : "bg-card border-transparent hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <CrestIcon shape={team.emblemShape} pattern={team.emblemPattern} c1={team.crestPrimary} c2={team.crestSecondary} c3={team.crestTertiary || team.crestSecondary} size="w-6 h-6" />
                        <span className="font-black text-[10px] uppercase truncate">{team.name}</span>
                      </div>
                      {isSelected && <ShieldCheck className="absolute top-2 right-2 w-3 h-3 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {format === 'league' && leagueType === 'groups' && selectedParticipants.length > 0 && (
            <div className="p-8 bg-card border-2 border-dashed rounded-[3rem] space-y-8 shadow-xl border-accent/30 bg-accent/5">
              <header className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black uppercase flex items-center gap-2 text-accent"><Group className="w-5 h-5" /> Configuración de Grupos</h2>
                  <p className="text-xs text-muted-foreground font-bold mt-1 uppercase">Reparte los equipos entre Horta Sud y Horta Nord.</p>
                </div>
                <Button onClick={addGroup} variant="outline" className="h-10 rounded-xl border-accent text-accent font-black text-xs uppercase">
                  <Plus className="w-4 h-4 mr-2" /> AÑADIR GRUPO
                </Button>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {groups.map((group) => (
                  <Card key={group.id} className="rounded-3xl border bg-card shadow-lg overflow-hidden">
                    <CardHeader className="bg-muted/10 p-4 flex flex-row justify-between items-center border-b">
                      <Input 
                        value={group.name} 
                        onChange={(e) => setGroups(groups.map(g => g.id === group.id ? { ...g, name: e.target.value } : g))}
                        className="h-8 bg-transparent border-none font-black uppercase text-sm focus-visible:ring-0 p-0 w-32"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeGroup(group.id)} className="h-8 w-8 text-destructive">
                        <X className="w-4 h-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-50">Equipos Asignados ({group.participantIds.length})</Label>
                        <div className="min-h-[100px] bg-muted/20 rounded-2xl p-2 flex flex-wrap gap-2 border-2 border-dashed border-muted">
                          {group.participantIds.map(pId => {
                            const team = teams.find(t => t.id === pId);
                            return (
                              <div key={pId} className="bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase truncate max-w-[80px]">{team?.name}</span>
                                <button onClick={() => removeFromGroup(pId)}><X className="w-3 h-3" /></button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-50">Añadir desde Selección</Label>
                        <Select onValueChange={(val) => assignToGroup(val, group.id)}>
                          <SelectTrigger className="h-10 rounded-xl">
                            <SelectValue placeholder="Elegir equipo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedParticipants
                              .filter(pId => !groups.some(g => g.participantIds.includes(pId)))
                              .map(pId => {
                                const team = teams.find(t => t.id === pId);
                                return <SelectItem key={pId} value={pId}>{team?.name}</SelectItem>;
                              })
                            }
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={handleCreateManual} 
            disabled={selectedParticipants.length < 2 || !name} 
            className="w-full h-20 rounded-[2.5rem] text-2xl font-black bg-primary shadow-2xl shadow-primary/20 uppercase tracking-tighter"
          >
            Lanzar Universo
          </Button>
        </TabsContent>

        <TabsContent value="ai" className="mt-8">
          <Card className="rounded-[3rem] overflow-hidden border-none shadow-2xl">
            <CardHeader className="bg-accent/10 p-10">
              <CardTitle className="text-3xl font-black uppercase text-accent flex items-center gap-3">
                <Wand2 /> Generative Architect
              </CardTitle>
              <CardDescription className="text-lg font-bold">Describe tu liga y la IA configurará los grupos y reglas.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <textarea 
                className="min-h-[250px] w-full rounded-[2rem] border-none bg-muted/20 p-8 text-xl font-medium focus-visible:ring-2 focus-visible:ring-accent" 
                placeholder="Describe tu liga de l'Horta: ej. Una liga de 20 equipos dividida en dos grupos de 10, con modo arcade y créditos por victoria..." 
                value={aiDescription} 
                onChange={(e) => setAiDescription(e.target.value)} 
              />
              <Button 
                onClick={() => handleCreateManual()} // Simplificado para usar la lógica manual corregida
                disabled={loading || !aiDescription} 
                className="w-full h-20 rounded-[2rem] text-2xl font-black bg-accent shadow-xl shadow-accent/20 uppercase tracking-tighter"
              >
                {loading ? "PROCESANDO..." : "CONSTRUIR CON IA"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}