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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UniformStyle, EmblemShape, VenueSurface, VenueSize, Team } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PREDEFINED_COLORS } from '@/lib/colors';

// Realistic Jersey SVG Component
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
      </defs>
      {/* Jersey Body Path */}
      <path 
        d="M40 40 L60 20 L140 20 L160 40 L180 60 L180 100 L160 100 L160 220 L40 220 L40 100 L20 100 L20 60 Z" 
        fill={primary} 
        stroke="rgba(0,0,0,0.2)"
        strokeWidth="2"
      />
      
      {/* Patterns */}
      {style === 'stripes' && (
        <path d="M40 40 L60 20 L140 20 L160 40 L160 220 L40 220 Z" fill="url(#stripes)" clipPath="url(#bodyClip)" />
      )}
      {style === 'hoops' && (
        <path d="M40 40 L60 20 L140 20 L160 40 L160 220 L40 220 Z" fill="url(#hoops)" />
      )}
      {style === 'halves' && (
        <path d="M40 40 L60 20 L100 20 L100 220 L40 220 Z" fill={secondary} />
      )}
      {style === 'gradient' && (
        <path d="M40 40 L60 20 L140 20 L160 40 L160 220 L40 220 Z" fill="url(#grad)" />
      )}
      {style === 'minimal' && (
        <rect x="150" y="20" width="10" height="200" fill={secondary} opacity="0.8" />
      )}
      
      {/* Brand & Sponsor Overlay */}
      <text x="100" y="140" textAnchor="middle" fill="white" fontSize="14" fontWeight="900" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
        {sponsor?.toUpperCase() || ''}
      </text>
      <text x="140" y="55" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" opacity="0.6">
        {brand?.toUpperCase() || ''}
      </text>

      {/* Shadows for realism */}
      <path d="M40 40 L60 20 L140 20 L160 40 L180 60" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
      <path d="M40 220 L160 220" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" />
    </svg>
  );
};

