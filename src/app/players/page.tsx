"use client";

import { useState, useEffect } from 'react';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, Search, User, Trash2, Pencil, Shirt, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Player, UniformStyle, ElementPlacement, VerticalPlacement, ElementSize } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PREDEFINED_COLORS } from '@/lib/colors';
import { cn } from '@/lib/utils';

// Simplified Jersey SVG for Individual Personal Branding
const PlayerJerseySVG = ({ 
  primary, secondary, style, brand, sponsor 
}: { 
  primary: string, secondary: string, style: UniformStyle, brand?: string, sponsor?: string 
}) => {
  return (
    <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-xl">
      <defs>
        <clipPath id="playerBodyClip">
          <path d="M40 40 L60 20 L140 20 L160 40 L180 60 L180 100 L160 100 L160 220 L150 225 L50 225 L40 220 L40 100 L20 100 L20 60 Z" />
        </clipPath>
        <pattern id="p_stripes" width="40" height="240" patternUnits="userSpaceOnUse"><rect width="20" height="240" fill={secondary} /></pattern>
        <pattern id="p_hoops" width="200" height="40" patternUnits="userSpaceOnUse"><rect width="200" height="20" fill={secondary} /></pattern>
        <radialGradient id="p_clothShading" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="white" stopOpacity="0.1" />
          <stop offset="100%" stopColor="black" stopOpacity="0.3" />
        </radialGradient>
      </defs>
      <path d="M40 40 L60 20 L140 20 L160 40 L180 60 L180 100 L160 100 L160 220 L150 225 L50 225 L40 220 L40 100 L20 100 L20 60 Z" fill={primary} />
      <g clipPath="url(#playerBodyClip)">
        {style === 'stripes' && <rect width="200" height="240" fill="url(#p_stripes)" />}
        {style === 'hoops' && <rect width="200" height="240" fill="url(#p_hoops)" />}
        {style === 'halves' && <rect x="100" width="100" height="240" fill={secondary} />}
      </g>
      <path d="M40 40 L60 20 L140 20 L160 40 L180 60 L180 100 L160 100 L160 220 L150 225 L50 225 L40 220 L40 100 L20 100 L20 60 Z" fill="url(#p_clothShading)" opacity="0.5" />
      <text x="100" y="150" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="900" opacity="0.8">{sponsor?.toUpperCase() || ''}</text>
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
            value === color ? "ring-2 ring-primary" : "border-transparent"
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
  const [value, setValue] = useState(1000);
  const [number, setNumber] = useState(10);
  const [position, setPosition] = useState(settings.positions[0] || 'FW');
  const [attributes, setAttributes] = useState<Record<string, number>>({});
  
  // Kit State (Personal Brand)
  const [kitStyle, setKitStyle] = useState<UniformStyle>('solid');
  const [kitC1, setKitC1] = useState(PREDEFINED_COLORS[24]);
  const [kitC2, setKitC2] = useState(PREDEFINED_COLORS[35]);
  const [sponsor, setSponsor] = useState('');

  useEffect(() => {
    if (editingPlayer) {
      setName(editingPlayer.name);
      setValue(editingPlayer.monetaryValue);
      setNumber(editingPlayer.jerseyNumber);
      setPosition(editingPlayer.position);
      setKitStyle(editingPlayer.uniformStyle || 'solid');
      setKitC1(editingPlayer.kitPrimary || PREDEFINED_COLORS[24]);
      setKitC2(editingPlayer.kitSecondary || PREDEFINED_COLORS[35]);
      setSponsor(editingPlayer.sponsor || '');
      
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
    setName(''); setValue(1000); setNumber(10);
    setPosition(settings.positions[0] || 'FW');
    setAttributes(settings.attributeNames.reduce((acc, name) => ({ ...acc, [name]: 50 }), {}));
    setKitStyle('solid'); setKitC1(PREDEFINED_COLORS[24]); setKitC2(PREDEFINED_COLORS[35]);
    setSponsor('');
  };

  const handleSavePlayer = () => {
    if (!name) return;

    const playerData: Player = {
      id: editingPlayer ? editingPlayer.id : Math.random().toString(36).substr(2, 9),
      name, monetaryValue: value, jerseyNumber: number, position,
      attributes: Object.entries(attributes).map(([k, v]) => ({ name: k, value: v })),
      teamId: editingPlayer ? editingPlayer.teamId : undefined,
      uniformStyle: kitStyle, kitPrimary: kitC1, kitSecondary: kitC2, sponsor,
      crestPlacement: 'left', sponsorPlacement: 'middle', brandPlacement: 'right'
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

  const filteredPlayers = players.filter(p => 
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.position.toLowerCase().includes(search.toLowerCase())) && !p.teamId
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <header className="flex justify-between items-center px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-black uppercase flex items-center gap-3">
            Agentes Libres <Sparkles className="text-accent" />
          </h1>
          <p className="text-muted-foreground">Jugadores sin equipo con marca personal propia.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button className="font-black rounded-xl"><UserPlus className="w-4 h-4 mr-2" /> RECLUTAR</Button></DialogTrigger>
          <DialogContent className="max-w-[900px] p-0 overflow-hidden rounded-2xl border-none">
            <div className="p-6 bg-muted/20 border-b"><DialogTitle className="font-black uppercase">Ficha de Agente</DialogTitle></div>
            <Tabs defaultValue="base" className="w-full flex flex-col h-[75vh]">
              <TabsList className="grid grid-cols-3 rounded-none h-12 border-b bg-card">
                <TabsTrigger value="base">Bio</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
                <TabsTrigger value="brand">Marca</TabsTrigger>
              </TabsList>
              <div className="flex-1 overflow-y-auto p-6">
                <TabsContent value="base" className="space-y-6 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Nombre</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
                    <div className="space-y-2">
                      <Label>Posición</Label>
                      <Select value={position} onValueChange={setPosition}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{settings.positions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Valor ({settings.currency})</Label><Input type="number" value={value} onChange={e => setValue(Number(e.target.value))} /></div>
                    <div className="space-y-2"><Label>Dorsal</Label><Input type="number" value={number} onChange={e => setNumber(Number(e.target.value))} /></div>
                  </div>
                </TabsContent>
                <TabsContent value="stats" className="space-y-4 mt-0">
                  <div className="grid md:grid-cols-2 gap-6">
                    {settings.attributeNames.map(attr => (
                      <div key={attr} className="space-y-2">
                        <div className="flex justify-between text-xs font-bold uppercase"><span>{attr}</span><span>{attributes[attr] || 50}</span></div>
                        <Slider value={[attributes[attr] || 50]} onValueChange={v => setAttributes(p => ({...p, [attr]: v[0]}))} max={100} min={1} />
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="brand" className="space-y-6 mt-0">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="aspect-[4/5] bg-muted/20 rounded-2xl flex items-center justify-center p-8 border-2 border-dashed">
                      <div className="w-full max-w-[180px]"><PlayerJerseySVG primary={kitC1} secondary={kitC2} style={kitStyle} sponsor={sponsor} /></div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Estilo Personal</Label>
                        <Select value={kitStyle} onValueChange={(v: any) => setKitStyle(v)}>
                          <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="solid">Sólido</SelectItem><SelectItem value="stripes">Rayas</SelectItem><SelectItem value="hoops">Aros</SelectItem><SelectItem value="halves">Mitades</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <ColorPicker label="Color Primario" value={kitC1} onChange={setKitC1} />
                      <ColorPicker label="Color Secundario" value={kitC2} onChange={setKitC2} />
                      <div className="space-y-2"><Label>Logo Personal</Label><Input placeholder="Ej: CR7" value={sponsor} onChange={e => setSponsor(e.target.value)} /></div>
                    </div>
                  </div>
                </TabsContent>
              </div>
              <div className="p-4 bg-muted/20 border-t flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>CANCELAR</Button>
                <Button onClick={handleSavePlayer} className="font-black">CONFIRMAR</Button>
              </div>
            </Tabs>
          </DialogContent>
        </Dialog>
      </header>

      <div className="px-4 md:px-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input className="pl-10 h-12 rounded-xl border-none shadow-lg" placeholder="Buscar agentes..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 md:px-0">
        {filteredPlayers.map(player => (
          <Card key={player.id} className="border-none bg-card hover:translate-y-[-4px] transition-all shadow-lg overflow-hidden group">
            <div className="h-1.5 w-full" style={{ backgroundColor: settings.positionColors[player.position] || 'var(--primary)' }} />
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="w-12 h-16 bg-muted/20 rounded-lg flex items-center justify-center border">
                  <PlayerJerseySVG primary={player.kitPrimary || PREDEFINED_COLORS[24]} secondary={player.kitSecondary || PREDEFINED_COLORS[35]} style={player.uniformStyle || 'solid'} sponsor={player.sponsor} />
                </div>
                <span className="text-3xl font-black opacity-10 leading-none">#{player.jerseyNumber}</span>
              </div>
              <h3 className="font-bold truncate">{player.name}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-4">{player.position}</p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1 rounded-lg h-9" onClick={() => { setEditingPlayer(player); setIsDialogOpen(true); }}>
                  <Pencil className="w-3 h-3 mr-2" /> EDITAR
                </Button>
                <Button variant="destructive" size="icon" className="w-9 h-9 rounded-lg" onClick={() => deletePlayer(player.id)}>
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
