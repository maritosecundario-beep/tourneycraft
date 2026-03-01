'use client';

import { useState, useEffect } from 'react';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Shield, Trash2, Pencil, Sparkles, Shirt, Landmark, Star, CircleSlash } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UniformStyle, EmblemShape, VenueSurface, VenueSize, Team } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PREDEFINED_COLORS } from '@/lib/colors';

// Advanced Jersey SVG Component with Dynamic Patterns
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
        <pattern id="waves" patternUnits="userSpaceOnUse" width="40" height="20">
          <path d="M0 10 Q10 0 20 10 T40 10" fill="none" stroke={secondary} strokeWidth="4" />
        </pattern>
        <pattern id="zigzag" patternUnits="userSpaceOnUse" width="40" height="20">
          <path d="M0 10 L10 0 L20 10 L30 0 L40 10" fill="none" stroke={secondary} strokeWidth="4" />
        </pattern>
        <pattern id="honeycomb" patternUnits="userSpaceOnUse" width="30" height="52">
          <path d="M15 0 L30 8.66 L30 26 L15 34.64 L0 26 L0 8.66 Z" fill="none" stroke={secondary} strokeWidth="1" />
        </pattern>
        <pattern id="pixel" patternUnits="userSpaceOnUse" width="20" height="20">
          <rect x="0" y="0" width="10" height="10" fill={secondary} opacity="0.5" />
          <rect x="10" y="10" width="5" height="5" fill={secondary} />
        </pattern>
        <pattern id="stars" patternUnits="userSpaceOnUse" width="50" height="50">
          <path d="M25 10 L28 18 L36 18 L30 24 L32 32 L25 28 L18 32 L20 24 L14 18 L22 18 Z" fill={secondary} />
        </pattern>

        <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: primary, stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: secondary, stopOpacity: 1 }} />
        </linearGradient>

        <radialGradient id="meshGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.15" />
          <stop offset="100%" stopColor="black" stopOpacity="0.25" />
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
        {style === 'waves' && <rect width="200" height="240" fill="url(#waves)" />}
        {style === 'zigzag' && <rect width="200" height="240" fill="url(#zigzag)" />}
        {style === 'honeycomb' && <rect width="200" height="240" fill="url(#honeycomb)" />}
        {style === 'pixel' && <rect width="200" height="240" fill="url(#pixel)" />}
        {style === 'stars' && <rect width="200" height="240" fill="url(#stars)" />}
        {style === 'halves' && <rect x="100" width="100" height="240" fill={secondary} />}
        {style === 'quarters' && (
          <>
            <rect x="100" y="20" width="60" height="100" fill={secondary} />
            <rect x="40" y="100" width="60" height="120" fill={secondary} />
          </>
        )}
        {style === 'shoulders' && (
          <>
            <path d="M40 40 L60 20 L100 20 L100 60 L40 60 Z" fill={secondary} />
            <path d="M160 40 L140 20 L100 20 L100 60 L160 60 Z" fill={secondary} />
          </>
        )}
        {style === 'side-panels' && (
          <>
            <rect x="40" y="60" width="20" height="160" fill={secondary} />
            <rect x="140" y="60" width="20" height="160" fill={secondary} />
          </>
        )}
        {style === 'gradient' && <rect width="200" height="240" fill="url(#grad)" />}
        {style === 'sash' && <path d="M40 40 L160 220 L160 180 L80 40 Z" fill={secondary} />}
        {style === 'minimal' && <rect x="150" y="20" width="10" height="200" fill={secondary} opacity="0.8" />}
        {style === 'camouflage' && (
          <g opacity="0.6">
            <ellipse cx="60" cy="80" rx="30" ry="15" fill={secondary} transform="rotate(20 60 80)" />
            <ellipse cx="140" cy="120" rx="40" ry="20" fill={secondary} transform="rotate(-15 140 120)" />
            <ellipse cx="80" cy="180" rx="35" ry="18" fill={secondary} transform="rotate(45 80 180)" />
          </g>
        )}
      </g>

      {/* Tertiary Color Trim (Collar & Cuffs) */}
      <path d="M60 20 L80 35 L120 35 L140 20 Z" fill={trim} /> 
      <path d="M20 60 L40 50 L40 70 L20 80 Z" fill={trim} /> 
      <path d="M180 60 L160 50 L160 70 L180 80 Z" fill={trim} /> 
      
      {/* Realistic Fabric Shading */}
      <path 
        d="M40 40 L60 20 L140 20 L160 40 L180 60 L180 100 L160 100 L160 220 L40 220 L40 100 L20 100 L20 60 Z" 
        fill="url(#meshGradient)" 
        opacity="0.4"
      />

      {/* Brand & Sponsor */}
      <text x="100" y="145" textAnchor="middle" fill={logo} fontSize="14" fontWeight="900" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)', fontFamily: 'Inter, sans-serif' }}>
        {sponsor?.toUpperCase() || 'ELITE BRAND'}
      </text>
      <text x="145" y="55" textAnchor="middle" fill={logo} fontSize="6" fontWeight="bold" opacity="0.9">
        {brand?.toUpperCase() || 'APEX'}
      </text>
    </svg>
  );
};

