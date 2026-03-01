'use client';

import { useState, useEffect } from 'react';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Search, Shield, UserPlus, Trash2, Palette, Landmark, MapPin, Pencil, Maximize, CheckCircle2, Star, CircleSlash, Sparkles, Shirt } from 'lucide-react';
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

      {/* Texture Lines */}
      <path d="M60 40 Q100 50 140 40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <path d="M40 100 L160 100" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="0.5" />
    </svg>
  );
};

// Advanced Crest Visualization with Multi-Layer Colors and New Shapes
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
      case 'oval':
        return (
          <g>
            <ellipse cx="12" cy="12" rx="10" ry="8" fill={c1} stroke={c2} strokeWidth="1.5" />
            <ellipse cx="12" cy="12" rx="7" ry="5" fill="none" stroke={c3} strokeWidth="1" />
          </g>
        );
      case 'triangle':
        return (
          <g>
            <path d="M12 2l10 18H2z" fill={c1} stroke={c2} strokeWidth="1" />
            <circle cx="12" cy="14" r="3" fill={c3} />
          </g>
        );
      case 'banner':
        return (
          <g>
            <path d="M4 2v16l8 4 8-4V2z" fill={c1} stroke={c2} strokeWidth="1.5" />
            <path d="M6 4v12l6 3 6-3V4z" fill="none" stroke={c3} strokeWidth="1" />
          </g>
        );
      case 'wings':
        return (
          <g>
            <path d="M12 12c-4 0-8-2-10-6 2 4 6 6 10 6s8-2 10-6c-2 4-6 6-10 6z" fill={c1} />
            <path d="M2 6c4 0 8 2 10 6s6-6 10-6" fill="none" stroke={c2} strokeWidth="1" />
            <circle cx="12" cy="12" r="4" fill={c3} />
          </g>
        );
      case 'eagle':
        return (
          <g>
            <path d="M12 2c-1 2-4 3-6 3 0 5 2 9 6 11 4-2 6-6 6-11-2 0-5-1-6-3z" fill={c1} stroke={c2} strokeWidth="1" />
            <path d="M10 7l2 2 2-2" stroke={c3} fill="none" strokeWidth="1.5" />
          </g>
        );
      case 'lion':
        return (
          <g>
            <path d="M12 2c5 0 9 4 9 9s-4 9-9 9-9-4-9-9 4-9 9-9z" fill={c1} />
            <path d="M8 8c1-1 3-1 4 0s3 1 4 0" stroke={c2} fill="none" strokeWidth="1.5" />
            <circle cx="12" cy="13" r="3" fill={c3} />
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
      toast({ title: "Club Actualizado", description: "Cambios guardados con éxito." });
    } else {
      addTeam(teamData);
      toast({ title: "Club Fundado", description: "La nueva entidad deportiva ha sido registrada." });
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
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground uppercase flex items-center gap-3">
             Identity Builder <Sparkles className="text-accent w-8 h-8" />
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg">Diseño de marcas y sedes para organizaciones de élite.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingTeam(null);
        }}>
          <DialogTrigger asChild>
            <Button className="shadow-2xl shadow-primary/40 bg-primary hover:bg-primary/90 text-primary-foreground h-14 px-10 font-black rounded-2xl transition-all hover:scale-105 active:scale-95">
              <Plus className="w-6 h-6 mr-2" /> FUNDAR CLUB
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[1000px] bg-card border-none shadow-2xl p-0 overflow-hidden max-h-[95vh] overflow-y-auto rounded-3xl">
            <div className="p-10 bg-muted/20 border-b flex flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-primary rounded-2xl shadow-lg">
                  <Shirt className="text-primary-foreground w-10 h-10" />
                </div>
                <div>
                  <DialogTitle className="text-4xl font-black tracking-tight flex items-center gap-3">
                    {editingTeam ? 'REDISENAR CLUB' : 'STUDIO DE BRANDING'}
                  </DialogTitle>
                  <CardDescription className="text-lg">Configuración de identidad visual, marca técnica y sede.</CardDescription>
                </div>
              </div>
            </div>
            <Tabs defaultValue="branding" className="w-full">
              <TabsList className="w-full grid grid-cols-3 rounded-none bg-muted/10 h-16 border-b">
                <TabsTrigger value="general" className="rounded-none font-black text-sm uppercase tracking-widest">Base Estratégica</TabsTrigger>
                <TabsTrigger value="branding" className="rounded-none font-black text-sm uppercase tracking-widest">Identidad Visual</TabsTrigger>
                <TabsTrigger value="venue" className="rounded-none font-black text-sm uppercase tracking-widest">Sede Central</TabsTrigger>
              </TabsList>
              
              <div className="p-8 md:p-12">
                <TabsContent value="general" className="space-y-10 mt-0">
                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="grid gap-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre de la Entidad</Label>
                      <Input className="h-16 text-2xl font-black bg-muted/10 rounded-2xl border-2 focus:border-primary transition-all" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Real Titans SC" />
                    </div>
                    <div className="grid gap-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Siglas (3 Caracteres)</Label>
                      <Input className="h-16 text-3xl font-black text-center uppercase bg-muted/10 rounded-2xl border-2 focus:border-primary" maxLength={3} value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} placeholder="TIT" />
                    </div>
                  </div>
                  <div className="space-y-6 bg-muted/5 p-8 rounded-3xl border">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Potencial de Rating</Label>
                      <span className="px-4 py-1.5 bg-primary text-primary-foreground text-xl font-black rounded-xl shadow-lg">{rating}</span>
                    </div>
                    <Slider value={[rating]} onValueChange={(vals) => setRating(vals[0])} max={100} min={1} className="py-4" />
                  </div>
                </TabsContent>

                <TabsContent value="branding" className="space-y-12 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
                    {/* Real-time Preview Area */}
                    <div className="space-y-8 bg-gradient-to-br from-muted/10 to-muted/20 p-10 rounded-[3rem] flex flex-col items-center border-4 border-dashed border-muted/30 relative shadow-inner">
                      <div className="w-full max-w-[300px] h-[350px] transition-all hover:scale-105 duration-700">
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
                      <div className="flex items-center gap-8 mt-6 p-6 bg-card rounded-[2rem] shadow-2xl border w-full justify-center transform hover:translate-y-[-5px] transition-transform">
                        <CrestIcon shape={emblemShape} c1={color1} c2={color2} c3={color3 || color1} c4={color4} size="w-20 h-20" />
                        <div className="h-16 w-px bg-border" />
                        <div className="grid grid-cols-2 gap-3">
                          <div className="w-8 h-8 rounded-full border-2 shadow-sm" style={{ backgroundColor: color1 }} />
                          <div className="w-8 h-8 rounded-full border-2 shadow-sm" style={{ backgroundColor: color2 }} />
                          {color3 && <div className="w-8 h-8 rounded-full border-2 shadow-sm" style={{ backgroundColor: color3 }} />}
                          {color4 && <div className="w-8 h-8 rounded-full border-2 shadow-sm" style={{ backgroundColor: color4 }} />}
                        </div>
                      </div>
                    </div>

                    {/* Controls Area */}
                    <div className="space-y-8 max-h-[600px] overflow-y-auto pr-6 custom-scrollbar pb-10">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <ColorPicker label="Base (P)" value={color1} onChange={setColor1} />
                        <ColorPicker label="Diseño (S)" value={color2} onChange={setColor2} />
                        <ColorPicker label="Detalles (T)" value={color3} onChange={setColor3} onClear={() => setColor3(undefined)} />
                        <ColorPicker label="Logos (A)" value={color4} onChange={setColor4} onClear={() => setColor4(undefined)} />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Marca Técnica</Label>
                          <Input value={brand} className="bg-muted/10 h-12 font-bold rounded-xl" onChange={(e) => setBrand(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Patrocinador</Label>
                          <Input value={sponsor} className="bg-muted/10 h-12 font-bold rounded-xl" onChange={(e) => setSponsor(e.target.value)} />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="grid gap-3">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Patrón de Equipación</Label>
                          <Select value={uniformStyle} onValueChange={(v: any) => setUniformStyle(v)}>
                            <SelectTrigger className="h-14 font-black text-base bg-muted/10 rounded-xl border-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              <SelectItem value="solid" className="font-bold">Sólido Clásico</SelectItem>
                              <SelectItem value="stripes" className="font-bold">Rayas Verticales</SelectItem>
                              <SelectItem value="hoops" className="font-bold">Aros Horizontales</SelectItem>
                              <SelectItem value="checks" className="font-bold">Cuadros (Damero)</SelectItem>
                              <SelectItem value="pinstripes" className="font-bold">Rayas Finas</SelectItem>
                              <SelectItem value="halves" className="font-bold">Mitades</SelectItem>
                              <SelectItem value="quarters" className="font-bold">Cuartos</SelectItem>
                              <SelectItem value="waves" className="font-bold">Ondas Dinámicas</SelectItem>
                              <SelectItem value="zigzag" className="font-bold">Zig-Zag Moderno</SelectItem>
                              <SelectItem value="honeycomb" className="font-bold">Panal de Abeja</SelectItem>
                              <SelectItem value="pixel" className="font-bold">Píxel Glitch</SelectItem>
                              <SelectItem value="camouflage" className="font-bold">Camuflaje Táctico</SelectItem>
                              <SelectItem value="stars" className="font-bold">Constelación</SelectItem>
                              <SelectItem value="shoulders" className="font-bold">Hombros de Contraste</SelectItem>
                              <SelectItem value="side-panels" className="font-bold">Paneles Laterales</SelectItem>
                              <SelectItem value="sash" className="font-bold">Banda Diagonal</SelectItem>
                              <SelectItem value="gradient" className="font-bold">Degradado</SelectItem>
                              <SelectItem value="minimal" className="font-bold">Sutil / Minimal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-3">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Forma del Emblema</Label>
                          <Select value={emblemShape} onValueChange={(v: any) => setEmblemShape(v)}>
                            <SelectTrigger className="h-14 font-black text-base bg-muted/10 rounded-xl border-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              <SelectItem value="shield" className="font-bold">Escudo Tradicional</SelectItem>
                              <SelectItem value="circle" className="font-bold">Circular Moderno</SelectItem>
                              <SelectItem value="square" className="font-bold">Cuadrado Robusto</SelectItem>
                              <SelectItem value="modern" className="font-bold">Líneas Vanguardistas</SelectItem>
                              <SelectItem value="hexagon" className="font-bold">Hexágono Técnico</SelectItem>
                              <SelectItem value="oval" className="font-bold">Óvalo Clásico</SelectItem>
                              <SelectItem value="triangle" className="font-bold">Triángulo Dinámico</SelectItem>
                              <SelectItem value="banner" className="font-bold">Estandarte Real</SelectItem>
                              <SelectItem value="wings" className="font-bold">Alas del Olimpo</SelectItem>
                              <SelectItem value="eagle" className="font-bold">Águila Imperial</SelectItem>
                              <SelectItem value="lion" className="font-bold">León Noble</SelectItem>
                              <SelectItem value="diamond" className="font-bold">Diamante</SelectItem>
                              <SelectItem value="crown" className="font-bold">Corona de Campeón</SelectItem>
                              <SelectItem value="star" className="font-bold">Estrella de Élite</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="venue" className="space-y-10 mt-0">
                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="grid gap-3">
                      <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Nombre de la Sede</Label>
                      <Input className="h-16 text-xl font-black bg-muted/10 rounded-2xl border-2" value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="Ej: Coliseo de los Sueños" />
                    </div>
                    <div className="grid gap-3">
                      <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Capacidad de Aforo</Label>
                      <Input className="h-16 text-xl font-black bg-muted/10 rounded-2xl border-2" type="number" value={venueCapacity} onChange={(e) => setVenueCapacity(Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="grid gap-3">
                      <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Superficie de Juego</Label>
                      <Select value={venueSurface} onValueChange={(v: any) => setVenueSurface(v)}>
                        <SelectTrigger className="h-16 font-black text-lg bg-muted/10 rounded-2xl border-2"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grass" className="font-bold">Césped Natural</SelectItem>
                          <SelectItem value="artificial" className="font-bold">Hierba Artificial</SelectItem>
                          <SelectItem value="parquet" className="font-bold">Parqué Madera</SelectItem>
                          <SelectItem value="hardcourt" className="font-bold">Cancha Dura</SelectItem>
                          <SelectItem value="clay" className="font-bold">Arcilla / Tierra</SelectItem>
                          <SelectItem value="ice" className="font-bold">Pista de Hielo</SelectItem>
                          <SelectItem value="sand" className="font-bold">Arena de Playa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-3">
                      <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Magnitud del Recinto</Label>
                      <Select value={venueSize} onValueChange={(v: any) => setVenueSize(v)}>
                        <SelectTrigger className="h-16 font-black text-lg bg-muted/10 rounded-2xl border-2"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small" className="font-bold">Local / Comunitario</SelectItem>
                          <SelectItem value="medium" className="font-bold">Estándar Regional</SelectItem>
                          <SelectItem value="large" className="font-bold">Gran Estadio Nacional</SelectItem>
                          <SelectItem value="monumental" className="font-bold">Recinto Monumental</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
            <div className="p-10 bg-muted/20 border-t flex flex-col md:flex-row justify-end gap-6">
              <Button variant="ghost" className="font-black text-muted-foreground h-14 px-8 rounded-2xl" onClick={() => setIsDialogOpen(false)}>DESCARTAR</Button>
              <Button onClick={handleSaveTeam} className="px-16 h-16 bg-primary text-primary-foreground font-black text-lg shadow-2xl rounded-2xl hover:scale-105 transition-transform active:scale-95">
                {editingTeam ? 'GUARDAR CAMBIOS' : 'FUNDAR CLUB'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative px-4 md:px-0">
        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input 
          className="pl-14 bg-card border-none h-16 text-xl shadow-2xl rounded-[1.5rem] focus:ring-2 focus:ring-primary/20 transition-all" 
          placeholder="Buscar club por nombre o siglas..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-4 md:px-0">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="border-none bg-card transition-all group overflow-hidden shadow-2xl border-t-8 rounded-[2.5rem] hover:translate-y-[-8px] hover:shadow-primary/10" style={{ borderTopColor: team.primaryColor }}>
            <div className="p-10 flex gap-8">
              <div className="w-32 h-32 shrink-0 flex items-center justify-center bg-muted/20 rounded-[2.5rem] relative shadow-inner border border-muted/30">
                <CrestIcon 
                  shape={team.emblemShape} 
                  c1={team.primaryColor} 
                  c2={team.secondaryColor} 
                  c3={team.tertiaryColor || team.primaryColor} 
                  c4={team.accentColor}
                  size="w-20 h-20" 
                />
                <div className="absolute -bottom-3 -right-3 bg-primary text-primary-foreground text-xs font-black px-4 py-1.5 rounded-full border-4 border-card shadow-lg">
                  {team.abbreviation}
                </div>
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className="text-3xl font-black truncate tracking-tighter uppercase leading-none mb-2">{team.name}</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black flex items-center gap-1.5">
                  <span className="text-primary">{team.brand || 'Elite'}</span> Kits • {team.sponsor || 'Official Sponsor'}
                </p>
                <div className="flex items-center gap-2 mt-5 bg-primary/10 w-fit px-4 py-2 rounded-2xl border border-primary/20">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-base font-black text-primary">{team.rating} OVR</span>
                </div>
              </div>
            </div>
            
            <div className="px-10 pb-10 pt-2 space-y-8">
              <div className="flex gap-4">
                <div className="flex-1 bg-muted/30 p-5 rounded-3xl border border-muted/40 shadow-sm">
                  <span className="text-[10px] uppercase font-black text-muted-foreground block mb-2 tracking-widest">Sede Central</span>
                  <span className="text-sm font-black flex items-center gap-2 truncate text-foreground">
                    <Landmark className="w-4 h-4 text-accent" /> {team.venueName}
                  </span>
                </div>
                <div className="w-28 bg-muted/30 p-5 rounded-3xl border border-muted/40 flex flex-col items-center justify-center shadow-sm">
                  <span className="text-[10px] uppercase font-black text-muted-foreground block mb-2">Paleta</span>
                  <div className="flex gap-1.5">
                    <div className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: team.primaryColor }} />
                    <div className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: team.secondaryColor }} />
                    {team.tertiaryColor && <div className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: team.tertiaryColor }} />}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button className="flex-1 bg-secondary text-secondary-foreground h-14 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:bg-secondary/80" onClick={() => {
                  setEditingTeam(team);
                  setIsDialogOpen(true);
                }}>
                  <Pencil className="w-4 h-4 mr-2" /> REDISEÑAR
                </Button>
                <Button variant="destructive" size="icon" className="w-14 h-14 rounded-2xl shadow-lg hover:rotate-6 transition-transform" onClick={() => deleteTeam(team.id)}>
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
