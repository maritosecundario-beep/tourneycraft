'use client';

import { useState, useEffect } from 'react';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Search, Shield, UserPlus, Trash2, Palette, Landmark, MapPin, Pencil, Maximize, CheckCircle2, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UniformStyle, EmblemShape, VenueSurface, VenueSize, Team } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PREDEFINED_COLORS } from '@/lib/colors';

// Realistic Jersey SVG Component with depth and detail
const JerseySVG = ({ primary, secondary, style, brand, sponsor }: { 
  primary: string, 
  secondary: string, 
  style: UniformStyle,
  brand?: string,
  sponsor?: string
}) => {
  return (
    <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-2xl">
      <defs>
        <clipPath id="bodyClip">
          <path d="M40 40 L60 20 L140 20 L160 40 L180 60 L180 100 L160 100 L160 220 L40 220 L40 100 L20 100 L20 60 Z" />
        </clipPath>
        <pattern id="stripes" patternUnits="userSpaceOnUse" width="40" height="240">
          <rect width="20" height="240" fill={secondary} />
          <rect x="20" width="20" height="240" fill="transparent" />
        </pattern>
        <pattern id="hoops" patternUnits="userSpaceOnUse" width="200" height="40">
          <rect width="200" height="20" fill={secondary} />
          <rect y="20" width="200" height="20" fill="transparent" />
        </pattern>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: primary, stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: secondary, stopOpacity: 1 }} />
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.5"/>
        </filter>
      </defs>
      
      {/* Jersey Base */}
      <path 
        d="M40 40 L60 20 L140 20 L160 40 L180 60 L180 100 L160 100 L160 220 L40 220 L40 100 L20 100 L20 60 Z" 
        fill={primary} 
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="1"
      />
      
      {/* Patterns with clipping */}
      <g clipPath="url(#bodyClip)">
        {style === 'stripes' && <rect width="200" height="240" fill="url(#stripes)" />}
        {style === 'hoops' && <rect width="200" height="240" fill="url(#hoops)" />}
        {style === 'halves' && <rect x="100" width="100" height="240" fill={secondary} />}
        {style === 'gradient' && <rect width="200" height="240" fill="url(#grad)" />}
        {style === 'minimal' && <rect x="150" y="20" width="10" height="200" fill={secondary} opacity="0.8" />}
      </g>
      
      {/* Brand & Sponsor - Realist positioning */}
      <text x="100" y="145" textAnchor="middle" fill="white" fontSize="16" fontWeight="900" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.4)', fontFamily: 'sans-serif' }}>
        {sponsor?.toUpperCase() || ''}
      </text>
      <text x="145" y="55" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" opacity="0.7">
        {brand?.toUpperCase() || ''}
      </text>

      {/* Realistic Folds and Shadows */}
      <path d="M40 40 L60 20 L140 20 L160 40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
      <path d="M40 100 L160 100" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
      <path d="M60 20 L140 20" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
      <path d="M40 220 L160 220" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="3" />
      
      {/* Texture effect */}
      <rect width="200" height="240" fill="url(#bodyClip)" opacity="0.03" style={{ mixBlendMode: 'overlay' }} />
    </svg>
  );
};