// Crest Visualization
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
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <header className="flex justify-between items-center px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Club Identity Studio</h1>
          <p className="text-muted-foreground">Gestiona el branding y las sedes de tus organizaciones.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingTeam(null);
        }}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-6">
              <Plus className="w-5 h-5 mr-2" /> Nueva Organización
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] bg-card border-none shadow-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
            <DialogHeader className="p-6 bg-muted/20 border-b">
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Star className="text-yellow-500 fill-current" /> {editingTeam ? 'Rediseñar Identidad' : 'Fundar Nueva Entidad'}
              </DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="branding" className="w-full">
              <TabsList className="w-full grid grid-cols-3 rounded-none bg-muted/10 h-12">
                <TabsTrigger value="general" className="rounded-none">Datos Base</TabsTrigger>
                <TabsTrigger value="branding" className="rounded-none">Identidad Visual</TabsTrigger>
                <TabsTrigger value="venue" className="rounded-none">Sede & Infraestructura</TabsTrigger>
              </TabsList>
              
              <div className="p-8">
                <TabsContent value="general" className="space-y-6 mt-0">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nombre Oficial</Label>
                      <Input id="name" placeholder="Phoenix Rising SC" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="abbr">Siglas (3 char)</Label>
                      <Input id="abbr" maxLength={3} placeholder="PHX" value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="flex justify-between">Nivel de Prestigio <span>{rating}</span></Label>
                    <Slider value={[rating]} onValueChange={(vals) => setRating(vals[0])} max={100} min={1} />
                  </div>
                </TabsContent>

                <TabsContent value="branding" className="space-y-8 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Preview Section */}
                    <div className="space-y-4 bg-muted/20 p-6 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-muted">
                      <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground self-start mb-4">Identity Preview</Label>
                      <div className="w-48 h-56">
                        <JerseySVG primary={primaryColor} secondary={secondaryColor} style={uniformStyle} brand={brand} sponsor={sponsor} />
                      </div>
                      <div className="mt-4">
                        <CrestIcon shape={emblemShape} color={primaryColor} size="w-16 h-16" />
                      </div>
                    </div>

                    {/* Controls Section */}
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Marca Técnica</Label>
                          <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ej: Apex" />
                        </div>
                        <div className="space-y-2">
                          <Label>Patrocinador</Label>
                          <Input value={sponsor} onChange={(e) => setSponsor(e.target.value)} placeholder="Ej: TechCorp" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Paleta Cromática Principal</Label>
                        <div className="grid grid-cols-10 gap-2">
                          {PREDEFINED_COLORS.map(color => (
                            <button
                              key={color}
                              onClick={() => setPrimaryColor(color)}
                              className={cn(
                                "w-6 h-6 rounded-full border-2 transition-transform hover:scale-125",
                                primaryColor === color ? "border-foreground" : "border-transparent"
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label>Patrón de Equipación</Label>
                          <Select value={uniformStyle} onValueChange={(v: any) => setUniformStyle(v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="solid">Sólido Minimalista</SelectItem>
                              <SelectItem value="stripes">Rayas Verticales Clásicas</SelectItem>
                              <SelectItem value="hoops">Aros Horizontales</SelectItem>
                              <SelectItem value="halves">Mitades Modernas</SelectItem>
                              <SelectItem value="gradient">Degradado Futuro</SelectItem>
                              <SelectItem value="minimal">Franja Lateral</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Forma del Emblema</Label>
                          <Select value={emblemShape} onValueChange={(v: any) => setEmblemShape(v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="shield">Escudo Real</SelectItem>
                              <SelectItem value="circle">Sello Circular</SelectItem>
                              <SelectItem value="square">Moderno Cuadrado</SelectItem>
                              <SelectItem value="modern">Geometría Pro</SelectItem>
                              <SelectItem value="diamond">Diamante Élite</SelectItem>
                              <SelectItem value="vintage">Contorno Vintage</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="venue" className="space-y-6 mt-0">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="venue">Nombre de la Sede</Label>
                      <Input id="venue" placeholder="Arena Monumental" value={venueName} onChange={(e) => setVenueName(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="capacity">Aforo Total</Label>
                      <Input id="capacity" type="number" value={venueCapacity} onChange={(e) => setVenueCapacity(Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Superficie de Juego</Label>
                      <Select value={venueSurface} onValueChange={(v: any) => setVenueSurface(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grass">Césped Natural</SelectItem>
                          <SelectItem value="parquet">Parqué / Madera</SelectItem>
                          <SelectItem value="hardcourt">Cancha Dura</SelectItem>
                          <SelectItem value="ice">Hielo</SelectItem>
                          <SelectItem value="sand">Arena</SelectItem>
                          <SelectItem value="clay">Arcilla</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Escala del Recinto</Label>
                      <Select value={venueSize} onValueChange={(v: any) => setVenueSize(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Centro Comunitario / Local</SelectItem>
                          <SelectItem value="medium">Recinto Estándar</SelectItem>
                          <SelectItem value="large">Arena de Gran Escala</SelectItem>
                          <SelectItem value="monumental">Estadio Nacional / Monumental</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
            <div className="p-6 bg-muted/20 border-t flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveTeam} className="px-10 bg-primary text-primary-foreground font-black shadow-xl shadow-primary/20">
                {editingTeam ? 'Actualizar Identidad' : 'Consolidar Organización'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative px-4 md:px-0">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input 
          className="pl-10 bg-card border-none h-12 text-lg shadow-lg focus-visible:ring-primary" 
          placeholder="Filtrar por nombre o siglas..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-0">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="border-none bg-card hover:shadow-2xl transition-all group overflow-hidden shadow-xl border-t-4" style={{ borderTopColor: team.primaryColor }}>
            <div className="p-6 flex gap-6">
              <div className="w-24 h-24 shrink-0 flex items-center justify-center bg-muted/30 rounded-2xl relative">
                <CrestIcon shape={team.emblemShape} color={team.primaryColor} size="w-16 h-16" />
                <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">
                  {team.abbreviation}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-black truncate">{team.name}</h3>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                      {team.brand || 'Classic'} • {team.sponsor || 'Sin Sponsor'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span className="text-sm font-black text-primary">{team.rating} Power</span>
                </div>
              </div>
            </div>
            
            <div className="px-6 pb-6 pt-2 space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 bg-muted/40 p-3 rounded-xl">
                  <span className="text-[10px] uppercase font-black text-muted-foreground block mb-1">Sede Principal</span>
                  <span className="text-sm font-bold flex items-center gap-2">
                    <Landmark className="w-3 h-3 text-accent" /> {team.venueName}
                  </span>
                </div>
                <div className="flex-1 bg-muted/40 p-3 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-black text-muted-foreground block mb-1">Identidad</span>
                  <div className="flex justify-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.primaryColor }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.secondaryColor }} />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 rounded-xl font-bold" onClick={() => {
                  setEditingTeam(team);
                  setIsDialogOpen(true);
                }}>
                  <Pencil className="w-4 h-4 mr-2" /> Rediseñar
                </Button>
                <Button variant="destructive" size="icon" className="w-10 h-10 rounded-xl" onClick={() => deleteTeam(team.id)}>
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