// Advanced Crest Visualization
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
      case 'hexagon':
        return (
          <g>
            <path d="M12 2l8.66 5v10L12 22l-8.66-5V7z" fill={c1} stroke={c2} strokeWidth="1" />
            <path d="M12 5l6 3.5v7L12 19l-6-3.5v-7z" fill="none" stroke={c3} strokeWidth="1" />
          </g>
        );
      case 'star':
        return (
          <g>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" fill={c1} stroke={c2} strokeWidth="1" />
            <circle cx="12" cy="12" r="2" fill={c3} />
          </g>
        );
      case 'lion':
        return (
          <g>
            <circle cx="12" cy="12" r="10" fill={c1} />
            <path d="M12 7c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5z" fill={c2} />
            <path d="M10 12l2 2 2-2" stroke={c3} fill="none" strokeWidth="1" />
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
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <Label className="text-[10px] font-black uppercase text-muted-foreground">{label}</Label>
      {onClear && value && (
        <button onClick={onClear} className="text-[10px] text-destructive hover:underline flex items-center gap-1">
          <CircleSlash className="w-3 h-3" /> Limpiar
        </button>
      )}
    </div>
    <div className="grid grid-cols-6 gap-1.5 p-2 bg-muted/10 rounded-xl border">
      {PREDEFINED_COLORS.map(color => (
        <button
          key={color}
          onClick={() => onChange(color)}
          className={cn(
            "w-5 h-5 rounded-full border transition-all hover:scale-110",
            value === color ? "ring-2 ring-primary scale-110 shadow-md" : "border-transparent"
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
  
  // Base State
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [rating, setRating] = useState(50);

  // Kit Studio State
  const [kitStyle, setKitStyle] = useState<UniformStyle>('solid');
  const [kitC1, setKitC1] = useState(PREDEFINED_COLORS[24]);
  const [kitC2, setKitC2] = useState(PREDEFINED_COLORS[35]);
  const [kitC3, setKitC3] = useState<string | undefined>(undefined);
  const [kitC4, setKitC4] = useState<string | undefined>(undefined);
  const [brand, setBrand] = useState('Apex');
  const [sponsor, setSponsor] = useState('');

  // Crest Studio State
  const [crestShape, setCrestShape] = useState<EmblemShape>('modern');
  const [crestC1, setCrestC1] = useState(PREDEFINED_COLORS[24]);
  const [crestC2, setCrestC2] = useState(PREDEFINED_COLORS[35]);
  const [crestC3, setCrestC3] = useState<string | undefined>(undefined);
  const [crestC4, setCrestC4] = useState<string | undefined>(undefined);

  // Venue State
  const [venueName, setVenueName] = useState('');
  const [venueCapacity, setVenueCapacity] = useState(1000);
  const [venueSurface, setVenueSurface] = useState<VenueSurface>('parquet');
  const [venueSize, setVenueSize] = useState<VenueSize>('medium');

  useEffect(() => {
    if (editingTeam) {
      setName(editingTeam.name);
      setAbbreviation(editingTeam.abbreviation);
      setRating(editingTeam.rating);
      setKitStyle(editingTeam.uniformStyle);
      setKitC1(editingTeam.kitPrimary);
      setKitC2(editingTeam.kitSecondary);
      setKitC3(editingTeam.kitTertiary);
      setKitC4(editingTeam.kitAccent);
      setBrand(editingTeam.brand || 'Apex');
      setSponsor(editingTeam.sponsor || '');
      setCrestShape(editingTeam.emblemShape);
      setCrestC1(editingTeam.crestPrimary);
      setCrestC2(editingTeam.crestSecondary);
      setCrestC3(editingTeam.crestTertiary);
      setCrestC4(editingTeam.crestAccent);
      setVenueName(editingTeam.venueName);
      setVenueCapacity(editingTeam.venueCapacity);
      setVenueSurface(editingTeam.venueSurface);
      setVenueSize(editingTeam.venueSize);
    } else {
      resetForm();
    }
  }, [editingTeam]);

  const resetForm = () => {
    setName('');
    setAbbreviation('');
    setRating(50);
    setKitStyle('solid');
    setKitC1(PREDEFINED_COLORS[24]);
    setKitC2(PREDEFINED_COLORS[35]);
    setKitC3(undefined);
    setKitC4(undefined);
    setBrand('Apex');
    setSponsor('');
    setCrestShape('modern');
    setCrestC1(PREDEFINED_COLORS[24]);
    setCrestC2(PREDEFINED_COLORS[35]);
    setCrestC3(undefined);
    setCrestC4(undefined);
    setVenueName('');
    setVenueCapacity(1000);
    setVenueSurface('parquet');
    setVenueSize('medium');
  };

  const handleSaveTeam = () => {
    if (!name || abbreviation.length !== 3) {
      toast({ title: "Error", description: "Nombre y Siglas (3) requeridos.", variant: "destructive" });
      return;
    }
    
    const teamData: Team = {
      id: editingTeam ? editingTeam.id : Math.random().toString(36).substr(2, 9),
      name,
      abbreviation: abbreviation.toUpperCase(),
      rating,
      uniformStyle: kitStyle,
      kitPrimary: kitC1,
      kitSecondary: kitC2,
      kitTertiary: kitC3,
      kitAccent: kitC4,
      brand,
      sponsor,
      emblemShape: crestShape,
      crestPrimary: crestC1,
      crestSecondary: crestC2,
      crestTertiary: crestC3,
      crestAccent: crestC4,
      venueName: venueName || 'Arena Principal',
      venueCapacity,
      venueSurface,
      venueSize,
      players: editingTeam ? editingTeam.players : []
    };

    if (editingTeam) {
      updateTeam(teamData);
      toast({ title: "Club Actualizado", description: "Cambios guardados." });
    } else {
      addTeam(teamData);
      toast({ title: "Club Fundado", description: "La entidad ha sido registrada." });
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
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4 md:px-0">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground uppercase flex items-center gap-3">
             Identity Builder <Sparkles className="text-accent w-8 h-8" />
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg">Diseña marcas independientes para cada club.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingTeam(null);
        }}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto shadow-2xl shadow-primary/40 bg-primary hover:bg-primary/90 text-primary-foreground h-14 px-10 font-black rounded-2xl">
              <Plus className="w-6 h-6 mr-2" /> FUNDAR CLUB
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-[1000px] bg-card border-none shadow-2xl p-0 overflow-hidden max-h-[95vh] rounded-3xl">
            <div className="p-6 md:p-10 bg-muted/20 border-b flex items-center gap-4">
              <div className="p-3 bg-primary rounded-xl">
                <Shield className="text-primary-foreground w-8 h-8" />
              </div>
              <DialogTitle className="text-xl md:text-3xl font-black uppercase tracking-tight">
                {editingTeam ? 'Rediseñar Club' : 'Legacy Branding Studio'}
              </DialogTitle>
            </div>
            
            <Tabs defaultValue="base" className="w-full flex flex-col h-[calc(95vh-150px)]">
              <TabsList className="w-full grid grid-cols-4 rounded-none bg-muted/10 h-14 md:h-16 border-b shrink-0">
                <TabsTrigger value="base" className="rounded-none font-black text-[10px] md:text-xs uppercase">Base</TabsTrigger>
                <TabsTrigger value="crest" className="rounded-none font-black text-[10px] md:text-xs uppercase">Escudo</TabsTrigger>
                <TabsTrigger value="kit" className="rounded-none font-black text-[10px] md:text-xs uppercase">Equipación</TabsTrigger>
                <TabsTrigger value="venue" className="rounded-none font-black text-[10px] md:text-xs uppercase">Sede</TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <TabsContent value="base" className="p-6 md:p-12 space-y-10 mt-0">
                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="grid gap-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre Entidad</Label>
                      <Input className="h-16 text-2xl font-black bg-muted/10 rounded-2xl border-none" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Siglas</Label>
                      <Input className="h-16 text-3xl font-black text-center uppercase bg-muted/10 rounded-2xl border-none" maxLength={3} value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-6 bg-muted/5 p-8 rounded-3xl border">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rating Global</Label>
                      <span className="px-4 py-1 bg-primary text-primary-foreground text-xl font-black rounded-xl shadow-lg">{rating}</span>
                    </div>
                    <Slider value={[rating]} onValueChange={(vals) => setRating(vals[0])} max={100} min={1} className="py-4" />
                  </div>
                </TabsContent>

                <TabsContent value="crest" className="p-6 md:p-12 space-y-10 mt-0">
                  <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="bg-gradient-to-br from-muted/20 to-muted/40 p-12 rounded-[3rem] border-4 border-dashed border-muted/30 flex justify-center">
                      <CrestIcon 
                        shape={crestShape} 
                        c1={crestC1} 
                        c2={crestC2} 
                        c3={crestC3 || crestC1} 
                        c4={crestC4} 
                        size="w-48 h-48" 
                      />
                    </div>
                    <div className="space-y-6">
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Forma del Emblema</Label>
                        <Select value={crestShape} onValueChange={(v: any) => setCrestShape(v)}>
                          <SelectTrigger className="h-14 font-black bg-muted/10 rounded-xl border-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="shield">Escudo Clásico</SelectItem>
                            <SelectItem value="circle">Circular Moderno</SelectItem>
                            <SelectItem value="hexagon">Hexágono Técnico</SelectItem>
                            <SelectItem value="modern">Líneas Vanguardia</SelectItem>
                            <SelectItem value="star">Estrella Elite</SelectItem>
                            <SelectItem value="lion">León Heráldico</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <ColorPicker label="Escudo P" value={crestC1} onChange={setCrestC1} />
                        <ColorPicker label="Escudo S" value={crestC2} onChange={setCrestC2} />
                        <ColorPicker label="Detalle T" value={crestC3} onChange={setCrestC3} onClear={() => setCrestC3(undefined)} />
                        <ColorPicker label="Acento A" value={crestC4} onChange={setCrestC4} onClear={() => setCrestC4(undefined)} />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="kit" className="p-6 md:p-12 space-y-10 mt-0">
                  <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="bg-gradient-to-br from-muted/20 to-muted/40 p-10 rounded-[3rem] border-4 border-dashed border-muted/30 flex justify-center">
                      <div className="w-64 h-80">
                        <JerseySVG 
                          primary={kitC1} 
                          secondary={kitC2} 
                          tertiary={kitC3} 
                          accent={kitC4} 
                          style={kitStyle} 
                          brand={brand} 
                          sponsor={sponsor} 
                        />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Diseño de Kit</Label>
                        <Select value={kitStyle} onValueChange={(v: any) => setKitStyle(v)}>
                          <SelectTrigger className="h-14 font-black bg-muted/10 rounded-xl border-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solid">Sólido</SelectItem>
                            <SelectItem value="stripes">Rayas</SelectItem>
                            <SelectItem value="hoops">Aros</SelectItem>
                            <SelectItem value="checks">Cuadros</SelectItem>
                            <SelectItem value="halves">Mitades</SelectItem>
                            <SelectItem value="zigzag">ZigZag</SelectItem>
                            <SelectItem value="pixel">Pixel</SelectItem>
                            <SelectItem value="camouflage">Camuflaje</SelectItem>
                            <SelectItem value="stars">Estrellas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <ColorPicker label="Kit P" value={kitC1} onChange={setKitC1} />
                        <ColorPicker label="Kit S" value={kitC2} onChange={setKitC2} />
                        <ColorPicker label="Trim T" value={kitC3} onChange={setKitC3} onClear={() => setKitC3(undefined)} />
                        <ColorPicker label="Detalles A" value={kitC4} onChange={setKitC4} onClear={() => setKitC4(undefined)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Marca</Label>
                          <Input value={brand} className="bg-muted/10 h-10 font-bold" onChange={(e) => setBrand(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Sponsor</Label>
                          <Input value={sponsor} className="bg-muted/10 h-10 font-bold" onChange={(e) => setSponsor(e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="venue" className="p-6 md:p-12 space-y-10 mt-0">
                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Nombre de Sede</Label>
                      <Input className="h-16 text-xl font-black bg-muted/10 rounded-2xl border-none" value={venueName} onChange={(e) => setVenueName(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Aforo</Label>
                      <Input className="h-16 text-xl font-black bg-muted/10 rounded-2xl border-none" type="number" value={venueCapacity} onChange={(e) => setVenueCapacity(Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Superficie</Label>
                      <Select value={venueSurface} onValueChange={(v: any) => setVenueSurface(v)}>
                        <SelectTrigger className="h-16 font-black bg-muted/10 rounded-2xl border-none"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grass">Césped</SelectItem>
                          <SelectItem value="parquet">Parqué</SelectItem>
                          <SelectItem value="hardcourt">Cancha Dura</SelectItem>
                          <SelectItem value="clay">Arcilla</SelectItem>
                          <SelectItem value="ice">Hielo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Magnitud</Label>
                      <Select value={venueSize} onValueChange={(v: any) => setVenueSize(v)}>
                        <SelectTrigger className="h-16 font-black bg-muted/10 rounded-2xl border-none"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Pequeño</SelectItem>
                          <SelectItem value="medium">Estándar</SelectItem>
                          <SelectItem value="large">Gran Estadio</SelectItem>
                          <SelectItem value="monumental">Monumental</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
            
            <div className="p-8 bg-muted/20 border-t flex flex-col md:flex-row justify-end gap-4 shrink-0">
              <Button variant="ghost" className="font-black h-14 px-8 rounded-2xl order-2 md:order-1" onClick={() => setIsDialogOpen(false)}>DESCARTAR</Button>
              <Button onClick={handleSaveTeam} className="w-full md:w-auto px-16 h-16 bg-primary text-primary-foreground font-black text-lg shadow-2xl rounded-2xl hover:scale-105 transition-transform order-1 md:order-2">
                {editingTeam ? 'GUARDAR CAMBIOS' : 'FUNDAR CLUB'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative px-4 md:px-0">
        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input 
          className="pl-14 bg-card border-none h-14 md:h-16 text-lg md:text-xl shadow-2xl rounded-2xl" 
          placeholder="Buscar club por nombre o siglas..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 px-4 md:px-0">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="border-none bg-card transition-all group overflow-hidden shadow-2xl rounded-[2.5rem] hover:translate-y-[-8px]">
            <div className="h-2 w-full" style={{ backgroundColor: team.kitPrimary }} />
            <div className="p-8 flex gap-6">
              <div className="w-24 h-24 shrink-0 flex items-center justify-center bg-muted/20 rounded-[2rem] relative border border-muted/30">
                <CrestIcon 
                  shape={team.emblemShape} 
                  c1={team.crestPrimary} 
                  c2={team.crestSecondary} 
                  c3={team.crestTertiary || team.crestPrimary} 
                  c4={team.crestAccent}
                  size="w-16 h-16" 
                />
                <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-[10px] font-black px-3 py-1 rounded-full border-4 border-card">
                  {team.abbreviation}
                </div>
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className="text-2xl font-black truncate tracking-tighter uppercase leading-none mb-1">{team.name}</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                  {team.brand || 'Elite'} • {team.sponsor || 'Official'}
                </p>
                <div className="flex items-center gap-2 mt-4 bg-primary/10 w-fit px-3 py-1 rounded-xl border border-primary/20">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-black text-primary">{team.rating} OVR</span>
                </div>
              </div>
            </div>
            
            <div className="px-8 pb-8 pt-2 space-y-6">
              <div className="flex gap-4">
                <div className="flex-1 bg-muted/30 p-4 rounded-3xl border border-muted/40">
                  <span className="text-[8px] uppercase font-black text-muted-foreground block mb-1 tracking-widest">Sede</span>
                  <span className="text-xs font-black flex items-center gap-2 truncate">
                    <Landmark className="w-4 h-4 text-accent" /> {team.venueName}
                  </span>
                </div>
                <div className="w-24 bg-muted/30 p-4 rounded-3xl border border-muted/40 flex flex-col items-center justify-center">
                  <div className="w-12 h-14">
                    <JerseySVG 
                      primary={team.kitPrimary} 
                      secondary={team.kitSecondary} 
                      tertiary={team.kitTertiary} 
                      accent={team.kitAccent} 
                      style={team.uniformStyle} 
                      brand={team.brand} 
                      sponsor={team.sponsor} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button className="flex-1 bg-secondary text-secondary-foreground h-14 rounded-2xl font-black text-xs uppercase tracking-widest" onClick={() => {
                  setEditingTeam(team);
                  setIsDialogOpen(true);
                }}>
                  <Pencil className="w-4 h-4 mr-2" /> REDISEÑAR
                </Button>
                <Button variant="destructive" size="icon" className="w-14 h-14 rounded-2xl" onClick={() => deleteTeam(team.id)}>
                  <Trash2 className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
