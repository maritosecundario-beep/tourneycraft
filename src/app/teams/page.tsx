'use client';

import { useState, useEffect } from 'react';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Trash2, Pencil, Sparkles, Shield, Star, Coins, UserPlus, LayoutGrid, Users, UserCircle2, Info, ChevronRight } from 'lucide-react';
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

// Hyper-Realistic Jersey SVG Visualizer 4.0 (Shared with players page)
const PlayerJerseySVG = ({ 
  primary, secondary, tertiary, accent, style, brand, sponsor, 
  crestPlacement, sponsorPlacement, brandPlacement, crestSize = 'medium'
}: { 
  primary: string, secondary: string, tertiary: string, accent: string, style: UniformStyle, 
  brand?: string, sponsor?: string, crestPlacement: ElementPlacement, 
  sponsorPlacement: VerticalPlacement, brandPlacement: ElementPlacement, crestSize?: ElementSize
}) => {
  const getCrestPos = () => {
    if (crestPlacement === 'left') return { x: 65, y: 70 };
    if (crestPlacement === 'center') return { x: 100, y: 70 };
    return { x: 135, y: 70 };
  };

  const getSponsorPos = () => {
    if (sponsorPlacement === 'top') return { x: 100, y: 105 };
    if (sponsorPlacement === 'middle') return { x: 100, y: 140 };
    return { x: 100, y: 175 };
  };

  const getBrandPos = () => {
    if (brandPlacement === 'left') return { x: 65, y: 55 };
    if (brandPlacement === 'center') return { x: 100, y: 45 };
    return { x: 135, y: 55 };
  };

  const getCrestScale = () => {
    if (crestSize === 'small') return 0.6;
    if (crestSize === 'large') return 1.4;
    return 1;
  };

  return (
    <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-2xl">
      <defs>
        <clipPath id="jerseyClip">
          <path d="M40 40 L60 20 L140 20 L160 40 L180 60 L180 100 L160 100 L160 220 L150 225 L50 225 L40 220 L40 100 L20 100 L20 60 Z" />
        </clipPath>
        <linearGradient id="clothHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.2" />
          <stop offset="50%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="black" stopOpacity="0.2" />
        </linearGradient>
        <pattern id="pat_stripes" width="40" height="240" patternUnits="userSpaceOnUse"><rect width="20" height="240" fill={secondary} /></pattern>
        <pattern id="pat_hoops" width="200" height="40" patternUnits="userSpaceOnUse"><rect width="200" height="20" fill={secondary} /></pattern>
        <pattern id="pat_checks" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill={secondary} />
          <rect x="20" y="20" width="20" height="20" fill={secondary} />
        </pattern>
        <pattern id="pat_pinstripes" width="10" height="240" patternUnits="userSpaceOnUse"><rect width="1" height="240" fill={secondary} /></pattern>
      </defs>

      {/* Main Body */}
      <path d="M40 40 L60 20 L140 20 L160 40 L180 60 L180 100 L160 100 L160 220 L150 225 L50 225 L40 220 L40 100 L20 100 L20 60 Z" fill={primary} />
      
      {/* Patterns */}
      <g clipPath="url(#jerseyClip)">
        {style === 'stripes' && <rect width="200" height="240" fill="url(#pat_stripes)" />}
        {style === 'hoops' && <rect width="200" height="240" fill="url(#pat_hoops)" />}
        {style === 'checks' && <rect width="200" height="240" fill="url(#pat_checks)" />}
        {style === 'pinstripes' && <rect width="200" height="240" fill="url(#pat_pinstripes)" />}
        {style === 'halves' && <rect x="100" width="100" height="240" fill={secondary} />}
        {style === 'sash' && <path d="M40 20 L200 180 L200 240 L0 80 Z" fill={secondary} />}
      </g>

      {/* Trims */}
      <path d="M60 20 L100 35 L140 20 L120 20 L100 30 L80 20 Z" fill={tertiary} />
      <rect x="20" y="85" width="20" height="15" fill={tertiary} transform="rotate(-45 20 85)" />
      <rect x="160" y="100" width="20" height="15" fill={tertiary} transform="rotate(45 160 100)" />

      {/* Realistic Volumetry Shadows */}
      <path d="M40 40 L60 20 L140 20 L160 40 L180 60 L180 100 L160 100 L160 220 L150 225 L50 225 L40 220 L40 100 L20 100 L20 60 Z" fill="url(#clothHighlight)" opacity="0.4" />
      <path d="M160 100 L180 100 L180 60 L160 40 Z" fill="black" opacity="0.1" /> {/* Shoulder shadow */}
      <path d="M40 100 L20 100 L20 60 L40 40 Z" fill="black" opacity="0.1" /> {/* Shoulder shadow */}

      {/* Branding Elements */}
      <g opacity="0.95">
        <text 
          x={getBrandPos().x} 
          y={getBrandPos().y} 
          textAnchor="middle" 
          fill={accent} 
          fontSize="8" 
          fontWeight="900" 
          style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
        >
          {brand || ''}
        </text>
        
        <circle 
          cx={getCrestPos().x} 
          cy={getCrestPos().y} 
          r={9 * getCrestScale()} 
          fill={accent} 
          stroke={tertiary} 
          strokeWidth="1.5" 
        />
        
        <text 
          x={getSponsorPos().x} 
          y={getSponsorPos().y} 
          textAnchor="middle" 
          fill={accent} 
          fontSize="16" 
          fontWeight="900" 
          style={{ textTransform: 'uppercase', letterSpacing: '1px' }}
        >
          {sponsor || ''}
        </text>
      </g>
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
  const { teams, players, settings, addTeam, updateTeam, deleteTeam, transferPlayer, addPlayer } = useTournamentStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);
  const [playerTargetTeamId, setPlayerTargetTeamId] = useState<string | null>(null);
  const [viewingRosterTeamId, setViewingRosterTeamId] = useState<string | null>(null);
  
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

  // New Player State (Matches free agents creation)
  const [pName, setPName] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pPos, setPPos] = useState(settings.positions[0] || 'FW');
  const [pVal, setPVal] = useState(10);
  const [pNum, setPNum] = useState(10);
  const [pAttrs, setPAttrs] = useState<Record<string, number>>({});
  
  // Kit State for New Player
  const [pKitStyle, setPKitStyle] = useState<UniformStyle>('solid');
  const [pKitC1, setPKitC1] = useState(PREDEFINED_COLORS[24]);
  const [pKitC2, setPKitC2] = useState(PREDEFINED_COLORS[35]);
  const [pKitC3, setPKitC3] = useState(PREDEFINED_COLORS[34]);
  const [pKitC4, setPKitC4] = useState(PREDEFINED_COLORS[35]);
  const [pBrand, setPBrand] = useState('');
  const [pSponsor, setPSponsor] = useState('');
  const [pCrestPos, setPCrestPos] = useState<ElementPlacement>('left');
  const [pSponsorPos, setPSponsorPos] = useState<VerticalPlacement>('middle');
  const [pBrandPos, setPBrandPos] = useState<ElementPlacement>('right');
  const [pCrestSize, setPCrestSize] = useState<ElementSize>('medium');

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
      
      const targetTeam = teams.find(t => t.id === playerTargetTeamId);
      if (targetTeam) {
        setPKitC1(targetTeam.crestPrimary);
        setPKitC2(targetTeam.crestSecondary);
        setPKitC3(targetTeam.crestTertiary || targetTeam.crestSecondary);
        setPKitC4(targetTeam.crestAccent || targetTeam.crestSecondary);
      }
    }
  }, [isPlayerDialogOpen, settings.attributeNames, playerTargetTeamId, teams]);

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
      description: pDesc,
      monetaryValue: pVal,
      jerseyNumber: pNum,
      position: pPos,
      teamId: playerTargetTeamId,
      suspensionMatchdays: 0,
      attributes: Object.entries(pAttrs).map(([name, value]) => ({ name, value })),
      uniformStyle: pKitStyle,
      kitPrimary: pKitC1,
      kitSecondary: pKitC2,
      kitTertiary: pKitC3,
      kitAccent: pKitC4,
      brand: pBrand,
      sponsor: pSponsor,
      crestPlacement: pCrestPos,
      sponsorPlacement: pSponsorPos,
      brandPlacement: pBrandPos,
      crestSize: pCrestSize
    };
    addPlayer(newPlayer);
    toast({ title: "Jugador Reclutado", description: `${pName} se ha unido al club.` });
    setIsPlayerDialogOpen(false);
    // Reset player form
    setPName(''); setPDesc(''); setPVal(10); setPNum(10); setPBrand(''); setPSponsor('');
  };

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.abbreviation.toLowerCase().includes(search.toLowerCase())
  );

  const viewingRosterTeam = teams.find(t => t.id === viewingRosterTeamId);
  const teamRoster = players.filter(p => p.teamId === viewingRosterTeamId);

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
                <Button variant="outline" className="h-11 rounded-xl font-black border-primary text-primary" onClick={() => setViewingRosterTeamId(team.id)}>
                  <LayoutGrid className="w-4 h-4 mr-2" /> PLANTILLA
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

      {/* Recruitment Dialog - Full experience like free agents page */}
      <Dialog open={isPlayerDialogOpen} onOpenChange={setIsPlayerDialogOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-[900px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-6 bg-muted/20 border-b">
            <DialogTitle className="font-black uppercase flex items-center gap-2">
              <UserCircle2 className="text-primary" /> Reclutamiento de Élite para {teams.find(t => t.id === playerTargetTeamId)?.name}
            </DialogTitle>
          </div>
          <Tabs defaultValue="base" className="w-full flex flex-col h-[80vh]">
            <TabsList className="grid grid-cols-3 rounded-none h-14 bg-card p-1 border-b">
              <TabsTrigger value="base" className="rounded-xl">Bio</TabsTrigger>
              <TabsTrigger value="stats" className="rounded-xl">Estadísticas</TabsTrigger>
              <TabsTrigger value="brand" className="rounded-xl">Marca Personal</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              <TabsContent value="base" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label>Nombre Completo</Label><Input value={pName} onChange={e => setPName(e.target.value)} className="h-12 rounded-xl" /></div>
                  <div className="space-y-2">
                    <Label>Posición Predilecta</Label>
                    <Select value={pPos} onValueChange={setPPos}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>{settings.positions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Valor ({settings.currency})</Label><Input type="number" value={pVal} onChange={e => setPVal(Number(e.target.value))} className="h-12 rounded-xl" /></div>
                  <div className="space-y-2"><Label>Dorsal</Label><Input type="number" value={pNum} onChange={e => setPNum(Number(e.target.value))} className="h-12 rounded-xl" /></div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Biografía / Descripción del Jugador</Label>
                    <Textarea 
                      value={pDesc} 
                      onChange={e => setPDesc(e.target.value)} 
                      placeholder="Historia, logros, estilo de juego..." 
                      className="min-h-[120px] rounded-xl" 
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="stats" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {settings.attributeNames.map(attr => (
                    <div key={attr} className="space-y-3 p-4 bg-muted/10 rounded-2xl border">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">{attr}</span>
                        <span className="text-lg font-black">{pAttrs[attr] || 50}</span>
                      </div>
                      <Slider 
                        value={[pAttrs[attr] || 50]} 
                        onValueChange={v => setPAttrs(prev => ({...prev, [attr]: v[0]}))} 
                        max={100} min={1} 
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="brand" className="space-y-8 mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                  <div className="aspect-square bg-muted/20 rounded-3xl flex items-center justify-center p-8 border-2 border-dashed border-accent/30 shadow-inner">
                    <div className="w-full max-w-[240px]">
                      <PlayerJerseySVG 
                        primary={pKitC1} secondary={pKitC2} tertiary={pKitC3} accent={pKitC4} 
                        style={pKitStyle} brand={pBrand} sponsor={pSponsor}
                        crestPlacement={pCrestPos} sponsorPlacement={pSponsorPos} 
                        brandPlacement={pBrandPos} crestSize={pCrestSize}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-8 pb-10">
                    <div className="space-y-4">
                      <h4 className="text-sm font-black uppercase text-accent border-b pb-2">Identidad Visual</h4>
                      <div className="space-y-2">
                        <Label>Estilo de Jersey</Label>
                        <Select value={pKitStyle} onValueChange={(v: any) => setPKitStyle(v)}>
                          <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solid">Liso</SelectItem>
                            <SelectItem value="stripes">Rayas</SelectItem>
                            <SelectItem value="hoops">Aros</SelectItem>
                            <SelectItem value="checks">Cuadros</SelectItem>
                            <SelectItem value="pinstripes">Rayas Finas</SelectItem>
                            <SelectItem value="halves">Mitades</SelectItem>
                            <SelectItem value="sash">Banda Diagonal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <ColorPicker label="Primario" value={pKitC1} onChange={setPKitC1} />
                        <ColorPicker label="Secundario" value={pKitC2} onChange={setPKitC2} />
                        <ColorPicker label="Detalles" value={pKitC3} onChange={setPKitC3} />
                        <ColorPicker label="Acento" value={pKitC4} onChange={setPKitC4} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-black uppercase text-accent border-b pb-2">Patrocinios</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Marca Técnica</Label><Input value={pBrand} onChange={e => setPBrand(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Sponsor Principal</Label><Input value={pSponsor} onChange={e => setPSponsor(e.target.value)} /></div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>

            <div className="p-4 bg-muted/20 border-t flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsPlayerDialogOpen(false)} className="rounded-xl h-12 font-black px-8">CANCELAR</Button>
              <Button onClick={handleCreatePlayer} disabled={!pName} className="rounded-xl h-12 font-black px-8 shadow-lg shadow-primary/20">CONFIRMAR FICHAJE</Button>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingRosterTeamId} onOpenChange={(o) => !o && setViewingRosterTeamId(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          {viewingRosterTeam && (
            <div className="flex flex-col h-[85vh]">
              <div className="p-8 bg-muted/10 border-b flex items-center gap-6">
                <CrestIcon 
                  shape={viewingRosterTeam.emblemShape} 
                  pattern={viewingRosterTeam.emblemPattern} 
                  c1={viewingRosterTeam.crestPrimary} 
                  c2={viewingRosterTeam.crestSecondary} 
                  c3={viewingRosterTeam.crestTertiary || viewingRosterTeam.crestSecondary} 
                  size="w-20 h-20" 
                />
                <div className="flex-1">
                  <DialogTitle className="text-3xl font-black uppercase tracking-tighter">Plantilla de {viewingRosterTeam.name}</DialogTitle>
                  <p className="text-muted-foreground font-bold text-xs uppercase mt-1">Total: {teamRoster.length} Agentes • Presupuesto: {viewingRosterTeam.budget} {settings.currency}</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {teamRoster.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-muted/10 rounded-3xl border-2 border-dashed">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="font-bold text-muted-foreground">Sin jugadores asignados actualmente.</p>
                    </div>
                  ) : (
                    teamRoster.map(player => (
                      <div key={player.id} className="p-4 bg-card border rounded-2xl shadow-sm flex items-center justify-between hover:border-primary/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary">#{player.jerseyNumber}</div>
                          <div>
                            <p className="font-black text-sm uppercase truncate max-w-[150px]">{player.name}</p>
                            <Badge variant="secondary" className="text-[9px] h-4 mt-1 font-black">{player.position}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-xs text-accent">{player.monetaryValue} {settings.currency}</p>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                            if(confirm(`¿Despedir a ${player.name}?`)) deletePlayer(player.id);
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="p-6 border-t bg-muted/5 flex justify-end">
                <Button onClick={() => setViewingRosterTeamId(null)} className="rounded-xl font-black h-12 px-8">CERRAR PLANTILLA</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