// Advanced Crest Visualization
const CrestIcon = ({ shape, color, size = "w-10 h-10" }: { shape: EmblemShape, color: string, size?: string }) => {
  const renderShape = () => {
    switch (shape) {
      case 'shield': return <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill={color} />;
      case 'circle': return <circle cx="12" cy="12" r="10" fill={color} />;
      case 'square': return <rect x="3" y="3" width="18" height="18" rx="4" fill={color} />;
      case 'modern': return <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke={color} fill="none" strokeWidth="2" />;
      case 'diamond': return <path d="M12 2l9 10-9 10-9-10z" fill={color} />;
      case 'vintage': return <path d="M4 4h16v16H4z" fill="none" stroke={color} strokeWidth="4" />;
      default: return <Shield fill={color} />;
    }
  };

  return (
    <svg viewBox="0 0 24 24" className={size}>
      {renderShape()}
    </svg>
  );
};

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
  
  // Aesthetic state
  const [primaryColor, setPrimaryColor] = useState(PREDEFINED_COLORS[10]);
  const [secondaryColor, setSecondaryColor] = useState(PREDEFINED_COLORS[19]);
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
      setPrimaryColor(editingTeam.primaryColor);
      setSecondaryColor(editingTeam.secondaryColor);
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
    setPrimaryColor(PREDEFINED_COLORS[10]);
    setSecondaryColor(PREDEFINED_COLORS[19]);
    setUniformStyle('solid');
    setEmblemShape('modern');
    setBrand('Apex');
    setSponsor('');
  };

  const handleSaveTeam = () => {
    if (!name || abbreviation.length !== 3) {
      toast({ title: "Error", description: "El nombre es obligatorio y la abreviación debe ser de 3 letras.", variant: "destructive" });
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
      primaryColor,
      secondaryColor,
      uniformStyle,
      emblemShape,
      brand,
      sponsor,
      players: editingTeam ? editingTeam.players : []
    };

    if (editingTeam) {
      updateTeam(teamData);
      toast({ title: "Equipo Actualizado", description: `${name} ha sido modificado.` });
    } else {
      addTeam(teamData);
      toast({ title: "Equipo Creado", description: `${name} ha sido fundado.` });
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
          <p className="text-muted-foreground text-sm md:text-base">Gestiona el branding y la infraestructura de tus organizaciones.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingTeam(null);
        }}>
          <DialogTrigger asChild>
            <Button className="shadow-2xl shadow-primary/40 bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 font-black rounded-2xl transition-all hover:scale-105 active:scale-95">
              <Plus className="w-5 h-5 mr-2" /> FUNDAR CLUB
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[850px] bg-card border-none shadow-2xl p-0 overflow-hidden max-h-[95vh] overflow-y-auto rounded-3xl">
            <DialogHeader className="p-8 bg-muted/20 border-b flex flex-row items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-3xl font-black tracking-tight flex items-center gap-2">
                  <Star className="text-yellow-500 fill-current w-8 h-8" /> {editingTeam ? 'REDISENAR MARCA' : 'FUNDAR ENTIDAD'}
                </DialogTitle>
                <CardDescription>Configura cada detalle de la identidad del club.</CardDescription>
              </div>
            </DialogHeader>
            <Tabs defaultValue="branding" className="w-full">
              <TabsList className="w-full grid grid-cols-3 rounded-none bg-muted/10 h-14 border-b">
                <TabsTrigger value="general" className="rounded-none font-bold text-xs md:text-sm">DATOS BASE</TabsTrigger>
                <TabsTrigger value="branding" className="rounded-none font-bold text-xs md:text-sm">BRANDING & KIT</TabsTrigger>
                <TabsTrigger value="venue" className="rounded-none font-bold text-xs md:text-sm">SEDE & ESTADIO</TabsTrigger>
              </TabsList>
              
              <div className="p-6 md:p-10">
                <TabsContent value="general" className="space-y-8 mt-0 animate-in fade-in slide-in-from-bottom-2">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nombre Oficial</Label>
                      <Input id="name" className="h-14 text-xl font-bold bg-muted/10" placeholder="Phoenix Rising SC" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="abbr" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Siglas (3 char)</Label>
                      <Input id="abbr" className="h-14 text-xl font-bold text-center uppercase tracking-widest bg-muted/10" maxLength={3} placeholder="PHX" value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="flex justify-between text-xs font-black uppercase tracking-widest text-muted-foreground">Nivel de Prestigio / Rating <span>{rating}</span></Label>
                    <div className="p-6 bg-muted/10 rounded-2xl border">
                      <Slider value={[rating]} onValueChange={(vals) => setRating(vals[0])} max={100} min={1} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="branding" className="space-y-10 mt-0 animate-in fade-in slide-in-from-bottom-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                    {/* Realistic Preview Section */}
                    <div className="space-y-6 bg-muted/5 p-8 rounded-[2.5rem] flex flex-col items-center justify-center border-2 border-dashed border-muted relative overflow-hidden">
                      <div className="absolute top-4 left-6 text-[10px] uppercase font-black tracking-widest text-muted-foreground/50">Club Kit Preview</div>
                      <div className="w-56 h-64 transition-transform hover:scale-110 duration-500">
                        <JerseySVG primary={primaryColor} secondary={secondaryColor} style={uniformStyle} brand={brand} sponsor={sponsor} />
                      </div>
                      <div className="flex items-center gap-6 mt-4 p-4 bg-card rounded-2xl shadow-xl border">
                        <CrestIcon shape={emblemShape} color={primaryColor} size="w-16 h-16" />
                        <div className="h-12 w-px bg-border" />
                        <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground">Primary Color</p>
                          <div className="w-12 h-4 rounded-full mt-1" style={{ backgroundColor: primaryColor }} />
                        </div>
                      </div>
                    </div>

                    {/* Branding Controls Section */}
                    <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Marca Técnica</Label>
                          <Input value={brand} className="bg-muted/10" onChange={(e) => setBrand(e.target.value)} placeholder="Apex Sports" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Main Sponsor</Label>
                          <Input value={sponsor} className="bg-muted/10" onChange={(e) => setSponsor(e.target.value)} placeholder="TechCorp" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Paleta Cromática Principal</Label>
                        <div className="grid grid-cols-10 gap-2 p-3 bg-muted/10 rounded-2xl border">
                          {PREDEFINED_COLORS.map(color => (
                            <button
                              key={color}
                              onClick={() => setPrimaryColor(color)}
                              className={cn(
                                "w-6 h-6 rounded-full border-2 transition-all hover:scale-125 hover:shadow-lg",
                                primaryColor === color ? "border-foreground scale-110 shadow-md" : "border-transparent"
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-6">
                        <div className="grid gap-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Patrón de Equipación</Label>
                          <Select value={uniformStyle} onValueChange={(v: any) => setUniformStyle(v)}>
                            <SelectTrigger className="h-12 font-bold"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="solid" className="font-bold">Sólido Minimalista</SelectItem>
                              <SelectItem value="stripes" className="font-bold">Rayas Verticales</SelectItem>
                              <SelectItem value="hoops" className="font-bold">Aros Horizontales</SelectItem>
                              <SelectItem value="halves" className="font-bold">Mitades Modernas</SelectItem>
                              <SelectItem value="gradient" className="font-bold">Degradado Pro</SelectItem>
                              <SelectItem value="minimal" className="font-bold">Franja Lateral</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Forma del Emblema</Label>
                          <Select value={emblemShape} onValueChange={(v: any) => setEmblemShape(v)}>
                            <SelectTrigger className="h-12 font-bold"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="shield" className="font-bold">Escudo Tradicional</SelectItem>
                              <SelectItem value="circle" className="font-bold">Sello Circular</SelectItem>
                              <SelectItem value="square" className="font-bold">Moderno Cuadrado</SelectItem>
                              <SelectItem value="modern" className="font-bold">Geometría Abstracta</SelectItem>
                              <SelectItem value="diamond" className="font-bold">Diamante Élite</SelectItem>
                              <SelectItem value="vintage" className="font-bold">Retro Vintage</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="venue" className="space-y-8 mt-0 animate-in fade-in slide-in-from-bottom-2">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nombre de la Sede</Label>
                      <Input className="h-14 text-lg font-bold bg-muted/10" placeholder="Arena Monumental" value={venueName} onChange={(e) => setVenueName(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Aforo Estimado</Label>
                      <Input className="h-14 text-lg font-bold bg-muted/10" type="number" value={venueCapacity} onChange={(e) => setVenueCapacity(Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid gap-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Superficie de Juego</Label>
                      <Select value={venueSurface} onValueChange={(v: any) => setVenueSurface(v)}>
                        <SelectTrigger className="h-14 font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grass" className="font-bold">Césped Natural</SelectItem>
                          <SelectItem value="parquet" className="font-bold">Parqué / Madera</SelectItem>
                          <SelectItem value="hardcourt" className="font-bold">Cancha Dura</SelectItem>
                          <SelectItem value="ice" className="font-bold">Hielo</SelectItem>
                          <SelectItem value="sand" className="font-bold">Arena</SelectItem>
                          <SelectItem value="clay" className="font-bold">Arcilla</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Escala del Recinto</Label>
                      <Select value={venueSize} onValueChange={(v: any) => setVenueSize(v)}>
                        <SelectTrigger className="h-14 font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small" className="font-bold">Pequeño / Local</SelectItem>
                          <SelectItem value="medium" className="font-bold">Recinto Estándar</SelectItem>
                          <SelectItem value="large" className="font-bold">Gran Estadio</SelectItem>
                          <SelectItem value="monumental" className="font-bold">Sede Monumental</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
            <div className="p-8 bg-muted/20 border-t flex flex-col md:flex-row justify-end gap-4">
              <Button variant="ghost" className="font-bold" onClick={() => setIsDialogOpen(false)}>CANCELAR</Button>
              <Button onClick={handleSaveTeam} className="px-12 h-14 bg-primary text-primary-foreground font-black shadow-2xl shadow-primary/30 rounded-2xl transition-all hover:scale-105">
                {editingTeam ? 'ACTUALIZAR IDENTIDAD' : 'CONFIRMAR FUNDACIÓN'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative px-4 md:px-0">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input 
          className="pl-10 bg-card border-none h-14 text-lg shadow-xl focus-visible:ring-2 focus-visible:ring-primary rounded-2xl" 
          placeholder="Filtrar por nombre o siglas del club..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-0">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="border-none bg-card hover:shadow-2xl transition-all group overflow-hidden shadow-xl border-t-8 rounded-[2rem]" style={{ borderTopColor: team.primaryColor }}>
            <div className="p-8 flex gap-6">
              <div className="w-28 h-28 shrink-0 flex items-center justify-center bg-muted/30 rounded-[2rem] relative shadow-inner">
                <CrestIcon shape={team.emblemShape} color={team.primaryColor} size="w-16 h-16" />
                <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-[10px] font-black px-3 py-1 rounded-full shadow-2xl border-2 border-card">
                  {team.abbreviation}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-black truncate tracking-tighter uppercase">{team.name}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mt-1">
                      {team.brand || 'Classic'} Kits • {team.sponsor || 'Sin Sponsor'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 bg-primary/5 w-fit px-3 py-1.5 rounded-full border border-primary/10">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-black text-primary">{team.rating} OVR</span>
                </div>
              </div>
            </div>
            
            <div className="px-8 pb-8 pt-2 space-y-6">
              <div className="flex gap-3">
                <div className="flex-1 bg-muted/40 p-4 rounded-2xl border border-muted/50">
                  <span className="text-[10px] uppercase font-black text-muted-foreground block mb-1.5 tracking-tighter">Sede Principal</span>
                  <span className="text-sm font-black flex items-center gap-2 truncate">
                    <Landmark className="w-4 h-4 text-accent" /> {team.venueName}
                  </span>
                </div>
                <div className="w-20 bg-muted/40 p-4 rounded-2xl border border-muted/50 flex flex-col items-center justify-center">
                  <span className="text-[10px] uppercase font-black text-muted-foreground block mb-2">Colores</span>
                  <div className="flex gap-1.5">
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: team.primaryColor }} />
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: team.secondaryColor }} />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-12 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105" onClick={() => {
                  setEditingTeam(team);
                  setIsDialogOpen(true);
                }}>
                  <Pencil className="w-4 h-4 mr-2" /> REDISEÑAR
                </Button>
                <Button variant="destructive" size="icon" className="w-12 h-12 rounded-2xl shadow-lg shadow-destructive/20 transition-all hover:scale-110 active:scale-90" onClick={() => deleteTeam(team.id)}>
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
