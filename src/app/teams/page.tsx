'use client';

import { useState, useEffect } from 'react';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Shield, Trash2, Pencil, Sparkles, Shirt, Landmark, Star, CircleSlash, Layout, Maximize } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UniformStyle, EmblemShape, EmblemPattern, ElementPlacement, VerticalPlacement, VenueSurface, VenueSize, Team } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PREDEFINED_COLORS } from '@/lib/colors';

// Advanced Crest SVG Component with Internal Patterns
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
        
        {/* Symbol Overlays */}
        {shape === 'lion' && <path d="M12 7c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5z" fill={c4 || c2} />}
        {shape === 'star' && <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" fill={c4 || c2} />}
      </g>
    );
  };

  return (
    <svg viewBox="0 0 24 24" className={size}>
      {renderShapeContent()}
    </svg>
  );
};

// Hyper-Realistic Jersey SVG Component
const JerseySVG = ({ 
  primary, secondary, tertiary, accent, 
  style, brand, sponsor, 
  crestPlacement = 'left', 
  sponsorPlacement = 'middle', 
  brandPlacement = 'right',
  crestShape, crestPattern, crestC1, crestC2, crestC3, crestC4
}: { 
  primary: string, secondary: string, tertiary?: string, accent?: string,
  style: UniformStyle, brand?: string, sponsor?: string,
  crestPlacement: ElementPlacement, sponsorPlacement: VerticalPlacement, brandPlacement: ElementPlacement,
  crestShape: EmblemShape, crestPattern: EmblemPattern, crestC1: string, crestC2: string, crestC3: string, crestC4?: string
}) => {
  const trim = tertiary || primary;
  const logoColor = accent || '#ffffff';

  // Placement Coordinates
  const crestX = crestPlacement === 'left' ? 65 : crestPlacement === 'right' ? 135 : 100;
  const sponsorY = sponsorPlacement === 'top' ? 110 : sponsorPlacement === 'bottom' ? 180 : 145;
  const brandX = brandPlacement === 'left' ? 65 : brandPlacement === 'right' ? 135 : 100;

  return (
    <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-2xl">
      <defs>
        <clipPath id="bodyClip"><path d="M40 40 L60 20 L140 20 L160 40 L180 60 L180 100 L160 100 L160 220 L40 220 L40 100 L20 100 L20 60 Z" /></clipPath>
        <pattern id="stripes" width="40" height="240" patternUnits="userSpaceOnUse"><rect width="20" height="240" fill={secondary} /></pattern>
        <pattern id="hoops" width="200" height="40" patternUnits="userSpaceOnUse"><rect width="200" height="20" fill={secondary} /></pattern>
        <pattern id="pinstripes" width="10" height="240" patternUnits="userSpaceOnUse"><rect width="2" height="240" fill={secondary} /></pattern>
        <pattern id="double-stripes" width="60" height="240" patternUnits="userSpaceOnUse"><rect x="10" width="10" height="240" fill={secondary} /><rect x="30" width="10" height="240" fill={secondary} /></pattern>
        <linearGradient id="fadeGrad" x1="0" y1="0" x2="0" y2="1" ><stop offset="0%" stopColor={primary} /><stop offset="100%" stopColor={secondary} /></linearGradient>
        <radialGradient id="shading" cx="50%" cy="40%" r="60%"><stop offset="0%" stopColor="white" stopOpacity="0.1" /><stop offset="100%" stopColor="black" stopOpacity="0.3" /></radialGradient>
      </defs>
      
      <path d="M40 40 L60 20 L140 20 L160 40 L180 60 L180 100 L160 100 L160 220 L40 220 L40 100 L20 100 L20 60 Z" fill={primary} />
      <g clipPath="url(#bodyClip)">
        {style === 'stripes' && <rect width="200" height="240" fill="url(#stripes)" />}
        {style === 'hoops' && <rect width="200" height="240" fill="url(#hoops)" />}
        {style === 'pinstripes' && <rect width="200" height="240" fill="url(#pinstripes)" />}
        {style === 'double-stripes' && <rect width="200" height="240" fill="url(#double-stripes)" />}
        {style === 'fade-vertical' && <rect width="200" height="240" fill="url(#fadeGrad)" />}
        {style === 'halves' && <rect x="100" width="100" height="240" fill={secondary} />}
        {style === 'sash' && <path d="M40 40 L160 220 L160 180 L80 40 Z" fill={secondary} />}
      </g>
      
      <path d="M60 20 L80 35 L120 35 L140 20 Z" fill={trim} /> 
      <path d="M40 40 L60 20 L140 20 L160 40 L180 60 L180 100 L160 100 L160 220 L40 220 L40 100 L20 100 L20 60 Z" fill="url(#shading)" />

      {/* Crest Placement */}
      <g transform={`translate(${crestX - 12}, 55) scale(1)`}>
        <CrestIcon shape={crestShape} pattern={crestPattern} c1={crestC1} c2={crestC2} c3={crestC3} c4={crestC4} size="w-6 h-6" />
      </g>

      {/* Brand Placement */}
      <text x={brandX} y="65" textAnchor="middle" fill={logoColor} fontSize="6" fontWeight="bold" opacity="0.9">
        {brand?.toUpperCase() || 'APEX'}
      </text>

      {/* Sponsor Placement */}
      <text x="100" y={sponsorY} textAnchor="middle" fill={logoColor} fontSize="14" fontWeight="900" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)', fontFamily: 'Inter, sans-serif' }}>
        {sponsor?.toUpperCase() || 'ELITE BRAND'}
      </text>
    </svg>
  );
};

