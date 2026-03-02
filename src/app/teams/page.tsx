
'use client';

import { useState, useEffect } from 'react';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Trash2, Pencil, Sparkles, Shield, Star, Coins, UserPlus, LayoutGrid, Users, UserCircle2, Info, ChevronRight, ArrowLeftRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmblemShape, EmblemPattern, VenueSurface, VenueSize, Team, Player, UniformStyle, ElementPlacement, VerticalPlacement, ElementSize } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PREDEFINED_COLORS } from '@/lib/colors';
import { Textarea } from '@/components/ui/textarea';
import { CrestIcon } from '@/components/ui/crest-icon';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const ColorPicker = ({ label, value, onChange }: { label: string, value: string, onChange: (c: string) => void }) => (
  <div className="space-y-1.5">
    <Label className="text-[10px] font-black uppercase text-muted-foreground">{label}</Label>
    <div className="grid grid-cols-6 gap-1 p-1 bg-muted/10 rounded-lg border">
      {PREDEFINED_COLORS.map(color => (
        <button
          key={color}
          onClick={() => onChange(color)}
          className={cn(
            "w-4 h-4 rounded-full border transition-all",
            value === color ? "ring-2 ring-primary scale-110" : "border-transparent"
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  </div>
);

export default function TeamsPage() {
  const { teams, players, settings, addTeam, updateTeam, deleteTeam, transferPlayer, addPlayer, deletePlayer } = useTournamentStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);
  const [playerTargetTeamId, setPlayerTargetTeamId] = useState<string | null>(null);
  const [viewingRosterTeamId, setViewingRosterTeamId] = useState<string | null>(null);
  
  // Manual Transfer State
  const [isTransferCenterOpen, setIsTransferCenterOpen] = useState(false);
  const [tSource, setTSource] = useState<string>('free');
  const [tPlayer, setTPlayer] = useState<string>('');
  const [tDest, setTDest] = useState<string>('');

  // Team Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [rating, setRating] = useState(50);
  const [budget, setBudget] = useState(50);
  const [crestShape, setCrestShape] = useState<EmblemShape>('shield');
  const [crestPattern, setCrestPattern] = useState<EmblemPattern>('none');
  const [crestC1, setCrestC1] = useState(PREDEFINED_COLORS[24]);
  const [crestC2, setCrestC2] = useState(PREDEFINED_COLORS[35]);
  const [crestC3, setCrestC3] = useState(PREDEFINED_COLORS[35]);
  const [crestC4, setCrestC4] = useState<string | undefined>(undefined);
  const [crestBorder, setCrestBorder] = useState<'none'|'thin'|'thick'>('thin');
  const [venueName, setVenueName] = useState('');
  const [venueCapacity, setVenueCapacity] = useState(1000);
  const [venueSurface, setVenueSurface] = useState<VenueSurface>('grass');
  const [venueSize, setVenueSize] = useState<VenueSize>('medium');

  // New Player State
  const [pName, setPName] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pPos, setPPos] = useState(settings.positions[0] || 'FW');
  const [pVal, setPVal] = useState(10);
  const [pNum, setPNum] = useState(10);
  const [pAttrs, setPAttrs] = useState<Record<string, number>>({});

  useEffect(() => {
    if (editingTeam) {
      setName(editingTeam.name);
      setDescription(editingTeam.description || '');
      setAbbreviation(editingTeam.abbreviation);
      setRating(editingTeam.rating);
      setBudget(editingTeam.budget || 50);
      setCrestShape(editingTeam.emblemShape);
      setCrestPattern(editingTeam.emblemPattern || 'none');
      setCrestC1(editingTeam.crestPrimary);
      setCrestC2(editingTeam.crestSecondary);
      setCrestC3(editingTeam.crestTertiary || editingTeam.crestSecondary);
      setCrestC4(editingTeam.crestAccent);
      setCrestBorder(editingTeam.crestBorderWidth || 'thin');
      setVenueName(editingTeam.venueName);
      setVenueCapacity(editingTeam.venueCapacity);
      setVenueSurface(editingTeam.venueSurface);
      setVenueSize(editingTeam.venueSize);
    } else {
      resetForm();
    }
  }, [editingTeam]);

  useEffect(() => {
    if (isPlayerDialogOpen) {
      const initialAttrs: Record<string, number> = {};
      settings.attributeNames.forEach(attr => initialAttrs[attr] = 50);
      setPAttrs(initialAttrs);
    }
  }, [isPlayerDialogOpen, settings.attributeNames]);

  const resetForm = () => {
    setName(''); setDescription(''); setAbbreviation(''); setRating(50); setBudget(50);
    setCrestShape('shield'); setCrestPattern('none');
    setCrestC1(PREDEFINED_COLORS[24]); setCrestC2(PREDEFINED_COLORS[35]);
    setCrestC3(PREDEFINED_COLORS[35]); setCrestC4(undefined);
    setCrestBorder('thin'); setVenueName(''); setVenueCapacity(1000);
    setVenueSurface('grass'); setVenueSize('medium');
  };

  const handleSaveTeam = () => {
    if (!name || abbreviation.length !== 3) {
      toast({ title: "Error", description: "Nombre y Siglas requeridos.", variant: "destructive" });
      return;
    }
    
    const teamData: Team = {
      id: editingTeam ? editingTeam.id : Math.random().toString(36).substr(2, 9),
      name, description, abbreviation: abbreviation.toUpperCase(), rating, budget,
      emblemShape: crestShape, emblemPattern: crestPattern, crestPrimary: crestC1, crestSecondary: crestC2,
      crestTertiary: crestC3, crestAccent: crestC4, crestBorderWidth: crestBorder,
      venueName: venueName || 'Arena Principal', venueCapacity, venueSurface, venueSize,
      players: editingTeam ? editingTeam.players : []
    };

    if (editingTeam) {
      updateTeam(teamData);
      toast({ title: "Actualizado", description: "Club actualizado correctamente." });
    } else {
      addTeam(teamData);
      toast({ title: "Club Creado", description: "Nueva entidad registrada en el sistema." });
    }
    setIsDialogOpen(false);
    setEditingTeam(null);
  };

  const handleCreatePlayer = () => {
    if (!pName || !playerTargetTeamId) return;
    const targetTeam = teams.find(t => t.id === playerTargetTeamId);
    
    const newPlayer: Player = {
      id: Math.random().toString(36).substr(2, 9),
      name: pName,
      description: pDesc,
      monetaryValue: pVal,
      jerseyNumber: pNum,
      position: pPos,
      teamId: playerTargetTeamId,
      suspensionMatchdays: 0,
      attributes: Object.entries(pAttrs).map(([name, value]) => ({ name, value })),
      uniformStyle: 'solid',
      kitPrimary: targetTeam?.crestPrimary || PREDEFINED_COLORS[24],
      kitSecondary: targetTeam?.crestSecondary || PREDEFINED_COLORS[35],
      kitTertiary: targetTeam?.crestTertiary || targetTeam?.crestSecondary,
      kitAccent: targetTeam?.crestAccent || targetTeam?.crestSecondary,
      crestPlacement: 'left',
      sponsorPlacement: 'middle',
      brandPlacement: 'right',
      crestSize: 'medium'
    };
    addPlayer(newPlayer);
    toast({ title: "Jugador Reclutado", description: `${pName} se ha unido al club.` });
    setIsPlayerDialogOpen(false);
    setPName(''); setPDesc(''); setPVal(10); setPNum(10);
  };

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.abbreviation.toLowerCase().includes(search.toLowerCase())
  );

  const viewingRosterTeam = teams.find(t => t.id === viewingRosterTeamId);
  const teamRoster = players.filter(p => p.teamId === viewingRosterTeamId);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <header className="flex justify-between items-center px-2 md:px-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase flex items-center gap-3">
            Clubs <Sparkles className="text-accent w-5 h-5 md:w-6 md:h-6" />
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm">Gestiona tus franquicias y su economía regional.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="font-black rounded-xl h-10 md:h-12 border-primary text-primary" onClick={() => setIsTransferCenterOpen(true)}>
            <ArrowLeftRight className="w-4 h-4 mr-2" /> TRASPASOS
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingTeam(null); }}>
            <DialogTrigger asChild><Button className="font-black rounded-xl h-10 md:h-12 shadow-lg shadow-primary/20 text-xs md:text-sm">FUNDAR CLUB</Button></DialogTrigger>
            <DialogContent className="max-w-[95vw] md:max-w-[800px] p-0 overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-2xl">
              <div className="p-4 md:p-6 bg-muted/20 border-b">
                <DialogTitle className="font-black uppercase text-sm md:text-base">Club Identity Studio</DialogTitle>
              </div>
              <Tabs defaultValue="base" className="w-full flex flex-col h-[80vh] md:h-[70vh]">
                <TabsList className="grid grid-cols-3 rounded-none h-12 md:h-14 border-b bg-card p-1">
                  <TabsTrigger value="base" className="rounded-lg md:rounded-xl text-xs">General</TabsTrigger>
                  <TabsTrigger value="crest" className="rounded-lg md:rounded-xl text-xs">Heráldica</TabsTrigger>
                  <TabsTrigger value="venue" className="rounded-lg md:rounded-xl text-xs">Sede</TabsTrigger>
                </TabsList>
                
                <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
                  <TabsContent value="base" className="space-y-6 mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Nombre del Club</Label><Input value={name} onChange={e => setName(e.target.value)} className="h-10 md:h-12 rounded-xl" /></div>
                      <div className="space-y-2"><Label>Siglas (3 car.)</Label><Input maxLength={3} value={abbreviation} onChange={e => setAbbreviation(e.target.value)} className="h-10 md:h-12 rounded-xl" /></div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Descripción / Historia</Label>
                        <Textarea value={description} onChange={e => setDescription(e.target.value)} className="min-h-[80px] md:min-h-[100px] rounded-xl" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 p-4 bg-muted/10 rounded-2xl border">
                        <div className="flex justify-between items-center mb-2"><Label>Rating Global</Label><span className="font-black text-primary">{rating}</span></div>
                        <Slider value={[rating]} onValueChange={v => setRating(v[0])} max={100} min={1} />
                      </div>
                      <div className="space-y-2 p-4 bg-muted/10 rounded-2xl border">
                        <Label className="flex items-center gap-2"><Coins className="w-4 h-4 text-accent" /> Presupuesto ({settings.currency})</Label>
                        <Input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))} className="h-10 mt-2 rounded-lg" />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="crest" className="space-y-8 mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
                      <div className="aspect-square bg-muted/20 rounded-3xl flex items-center justify-center border-2 border-dashed border-accent/20">
                        <CrestIcon shape={crestShape} pattern={crestPattern} c1={crestC1} c2={crestC2} c3={crestC3} c4={crestC4} border={crestBorder} size="w-32 h-32 md:w-40 h-40" />
                      </div>
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Forma Base</Label>
                            <Select value={crestShape} onValueChange={(v: any) => setCrestShape(v)}>
                              <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                              <SelectContent>{['shield','circle','hexagon','diamond','modern','star','crown','eagle','lion'].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Patrón</Label>
                            <Select value={crestPattern} onValueChange={(v: any) => setCrestPattern(v)}>
                              <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                              <SelectContent>{['none','vertical-split','horizontal-split','diagonal-split','cross','saltire','quarters'].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <ColorPicker label="Base" value={crestC1} onChange={setCrestC1} />
                          <ColorPicker label="Patrón" value={crestC2} onChange={setCrestC2} />
                          <ColorPicker label="Borde" value={crestC3} onChange={setCrestC3} />
                          <ColorPicker label="Acento" value={crestC4 || ''} onChange={setCrestC4} />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="venue" className="space-y-6 mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2"><Label>Nombre de la Sede</Label><Input value={venueName} onChange={e => setVenueName(e.target.value)} className="h-10 md:h-12 rounded-xl" /></div>
                      <div className="space-y-2"><Label>Aforo Máximo</Label><Input type="number" value={venueCapacity} onChange={e => setVenueCapacity(Number(e.target.value))} className="h-10 md:h-12 rounded-xl" /></div>
                      <div className="space-y-2">
                        <Label>Superficie</Label>
                        <Select value={venueSurface} onValueChange={(v: any) => setVenueSurface(v)}>
                          <SelectTrigger className="h-10 md:h-12 rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>{['grass','artificial','clay','hardcourt','parquet','ice','sand'].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Escala</Label>
                        <Select value={venueSize} onValueChange={(v: any) => setVenueSize(v)}>
                          <SelectTrigger className="h-10 md:h-12 rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>{['small','medium','large','monumental'].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                </div>

                <div className="p-4 bg-muted/20 border-t flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-10 md:h-12 px-4 md:px-8 font-black text-xs md:text-sm">CANCELAR</Button>
                  <Button onClick={handleSaveTeam} className="rounded-xl h-10 md:h-12 px-4 md:px-8 font-black shadow-lg shadow-primary/20 text-xs md:text-sm">GUARDAR CLUB</Button>
                </div>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="px-2 md:px-0">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 md:w-5 md:h-5" />
          <Input 
            className="pl-12 h-12 md:h-14 rounded-2xl border-none shadow-xl bg-card text-base md:text-lg" 
            placeholder="Buscar club..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 px-2 md:px-0">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-2xl overflow-hidden group">
            <div className="h-2 md:h-3 w-full" style={{ backgroundColor: team.crestPrimary }} />
            <div className="p-4 md:p-8">
              <div className="flex gap-4 md:gap-6 items-center mb-4 md:mb-6">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-muted/30 rounded-2xl md:rounded-[2rem] flex items-center justify-center relative shadow-inner">
                  <CrestIcon shape={team.emblemShape} pattern={team.emblemPattern} c1={team.crestPrimary} c2={team.crestSecondary} c3={team.crestTertiary || team.crestSecondary} c4={team.crestAccent} border={team.crestBorderWidth} size="w-10 h-10 md:w-12 md:h-12" />
                  <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-primary text-[8px] md:text-[10px] font-black px-2 py-0.5 md:px-3 md:py-1 rounded-full text-white shadow-xl">{team.abbreviation}</div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="text-lg md:text-2xl font-black uppercase truncate tracking-tighter">{team.name}</h3>
                  <div className="flex items-center gap-2 md:gap-3 mt-1 md:mt-2">
                    <div className="flex items-center gap-1 text-[10px] md:text-xs font-black text-accent"><Coins className="w-3 h-3" /> {team.budget?.toLocaleString()}</div>
                    <div className="flex items-center gap-1 text-[10px] md:text-xs font-black text-primary"><Star className="w-3 h-3 fill-current" /> {team.rating}</div>
                  </div>
                </div>
              </div>

              {team.description && <p className="text-[10px] text-muted-foreground line-clamp-2 mb-4 md:mb-6 italic">{team.description}</p>}

              <div className="grid grid-cols-2 gap-2">
                <Button className="h-9 md:h-11 rounded-xl font-black text-[10px] md:text-sm" variant="secondary" onClick={() => { setEditingTeam(team); setIsDialogOpen(true); }}>
                  <Pencil className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" /> EDITAR
                </Button>
                <Button className="h-9 md:h-11 rounded-xl font-black text-[10px] md:text-sm" variant="default" onClick={() => { setPlayerTargetTeamId(team.id); setIsPlayerDialogOpen(true); }}>
                  <UserPlus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" /> RECLUTAR
                </Button>
                <Button variant="outline" className="h-9 md:h-11 rounded-xl font-black border-primary text-primary text-[10px] md:text-sm" onClick={() => setViewingRosterTeamId(team.id)}>
                  <LayoutGrid className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" /> PLANTILLA
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-9 md:h-11 rounded-xl font-black border-accent text-accent text-[10px] md:text-sm"><Users className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" /> MERCADO</Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-[1.5rem] md:rounded-[2rem] max-w-[90vw] md:max-w-lg">
                    <DialogHeader><DialogTitle className="font-black uppercase text-sm md:text-base">Agentes Libres para {team.name}</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Fichar agentes sin club</p>
                      <ScrollArea className="h-[250px] md:h-[300px] pr-2">
                        <div className="grid gap-2">
                          {players.filter(p => !p.teamId).map(p => (
                            <div key={p.id} className="flex items-center justify-between p-2 md:p-3 bg-muted/30 rounded-xl">
                              <div className="overflow-hidden"><p className="font-black text-xs md:text-sm truncate">{p.name}</p><p className="text-[9px] md:text-[10px] font-bold text-accent">{p.monetaryValue.toLocaleString()} {settings.currency}</p></div>
                              <Button size="sm" className="font-black text-[9px] md:text-xs h-7 md:h-8" onClick={() => {
                                if (team.budget < p.monetaryValue) {
                                  toast({ title: "Fondos Insuficientes", variant: "destructive" });
                                  return;
                                }
                                transferPlayer(p.id, team.id);
                                toast({ title: "Fichaje Confirmado" });
                              }}>FICHAR</Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="destructive" className="h-9 md:h-11 rounded-xl shadow-lg" onClick={() => {
                  if(confirm(`¿Desaparecer el club ${team.name}?`)) deleteTeam(team.id);
                }}>
                  <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Manual Transfer Center */}
      <Dialog open={isTransferCenterOpen} onOpenChange={setIsTransferCenterOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-primary p-6 text-white border-b">
            <DialogTitle className="text-xl md:text-2xl font-black uppercase flex items-center gap-3">
              <ArrowLeftRight className="w-6 h-6" /> Oficina de Traspasos
            </DialogTitle>
          </div>
          <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 bg-card">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">1. Selección de Origen</Label>
                <Select value={tSource} onValueChange={(v) => { setTSource(v); setTPlayer(''); }}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Origen..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Agentes Libres</SelectItem>
                    {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">2. Elegir Agente</Label>
                <Select value={tPlayer} onValueChange={setTPlayer}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Agente..." /></SelectTrigger>
                  <SelectContent>
                    {players.filter(p => tSource === 'free' ? !p.teamId : p.teamId === tSource).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.monetaryValue} {settings.currency})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">3. Destino del Contrato</Label>
                <Select value={tDest} onValueChange={setTDest}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Destino..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Agente Libre (Despido)</SelectItem>
                    {teams.filter(t => t.id !== tSource).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <Button 
                  className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20" 
                  disabled={!tPlayer || !tDest}
                  onClick={() => {
                    const p = players.find(x => x.id === tPlayer);
                    const target = tDest === 'free' ? undefined : teams.find(x => x.id === tDest);
                    if (target && tSource === 'free' && target.budget < (p?.monetaryValue || 0)) {
                      toast({ title: "Fondos Insuficientes", variant: "destructive" });
                      return;
                    }
                    transferPlayer(tPlayer, tDest === 'free' ? undefined : tDest);
                    toast({ title: "Traspaso Realizado", description: "El universo ha sido reequilibrado." });
                    setTPlayer('');
                  }}
                >
                  EJECUTAR OPERACIÓN
                </Button>
              </div>
            </div>
          </div>
          <div className="p-4 bg-muted/30 border-t flex justify-end">
            <Button variant="ghost" onClick={() => setIsTransferCenterOpen(false)} className="rounded-xl font-black uppercase text-[10px]">Cerrar Oficina</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPlayerDialogOpen} onOpenChange={setIsPlayerDialogOpen}>
        <DialogContent className="rounded-[1.5rem] md:rounded-[2.5rem] max-w-[95vw] md:max-w-[800px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-4 md:p-6 bg-muted/20 border-b">
            <DialogTitle className="font-black uppercase flex items-center gap-2 text-sm md:text-base">
              <UserCircle2 className="text-primary w-4 h-4 md:w-5 md:h-5" /> Reclutamiento para {teams.find(t => t.id === playerTargetTeamId)?.name}
            </DialogTitle>
          </div>
          <Tabs defaultValue="base" className="w-full flex flex-col h-[80vh] md:h-[65vh]">
            <TabsList className="grid grid-cols-2 rounded-none h-12 md:h-14 bg-card p-1 border-b">
              <TabsTrigger value="base" className="rounded-lg md:rounded-xl text-xs">Bio</TabsTrigger>
              <TabsTrigger value="stats" className="rounded-lg md:rounded-xl text-xs">Estadísticas</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
              <TabsContent value="base" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2"><Label>Nombre</Label><Input value={pName} onChange={e => setPName(e.target.value)} className="h-10 md:h-12 rounded-xl" /></div>
                  <div className="space-y-2">
                    <Label>Posición</Label>
                    <Select value={pPos} onValueChange={setPPos}>
                      <SelectTrigger className="h-10 md:h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>{settings.positions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Valor</Label><Input type="number" value={pVal} onChange={e => setPVal(Number(e.target.value))} className="h-10 md:h-12 rounded-xl" /></div>
                  <div className="space-y-2"><Label>Dorsal</Label><Input type="number" value={pNum} onChange={e => setPNum(Number(e.target.value))} className="h-10 md:h-12 rounded-xl" /></div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Biografía</Label>
                    <Textarea value={pDesc} onChange={e => setPDesc(e.target.value)} placeholder="Historia del jugador..." className="min-h-[100px] rounded-xl" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="stats" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  {settings.attributeNames.map(attr => (
                    <div key={attr} className="space-y-2 p-3 md:p-4 bg-muted/10 rounded-2xl border">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] md:text-[10px] font-black uppercase text-primary">{attr}</span>
                        <span className="text-base md:text-lg font-black">{pAttrs[attr] || 50}</span>
                      </div>
                      <Slider value={[pAttrs[attr] || 50]} onValueChange={v => setPAttrs(prev => ({...prev, [attr]: v[0]}))} max={100} min={1} />
                    </div>
                  ))}
                </div>
              </TabsContent>
            </div>

            <div className="p-4 bg-muted/20 border-t flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsPlayerDialogOpen(false)} className="rounded-xl h-10 md:h-12 text-xs md:text-sm font-black px-4 md:px-8">CANCELAR</Button>
              <Button onClick={handleCreatePlayer} disabled={!pName} className="rounded-xl h-10 md:h-12 text-xs md:text-sm font-black px-4 md:px-8 shadow-lg shadow-primary/20">CONFIRMAR</Button>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingRosterTeamId} onOpenChange={(o) => !o && setViewingRosterTeamId(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-3xl p-0 overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-2xl">
          {viewingRosterTeam && (
            <div className="flex flex-col h-[85vh] md:h-[80vh]">
              <div className="p-4 md:p-8 bg-muted/10 border-b flex items-center gap-4 md:gap-6">
                <CrestIcon shape={viewingRosterTeam.emblemShape} pattern={viewingRosterTeam.emblemPattern} c1={viewingRosterTeam.crestPrimary} c2={viewingRosterTeam.crestSecondary} c3={viewingRosterTeam.crestTertiary || viewingRosterTeam.crestSecondary} size="w-12 h-12 md:w-20 md:h-20" />
                <div className="flex-1 overflow-hidden">
                  <DialogTitle className="text-xl md:text-3xl font-black uppercase tracking-tighter truncate">Plantilla de {viewingRosterTeam.name}</DialogTitle>
                  <p className="text-muted-foreground font-bold text-[9px] md:text-xs uppercase mt-1">Total: {teamRoster.length} • {viewingRosterTeam.budget} {settings.currency}</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  {teamRoster.length === 0 ? (
                    <div className="col-span-full py-12 md:py-20 text-center bg-muted/10 rounded-2xl md:rounded-3xl border-2 border-dashed">
                      <Users className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 opacity-20" />
                      <p className="font-bold text-muted-foreground text-xs md:text-sm">Sin jugadores asignados.</p>
                    </div>
                  ) : (
                    teamRoster.map(player => (
                      <div key={player.id} className="p-3 md:p-4 bg-card border rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-xs md:text-sm shrink-0">#{player.jerseyNumber}</div>
                          <div className="overflow-hidden">
                            <p className="font-black text-xs md:text-sm uppercase truncate">{player.name}</p>
                            <Badge variant="secondary" className="text-[8px] md:text-[9px] h-4 mt-0.5 font-black">{player.position}</Badge>
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2">
                          <p className="font-black text-[10px] md:text-xs text-accent">{player.monetaryValue}</p>
                          <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-destructive" onClick={() => {
                            if(confirm(`¿Despedir a ${player.name}?`)) deletePlayer(player.id);
                          }}>
                            <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="p-4 md:p-6 border-t bg-muted/5 flex justify-end">
                <Button onClick={() => setViewingRosterTeamId(null)} className="rounded-xl font-black h-10 md:h-12 px-6 md:px-8 text-xs md:text-sm">CERRAR</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
