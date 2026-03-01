'use client';

import { useState, useEffect } from 'react';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Search, Shield, UserPlus, Trash2, Palette, Landmark, MapPin, Pencil, Maximize, CheckCircle2, Star, CircleSlash } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UniformStyle, EmblemShape, VenueSurface, VenueSize, Team } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PREDEFINED_COLORS } from '@/lib/colors';

// Hyper-Realistic Jersey SVG Component
const JerseySVG = ({ 
  primary, 
  secondary, 
  tertiary, 
  accent, 
  style, 
  brand, 
  sponsor 
}: { 
  primary: string, 
  secondary: string, 
  tertiary?: string,
  accent?: string,
  style: UniformStyle,
  brand?: string,
  sponsor?: string
}) => {
  const trim = tertiary || primary;
  const logo = accent || '#ffffff';

  return (
    <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-2xl">
      <defs>
        <clipPath id="bodyClip">
          <path d="M40 40 L60 20 L140 20 L160 40 L180 60 L180 100 L160 100 L160 220 L40 220 L40 100 L20 100 L20 60 Z" />
        </clipPath>
        
        {/* Patterns */}
        <pattern id="stripes" patternUnits="userSpaceOnUse" width="40" height="240">
          <rect width="20" height="240" fill={secondary} />
        </pattern>
        <pattern id="hoops" patternUnits="userSpaceOnUse" width="200" height="40">
          <rect width="200" height="20" fill={secondary} />
        </pattern>
        <pattern id="checks" patternUnits="userSpaceOnUse" width="40" height="40">
          <rect width="20" height="20" fill={secondary} />
          <rect x="20" y="20" width="20" height="20" fill={secondary} />
        </pattern>
        <pattern id="pinstripes" patternUnits="userSpaceOnUse" width="10" height="240">
          <rect width="2" height="240" fill={secondary} />
        </pattern>
        <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: primary, stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: secondary, stopOpacity: 1 }} />
        </linearGradient>

        {/* Realistic Texture / Fabric Shading */}
        <radialGradient id="meshGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.1" />
          <stop offset="100%" stopColor="black" stopOpacity="0.2" />
        </radialGradient>
      </defs>
      
      {/* Base Jersey Shape */}
      <path 
        d="M40 40 L60 20 L140 20 L160 40 L180 60 L180 100 L160 100 L160 220 L40 220 L40 100 L20 100 L20 60 Z" 
        fill={primary} 
      />
      
      {/* Patterns with clipping */}
      <g clipPath="url(#bodyClip)">
        {style === 'stripes' && <rect width="200" height="240" fill="url(#stripes)" />}
        {style === 'hoops' && <rect width="200" height="240" fill="url(#hoops)" />}
        {style === 'checks' && <rect width="200" height="240" fill="url(#checks)" />}
        {style === 'pinstripes' && <rect width="200" height="240" fill="url(#pinstripes)" />}
        {style === 'halves' && <rect x="100" width="100" height="240" fill={secondary} />}
        {style === 'quarters' && (
          <>
            <rect x="100" y="20" width="60" height="100" fill={secondary} />
            <rect x="40" y="100" width="60" height="120" fill={secondary} />
          </>
        )}
        {style === 'gradient' && <rect width="200" height="240" fill="url(#grad)" />}
        {style === 'sash' && <path d="M40 40 L160 220 L160 180 L80 40 Z" fill={secondary} />}
        {style === 'minimal' && <rect x="150" y="20" width="10" height="200" fill={secondary} opacity="0.8" />}
      </g>

      {/* Tertiary Color Trim (Collar & Cuffs) */}
      <path d="M60 20 L80 35 L120 35 L140 20 Z" fill={trim} /> {/* Collar */}
      <path d="M20 60 L40 50 L40 70 L20 80 Z" fill={trim} /> {/* Left Cuff */}
      <path d="M180 60 L160 50 L160 70 L180 80 Z" fill={trim} /> {/* Right Cuff */}
      
      {/* Realistic Shading Layers */}
      <path 
        d="M40 40 L60 20 L140 20 L160 40 L180 60 L180 100 L160 100 L160 220 L40 220 L40 100 L20 100 L20 60 Z" 
        fill="url(#meshGradient)" 
        opacity="0.3"
      />

      {/* Brand & Sponsor */}
      <text x="100" y="145" textAnchor="middle" fill={logo} fontSize="14" fontWeight="900" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)', fontFamily: 'Inter, sans-serif' }}>
        {sponsor?.toUpperCase() || 'SPONSOR'}
      </text>
      <text x="145" y="55" textAnchor="middle" fill={logo} fontSize="6" fontWeight="bold" opacity="0.8">
        {brand?.toUpperCase() || 'APEX'}
      </text>

      {/* Folds and Shadows */}
      <path d="M40 100 L160 100" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
      <path d="M40 220 L160 220" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
    </svg>
  );
};

