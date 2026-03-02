
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
import { Trophy, Users, Coins, Target, Brackets, ShieldAlert, Group, Plus, X, Wand2, Info, ChevronRight, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TournamentMode, TournamentFormat, ScoringRuleType, TournamentEntryType, LeagueType, TournamentGroup } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CrestIcon } from '@/components/ui/crest-icon';
import { Badge } from '@/components/ui/badge';

export default function NewTournamentPage() {
  const router = useRouter();
  const { addTournament, teams } = useTournamentStore();
  const { toast } = useToast();
  
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
  const [aiDescription, setAiDescription] = useState('');
  
  const [groups, setGroups] = useState<TournamentGroup[]>([
    { id: 'g1', name: 'Horta Sud', participantIds: [] },
    { id: 'g2', name: 'Horta Nord', participantIds: [] }
  ]);
  
  const [scoringType, setScoringType] = useState<ScoringRuleType>('bestOfN');
  const [scoringValue, setScoringValue] = useState(9);
  
  const [winReward, setWinReward] = useState(10);
  const [lossPenalty, setLossPenalty] = useState(15);
  const [drawReward, setDrawReward] = useState(0);
  
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

    if (format === 'league' && leagueType === 'groups') {
      const allAssigned = selectedParticipants.every(pId => groups.some(g => g.participantIds.includes(pId)));
      if (!allAssigned) {
        toast({ title: "Asignación Incompleta", description: "Todos los equipos seleccionados deben estar asignados a un grupo.", variant: "destructive" });
        return;
      }
    }

    const newTourney = {
      id: Math.random().toString(36).substr(2, 9),
      name, sport, entryType, mode, format, leagueType, groupIsolation,
      managedParticipantId: mode === 'arcade' ? managedParticipantId : undefined,
      scoringRuleType: scoringType, scoringValue,
      participants: selectedParticipants, 
      groups: (format === 'league' && leagueType === 'groups') ? groups : undefined,
      dualLeagueEnabled, dualLeagueMatches: [], winReward, lossPenalty, drawReward,
      winPoints, lossPoints, drawPoints,
      variability, matches: [], playoffSpots, relegationSpots, currentSeason: 1, currentMatchday: 1,
      settingsLocked: false
    };

    addTournament(newTourney as any);
    toast({ title: "Competición Creada", description: "Se ha generado el calendario base." });
    router.push(`/tournaments/${newTourney.id}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-32 px-4 md:px-0">
      <header>
        <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter flex items-center gap-3">
          <Trophy className="text-primary w-8 h-8 md:w-10 md:h-10" /> Architect Studio
        </h1>
        <p className="text-muted-foreground text-xs md:text-sm">Configura los puntos, créditos y reglas de tu liga.</p>
      </header>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12 md:h-16 bg-card p-1 rounded-2xl md:rounded-3xl border shadow-xl">
          <TabsTrigger value="manual" className="rounded-xl md:rounded-2xl text-xs md:text-lg font-black uppercase tracking-tight">DISEÑO MANUAL</TabsTrigger>
          <TabsTrigger value="ai" className="rounded-xl md:rounded-2xl text-xs md:text-lg font-black uppercase tracking-tight">ASISTENTE IA</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-6 md:mt-8 space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <Card className="border-none bg-card shadow-2xl rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-muted/20 border-b p-6 md:p-8">
                <CardTitle className="text-lg md:text-xl font-black uppercase">Estructura Base</CardTitle>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-4 md:space-y-6">
                <div className="space-y-2"><Label>Nombre del Torneo</Label><Input value={name} onChange={e => setName(e.target.value)} className="h-10 md:h-12 rounded-xl" placeholder="Ej: Lliga l'Horta Élite" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Deporte</Label><Input value={sport} onChange={e => setSport(e.target.value)} className="h-10 md:h-12 rounded-xl" /></div>
                  <div className="space-y-2">
                    <Label>Modo</Label>
                    <Select value={mode} onValueChange={(v: any) => setMode(v)}>
                      <SelectTrigger className="h-10 md:h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="normal">Simulación</SelectItem><SelectItem value="arcade">Arcade</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                {mode === 'arcade' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label className="flex items-center gap-2"><Target className="w-4 h-4 text-accent" /> Tu Equipo (Arcade)</Label>
                    <Select value={managedParticipantId} onValueChange={setManagedParticipantId}>
                      <SelectTrigger className="h-10 md:h-12 rounded-xl"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
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
                      <SelectTrigger className="h-10 md:h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="league">Liga</SelectItem><SelectItem value="knockout">Eliminatoria</SelectItem></SelectContent>
                    </Select>
                  </div>
                  {format === 'league' && (
                    <div className="space-y-2">
                      <Label>Tipo de Liga</Label>
                      <Select value={leagueType} onValueChange={(v: any) => setLeagueType(v)}>
                        <SelectTrigger className="h-10 md:h-12 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="single-table">Tabla Única</SelectItem><SelectItem value="groups">Grupos/Conferencias</SelectItem></SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 md:p-4 bg-muted/20 rounded-2xl border">
                  <div className="space-y-0.5">
                    <Label className="font-black uppercase text-[10px]">Liga Dual (Espejo)</Label>
                    <p className="text-[9px] text-muted-foreground">Genera partidos de reservas en paralelo.</p>
                  </div>
                  <Switch checked={dualLeagueEnabled} onCheckedChange={setDualLeagueEnabled} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-card shadow-2xl rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-primary/5 border-b p-6 md:p-8"><CardTitle className="text-lg md:text-xl font-black uppercase flex items-center gap-2"><Target className="text-primary" /> Reglas de Competición</CardTitle></CardHeader>
              <CardContent className="p-6 md:p-8 space-y-4 md:space-y-6">
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                  <div className="space-y-1"><Label className="text-[9px] md:text-[10px] uppercase font-bold text-center block">PTS V.</Label><Input type="number" value={winPoints} onChange={e => setWinPoints(Number(e.target.value))} className="h-9 md:h-10 text-center" /></div>
                  <div className="space-y-1"><Label className="text-[9px] md:text-[10px] uppercase font-bold text-center block">PTS D.</Label><Input type="number" value={lossPoints} onChange={e => setLossPoints(Number(e.target.value))} className="h-9 md:h-10 text-center" /></div>
                  <div className="space-y-1"><Label className="text-[9px] md:text-[10px] uppercase font-bold text-center block">PTS E.</Label><Input type="number" value={drawPoints} onChange={e => setDrawPoints(Number(e.target.value))} className="h-9 md:h-10 text-center" /></div>
                </div>
                <div className="p-4 md:p-6 bg-accent/5 rounded-2xl md:rounded-3xl border space-y-4">
                  <Label className="text-[10px] font-black uppercase text-accent flex items-center gap-2"><Coins className="w-4 h-4" /> Economía (CR)</Label>
                  <div className="grid grid-cols-3 gap-2 md:gap-4">
                    <div className="space-y-1"><Label className="text-[9px] text-center block">Gana (+)</Label><Input type="number" value={winReward} onChange={e => setWinReward(Number(e.target.value))} className="h-9 text-center" /></div>
                    <div className="space-y-1"><Label className="text-[9px] text-center block">Pierde (-)</Label><Input type="number" value={lossPenalty} onChange={e => setLossPenalty(Number(e.target.value))} className="h-9 text-center" /></div>
                    <div className="space-y-1"><Label className="text-[9px] text-center block">Empata</Label><Input type="number" value={drawReward} onChange={e => setDrawReward(Number(e.target.value))} className="h-9 text-center" /></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-black uppercase text-[10px]"><Brackets className="w-3 h-3 text-green-500" /> Plazas Playoff</Label>
                    <Input type="number" value={playoffSpots} onChange={e => setPlayoffSpots(Number(e.target.value))} className="h-10 md:h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-black uppercase text-[10px]"><ShieldAlert className="w-3 h-3 text-red-500" /> Plazas Descenso</Label>
                    <Input type="number" value={relegationSpots} onChange={e => setRelegationSpots(Number(e.target.value))} className="h-10 md:h-12 rounded-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none bg-card shadow-2xl rounded-[1.5rem] md:rounded-[3rem] p-6 md:p-8 space-y-6 md:space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg md:text-xl font-black uppercase flex items-center gap-2"><Users className="text-primary" /> Inscripción de Equipos ({selectedParticipants.length})</h2>
                <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase">Selecciona qué entidades participarán en este universo.</p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button variant="outline" size="sm" onClick={() => setSelectedParticipants(teams.map(t => t.id))} className="flex-1 md:flex-none text-[10px] font-black uppercase h-9">SELECCIONAR TODOS</Button>
                <Button variant="outline" size="sm" onClick={() => { setSelectedParticipants([]); setGroups(groups.map(g => ({...g, participantIds: []}))); }} className="flex-1 md:flex-none text-[10px] font-black uppercase h-9">LIMPIAR</Button>
              </div>
            </header>
            <ScrollArea className="h-[300px] md:h-[400px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 pr-4">
                {teams.map(team => {
                  const isSelected = selectedParticipants.includes(team.id);
                  const isAssigned = groups.some(g => g.participantIds.includes(team.id));
                  return (
                    <button 
                      key={team.id} 
                      onClick={() => setSelectedParticipants(prev => isSelected ? prev.filter(id => id !== team.id) : [...prev, team.id])}
                      className={cn(
                        "p-4 rounded-xl md:rounded-2xl border-2 transition-all text-left flex flex-col gap-2 relative",
                        isSelected ? "bg-primary/10 border-primary shadow-md" : "bg-card border-transparent hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <CrestIcon shape={team.emblemShape} pattern={team.emblemPattern} c1={team.crestPrimary} c2={team.crestSecondary} c3={team.crestTertiary || team.crestSecondary} size="w-8 h-8" />
                        <div className="overflow-hidden">
                          <span className="font-black text-[10px] md:text-xs uppercase truncate block">{team.name}</span>
                          <span className="text-[9px] opacity-50 block">{team.abbreviation}</span>
                        </div>
                      </div>
                      {isSelected && format === 'league' && leagueType === 'groups' && (
                        <div className={cn("mt-2 text-[8px] font-black uppercase p-1 rounded text-center", isAssigned ? "bg-green-500 text-white" : "bg-yellow-500 text-black animate-pulse")}>
                          {isAssigned ? "Asignado" : "Sin Grupo"}
                        </div>
                      )}
                      {isSelected && <div className="absolute top-1 right-1 bg-primary text-white p-0.5 rounded-full"><Plus className="w-2 h-2 rotate-45" /></div>}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>

          {format === 'league' && leagueType === 'groups' && selectedParticipants.length > 0 && (
            <div className="p-6 md:p-10 bg-accent/5 border-2 border-dashed border-accent/20 rounded-[2rem] md:rounded-[4rem] space-y-8 shadow-inner">
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center">
                    <Group className="text-accent w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">Distribución por Conferencias</h2>
                    <p className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase">Asigna los equipos inscritos a sus respectivos grupos geográficos.</p>
                  </div>
                </div>
                <Button onClick={addGroup} variant="outline" className="w-full md:w-auto h-12 rounded-xl border-accent text-accent font-black text-xs uppercase">
                  <Plus className="w-4 h-4 mr-2" /> AÑADIR CONFERENCIA
                </Button>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                {groups.map((group) => (
                  <Card key={group.id} className="rounded-[2rem] border bg-card shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardHeader className="bg-muted/10 p-6 flex flex-row justify-between items-center border-b">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-accent text-accent-foreground font-black">{group.participantIds.length}</Badge>
                        <Input 
                          value={group.name} 
                          onChange={(e) => setGroups(groups.map(g => g.id === group.id ? { ...g, name: e.target.value } : g))}
                          className="h-10 bg-transparent border-none font-black uppercase text-lg focus-visible:ring-0 p-0 w-40"
                        />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeGroup(group.id)} className="h-10 w-10 text-destructive hover:bg-destructive/10">
                        <X className="w-5 h-5" />
                      </Button>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <ScrollArea className="h-[200px] bg-muted/20 rounded-2xl p-4 border-2 border-dashed border-muted">
                        <div className="flex flex-wrap gap-2">
                          {group.participantIds.length === 0 && (
                            <div className="flex flex-col items-center justify-center w-full py-10 text-muted-foreground opacity-50">
                              <AlertCircle className="w-8 h-8 mb-2" />
                              <p className="text-[10px] font-black uppercase">Sin equipos asignados</p>
                            </div>
                          )}
                          {group.participantIds.map(pId => {
                            const team = teams.find(t => t.id === pId);
                            return (
                              <Badge key={pId} variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-4 py-2 rounded-xl flex items-center gap-3 hover:bg-primary/20 transition-colors">
                                <CrestIcon shape={team?.emblemShape!} pattern={team?.emblemPattern!} c1={team?.crestPrimary!} c2={team?.crestSecondary!} size="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase truncate max-w-[100px]">{team?.name}</span>
                                <button onClick={() => removeFromGroup(pId)} className="hover:text-destructive transition-colors"><X className="w-3 h-3" /></button>
                              </Badge>
                            );
                          })}
                        </div>
                      </ScrollArea>
                      
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block ml-1">Transferir equipo a esta zona</Label>
                        <Select onValueChange={(val) => assignToGroup(val, group.id)}>
                          <SelectTrigger className="h-12 rounded-xl border-2 focus:ring-accent">
                            <SelectValue placeholder="Elegir club disponible..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {selectedParticipants
                              .filter(pId => !group.participantIds.includes(pId))
                              .map(pId => {
                                const team = teams.find(t => t.id === pId);
                                const isOtherGroup = groups.some(g => g.id !== group.id && g.participantIds.includes(pId));
                                return (
                                  <SelectItem key={pId} value={pId} className="rounded-lg">
                                    <div className="flex items-center justify-between w-full gap-2">
                                      <span>{team?.name}</span>
                                      {isOtherGroup && <Badge variant="outline" className="text-[8px] opacity-50 ml-2">OTRO GRUPO</Badge>}
                                    </div>
                                  </SelectItem>
                                );
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

          <div className="fixed bottom-6 left-0 right-0 px-4 md:static md:px-0 md:mt-12 z-50">
            <Button 
              onClick={handleCreateManual} 
              disabled={selectedParticipants.length < 2 || !name} 
              className="w-full h-16 md:h-24 rounded-[1.5rem] md:rounded-[3rem] text-lg md:text-3xl font-black bg-primary shadow-2xl shadow-primary/40 uppercase tracking-tighter border-b-8 border-primary-foreground/20 hover:translate-y-1 hover:border-b-4 transition-all"
            >
              Lanzar Nuevo Universo
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="mt-6 md:mt-8">
          <Card className="rounded-[2.5rem] md:rounded-[4rem] overflow-hidden border-none shadow-2xl">
            <CardHeader className="bg-accent/10 p-8 md:p-16 text-center">
              <div className="mx-auto w-20 h-20 bg-accent/20 rounded-[2rem] flex items-center justify-center mb-6">
                <Wand2 className="text-accent w-10 h-10" />
              </div>
              <CardTitle className="text-2xl md:text-5xl font-black uppercase text-accent tracking-tighter">Generative Architect</CardTitle>
              <CardDescription className="text-base md:text-xl font-bold max-w-2xl mx-auto mt-4">Describe la visión de tu liga y la IA configurará los grupos, calendarios y reglas económicas por ti.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 md:p-16 space-y-8">
              <textarea 
                className="min-h-[200px] md:min-h-[300px] w-full rounded-3xl border-none bg-muted/20 p-8 md:p-12 text-lg md:text-2xl font-medium focus-visible:ring-4 focus-visible:ring-accent outline-none transition-all placeholder:opacity-30" 
                placeholder="Ej. Crea una liga profesional de 20 equipos dividida en Horta Sud y Nord. Quiero recompensas de 10 CR, un sistema de playoff de 8 plazas y que el tema sea retro..." 
                value={aiDescription} 
                onChange={(e) => {
                  setAiDescription(e.target.value);
                  if(!name) setName(e.target.value.split(' ').slice(0, 3).join(' ')); 
                }} 
              />
              <Button 
                onClick={handleCreateManual} 
                disabled={!aiDescription} 
                className="w-full h-20 md:h-24 rounded-[2rem] md:rounded-[3rem] text-xl md:text-3xl font-black bg-accent shadow-xl shadow-accent/30 uppercase tracking-tighter"
              >
                CONSTRUIR CON INTELIGENCIA ARTIFICIAL
              </Button>
              <div className="flex gap-4 items-center text-xs md:text-sm text-muted-foreground bg-muted/30 p-6 rounded-3xl border border-dashed border-muted-foreground/20">
                <Info className="w-6 h-6 shrink-0 text-accent" />
                <p className="font-medium">Nuestra IA analizará la semántica de tu descripción para proponer una estructura óptima de participantes, equilibrando presupuestos y calendarios regionales.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
