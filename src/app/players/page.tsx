
'use client';

import { useState, useEffect } from 'react';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, Search, User, Trash2, Pencil, Sparkles, LayoutGrid, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Player, UniformStyle, ElementPlacement, VerticalPlacement, ElementSize } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PREDEFINED_COLORS } from '@/lib/colors';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

// Hyper-Realistic Jersey SVG Visualizer 4.0
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

export default function PlayersPage() {
  const { players, settings, addPlayer, updatePlayer, deletePlayer } = useTournamentStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState(1000);
  const [number, setNumber] = useState(10);
  const [position, setPosition] = useState(settings.positions[0] || 'FW');
  const [attributes, setAttributes] = useState<Record<string, number>>({});
  
  // Kit State
  const [kitStyle, setKitStyle] = useState<UniformStyle>('solid');
  const [kitC1, setKitC1] = useState(PREDEFINED_COLORS[24]);
  const [kitC2, setKitC2] = useState(PREDEFINED_COLORS[35]);
  const [kitC3, setKitC3] = useState(PREDEFINED_COLORS[34]);
  const [kitC4, setKitC4] = useState(PREDEFINED_COLORS[35]);
  const [brand, setBrand] = useState('');
  const [sponsor, setSponsor] = useState('');
  const [crestPos, setCrestPos] = useState<ElementPlacement>('left');
  const [sponsorPos, setSponsorPos] = useState<VerticalPlacement>('middle');
  const [brandPos, setBrandPos] = useState<ElementPlacement>('right');
  const [crestSize, setCrestSize] = useState<ElementSize>('medium');

  useEffect(() => {
    if (editingPlayer) {
      setName(editingPlayer.name);
      setDescription(editingPlayer.description || '');
      setValue(editingPlayer.monetaryValue);
      setNumber(editingPlayer.jerseyNumber);
      setPosition(editingPlayer.position);
      setKitStyle(editingPlayer.uniformStyle || 'solid');
      setKitC1(editingPlayer.kitPrimary || PREDEFINED_COLORS[24]);
      setKitC2(editingPlayer.kitSecondary || PREDEFINED_COLORS[35]);
      setKitC3(editingPlayer.kitTertiary || PREDEFINED_COLORS[34]);
      setKitC4(editingPlayer.kitAccent || PREDEFINED_COLORS[35]);
      setBrand(editingPlayer.brand || '');
      setSponsor(editingPlayer.sponsor || '');
      setCrestPos(editingPlayer.crestPlacement || 'left');
      setSponsorPos(editingPlayer.sponsorPlacement || 'middle');
      setBrandPos(editingPlayer.brandPlacement || 'right');
      setCrestSize(editingPlayer.crestSize || 'medium');
      
      const attrsMap: Record<string, number> = {};
      settings.attributeNames.forEach(attr => {
        const found = editingPlayer.attributes.find(a => a.name === attr);
        attrsMap[attr] = found ? found.value : 50;
      });
      setAttributes(attrsMap);
    } else {
      resetForm();
    }
  }, [editingPlayer, settings]);

  const resetForm = () => {
    setName(''); setDescription(''); setValue(1000); setNumber(10);
    setPosition(settings.positions[0] || 'FW');
    setAttributes(settings.attributeNames.reduce((acc, name) => ({ ...acc, [name]: 50 }), {}));
    setKitStyle('solid'); setKitC1(PREDEFINED_COLORS[24]); setKitC2(PREDEFINED_COLORS[35]);
    setKitC3(PREDEFINED_COLORS[34]); setKitC4(PREDEFINED_COLORS[35]);
    setBrand(''); setSponsor(''); setCrestPos('left'); setSponsorPos('middle'); 
    setBrandPos('right'); setCrestSize('medium');
  };

  const handleSavePlayer = () => {
    if (!name) return;

    const playerData: Player = {
      id: editingPlayer ? editingPlayer.id : Math.random().toString(36).substr(2, 9),
      name, description, monetaryValue: value, jerseyNumber: number, position,
      attributes: Object.entries(attributes).map(([k, v]) => ({ name: k, value: v })),
      teamId: editingPlayer ? editingPlayer.teamId : undefined,
      suspensionMatchdays: editingPlayer ? editingPlayer.suspensionMatchdays : 0,
      uniformStyle: kitStyle, kitPrimary: kitC1, kitSecondary: kitC2, 
      kitTertiary: kitC3, kitAccent: kitC4, brand, sponsor,
      crestPlacement: crestPos, sponsorPlacement: sponsorPos, 
      brandPlacement: brandPos, crestSize
    };

    if (editingPlayer) {
      updatePlayer(playerData);
      toast({ title: "Agente Actualizado", description: `${name} ha sido modificado.` });
    } else {
      addPlayer(playerData);
      toast({ title: "Agente Reclutado", description: `${name} ya está disponible.` });
    }
    setIsDialogOpen(false);
  };

  const freeAgents = players.filter(p => !p.teamId);
  const filteredPlayers = freeAgents.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.position.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <header className="flex justify-between items-center px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-black uppercase flex items-center gap-3">
            Agentes Libres <Sparkles className="text-accent" />
          </h1>
          <p className="text-muted-foreground">Jugadores sin equipo con marca personal propia.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button className="font-black rounded-xl h-12 shadow-lg shadow-primary/20"><UserPlus className="w-4 h-4 mr-2" /> RECLUTAR</Button></DialogTrigger>
          <DialogContent className="max-w-[900px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
            <div className="p-6 bg-muted/20 border-b flex justify-between items-center">
              <DialogTitle className="font-black uppercase">Ficha de Agente Élite</DialogTitle>
            </div>
            <Tabs defaultValue="base" className="w-full flex flex-col h-[80vh]">
              <TabsList className="grid grid-cols-3 rounded-none h-14 border-b bg-card p-1">
                <TabsTrigger value="base" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">Bio</TabsTrigger>
                <TabsTrigger value="stats" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">Estadísticas</TabsTrigger>
                <TabsTrigger value="brand" className="rounded-xl data-[state=active]:bg-accent data-[state=active]:text-white">Personalización Kit</TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <TabsContent value="base" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label>Nombre Completo</Label><Input value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl" /></div>
                    <div className="space-y-2">
                      <Label>Posición Predilecta</Label>
                      <Select value={position} onValueChange={setPosition}>
                        <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>{settings.positions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Valor de Mercado ({settings.currency})</Label><Input type="number" value={value} onChange={e => setValue(Number(e.target.value))} className="h-12 rounded-xl" /></div>
                    <div className="space-y-2"><Label>Dorsal</Label><Input type="number" value={number} onChange={e => setNumber(Number(e.target.value))} className="h-12 rounded-xl" /></div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Biografía / Descripción</Label>
                      <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Historia del agente, logros..." className="min-h-[100px] rounded-xl" />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="stats" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {settings.attributeNames.map(attr => (
                      <div key={attr} className="space-y-3 p-4 bg-muted/10 rounded-2xl border">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary">{attr}</span>
                          <span className="text-lg font-black">{attributes[attr] || 50}</span>
                        </div>
                        <Slider 
                          value={[attributes[attr] || 50]} 
                          onValueChange={v => setAttributes(p => ({...p, [attr]: v[0]}))} 
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
                          primary={kitC1} secondary={kitC2} tertiary={kitC3} accent={kitC4} 
                          style={kitStyle} brand={brand} sponsor={sponsor}
                          crestPlacement={crestPos} sponsorPlacement={sponsorPos} 
                          brandPlacement={brandPos} crestSize={crestSize}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-8 pb-10">
                      <div className="space-y-4">
                        <h4 className="text-sm font-black uppercase text-accent border-b pb-2">Estética Textil</h4>
                        <div className="space-y-2">
                          <Label>Patrón Base</Label>
                          <Select value={kitStyle} onValueChange={(v: any) => setKitStyle(v)}>
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
                          <ColorPicker label="Color 1 (Base)" value={kitC1} onChange={setKitC1} />
                          <ColorPicker label="Color 2 (Patrón)" value={kitC2} onChange={setKitC2} />
                          <ColorPicker label="Color 3 (Cuello)" value={kitC3} onChange={setKitC3} />
                          <ColorPicker label="Color 4 (Logos)" value={kitC4} onChange={setKitC4} />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-black uppercase text-accent border-b pb-2">Identidad Corporativa</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>Marca Técnica</Label><Input placeholder="Nike, Adidas..." value={brand} onChange={e => setBrand(e.target.value)} /></div>
                          <div className="space-y-2"><Label>Patrocinador</Label><Input placeholder="Fly Emirates..." value={sponsor} onChange={e => setSponsor(e.target.value)} /></div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-black uppercase text-accent border-b pb-2">Geometría de Elementos</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Posición Escudo</Label>
                            <Select value={crestPos} onValueChange={(v: any) => setCrestPos(v)}>
                              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="left">Izquierda</SelectItem><SelectItem value="center">Centro</SelectItem><SelectItem value="right">Derecha</SelectItem></SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Tamaño Escudo</Label>
                            <Select value={crestSize} onValueChange={(v: any) => setCrestSize(v)}>
                              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="small">Pequeño</SelectItem><SelectItem value="medium">Normal</SelectItem><SelectItem value="large">Grande</SelectItem></SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Posición Sponsor</Label>
                            <Select value={sponsorPos} onValueChange={(v: any) => setSponsorPos(v)}>
                              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="top">Alto</SelectItem><SelectItem value="middle">Medio</SelectItem><SelectItem value="bottom">Bajo</SelectItem></SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Posición Marca</Label>
                            <Select value={brandPos} onValueChange={(v: any) => setBrandPos(v)}>
                              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="left">Izquierda</SelectItem><SelectItem value="center">Centro</SelectItem><SelectItem value="right">Derecha</SelectItem></SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>

              <div className="p-4 bg-muted/20 border-t flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-12 px-8 font-black">CANCELAR</Button>
                <Button onClick={handleSavePlayer} className="rounded-xl h-12 px-8 font-black shadow-lg shadow-primary/20">CONFIRMAR AGENTE</Button>
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
            placeholder="Buscar por nombre o posición..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 md:px-0">
        {filteredPlayers.map(player => (
          <Card key={player.id} className="border-none bg-card hover:translate-y-[-8px] transition-all duration-300 shadow-xl overflow-hidden group">
            <div className="h-2 w-full" style={{ backgroundColor: settings.positionColors[player.position] || 'var(--primary)' }} />
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-16 h-20 bg-muted/20 rounded-xl flex items-center justify-center border-2 border-dashed border-accent/20 group-hover:border-accent/50 transition-colors">
                  <PlayerJerseySVG 
                    primary={player.kitPrimary || PREDEFINED_COLORS[24]} 
                    secondary={player.kitSecondary || PREDEFINED_COLORS[35]} 
                    tertiary={player.kitTertiary || PREDEFINED_COLORS[34]}
                    accent={player.kitAccent || PREDEFINED_COLORS[35]}
                    style={player.uniformStyle || 'solid'} 
                    brand={player.brand}
                    sponsor={player.sponsor}
                    crestPlacement={player.crestPlacement || 'left'}
                    sponsorPlacement={player.sponsorPlacement || 'middle'}
                    brandPlacement={player.brandPlacement || 'right'}
                    crestSize={player.crestSize || 'medium'}
                  />
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black opacity-10 leading-none block">#{player.jerseyNumber}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mt-1 block">{player.position}</span>
                </div>
              </div>
              <h3 className="text-xl font-black uppercase truncate mb-1">{player.name}</h3>
              <p className="text-sm font-bold text-muted-foreground mb-4 flex items-center gap-2">
                <LayoutGrid className="w-3 h-3" /> {player.monetaryValue.toLocaleString()} {settings.currency}
              </p>
              {player.description && (
                <p className="text-[10px] text-muted-foreground line-clamp-2 mb-4 italic">
                  {player.description}
                </p>
              )}
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1 rounded-xl h-11 font-black" onClick={() => { setEditingPlayer(player); setIsDialogOpen(true); }}>
                  <Pencil className="w-4 h-4 mr-2" /> EDITAR
                </Button>
                <Button variant="destructive" size="icon" className="w-11 h-11 rounded-xl shadow-lg shadow-destructive/10" onClick={() => {
                  if(confirm(`¿Despedir a ${player.name}?`)) deletePlayer(player.id);
                }}>
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredPlayers.length === 0 && (
          <div className="col-span-full py-20 text-center bg-card rounded-[2.5rem] shadow-xl border-2 border-dashed">
            <User className="w-16 h-16 text-muted mx-auto mb-4 opacity-20" />
            <p className="text-xl font-bold text-muted-foreground">No hay agentes que coincidan con la búsqueda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