// Advanced Crest Visualization with Multi-Layer Colors
const CrestIcon = ({ shape, c1, c2, c3, c4, size = "w-10 h-10" }: { shape: EmblemShape, c1: string, c2: string, c3: string, c4?: string, size?: string }) => {
  const renderShape = () => {
    switch (shape) {
      case 'shield': 
        return (
          <g>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill={c1} />
            <path d="M12 20s6-3 6-8.5V6.5l-6-2.2-6 2.2V11.5c0 5.5 6 8.5 6 8.5z" fill="none" stroke={c2} strokeWidth="1.5" />
            <circle cx="12" cy="11" r="3" fill={c3} />
            {c4 && <path d="M10 11l2 2 2-2" stroke={c4} fill="none" strokeWidth="1" />}
          </g>
        );
      case 'circle': 
        return (
          <g>
            <circle cx="12" cy="12" r="10" fill={c1} />
            <circle cx="12" cy="12" r="8" fill="none" stroke={c2} strokeWidth="1.5" />
            <path d="M9 12l2 2 4-4" stroke={c3} fill="none" strokeWidth="2" />
          </g>
        );
      case 'modern': 
        return (
          <g>
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill={c1} />
            <path d="M2 17l10 5 10-5" stroke={c2} fill="none" strokeWidth="2" />
            <path d="M2 12l10 5 10-5" stroke={c3} fill="none" strokeWidth="2" />
          </g>
        );
      case 'crown':
        return (
          <g>
            <path d="M2 20h20v-2H2v2zM5 18l-2-8 6 3 3-7 3 7 6-3-2 8H5z" fill={c1} stroke={c2} strokeWidth="1" />
            <circle cx="12" cy="11" r="2" fill={c3} />
          </g>
        );
      case 'star':
        return (
          <g>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" fill={c1} stroke={c2} strokeWidth="1" />
            <circle cx="12" cy="12" r="2" fill={c3} />
          </g>
        );
      default: return <Shield fill={c1} />;
    }
  };

  return (
    <svg viewBox="0 0 24 24" className={size}>
      {renderShape()}
    </svg>
  );
};