const ColorPicker = ({ label, value, onChange, onClear }: { label: string, value?: string, onChange: (c: string) => void, onClear?: () => void }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <Label className="text-[10px] font-black uppercase text-muted-foreground">{label}</Label>
      {onClear && value && (
        <button onClick={onClear} className="text-[10px] text-destructive hover:underline flex items-center gap-1">
          <CircleSlash className="w-3 h-3" />
        </button>
      )}
    </div>
    <div className="grid grid-cols-6 gap-1.5 p-1.5 bg-muted/10 rounded-xl border">
      {PREDEFINED_COLORS.map(color => (
        <button
          key={color}
          onClick={() => onChange(color)}
          className={cn(
            "w-5 h-5 rounded-full border transition-all hover:scale-110",
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
  
  // State
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [rating, setRating] = useState(50);
  const [kitStyle, setKitStyle] = useState<UniformStyle>('solid');
  const [kitC1, setKitC1] = useState(PREDEFINED_COLORS[24]);
  const [kitC2, setKitC2] = useState(PREDEFINED_COLORS[35]);
  const [kitC3, setKitC3] = useState<string | undefined>(undefined);
  const [kitC4, setKitC4] = useState<string | undefined>(undefined);
  const [brand, setBrand] = useState('Apex');
  const [sponsor, setSponsor] = useState('');
  const [crestShape, setCrestShape] = useState<EmblemShape>('shield');
  const [crestPattern, setCrestPattern] = useState<EmblemPattern>('none');
  const [crestC1, setCrestC1] = useState(PREDEFINED_COLORS[24]);
  const [crestC2, setCrestC2] = useState(PREDEFINED_COLORS[35]);
  const [crestC3, setCrestC3] = useState(PREDEFINED_COLORS[35]);
  const [crestC4, setCrestC4] = useState<string | undefined>(undefined);
  const [crestBorder, setCrestBorder] = useState<'none'|'thin'|'thick'>('thin');
  const [crestPlacement, setCrestPlacement] = useState<ElementPlacement>('left');
  const [sponsorPlacement, setSponsorPlacement] = useState<VerticalPlacement>('middle');
  const [brandPlacement, setBrandPlacement] = useState<ElementPlacement>('right');
  const [venueName, setVenueName] = useState('');
  const [venueCapacity, setVenueCapacity] = useState(1000);
  const [venueSurface, setVenueSurface] = useState<VenueSurface>('grass');
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
      setCrestPattern(editingTeam.emblemPattern || 'none');
      setCrestC1(editingTeam.crestPrimary);
      setCrestC2(editingTeam.crestSecondary);
      setCrestC3(editingTeam.crestTertiary || editingTeam.crestSecondary);
      setCrestC4(editingTeam.crestAccent);
      setCrestBorder(editingTeam.crestBorderWidth || 'thin');
      setCrestPlacement(editingTeam.crestPlacement || 'left');
      setSponsorPlacement(editingTeam.sponsorPlacement || 'middle');
      setBrandPlacement(editingTeam.brandPlacement || 'right');
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
    setKitStyle('solid'); setKitC1(PREDEFINED_COLORS[24]); setKitC2(PREDEFINED_COLORS[35]);
    setKitC3(undefined); setKitC4(undefined); setBrand('Apex'); setSponsor('');
    setCrestShape('shield'); setCrestPattern('none'); setCrestC1(PREDEFINED_COLORS[24]);
    setCrestC2(PREDEFINED_COLORS[35]); setCrestC3(PREDEFINED_COLORS[35]); setCrestC4(undefined);
    setCrestBorder('thin'); setCrestPlacement('left'); setSponsorPlacement('middle'); setBrandPlacement('right');
    setVenueName(''); setVenueCapacity(1000); setVenueSurface('grass'); setVenueSize('medium');
  };

  const handleSaveTeam = () => {
    if (!name || abbreviation.length !== 3) {
      toast({ title: "Error", description: "Nombre y Siglas (3) requeridos.", variant: "destructive" });
      return;
    }
    
    const teamData: Team = {
      id: editingTeam ? editingTeam.id : Math.random().toString(36).substr(2, 9),
      name, abbreviation: abbreviation.toUpperCase(), rating,
      uniformStyle: kitStyle, kitPrimary: kitC1, kitSecondary: kitC2, kitTertiary: kitC3, kitAccent: kitC4,
      brand, sponsor, crestPlacement, sponsorPlacement, brandPlacement,
      emblemShape: crestShape, emblemPattern: crestPattern, crestPrimary: crestC1, crestSecondary: crestC2,
      crestTertiary: crestC3, crestAccent: crestC4, crestBorderWidth: crestBorder,
      venueName: venueName || 'Arena Principal', venueCapacity, venueSurface, venueSize,
      players: editingTeam ? editingTeam.players : []
    };

    if (editingTeam) {
      updateTeam(teamData);
      toast({ title: "Actualizado", description: "Los cambios se han guardado." });
    } else {
      addTeam(teamData);
      toast({ title: "Club Creado", description: "Nueva entidad registrada." });
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4 md:px-0">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase flex items-center gap-3">
            Identity Hub <Sparkles className="text-accent" />
          </h1>
          <p className="text-muted-foreground">Personalización total de heráldica y equipamiento.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button className="h-14 px-10 font-black rounded-2xl shadow-xl shadow-primary/20">FUNDAR CLUB</Button></DialogTrigger>
          <DialogContent className="max-w-[1100px] p-0 overflow-hidden rounded-3xl border-none">
            <div className="p-6 bg-muted/20 border-b flex items-center justify-between">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">Legacy Branding Studio</DialogTitle>
            </div>
            <Tabs defaultValue="base" className="w-full flex flex-col h-[85vh]">
              <TabsList className="grid grid-cols-4 rounded-none h-14 border-b bg-card">
                <TabsTrigger value="base" className="font-black text-xs uppercase">General</TabsTrigger>
                <TabsTrigger value="crest" className="font-black text-xs uppercase">Escudo</TabsTrigger>
                <TabsTrigger value="kit" className="font-black text-xs uppercase">Kit</TabsTrigger>
                <TabsTrigger value="venue" className="font-black text-xs uppercase">Sede</TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
                <TabsContent value="base" className="space-y-8 mt-0">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-2"><Label>Nombre</Label><Input className="h-12 font-bold" value={name} onChange={e => setName(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Siglas (3)</Label><Input className="h-12 font-black text-center" maxLength={3} value={abbreviation} onChange={e => setAbbreviation(e.target.value)} /></div>
                  </div>
                  <div className="p-6 bg-muted/10 rounded-2xl border space-y-4">
                    <div className="flex justify-between items-center"><Label>Rating Global</Label><span className="font-black text-primary">{rating}</span></div>
                    <Slider value={[rating]} onValueChange={v => setRating(v[0])} max={100} min={1} />
                  </div>
                </TabsContent>

                <TabsContent value="crest" className="space-y-8 mt-0">
                  <div className="grid lg:grid-cols-2 gap-10 items-start">
                    <div className="aspect-square bg-muted/20 rounded-3xl flex items-center justify-center p-12 border-4 border-dashed">
                      <CrestIcon shape={crestShape} pattern={crestPattern} c1={crestC1} c2={crestC2} c3={crestC3} c4={crestC4} border={crestBorder} size="w-48 h-48" />
                    </div>
                    <div className="grid gap-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Forma</Label>
                          <Select value={crestShape} onValueChange={(v: any) => setCrestShape(v)}>
                            <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {['shield','circle','hexagon','diamond','modern','square','lion','star'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Patrón</Label>
                          <Select value={crestPattern} onValueChange={(v: any) => setCrestPattern(v)}>
                            <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {['none','vertical-split','horizontal-split','diagonal-split','cross','saltire','quarters'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <ColorPicker label="Base" value={crestC1} onChange={setCrestC1} />
                        <ColorPicker label="Patrón" value={crestC2} onChange={setCrestC2} />
                        <ColorPicker label="Borde" value={crestC3} onChange={setCrestC3} />
                        <ColorPicker label="Símbolo" value={crestC4} onChange={setCrestC4} onClear={() => setCrestC4(undefined)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Ancho de Borde</Label>
                        <Select value={crestBorder} onValueChange={(v: any) => setCrestBorder(v)}>
                          <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="none">Sin Borde</SelectItem><SelectItem value="thin">Fino</SelectItem><SelectItem value="thick">Grueso</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="kit" className="space-y-8 mt-0">
                  <div className="grid lg:grid-cols-2 gap-10 items-start">
                    <div className="aspect-square bg-muted/20 rounded-3xl flex items-center justify-center p-8 border-4 border-dashed">
                      <div className="w-64 h-80">
                        <JerseySVG 
                          primary={kitC1} secondary={kitC2} tertiary={kitC3} accent={kitC4}
                          style={kitStyle} brand={brand} sponsor={sponsor}
                          crestPlacement={crestPlacement} sponsorPlacement={sponsorPlacement} brandPlacement={brandPlacement}
                          crestShape={crestShape} crestPattern={crestPattern} crestC1={crestC1} crestC2={crestC2} crestC3={crestC3} crestC4={crestC4}
                        />
                      </div>
                    </div>
                    <div className="grid gap-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Estilo</Label>
                          <Select value={kitStyle} onValueChange={(v: any) => setKitStyle(v)}>
                            <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {['solid','stripes','hoops','double-stripes','pinstripes','halves','sash','fade-vertical'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Marca</Label>
                          <Input className="h-12" value={brand} onChange={e => setBrand(e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <ColorPicker label="P" value={kitC1} onChange={setKitC1} />
                        <ColorPicker label="S" value={kitC2} onChange={setKitC2} />
                        <ColorPicker label="T" value={kitC3} onChange={setKitC3} onClear={() => setKitC3(undefined)} />
                        <ColorPicker label="A" value={kitC4} onChange={setKitC4} onClear={() => setKitC4(undefined)} />
                      </div>
                      <div className="grid grid-cols-3 gap-3 bg-muted/5 p-4 rounded-xl border">
                        <div className="space-y-2">
                          <Label className="text-[10px]">Escudo</Label>
                          <Select value={crestPlacement} onValueChange={(v: any) => setCrestPlacement(v)}>
                            <SelectTrigger className="h-10 text-[10px]"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="left">Izquierda</SelectItem><SelectItem value="center">Centro</SelectItem><SelectItem value="right">Derecha</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px]">Sponsor</Label>
                          <Select value={sponsorPlacement} onValueChange={(v: any) => setSponsorPlacement(v)}>
                            <SelectTrigger className="h-10 text-[10px]"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="top">Alto</SelectItem><SelectItem value="middle">Centro</SelectItem><SelectItem value="bottom">Bajo</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px]">Marca</Label>
                          <Select value={brandPlacement} onValueChange={(v: any) => setBrandPlacement(v)}>
                            <SelectTrigger className="h-10 text-[10px]"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="left">Izquierda</SelectItem><SelectItem value="center">Centro</SelectItem><SelectItem value="right">Derecha</SelectItem></SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2"><Label>Sponsor Principal</Label><Input className="h-12" value={sponsor} onChange={e => setSponsor(e.target.value)} /></div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="venue" className="space-y-6 mt-0">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label>Nombre de la Sede</Label><Input className="h-12" value={venueName} onChange={e => setVenueName(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Aforo</Label><Input className="h-12" type="number" value={venueCapacity} onChange={e => setVenueCapacity(Number(e.target.value))} /></div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Superficie</Label>
                      <Select value={venueSurface} onValueChange={(v: any) => setVenueSurface(v)}>
                        <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                        <SelectContent>{['grass','artificial','clay','hardcourt','parquet','ice','sand'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Magnitud</Label>
                      <Select value={venueSize} onValueChange={(v: any) => setVenueSize(v)}>
                        <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="small">Pequeño</SelectItem><SelectItem value="medium">Medio</SelectItem><SelectItem value="large">Grande</SelectItem><SelectItem value="monumental">Monumental</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </div>
              <div className="p-8 bg-muted/20 border-t flex justify-end gap-4">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>DESCARTAR</Button>
                <Button onClick={handleSaveTeam} className="px-12 h-14 font-black">GUARDAR CLUB</Button>
              </div>
            </Tabs>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative px-4 md:px-0">
        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-14 h-16 rounded-2xl border-none shadow-xl" placeholder="Buscar por nombre o siglas..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-0">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden hover:translate-y-[-5px] transition-all">
            <div className="h-2 w-full" style={{ backgroundColor: team.kitPrimary }} />
            <div className="p-8">
              <div className="flex gap-6 items-center mb-6">
                <div className="w-20 h-20 bg-muted/20 rounded-2xl flex items-center justify-center border relative">
                  <CrestIcon 
                    shape={team.emblemShape} pattern={team.emblemPattern} 
                    c1={team.crestPrimary} c2={team.crestSecondary} c3={team.crestTertiary || team.crestSecondary} c4={team.crestAccent} 
                    border={team.crestBorderWidth} size="w-12 h-12" 
                  />
                  <div className="absolute -bottom-2 -right-2 bg-primary text-white text-[10px] font-black px-2 py-1 rounded-lg">
                    {team.abbreviation}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black uppercase truncate tracking-tight">{team.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-black text-primary">{team.rating} OVR</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/30 p-4 rounded-2xl border">
                  <span className="text-[10px] font-black opacity-50 block uppercase mb-1">Sede</span>
                  <span className="text-xs font-bold truncate flex items-center gap-2"><Landmark className="w-3 h-3" /> {team.venueName}</span>
                </div>
                <div className="bg-muted/30 p-2 rounded-2xl border flex items-center justify-center">
                  <div className="w-10 h-12">
                    <JerseySVG 
                      primary={team.kitPrimary} secondary={team.kitSecondary} tertiary={team.kitTertiary} accent={team.kitAccent}
                      style={team.uniformStyle} brand={team.brand} sponsor={team.sponsor}
                      crestPlacement={team.crestPlacement} sponsorPlacement={team.sponsorPlacement} brandPlacement={team.brandPlacement}
                      crestShape={team.emblemShape} crestPattern={team.emblemPattern} crestC1={team.crestPrimary} crestC2={team.crestSecondary} crestC3={team.crestTertiary || team.crestSecondary} crestC4={team.crestAccent}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 h-12 rounded-xl font-black" variant="secondary" onClick={() => { setEditingTeam(team); setIsDialogOpen(true); }}>
                  <Pencil className="w-4 h-4 mr-2" /> REDISEÑAR
                </Button>
                <Button variant="destructive" size="icon" className="h-12 w-12 rounded-xl" onClick={() => deleteTeam(team.id)}>
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
