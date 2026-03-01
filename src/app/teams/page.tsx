'use client';

import { useState, useEffect } from 'react';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Trash2, Pencil, Sparkles, Shield, Star, Coins, UserPlus, FileText, UserCircle2, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmblemShape, EmblemPattern, VenueSurface, VenueSize, Team, Player } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PREDEFINED_COLORS } from '@/lib/colors';
import { Textarea } from '@/components/ui/textarea';
import { CrestIcon } from '@/components/ui/crest-icon';

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
  const { teams, players, settings, addTeam, updateTeam, deleteTeam, transferPlayer, addPlayer } = useTournamentStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);
  const [playerTargetTeamId, setPlayerTargetTeamId] = useState<string | null>(null);
  
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
  const [venueSurface, setVenueSurface] = useState<VenueSurface>('parquet');
  const [venueSize, setVenueSize] = useState<VenueSize>('medium');

  // New Player State
  const [pName, setPName] = useState('');
  const [pPos, setPPos] = useState(settings.positions[0] || 'FW');
  const [pVal, setPVal] = useState(10);

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

  const resetForm = () => {
    setName(''); setDescription(''); setAbbreviation(''); setRating(50); setBudget(50);
    setCrestShape('shield'); setCrestPattern('none');
    setCrestC1(PREDEFINED_COLORS[24]); setCrestC2(PREDEFINED_COLORS[35]);
    setCrestC3(PREDEFINED_COLORS[35]); setCrestC4(undefined);
    setCrestBorder('thin'); setVenueName(''); setVenueCapacity(1000);
    setVenueSurface('parquet'); setVenueSize('medium');
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
    const newPlayer: Player = {
      id: Math.random().toString(36).substr(2, 9),
      name: pName,
      monetaryValue: pVal,
      jerseyNumber: Math.floor(Math.random() * 99) + 1,
      position: pPos,
      teamId: playerTargetTeamId,
      suspensionMatchdays: 0,
      attributes: settings.attributeNames.map(a => ({ name: a, value: 50 })),
      uniformStyle: 'solid',
      kitPrimary: PREDEFINED_COLORS[24],
      kitSecondary: PREDEFINED_COLORS[35],
      crestPlacement: 'left',
      sponsorPlacement: 'middle',
      brandPlacement: 'right'
    };
    addPlayer(newPlayer);
    toast({ title: "Jugador Reclutado", description: `${pName} se ha unido al club.` });
    setIsPlayerDialogOpen(false);
    setPName('');
  };

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.abbreviation.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <header className="flex justify-between items-center px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-black uppercase flex items-center gap-3">
            Clubs <Sparkles className="text-accent" />
          </h1>
          <p className="text-muted-foreground">Gestiona tus franquicias y su economía regional.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingTeam(null); }}>
          <DialogTrigger asChild><Button className="font-black rounded-xl h-12 shadow-lg shadow-primary/20">FUNDAR CLUB</Button></DialogTrigger>
          <DialogContent className="max-w-[800px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
            <div className="p-6 bg-muted/20 border-b flex justify-between items-center">
              <DialogTitle className="font-black uppercase">Club Identity Studio</DialogTitle>
            </div>
            <Tabs defaultValue="base" className="w-full flex flex-col h-[70vh]">
              <TabsList className="grid grid-cols-3 rounded-none h-14 border-b bg-card p-1">
                <TabsTrigger value="base" className="rounded-xl">General</TabsTrigger>
                <TabsTrigger value="crest" className="rounded-xl">Heráldica</TabsTrigger>
                <TabsTrigger value="venue" className="rounded-xl">Sede</TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-y-auto p-6">
                <TabsContent value="base" className="space-y-6 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Nombre del Club</Label><Input value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl" /></div>
                    <div className="space-y-2"><Label>Siglas (3 car.)</Label><Input maxLength={3} value={abbreviation} onChange={e => setAbbreviation(e.target.value)} className="h-12 rounded-xl" /></div>
                    <div className="space-y-2 col-span-2">
                      <Label>Descripción / Historia</Label>
                      <Textarea value={description} onChange={e => setDescription(e.target.value)} className="min-h-[100px] rounded-xl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="aspect-square bg-muted/20 rounded-3xl flex items-center justify-center border-2 border-dashed border-accent/20">
                      <CrestIcon shape={crestShape} pattern={crestPattern} c1={crestC1} c2={crestC2} c3={crestC3} c4={crestC4} border={crestBorder} size="w-40 h-40" />
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label>Nombre de la Sede</Label><Input value={venueName} onChange={e => setVenueName(e.target.value)} className="h-12 rounded-xl" /></div>
                    <div className="space-y-2"><Label>Aforo Máximo</Label><Input type="number" value={venueCapacity} onChange={e => setVenueCapacity(Number(e.target.value))} className="h-12 rounded-xl" /></div>
                    <div className="space-y-2">
                      <Label>Superficie</Label>
                      <Select value={venueSurface} onValueChange={(v: any) => setVenueSurface(v)}>
                        <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>{['grass','artificial','clay','hardcourt','parquet','ice','sand'].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Escala del Recinto</Label>
                      <Select value={venueSize} onValueChange={(v: any) => setVenueSize(v)}>
                        <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>{['small','medium','large','monumental'].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </div>

              <div className="p-4 bg-muted/20 border-t flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-12 px-8 font-black">CANCELAR</Button>
                <Button onClick={handleSaveTeam} className="rounded-xl h-12 px-8 font-black shadow-lg shadow-primary/20">GUARDAR CLUB</Button>
              </div>
            </Tabs>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-0">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden group">
            <div className="h-3 w-full" style={{ backgroundColor: team.crestPrimary }} />
            <div className="p-8">
              <div className="flex gap-6 items-center mb-6">
                <div className="w-20 h-20 bg-muted/30 rounded-[2rem] flex items-center justify-center relative shadow-inner">
                  <CrestIcon shape={team.emblemShape} pattern={team.emblemPattern} c1={team.crestPrimary} c2={team.crestSecondary} c3={team.crestTertiary || team.crestSecondary} c4={team.crestAccent} border={team.crestBorderWidth} size="w-12 h-12" />
                  <div className="absolute -bottom-2 -right-2 bg-primary text-[10px] font-black px-3 py-1 rounded-full text-white shadow-xl">{team.abbreviation}</div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="text-2xl font-black uppercase truncate tracking-tighter">{team.name}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-xs font-black text-accent"><Coins className="w-3 h-3" /> {team.budget?.toLocaleString()}</div>
                    <div className="flex items-center gap-1 text-xs font-black text-primary"><Star className="w-3 h-3 fill-current" /> {team.rating}</div>
                  </div>
                </div>
              </div>

              {team.description && <p className="text-[10px] text-muted-foreground line-clamp-2 mb-6 italic">{team.description}</p>}

              <div className="grid grid-cols-2 gap-2">
                <Button className="h-11 rounded-xl font-black shadow-lg" variant="secondary" onClick={() => { setEditingTeam(team); setIsDialogOpen(true); }}>
                  <Pencil className="w-4 h-4 mr-2" /> EDITAR
                </Button>
                <Button className="h-11 rounded-xl font-black shadow-lg" variant="default" onClick={() => { setPlayerTargetTeamId(team.id); setIsPlayerDialogOpen(true); }}>
                  <UserPlus className="w-4 h-4 mr-2" /> RECLUTAR
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-11 rounded-xl font-black border-accent text-accent"><Users className="w-4 h-4 mr-2" /> TRASPASOS</Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-[2rem] max-w-lg">
                    <DialogHeader><DialogTitle className="font-black uppercase">Mercado de Traspasos</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase">Fichar Agente para {team.name}</p>
                      <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
                        {players.filter(p => !p.teamId).map(p => (
                          <div key={p.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                            <div><p className="font-black text-sm">{p.name}</p><p className="text-[10px] font-bold text-accent">{p.monetaryValue.toLocaleString()} {settings.currency}</p></div>
                            <Button size="sm" className="font-black" onClick={() => {
                              if (team.budget < p.monetaryValue) {
                                toast({ title: "Fondos Insuficientes", description: "El club no tiene presupuesto para este agente.", variant: "destructive" });
                                return;
                              }
                              transferPlayer(p.id, team.id);
                              toast({ title: "Fichaje Confirmado", description: `${p.name} se une a ${team.name}.` });
                            }}>FICHAR</Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="destructive" className="h-11 rounded-xl shadow-lg shadow-destructive/10" onClick={() => {
                  if(confirm(`¿Desaparecer el club ${team.name}?`)) deleteTeam(team.id);
                }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isPlayerDialogOpen} onOpenChange={setIsPlayerDialogOpen}>
        <DialogContent className="rounded-[2rem] max-w-md">
          <DialogHeader><DialogTitle className="font-black uppercase flex items-center gap-2"><UserCircle2 className="text-primary" /> Nuevo Agente para el Club</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nombre Completo</Label><Input value={pName} onChange={e => setPName(e.target.value)} className="h-12 rounded-xl" /></div>
            <div className="space-y-2">
              <Label>Posición</Label>
              <Select value={pPos} onValueChange={setPPos}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{settings.positions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Valor ({settings.currency})</Label><Input type="number" value={pVal} onChange={e => setPVal(Number(e.target.value))} className="h-12 rounded-xl" /></div>
            <Button onClick={handleCreatePlayer} disabled={!pName} className="w-full h-12 rounded-xl font-black shadow-lg shadow-primary/20">CONFIRMAR FICHAJE</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