const ColorPicker = ({ label, value, onChange, onClear }: { label: string, value?: string, onChange: (c: string) => void, onClear?: () => void }) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <Label className="text-[10px] font-black uppercase text-muted-foreground">{label}</Label>
      {onClear && value && (
        <button onClick={onClear} className="text-[10px] text-destructive hover:underline flex items-center gap-1">
          <CircleSlash className="w-3 h-3" /> Limpiar
        </button>
      )}
    </div>
    <div className="grid grid-cols-5 gap-2 p-2 bg-muted/10 rounded-xl border">
      {PREDEFINED_COLORS.map(color => (
        <button
          key={color}
          onClick={() => onChange(color)}
          className={cn(
            "w-6 h-6 rounded-full border-2 transition-all hover:scale-125",
            value === color ? "border-foreground scale-110 shadow-md" : "border-transparent"
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
  
  // Form state
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [rating, setRating] = useState(50);
  const [venueName, setVenueName] = useState('');
  const [venueCapacity, setVenueCapacity] = useState(1000);
  const [venueSurface, setVenueSurface] = useState<VenueSurface>('parquet');
  const [venueSize, setVenueSize] = useState<VenueSize>('medium');
  const [brand, setBrand] = useState('Apex');
  const [sponsor, setSponsor] = useState('');
  
  // Colors
  const [color1, setColor1] = useState(PREDEFINED_COLORS[10]);
  const [color2, setColor2] = useState(PREDEFINED_COLORS[19]);
  const [color3, setColor3] = useState<string | undefined>(undefined);
  const [color4, setColor4] = useState<string | undefined>(undefined);

  const [uniformStyle, setUniformStyle] = useState<UniformStyle>('solid');
  const [emblemShape, setEmblemShape] = useState<EmblemShape>('modern');

  useEffect(() => {
    if (editingTeam) {
      setName(editingTeam.name);
      setAbbreviation(editingTeam.abbreviation);
      setRating(editingTeam.rating);
      setVenueName(editingTeam.venueName);
      setVenueCapacity(editingTeam.venueCapacity);
      setVenueSurface(editingTeam.venueSurface);
      setVenueSize(editingTeam.venueSize || 'medium');
      setColor1(editingTeam.primaryColor);
      setColor2(editingTeam.secondaryColor);
      setColor3(editingTeam.tertiaryColor);
      setColor4(editingTeam.accentColor);
      setUniformStyle(editingTeam.uniformStyle);
      setEmblemShape(editingTeam.emblemShape);
      setBrand(editingTeam.brand || 'Apex');
      setSponsor(editingTeam.sponsor || '');
    } else {
      resetForm();
    }
  }, [editingTeam]);

  const resetForm = () => {
    setName('');
    setAbbreviation('');
    setRating(50);
    setVenueName('');
    setVenueCapacity(1000);
    setVenueSurface('parquet');
    setVenueSize('medium');
    setColor1(PREDEFINED_COLORS[10]);
    setColor2(PREDEFINED_COLORS[19]);
    setColor3(undefined);
    setColor4(undefined);
    setUniformStyle('solid');
    setEmblemShape('modern');
    setBrand('Apex');
    setSponsor('');
  };

  const handleSaveTeam = () => {
    if (!name || abbreviation.length !== 3) {
      toast({ title: "Error", description: "Completa los campos obligatorios.", variant: "destructive" });
      return;
    }
    
    const teamData: Team = {
      id: editingTeam ? editingTeam.id : Math.random().toString(36).substr(2, 9),
      name,
      abbreviation: abbreviation.toUpperCase(),
      rating,
      venueName: venueName || 'Arena Principal',
      venueCapacity,
      venueSurface,
      venueSize,
      primaryColor: color1,
      secondaryColor: color2,
      tertiaryColor: color3,
      accentColor: color4,
      uniformStyle,
      emblemShape,
      brand,
      sponsor,
      players: editingTeam ? editingTeam.players : []
    };

    if (editingTeam) {
      updateTeam(teamData);
      toast({ title: "Club Actualizado", description: "Cambios guardados." });
    } else {
      addTeam(teamData);
      toast({ title: "Club Fundado", description: "Éxito al crear la entidad." });
    }

    setIsDialogOpen(false);
    setEditingTeam(null);
  };

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.abbreviation.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 md:pb-20">
      <header className="flex justify-between items-center px-4 md:px-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground uppercase">Identity Studio</h1>
          <p className="text-muted-foreground text-sm md:text-base">Branding de élite para organizaciones competitivas.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingTeam(null);
        }}>
          <DialogTrigger asChild>
            <Button className="shadow-2xl shadow-primary/40 bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 font-black rounded-2xl transition-all">
              <Plus className="w-5 h-5 mr-2" /> FUNDAR CLUB
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[950px] bg-card border-none shadow-2xl p-0 overflow-hidden max-h-[95vh] overflow-y-auto rounded-3xl">
            <div className="p-8 bg-muted/20 border-b flex flex-row items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-3xl font-black tracking-tight flex items-center gap-2">
                  <Star className="text-yellow-500 fill-current w-8 h-8" /> {editingTeam ? 'REDISENAR CLUB' : 'FUNDAR ENTIDAD'}
                </DialogTitle>
                <CardDescription>Configura cada detalle de la identidad visual y técnica.</CardDescription>
              </div>
            </div>
            <Tabs defaultValue="branding" className="w-full">
              <TabsList className="w-full grid grid-cols-3 rounded-none bg-muted/10 h-14 border-b">
                <TabsTrigger value="general" className="rounded-none font-bold">BASE</TabsTrigger>
                <TabsTrigger value="branding" className="rounded-none font-bold">BRANDING</TabsTrigger>
                <TabsTrigger value="venue" className="rounded-none font-bold">SEDE</TabsTrigger>
              </TabsList>
              
              <div className="p-6 md:p-10">
                <TabsContent value="general" className="space-y-8 mt-0">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nombre</Label>
                      <Input className="h-14 text-xl font-bold bg-muted/10" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Siglas</Label>
                      <Input className="h-14 text-xl font-bold text-center uppercase bg-muted/10" maxLength={3} value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="flex justify-between text-xs font-black uppercase text-muted-foreground">Rating <span>{rating}</span></Label>
                    <Slider value={[rating]} onValueChange={(vals) => setRating(vals[0])} max={100} min={1} />
                  </div>
                </TabsContent>

                <TabsContent value="branding" className="space-y-10 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                    <div className="space-y-6 bg-muted/5 p-8 rounded-[2.5rem] flex flex-col items-center border-2 border-dashed border-muted relative">
                      <div className="w-64 h-72 transition-transform hover:scale-110 duration-500">
                        <JerseySVG 
                          primary={color1} 
                          secondary={color2} 
                          tertiary={color3}
                          accent={color4}
                          style={uniformStyle} 
                          brand={brand} 
                          sponsor={sponsor} 
                        />
                      </div>
                      <div className="flex items-center gap-6 mt-4 p-4 bg-card rounded-2xl shadow-xl border w-full justify-center">
                        <CrestIcon shape={emblemShape} c1={color1} c2={color2} c3={color3 || color1} c4={color4} size="w-16 h-16" />
                        <div className="h-12 w-px bg-border" />
                        <div className="flex gap-2">
                          <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: color1 }} title="Color 1" />
                          <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: color2 }} title="Color 2" />
                          {color3 && <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: color3 }} title="Color 3" />}
                          {color4 && <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: color4 }} title="Color 4" />}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                      <div className="grid grid-cols-2 gap-4">
                        <ColorPicker label="Color Primario" value={color1} onChange={setColor1} />
                        <ColorPicker label="Color Secundario" value={color2} onChange={setColor2} />
                        <ColorPicker label="Color Terciario (Opc)" value={color3} onChange={setColor3} onClear={() => setColor3(undefined)} />
                        <ColorPicker label="Color de Acento (Opc)" value={color4} onChange={setColor4} onClear={() => setColor4(undefined)} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Marca</Label>
                          <Input value={brand} className="bg-muted/10 h-10" onChange={(e) => setBrand(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Sponsor</Label>
                          <Input value={sponsor} className="bg-muted/10 h-10" onChange={(e) => setSponsor(e.target.value)} />
                        </div>
                      </div>

                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Estilo Uniforme</Label>
                          <Select value={uniformStyle} onValueChange={(v: any) => setUniformStyle(v)}>
                            <SelectTrigger className="h-12 font-bold"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="solid" className="font-bold">Sólido</SelectItem>
                              <SelectItem value="stripes" className="font-bold">Rayas</SelectItem>
                              <SelectItem value="hoops" className="font-bold">Aros</SelectItem>
                              <SelectItem value="checks" className="font-bold">Cuadros</SelectItem>
                              <SelectItem value="pinstripes" className="font-bold">Rayas Finas</SelectItem>
                              <SelectItem value="halves" className="font-bold">Mitades</SelectItem>
                              <SelectItem value="quarters" className="font-bold">Cuartos</SelectItem>
                              <SelectItem value="sash" className="font-bold">Franja Diagonal</SelectItem>
                              <SelectItem value="gradient" className="font-bold">Degradado</SelectItem>
                              <SelectItem value="minimal" className="font-bold">Minimalista</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Escudo</Label>
                          <Select value={emblemShape} onValueChange={(v: any) => setEmblemShape(v)}>
                            <SelectTrigger className="h-12 font-bold"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="shield" className="font-bold">Escudo</SelectItem>
                              <SelectItem value="circle" className="font-bold">Circular</SelectItem>
                              <SelectItem value="square" className="font-bold">Cuadrado</SelectItem>
                              <SelectItem value="modern" className="font-bold">Moderno</SelectItem>
                              <SelectItem value="diamond" className="font-bold">Diamante</SelectItem>
                              <SelectItem value="crown" className="font-bold">Corona</SelectItem>
                              <SelectItem value="star" className="font-bold">Estrella</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="venue" className="space-y-8 mt-0">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label className="text-xs font-black uppercase text-muted-foreground">Sede</Label>
                      <Input className="h-14 text-lg font-bold bg-muted/10" value={venueName} onChange={(e) => setVenueName(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs font-black uppercase text-muted-foreground">Capacidad</Label>
                      <Input className="h-14 text-lg font-bold bg-muted/10" type="number" value={venueCapacity} onChange={(e) => setVenueCapacity(Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="grid gap-2">
                      <Label className="text-xs font-black uppercase text-muted-foreground">Superficie</Label>
                      <Select value={venueSurface} onValueChange={(v: any) => setVenueSurface(v)}>
                        <SelectTrigger className="h-14 font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grass" className="font-bold">Césped</SelectItem>
                          <SelectItem value="parquet" className="font-bold">Parqué</SelectItem>
                          <SelectItem value="hardcourt" className="font-bold">Pista Dura</SelectItem>
                          <SelectItem value="clay" className="font-bold">Arcilla</SelectItem>
                          <SelectItem value="ice" className="font-bold">Hielo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs font-black uppercase text-muted-foreground">Escala</Label>
                      <Select value={venueSize} onValueChange={(v: any) => setVenueSize(v)}>
                        <SelectTrigger className="h-14 font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small" className="font-bold">Pequeño</SelectItem>
                          <SelectItem value="medium" className="font-bold">Estándar</SelectItem>
                          <SelectItem value="large" className="font-bold">Grande</SelectItem>
                          <SelectItem value="monumental" className="font-bold">Monumental</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
            <div className="p-8 bg-muted/20 border-t flex flex-col md:flex-row justify-end gap-4">
              <Button variant="ghost" className="font-bold" onClick={() => setIsDialogOpen(false)}>CANCELAR</Button>
              <Button onClick={handleSaveTeam} className="px-12 h-14 bg-primary text-primary-foreground font-black shadow-2xl rounded-2xl">
                {editingTeam ? 'ACTUALIZAR' : 'CONFIRMAR'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative px-4 md:px-0">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input 
          className="pl-10 bg-card border-none h-14 text-lg shadow-xl rounded-2xl" 
          placeholder="Buscar club por nombre o siglas..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-0">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="border-none bg-card transition-all group overflow-hidden shadow-xl border-t-8 rounded-[2rem]" style={{ borderTopColor: team.primaryColor }}>
            <div className="p-8 flex gap-6">
              <div className="w-28 h-28 shrink-0 flex items-center justify-center bg-muted/30 rounded-[2rem] relative shadow-inner">
                <CrestIcon 
                  shape={team.emblemShape} 
                  c1={team.primaryColor} 
                  c2={team.secondaryColor} 
                  c3={team.tertiaryColor || team.primaryColor} 
                  c4={team.accentColor}
                  size="w-16 h-16" 
                />
                <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-[10px] font-black px-3 py-1 rounded-full border-2 border-card">
                  {team.abbreviation}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-black truncate tracking-tighter uppercase">{team.name}</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mt-1">
                  {team.brand || 'Apex'} Kits • {team.sponsor || 'Elite'}
                </p>
                <div className="flex items-center gap-2 mt-4 bg-primary/5 w-fit px-3 py-1.5 rounded-full border border-primary/10">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-black text-primary">{team.rating} OVR</span>
                </div>
              </div>
            </div>
            
            <div className="px-8 pb-8 pt-2 space-y-6">
              <div className="flex gap-3">
                <div className="flex-1 bg-muted/40 p-4 rounded-2xl border border-muted/50">
                  <span className="text-[10px] uppercase font-black text-muted-foreground block mb-1.5 tracking-tighter">Venue</span>
                  <span className="text-sm font-black flex items-center gap-2 truncate">
                    <Landmark className="w-4 h-4 text-accent" /> {team.venueName}
                  </span>
                </div>
                <div className="w-24 bg-muted/40 p-4 rounded-2xl border border-muted/50 flex flex-col items-center justify-center">
                  <span className="text-[10px] uppercase font-black text-muted-foreground block mb-2">Colors</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.primaryColor }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.secondaryColor }} />
                    {team.tertiaryColor && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.tertiaryColor }} />}
                    {team.accentColor && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.accentColor }} />}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button className="flex-1 bg-secondary text-secondary-foreground h-12 rounded-2xl font-black text-xs uppercase transition-all" onClick={() => {
                  setEditingTeam(team);
                  setIsDialogOpen(true);
                }}>
                  <Pencil className="w-4 h-4 mr-2" /> REDISEÑAR
                </Button>
                <Button variant="destructive" size="icon" className="w-12 h-12 rounded-2xl" onClick={() => deleteTeam(team.id)}>
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
