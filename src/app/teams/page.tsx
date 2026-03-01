'use client';

import { useState, useEffect } from 'react';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Search, Shield, UserPlus, Trash2, Palette, Landmark, MapPin, Pencil, Maximize } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UniformStyle, EmblemShape, VenueSurface, VenueSize, Team } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PREDEFINED_COLORS } from '@/lib/colors';

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

  const renderUniformPreview = (primary: string, secondary: string, style: UniformStyle) => {
    return (
      <div className="w-full h-32 rounded-xl relative overflow-hidden border border-border shadow-inner" style={{ backgroundColor: primary }}>
        {style === 'stripes' && (
          <div className="absolute inset-0 flex">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex-1 h-full" style={{ backgroundColor: i % 2 === 0 ? secondary : 'transparent' }} />
            ))}
          </div>
        )}
        {style === 'hoops' && (
          <div className="absolute inset-0 flex flex-col">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex-1 w-full" style={{ backgroundColor: i % 2 === 0 ? secondary : 'transparent' }} />
            ))}
          </div>
        )}
        {style === 'halves' && (
          <div className="absolute inset-0 flex">
            <div className="flex-1 h-full" style={{ backgroundColor: secondary }} />
            <div className="flex-1 h-full" />
          </div>
        )}
        {style === 'gradient' && (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        )}
        {style === 'minimal' && (
          <div className="absolute top-0 right-0 w-8 h-full" style={{ backgroundColor: secondary }} />
        )}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[30px] font-black opacity-10 uppercase tracking-widest text-foreground">IDENTITY</span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Organizaciones y Equipos</h1>
          <p className="text-muted-foreground">Gestiona y personaliza tus entidades deportivas.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingTeam(null);
        }}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-6">
              <Plus className="w-5 h-5 mr-2" /> Nuevo Equipo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[650px] bg-card border-none shadow-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
            <DialogHeader className="p-6 bg-muted/20 border-b">
              <DialogTitle className="text-2xl">{editingTeam ? 'Editar Equipo' : 'Constructor de Identidad'}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="w-full grid grid-cols-3 rounded-none bg-muted/10 h-12">
                <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">General</TabsTrigger>
                <TabsTrigger value="branding" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent">Branding</TabsTrigger>
                <TabsTrigger value="venue" className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-500">Sede</TabsTrigger>
              </TabsList>
              
              <div className="p-6">
                <TabsContent value="general" className="space-y-4 mt-0">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nombre de la Organización</Label>
                    <Input id="name" placeholder="Ej: Phoenix Rising" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="abbr">Abreviatura (3 letras)</Label>
                      <Input id="abbr" maxLength={3} placeholder="PHX" value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Nivel de Desempeño</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <Slider value={[rating]} onValueChange={(vals) => setRating(vals[0])} max={100} min={1} />
                        <span className="font-mono font-bold text-primary min-w-8">{rating}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="branding" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Color Primario</Label>
                        <div className="grid grid-cols-5 gap-2">
                          {PREDEFINED_COLORS.map(color => (
                            <button
                              key={color}
                              onClick={() => setPrimaryColor(color)}
                              className={cn(
                                "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 shadow-sm",
                                primaryColor === color ? "border-foreground" : "border-transparent"
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Color de Acento</Label>
                        <div className="grid grid-cols-5 gap-2">
                          {PREDEFINED_COLORS.map(color => (
                            <button
                              key={color}
                              onClick={() => setSecondaryColor(color)}
                              className={cn(
                                "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 shadow-sm",
                                secondaryColor === color ? "border-foreground" : "border-transparent"
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label>Patrón de Uniforme</Label>
                        <Select value={uniformStyle} onValueChange={(v: any) => setUniformStyle(v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solid">Sólido</SelectItem>
                            <SelectItem value="stripes">Rayas Verticales</SelectItem>
                            <SelectItem value="hoops">Rayas Horizontales</SelectItem>
                            <SelectItem value="halves">Mitades</SelectItem>
                            <SelectItem value="gradient">Degradado</SelectItem>
                            <SelectItem value="minimal">Minimalista</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Forma del Escudo</Label>
                        <Select value={emblemShape} onValueChange={(v: any) => setEmblemShape(v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="shield">Escudo Clásico</SelectItem>
                            <SelectItem value="circle">Circular</SelectItem>
                            <SelectItem value="square">Cuadrangular</SelectItem>
                            <SelectItem value="modern">Geométrico Moderno</SelectItem>
                            <SelectItem value="diamond">Diamante</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4 pt-4 border-t">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Previsualización de Identidad</Label>
                    {renderUniformPreview(primaryColor, secondaryColor, uniformStyle)}
                  </div>
                </TabsContent>

                <TabsContent value="venue" className="space-y-4 mt-0">
                  <div className="grid gap-2">
                    <Label htmlFor="venue">Nombre de la Sede</Label>
                    <Input id="venue" placeholder="Ej: Apex Arena" value={venueName} onChange={(e) => setVenueName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="capacity">Capacidad Total</Label>
                      <Input id="capacity" type="number" value={venueCapacity} onChange={(e) => setVenueCapacity(Number(e.target.value))} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Tamaño del Recinto</Label>
                      <Select value={venueSize} onValueChange={(v: any) => setVenueSize(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Pequeño / Local</SelectItem>
                          <SelectItem value="medium">Estándar</SelectItem>
                          <SelectItem value="large">Gran Estadio</SelectItem>
                          <SelectItem value="monumental">Monumental / Épico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Superficie de Juego</Label>
                    <Select value={venueSurface} onValueChange={(v: any) => setVenueSurface(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parquet">Parqué / Madera</SelectItem>
                        <SelectItem value="hardcourt">Cancha Dura</SelectItem>
                        <SelectItem value="grass">Césped / Natural</SelectItem>
                        <SelectItem value="ice">Hielo</SelectItem>
                        <SelectItem value="clay">Arcilla</SelectItem>
                        <SelectItem value="sand">Arena</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
            <div className="p-6 bg-muted/20 border-t flex justify-end">
              <Button onClick={handleSaveTeam} className="w-full md:w-auto px-8 h-11 bg-primary text-primary-foreground font-bold shadow-xl shadow-primary/20">
                {editingTeam ? 'Guardar Cambios' : 'Establecer Organización'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input 
          className="pl-10 bg-card border-none h-12 text-lg shadow-lg focus-visible:ring-primary" 
          placeholder="Filtrar equipos..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="border-none bg-card hover:ring-2 hover:ring-primary/50 transition-all group overflow-hidden shadow-xl">
            <div className="h-32 relative overflow-hidden">
              <div className="absolute inset-0 opacity-40" style={{ backgroundColor: team.primaryColor }} />
              <div 
                className="absolute inset-0 mix-blend-multiply" 
                style={{ 
                  background: team.uniformStyle === 'stripes' 
                    ? `repeating-linear-gradient(90deg, ${team.secondaryColor} 0, ${team.secondaryColor} 20px, transparent 20px, transparent 40px)`
                    : team.uniformStyle === 'hoops'
                    ? `repeating-linear-gradient(0deg, ${team.secondaryColor} 0, ${team.secondaryColor} 20px, transparent 20px, transparent 40px)`
                    : team.uniformStyle === 'halves'
                    ? `linear-gradient(90deg, ${team.secondaryColor} 50%, transparent 50%)`
                    : team.uniformStyle === 'gradient'
                    ? `linear-gradient(135deg, ${team.primaryColor}, ${team.secondaryColor})`
                    : team.uniformStyle === 'minimal'
                    ? `linear-gradient(90deg, transparent 80%, ${team.secondaryColor} 80%)`
                    : 'transparent'
                }} 
              />
              <div className="absolute inset-x-6 -bottom-8 flex items-end">
                <div className={cn(
                  "w-20 h-20 bg-card shadow-2xl flex items-center justify-center relative z-10 border-4 border-card transition-transform group-hover:scale-110",
                  team.emblemShape === 'shield' && "rounded-b-3xl rounded-t-lg",
                  team.emblemShape === 'circle' && "rounded-full",
                  team.emblemShape === 'square' && "rounded-2xl",
                  team.emblemShape === 'modern' && "rounded-tr-3xl rounded-bl-3xl",
                  team.emblemShape === 'diamond' && "rotate-45"
                )}>
                  <div className={cn(team.emblemShape === 'diamond' && "-rotate-45")}>
                    <Shield className="w-10 h-10" style={{ color: team.primaryColor }} />
                  </div>
                </div>
              </div>
            </div>
            <CardHeader className="pt-12 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-black">{team.name}</CardTitle>
                  <CardDescription className="font-mono font-bold text-accent uppercase tracking-widest">{team.abbreviation}</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">POWER</p>
                  <p className="text-3xl font-black text-primary leading-none">{team.rating}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col p-3 bg-muted/30 rounded-xl">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                    <Landmark className="w-3 h-3" /> Sede
                  </span>
                  <span className="text-sm font-bold truncate">{team.venueName}</span>
                </div>
                <div className="flex flex-col p-3 bg-muted/30 rounded-xl">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                    <Maximize className="w-3 h-3" /> Tamaño
                  </span>
                  <span className="text-sm font-bold capitalize">{team.venueSize || 'Estándar'}</span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 rounded-xl" variant="secondary" size="sm" onClick={() => {
                  setEditingTeam(team);
                  setIsDialogOpen(true);
                }}>
                  <Pencil className="w-4 h-4 mr-2" /> Editar
                </Button>
                <Button variant="destructive" size="icon" className="rounded-xl" onClick={() => deleteTeam(team.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
