"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trophy, Users, Coins, Target, Sparkles, Group, Plus, X, AlertCircle, Settings2, CheckCircle2, RefreshCw, Wand2, Loader2, UserPlus, Activity, Clock, Timer, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TournamentMode, TournamentFormat, TournamentEntryType, LeagueType, TournamentGroup, ScoringRuleType, ChallengeSport } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CrestIcon } from '@/components/ui/crest-icon';
import { Badge } from '@/components/ui/badge';
import { aiGroupDistributor } from '@/ai/flows/ai-group-distributor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function NewTournamentPage() {
  const router = useRouter();
  const { addTournament, teams, players, settings } = useTournamentStore();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [sport, setSport] = useState('Basketball');
  const [entryType, setEntryType] = useState<TournamentEntryType>('teams');
  const [mode, setMode] = useState<TournamentMode>('normal');
  const [format, setFormat] = useState<TournamentFormat>('league');
  const [leagueType, setLeagueType] = useState<LeagueType>('groups');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [dualLeagueEnabled, setDualLeagueEnabled] = useState(false);
  const [managedParticipantId, setManagedParticipantId] = useState<string>('');
  
  // Challenge State
  const [challengeSports, setChallengeSports] = useState<ChallengeSport[]>([]);
  const [challengeRounds, setChallengeRounds] = useState(1);
  const [isSportModalOpen, setIsSportModalOpen] = useState(false);
  
  // New Sport Form
  const [nsName, setNsName] = useState('');
  const [nsNumeric, setNsNumeric] = useState(true);
  const [nsPeriods, setNsPeriods] = useState(false);
  const [nsNumPeriods, setNsNumPeriods] = useState(2);
  const [nsDuration, setNsDuration] = useState(60);
  const [nsRest, setNsRest] = useState(15);

  const [groups, setGroups] = useState<TournamentGroup[]>([
    { id: 'g1', name: 'Horta Sud', participantIds: [] },
    { id: 'g2', name: 'Horta Nord', participantIds: [] }
  ]);
  
  // Rules
  const [winReward, setWinReward] = useState(10);
  const [lossPenalty, setLossPenalty] = useState(15);
  const [drawReward, setDrawReward] = useState(0);
  const [winPoints, setWinPoints] = useState(3);
  const [lossPoints, setLossPoints] = useState(0);
  const [drawPoints, setDrawPoints] = useState(1);
  
  const [scoringType, setScoringType] = useState<ScoringRuleType>('bestOfN');
  const [scoringValue, setScoringValue] = useState(9);
  const [rangeMin, setRangeMin] = useState(0);
  const [rangeMax, setRangeMax] = useState(10);

  const [playoffSpots, setPlayoffSpots] = useState(8);
  const [relegationSpots, setRelegationSpots] = useState(4);

  const handleCreateManual = () => {
    if (!name || selectedParticipants.length < 2) {
      toast({ title: "Configuración incompleta", description: "Nombre y al menos 2 participantes requeridos.", variant: "destructive" });
      return;
    }

    if (mode === 'arcade' && !managedParticipantId) {
      toast({ title: "Club no seleccionado", description: "Debes elegir tu club para el modo Arcade.", variant: "destructive" });
      return;
    }

    if (mode === 'challenge') {
      if (selectedParticipants.length !== 2) {
        toast({ title: "Challenge Inválido", description: "Solo puedes elegir exactamente 2 jugadores.", variant: "destructive" });
        return;
      }
      if (challengeSports.length === 0) {
        toast({ title: "Sin Deportes", description: "Añade al menos un deporte al Challenge.", variant: "destructive" });
        return;
      }
    }

    const newTourney = {
      id: Math.random().toString(36).substr(2, 9),
      name, sport: mode === 'challenge' ? 'Multisport' : sport, 
      entryType: mode === 'challenge' ? 'players' : entryType, 
      mode, format: mode === 'challenge' ? 'league' : format, 
      leagueType: mode === 'challenge' ? 'single-table' : leagueType,
      managedParticipantId: mode === 'arcade' ? managedParticipantId : undefined,
      scoringRuleType: scoringType, 
      scoringValue,
      nToNRangeMin: rangeMin,
      nToNRangeMax: rangeMax,
      participants: selectedParticipants, 
      groups: (format === 'league' && leagueType === 'groups' && mode !== 'challenge') ? groups : undefined,
      groupIsolation: true,
      dualLeagueEnabled: mode === 'challenge' ? false : dualLeagueEnabled, 
      dualLeagueMatches: [], winReward, lossPenalty, drawReward,
      winPoints, lossPoints, drawPoints,
      matches: [], playoffSpots: mode === 'challenge' ? 0 : playoffSpots, 
      relegationSpots: mode === 'challenge' ? 0 : relegationSpots, 
      currentSeason: 1, currentMatchday: 1,
      settingsLocked: false, variability: 15,
      challengeSports: mode === 'challenge' ? challengeSports : undefined,
      challengeRounds: mode === 'challenge' ? challengeRounds : undefined
    };

    addTournament(newTourney as any);
    toast({ title: "Universo Iniciado", description: "Torneo creado con éxito." });
    router.push(`/tournaments`);
  };

  const addSport = () => {
    if (!nsName) return;
    const newSport: ChallengeSport = {
      id: `sport-${Date.now()}`,
      name: nsName,
      isNumeric: nsNumeric,
      hasPeriods: nsPeriods,
      numPeriods: nsPeriods ? nsNumPeriods : undefined,
      periodDuration: nsPeriods ? nsDuration : undefined,
      restDuration: nsPeriods ? nsRest : undefined,
    };
    setChallengeSports([...challengeSports, newSport]);
    setIsSportModalOpen(false);
    setNsName('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32 px-4 md:px-0">
      <header>
        <h1 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-3">
          <Trophy className="text-primary w-10 md:w-12 h-10 md:h-12" /> Architect Studio
        </h1>
        <p className="text-muted-foreground">Configura las reglas competitivas de tu nuevo universo.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none bg-card shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/20 border-b p-6">
            <CardTitle className="text-lg font-black uppercase">Estructura Base</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2"><Label>Nombre del Torneo</Label><Input value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl" placeholder="Ej: Challenge l'Horta 2024" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Modo de Juego</Label>
                <Select value={mode} onValueChange={(v: any) => {
                  setMode(v);
                  if (v === 'challenge') {
                    setEntryType('players');
                    setFormat('league');
                    setLeagueType('single-table');
                    setSelectedParticipants([]);
                  }
                }}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="normal">Simulación Total</SelectItem>
                    <SelectItem value="arcade">Modo Arcade (Controlas Club)</SelectItem>
                    <SelectItem value="challenge">MODO CHALLENGE (Innovación)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Participantes</Label>
                <Select value={entryType} onValueChange={(v: any) => setEntryType(v)} disabled={mode === 'challenge'}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="teams">Clubs / Equipos</SelectItem>
                    <SelectItem value="players">Agentes Libres</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {mode !== 'challenge' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Formato</Label>
                    <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="league">Liga Regular</SelectItem>
                        <SelectItem value="knockout">Eliminatoria Directa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {format === 'league' && (
                    <div className="space-y-2">
                      <Label>Tipo de Liga</Label>
                      <Select value={leagueType} onValueChange={(v: any) => setLeagueType(v)}>
                        <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="single-table">Tabla Única Global</SelectItem>
                          <SelectItem value="groups">Conferencias / Grupos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border">
                  <div className="space-y-0.5">
                    <Label className="font-black uppercase text-[10px]">Liga Dual (Espejo)</Label>
                    <p className="text-[9px] text-muted-foreground">Simula canteras en paralelo e invertido.</p>
                  </div>
                  <Switch checked={dualLeagueEnabled} onCheckedChange={setDualLeagueEnabled} />
                </div>
              </>
            )}

            {mode === 'challenge' && (
              <div className="space-y-4 p-6 bg-accent/5 border-2 border-accent/20 rounded-[2rem]">
                <div className="flex justify-between items-center">
                  <h3 className="font-black uppercase text-accent text-sm flex items-center gap-2"><Activity className="w-4 h-4" /> Disciplinas del Challenge</h3>
                  <Button size="sm" onClick={() => setIsSportModalOpen(true)} className="rounded-lg h-8 bg-accent font-black text-[10px]"><Plus className="w-3 h-3 mr-1" /> AÑADIR DEPORTE</Button>
                </div>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {challengeSports.length === 0 ? <p className="text-center text-[10px] py-8 text-muted-foreground opacity-50 uppercase font-black">Sin deportes añadidos</p> : 
                      challengeSports.map(s => (
                        <div key={s.id} className="flex items-center justify-between bg-card p-3 rounded-xl border">
                          <div className="flex items-center gap-3">
                            <Activity className="w-4 h-4 text-accent" />
                            <div><p className="font-black text-xs uppercase">{s.name}</p><p className="text-[8px] opacity-50 uppercase">{s.isNumeric ? 'Numérico' : 'G/P'} {s.hasPeriods ? `• ${s.numPeriods} Periodos` : ''}</p></div>
                          </div>
                          <X className="w-4 h-4 text-destructive cursor-pointer" onClick={() => setChallengeSports(challengeSports.filter(x => x.id !== s.id))} />
                        </div>
                      ))
                    }
                  </div>
                </ScrollArea>
                <div className="pt-2">
                  <Label className="text-[10px] font-black uppercase mb-2 block">Vueltas de Liga</Label>
                  <Input type="number" value={challengeRounds} onChange={e => setChallengeRounds(Number(e.target.value))} className="h-10" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-primary/5 border-b p-6">
            <CardTitle className="text-lg font-black uppercase flex items-center gap-2">
              <Settings2 className="text-primary" /> Sistema de Puntuación
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1"><Label className="text-[10px] uppercase font-bold text-center block">VICTORIA</Label><Input type="number" value={winPoints} onChange={e => setWinPoints(Number(e.target.value))} className="h-12 text-center rounded-xl font-black text-xl" /></div>
              <div className="space-y-1"><Label className="text-[10px] uppercase font-bold text-center block">EMPATE</Label><Input type="number" value={drawPoints} onChange={e => setDrawPoints(Number(e.target.value))} className="h-12 text-center rounded-xl font-black text-xl" /></div>
              <div className="space-y-1"><Label className="text-[10px] uppercase font-bold text-center block">DERROTA</Label><Input type="number" value={lossPoints} onChange={e => setLossPoints(Number(e.target.value))} className="h-12 text-center rounded-xl font-black text-xl" /></div>
            </div>

            {mode !== 'challenge' && (
              <div className="p-6 bg-accent/5 rounded-[2rem] border space-y-4">
                <Label className="text-[10px] font-black uppercase text-accent flex items-center gap-2"><Coins className="w-4 h-4" /> Economía (CR)</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1"><Label className="text-[9px] text-center block uppercase font-bold">Gana (+)</Label><Input type="number" value={winReward} onChange={e => setWinReward(Number(e.target.value))} className="h-10 text-center" /></div>
                  <div className="space-y-1"><Label className="text-[9px] text-center block uppercase font-bold">Pierde (-)</Label><Input type="number" value={lossPenalty} onChange={e => setLossPenalty(Number(e.target.value))} className="h-10 text-center" /></div>
                  <div className="space-y-1"><Label className="text-[9px] text-center block uppercase font-bold">Empata</Label><Input type="number" value={drawReward} onChange={e => setDrawReward(Number(e.target.value))} className="h-10 text-center" /></div>
                </div>
              </div>
            )}
            
            {mode === 'challenge' && (
              <div className="p-6 bg-primary/10 rounded-[2rem] border-2 border-primary/20 flex items-center gap-4">
                <ShieldCheck className="w-10 h-10 text-primary shrink-0" />
                <p className="text-[10px] font-bold text-primary uppercase leading-tight">En el modo Challenge, la economía está desactivada. Solo importan los puntos deportivos por disciplina.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-none bg-card shadow-2xl rounded-[3rem] p-8 space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <CardTitle className="text-xl font-black uppercase flex items-center gap-2">
              <Users className="text-primary" /> {mode === 'challenge' ? 'Selección de Dualistas' : 'Inscripción' } ({selectedParticipants.length}{mode === 'challenge' ? '/2' : ''})
            </CardTitle>
            <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase">
              {mode === 'challenge' ? 'Selecciona exactamente 2 agentes para el duelo personal.' : 'Marca los clubes o agentes participantes.' }
            </p>
          </div>
          {mode !== 'challenge' && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedParticipants((entryType === 'teams' ? teams : players).map(t => t.id))} className="text-[10px] font-black uppercase h-10 px-6 border-primary text-primary">SELECCIONAR TODOS</Button>
              <Button variant="outline" size="sm" onClick={() => { setSelectedParticipants([]); setGroups(groups.map(g => ({...g, participantIds: []}))); }} className="text-[10px] font-black uppercase h-10 px-6">LIMPIAR</Button>
            </div>
          )}
        </header>
        <ScrollArea className="h-[400px]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pr-4 pb-4">
            {(entryType === 'teams' ? teams : players).map((item) => {
              const isSelected = selectedParticipants.includes(item.id);
              const isTeam = 'abbreviation' in item;
              return (
                <button 
                  key={`reg-card-${item.id}`} 
                  onClick={() => {
                    if (mode === 'challenge') {
                      if (isSelected) setSelectedParticipants(prev => prev.filter(id => id !== item.id));
                      else if (selectedParticipants.length < 2) setSelectedParticipants(prev => [...prev, item.id]);
                      else toast({ title: "Límite Challenge", description: "Solo puedes elegir 2 duelistas.", variant: "destructive" });
                    } else {
                      setSelectedParticipants(prev => isSelected ? prev.filter(id => id !== item.id) : [...prev, item.id]);
                    }
                  }}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 relative group",
                    isSelected ? "bg-primary/10 border-primary shadow-md" : "bg-card border-muted/30 hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {isTeam ? (
                        <CrestIcon shape={(item as any).emblemShape} pattern={(item as any).emblemPattern} c1={(item as any).crestPrimary} c2={(item as any).crestSecondary} c3={(item as any).crestTertiary || (item as any).crestPrimary} size="w-10 h-10" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-muted/20 flex items-center justify-center font-black text-xs">{(item as any).jerseyNumber}</div>
                      )}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full p-0.5 shadow-lg">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <span className="font-black text-[10px] uppercase truncate block">{item.name}</span>
                      <span className="text-[9px] opacity-50 block">{isTeam ? (item as any).abbreviation : (item as any).position}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </Card>

      <div className="pt-12">
        <Button 
          onClick={handleCreateManual} 
          disabled={(mode === 'challenge' ? selectedParticipants.length !== 2 : selectedParticipants.length < 2) || !name} 
          className="w-full h-24 rounded-[3rem] text-3xl font-black bg-primary shadow-2xl shadow-primary/40 uppercase tracking-tighter"
        >
          {mode === 'challenge' ? 'INICIAR DUELO CHALLENGE' : 'LANZAR NUEVO UNIVERSO' }
        </Button>
      </div>

      <Dialog open={isSportModalOpen} onOpenChange={setIsSportModalOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-md border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-accent p-6 text-white border-b">
            <DialogTitle className="text-xl font-black uppercase flex items-center gap-2"><Activity /> Configurar Disciplina</DialogTitle>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2"><Label>Nombre del Deporte</Label><Input value={nsName} onChange={e => setNsName(e.target.value)} placeholder="Ej: Tenis de Mesa" /></div>
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border">
              <Label className="font-black uppercase text-[10px]">Resultado Numérico</Label>
              <Switch checked={nsNumeric} onCheckedChange={setNsNumeric} />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border">
              <Label className="font-black uppercase text-[10px]">Habilitar Cronómetro / Periodos</Label>
              <Switch checked={nsPeriods} onCheckedChange={setNsPeriods} />
            </div>
            {nsPeriods && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1"><Label className="text-[8px] font-black uppercase block text-center">Nº Periodos</Label><Input type="number" value={nsNumPeriods} onChange={e => setNsNumPeriods(Number(e.target.value))} /></div>
                <div className="space-y-1"><Label className="text-[8px] font-black uppercase block text-center">Duración (seg)</Label><Input type="number" value={nsDuration} onChange={e => setNsDuration(Number(e.target.value))} /></div>
                <div className="space-y-1"><Label className="text-[8px] font-black uppercase block text-center">Descanso (seg)</Label><Input type="number" value={nsRest} onChange={e => setNsRest(Number(e.target.value))} /></div>
              </div>
            )}
            <Button onClick={addSport} className="w-full h-12 bg-accent font-black rounded-xl uppercase">GUARDAR DEPORTE</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}