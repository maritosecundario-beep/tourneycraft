
'use client';

import { useState, useEffect } from 'react';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Trash2, Pencil, Sparkles, Landmark, Star, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmblemShape, EmblemPattern, VenueSurface, VenueSize, Team } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PREDEFINED_COLORS } from '@/lib/colors';

// Advanced Crest SVG Component 2.0
const CrestIcon = ({ 
  shape, pattern, c1, c2, c3, c4, border = 'thin', size = "w-10 h-10" 
}: { 
  shape: EmblemShape, pattern: EmblemPattern, c1: string, c2: string, c3: string, c4?: string, 
  border?: 'none' | 'thin' | 'thick', size?: string 
}) => {
  const borderWidth = border === 'none' ? 0 : border === 'thin' ? 1 : 2;
  
  const renderPattern = () => {
    switch(pattern) {
      case 'vertical-split': return <rect x="12" y="0" width="12" height="24" fill={c2} />;
      case 'horizontal-split': return <rect x="0" y="12" width="24" height="12" fill={c2} />;
      case 'diagonal-split': return <path d="M0 0 L24 24 L24 0 Z" fill={c2} />;
      case 'cross': return (
        <>
          <rect x="10" y="0" width="4" height="24" fill={c2} />
          <rect x="0" y="10" width="24" height="4" fill={c2} />
        </>
      );
      case 'saltire': return (
        <>
          <path d="M0 0 L24 24 L20 24 L0 4 Z" fill={c2} />
          <path d="M24 0 L0 24 L4 24 L24 4 Z" fill={c2} />
        </>
      );
      case 'quarters': return (
        <>
          <rect x="12" y="0" width="12" height="12" fill={c2} />
          <rect x="0" y="12" width="12" height="12" fill={c2} />
        </>
      );
      default: return null;
    }
  };

  const renderShapePath = () => {
    switch (shape) {
      case 'shield': return "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z";
      case 'circle': return "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z";
      case 'hexagon': return "M12 2l8.66 5v10L12 22l-8.66-5V7z";
      case 'diamond': return "M12 2l10 10-10 10-10-10z";
      case 'modern': return "M2 7l10-5 10 5v10l-10 5-10-5z";
      case 'square': return "M3 3h18v18h-18z";
      case 'star': return "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z";
      case 'lion': return "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z";
      case 'crown': return "M2 20h20v-4l-4-4-2 4-2-4-2 4-2-4-4 4z";
      case 'eagle': return "M12 2l2 4h6l-4 4 2 6-6-4-6 4 2-6-4-4h6z";
      default: return "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z";
    }
  };

  const pathD = renderShapePath();

  return (
    <svg viewBox="0 0 24 24" className={cn("drop-shadow-lg", size)}>
      <defs>
        <clipPath id={`crest-clip-${shape}`}>
          <path d={pathD} />
        </clipPath>
      </defs>
      <path d={pathD} fill={c1} />
      <g clipPath={`url(#crest-clip-${shape})`}>
        {renderPattern()}
      </g>
      {borderWidth > 0 && <path d={pathD} fill="none" stroke={c3} strokeWidth={borderWidth} />}
      {shape === 'lion' && <path d="M12 7c-2 0-3 1-3 3s1 3 3 3 3-1 3-3-1-3-3-3z" fill={c4 || c2} />}
    </svg>
  );
};

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
  const { teams, addTeam, updateTeam, deleteTeam } = useTournamentStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [rating, setRating] = useState(50);
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

  useEffect(() => {
    if (editingTeam) {
      setName(editingTeam.name);
      setAbbreviation(editingTeam.abbreviation);
      setRating(editingTeam.rating);
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
    setName(''); setAbbreviation(''); setRating(50);
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
      name, abbreviation: abbreviation.toUpperCase(), rating,
      emblemShape: crestShape, emblemPattern: crestPattern, crestPrimary: crestC1, crestSecondary: crestC2,
      crestTertiary: crestC3, crestAccent: crestC4, crestBorderWidth: crestBorder,
      venueName: venueName || 'Arena Principal', venueCapacity, venueSurface, venueSize,
      players: editingTeam ? editingTeam.players : []
    };

    if (editingTeam) {
      updateTeam(teamData);
      toast({ title: "Actualizado", description: "Club actualizado." });
    } else {
      addTeam(teamData);
      toast({ title: "Club Creado", description: "Nueva entidad registrada." });
    }
    setIsDialogOpen(false);
    setEditingTeam(null);
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
          <p className="text-muted-foreground">Gestiona tus franquicias y estadios.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingTeam(null); }}>
          <DialogTrigger asChild><Button className="font-black rounded-xl h-12 shadow-lg shadow-primary/20">FUNDAR CLUB</Button></DialogTrigger>
          <DialogContent className="max-w-[800px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
            <div className="p-6 bg-muted/20 border-b flex justify-between items-center">
              <DialogTitle className="font-black uppercase">Club Identity Studio</DialogTitle>
            </div>
            <Tabs defaultValue="base" className="w-full flex flex-col h-[70vh]">
              <TabsList className="grid grid-cols-3 rounded-none h-14 border-b bg-card p-1">
                <TabsTrigger value="base" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">General</TabsTrigger>
                <TabsTrigger value="crest" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">Heráldica</TabsTrigger>
                <TabsTrigger value="venue" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">Infraestructura</TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <TabsContent value="base" className="space-y-6 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Nombre del Club</Label><Input value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl" /></div>
                    <div className="space-y-2"><Label>Siglas (3 car.)</Label><Input maxLength={3} value={abbreviation} onChange={e => setAbbreviation(e.target.value)} className="h-12 rounded-xl" /></div>
                  </div>
                  <div className="space-y-2 p-4 bg-muted/10 rounded-2xl border">
                    <div className="flex justify-between items-center mb-2">
                      <Label>Rating Global</Label>
                      <span className="text-lg font-black text-primary">{rating}</span>
                    </div>
                    <Slider value={[rating]} onValueChange={v => setRating(v[0])} max={100} min={1} />
                  </div>
                </TabsContent>

                <TabsContent value="crest" className="space-y-8 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="aspect-square bg-muted/20 rounded-3xl flex items-center justify-center border-2 border-dashed border-accent/20 shadow-inner">
                      <CrestIcon shape={crestShape} pattern={crestPattern} c1={crestC1} c2={crestC2} c3={crestC3} c4={crestC4} border={crestBorder} size="w-40 h-40" />
                    </div>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Forma Base</Label>
                          <Select value={crestShape} onValueChange={(v: any) => setCrestShape(v)}>
                            <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>{['shield','circle','hexagon','diamond','modern','square','lion','star','crown','eagle'].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
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

      <div className="px-4 md:px-0">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
          <Input 
            className="pl-12 h-14 rounded-2xl border-none shadow-xl bg-card text-lg focus-visible:ring-2 focus-visible:ring-primary" 
            placeholder="Filtrar clubs por nombre o siglas..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-0">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden hover:translate-y-[-8px] transition-all duration-300 group">
            <div className="h-3 w-full" style={{ backgroundColor: team.crestPrimary }} />
            <div className="p-8">
              <div className="flex gap-6 items-center mb-8">
                <div className="w-20 h-20 bg-muted/30 rounded-[2rem] flex items-center justify-center border-2 border-dashed group-hover:border-primary/50 transition-colors relative shadow-inner">
                  <CrestIcon 
                    shape={team.emblemShape} pattern={team.emblemPattern} 
                    c1={team.crestPrimary} c2={team.crestSecondary} c3={team.crestTertiary || team.crestSecondary} c4={team.crestAccent} 
                    border={team.crestBorderWidth} size="w-12 h-12" 
                  />
                  <div className="absolute -bottom-2 -right-2 bg-primary text-[10px] font-black px-3 py-1 rounded-full text-white shadow-xl">
                    {team.abbreviation}
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="text-2xl font-black uppercase truncate tracking-tighter">{team.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-black text-primary tracking-widest">{team.rating} GLOBAL</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-muted/30 p-4 rounded-3xl border border-border/50">
                  <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Sede Central</p>
                  <p className="text-sm font-bold truncate">{team.venueName}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-3xl border border-border/50">
                  <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Aforo</p>
                  <p className="text-sm font-bold">{team.venueCapacity.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 h-12 rounded-2xl font-black shadow-lg" variant="secondary" onClick={() => { setEditingTeam(team); setIsDialogOpen(true); }}>
                  <Pencil className="w-4 h-4 mr-2" /> REDISEÑAR
                </Button>
                <Button variant="destructive" size="icon" className="h-12 w-12 rounded-2xl shadow-lg shadow-destructive/10" onClick={() => {
                  if(confirm(`¿Desaparecer el club ${team.name}?`)) deleteTeam(team.id);
                }}>
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {filteredTeams.length === 0 && (
          <div className="col-span-full py-20 text-center bg-card rounded-[3rem] shadow-xl border-4 border-dashed border-muted/20">
            <Shield className="w-20 h-20 text-muted mx-auto mb-6 opacity-20" />
            <h2 className="text-2xl font-black text-muted-foreground">No se encontraron clubs registrados.</h2>
          </div>
        )}
      </div>
    </div>
  );
}
