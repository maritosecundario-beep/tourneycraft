'use client';

import { useState, useEffect } from 'react';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Trash2, Pencil, Sparkles, Landmark, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmblemShape, EmblemPattern, VenueSurface, VenueSize, Team } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PREDEFINED_COLORS } from '@/lib/colors';

// Advanced Crest SVG Component
const CrestIcon = ({ 
  shape, 
  pattern, 
  c1, 
  c2, 
  c3, 
  c4, 
  border = 'thin', 
  size = "w-10 h-10" 
}: { 
  shape: EmblemShape, 
  pattern: EmblemPattern, 
  c1: string, 
  c2: string, 
  c3: string, 
  c4?: string, 
  border?: 'none' | 'thin' | 'thick',
  size?: string 
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

  const renderShapeContent = () => {
    let d = "";
    switch (shape) {
      case 'shield': d = "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"; break;
      case 'circle': d = "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"; break;
      case 'hexagon': d = "M12 2l8.66 5v10L12 22l-8.66-5V7z"; break;
      case 'diamond': d = "M12 2l10 10-10 10-10-10z"; break;
      case 'modern': d = "M2 7l10-5 10 5v10l-10 5-10-5z"; break;
      case 'square': d = "M3 3h18v18h-18z"; break;
      case 'star': d = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z"; break;
      case 'lion': d = "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"; break;
      default: d = "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z";
    }

    return (
      <g>
        <clipPath id={`clip-${shape}`}>
          <path d={d} />
        </clipPath>
        <path d={d} fill={c1} />
        <g clipPath={`url(#clip-${shape})`}>
          {renderPattern()}
        </g>
        {borderWidth > 0 && <path d={d} fill="none" stroke={c3} strokeWidth={borderWidth} />}
        {shape === 'lion' && <path d="M12 7c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5z" fill={c4 || c2} />}
        {shape === 'star' && pattern === 'none' && <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" fill={c4 || c2} />}
      </g>
    );
  };

  return (
    <svg viewBox="0 0 24 24" className={size}>
      {renderShapeContent()}
    </svg>
  );
};

const ColorPicker = ({ label, value, onChange }: { label: string, value: string, onChange: (c: string) => void }) => (
  <div className="space-y-2">
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
      setName(''); setAbbreviation(''); setRating(50);
      setCrestShape('shield'); setCrestPattern('none');
      setCrestC1(PREDEFINED_COLORS[24]); setCrestC2(PREDEFINED_COLORS[35]);
      setCrestC3(PREDEFINED_COLORS[35]); setCrestC4(undefined);
      setCrestBorder('thin'); setVenueName(''); setVenueCapacity(1000);
      setVenueSurface('grass'); setVenueSize('medium');
    }
  }, [editingTeam]);

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
  };

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.abbreviation.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <header className="flex justify-between items-center px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-black uppercase flex items-center gap-3">
            Clubs <Sparkles className="text-accent" />
          </h1>
          <p className="text-muted-foreground">Gestiona tus franquicias y estadios.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button className="font-black rounded-xl">FUNDAR CLUB</Button></DialogTrigger>
          <DialogContent className="max-w-[800px] p-0 overflow-hidden rounded-2xl border-none">
            <div className="p-6 bg-muted/20 border-b"><DialogTitle className="font-black uppercase">Club Studio</DialogTitle></div>
            <Tabs defaultValue="base" className="w-full flex flex-col h-[70vh]">
              <TabsList className="grid grid-cols-3 rounded-none h-12 border-b bg-card">
                <TabsTrigger value="base">General</TabsTrigger>
                <TabsTrigger value="crest">Escudo</TabsTrigger>
                <TabsTrigger value="venue">Sede</TabsTrigger>
              </TabsList>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <TabsContent value="base" className="space-y-6 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Nombre</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Siglas</Label><Input maxLength={3} value={abbreviation} onChange={e => setAbbreviation(e.target.value)} /></div>
                  </div>
                  <div className="space-y-2"><Label>Rating Global ({rating})</Label><Slider value={[rating]} onValueChange={v => setRating(v[0])} max={100} min={1} /></div>
                </TabsContent>
                <TabsContent value="crest" className="space-y-6 mt-0">
                  <div className="grid grid-cols-2 gap-8 items-start">
                    <div className="aspect-square bg-muted/20 rounded-xl flex items-center justify-center border-2 border-dashed">
                      <CrestIcon shape={crestShape} pattern={crestPattern} c1={crestC1} c2={crestC2} c3={crestC3} c4={crestC4} border={crestBorder} size="w-32 h-32" />
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <Label>Forma</Label>
                        <Select value={crestShape} onValueChange={(v: any) => setCrestShape(v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{['shield','circle','hexagon','diamond','modern','square','lion','star'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Label>Patrón</Label>
                        <Select value={crestPattern} onValueChange={(v: any) => setCrestPattern(v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{['none','vertical-split','horizontal-split','diagonal-split','cross','saltire','quarters'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <ColorPicker label="Base" value={crestC1} onChange={setCrestC1} />
                      <ColorPicker label="Patrón" value={crestC2} onChange={setCrestC2} />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="venue" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Sede</Label><Input value={venueName} onChange={e => setVenueName(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Capacidad</Label><Input type="number" value={venueCapacity} onChange={e => setVenueCapacity(Number(e.target.value))} /></div>
                  </div>
                </TabsContent>
              </div>
              <div className="p-4 bg-muted/20 border-t flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>CANCELAR</Button>
                <Button onClick={handleSaveTeam}>GUARDAR</Button>
              </div>
            </Tabs>
          </DialogContent>
        </Dialog>
      </header>

      <div className="px-4 md:px-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input className="pl-10 h-12 rounded-xl border-none shadow-lg" placeholder="Buscar clubs..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:px-0">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="rounded-3xl border-none shadow-xl overflow-hidden">
            <div className="h-2 w-full" style={{ backgroundColor: team.crestPrimary }} />
            <div className="p-6">
              <div className="flex gap-4 items-center mb-6">
                <div className="w-16 h-16 bg-muted/30 rounded-xl flex items-center justify-center border relative">
                  <CrestIcon 
                    shape={team.emblemShape} pattern={team.emblemPattern} 
                    c1={team.crestPrimary} c2={team.crestSecondary} c3={team.crestTertiary || team.crestSecondary} c4={team.crestAccent} 
                    border={team.crestBorderWidth} size="w-10 h-10" 
                  />
                  <div className="absolute -bottom-1 -right-1 bg-primary text-[8px] font-black px-1.5 py-0.5 rounded text-white">
                    {team.abbreviation}
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-black uppercase truncate">{team.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-xs font-black text-primary">{team.rating} OVR</span>
                  </div>
                </div>
              </div>
              <div className="bg-muted/30 p-3 rounded-xl border mb-6 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-bold truncate">{team.venueName}</span>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 h-10 rounded-xl font-black" variant="secondary" onClick={() => { setEditingTeam(team); setIsDialogOpen(true); }}>
                  <Pencil className="w-3 h-3 mr-2" /> EDITAR
                </Button>
                <Button variant="destructive" size="icon" className="h-10 w-10 rounded-xl" onClick={() => deleteTeam(team.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
