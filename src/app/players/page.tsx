"use client";

import { useState, useEffect } from 'react';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Search, User, Trash2, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Player } from '@/lib/types';

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

  useEffect(() => {
    if (editingPlayer) {
      setName(editingPlayer.name);
      setValue(editingPlayer.monetaryValue);
      setNumber(editingPlayer.jerseyNumber);
      setPosition(editingPlayer.position);
      
      const attrsMap: Record<string, number> = {};
      settings.attributeNames.forEach(attr => {
        const found = editingPlayer.attributes.find(a => a.name === attr);
        attrsMap[attr] = found ? found.value : 50;
      });
      setAttributes(attrsMap);
    } else {
      setName('');
      setValue(1000);
      setNumber(10);
      setPosition(settings.positions[0] || 'FW');
      setAttributes(settings.attributeNames.reduce((acc, name) => ({ ...acc, [name]: 50 }), {}));
    }
  }, [editingPlayer, settings]);

  const handleSavePlayer = () => {
    if (!name) return;

    const playerData: Player = {
      id: editingPlayer ? editingPlayer.id : Math.random().toString(36).substr(2, 9),
      name,
      monetaryValue: value,
      jerseyNumber: number,
      position,
      attributes: Object.entries(attributes).map(([k, v]) => ({ name: k, value: v })),
      teamId: editingPlayer ? editingPlayer.teamId : undefined
    };

    if (editingPlayer) {
      updatePlayer(playerData);
      toast({ title: "Agente Actualizado", description: `${name} ha sido modificado.` });
    } else {
      addPlayer(playerData);
      toast({ title: "Agente Reclutado", description: `${name} ya está disponible.` });
    }

    setIsDialogOpen(false);
    setEditingPlayer(null);
  };

  const filteredPlayers = players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) && !p.teamId);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agentes Libres</h1>
          <p className="text-muted-foreground">Jugadores sin contrato esperando ser reclutados.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingPlayer(null);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/20">
              <UserPlus className="w-4 h-4 mr-2" /> Reclutar Jugador
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-card border-none max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlayer ? 'Editar Jugador' : 'Reclutar Nuevo Jugador'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="pname">Nombre Completo</Label>
                  <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Posición / Rol</Label>
                  <Select value={position} onValueChange={setPosition}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {settings.positions.map(pos => <SelectItem key={pos} value={pos}>{pos}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Valor de Mercado ({settings.currency})</Label>
                  <Input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
                </div>
                <div className="grid gap-2">
                  <Label>Dorsal / Número</Label>
                  <Input type="number" value={number} onChange={(e) => setNumber(Number(e.target.value))} />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-bold text-sm uppercase tracking-widest text-primary">Atributos de Desempeño</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {settings.attributeNames.map(attr => (
                    <div key={attr} className="space-y-2">
                      <div className="flex justify-between">
                        <Label>{attr}</Label>
                        <span className="text-xs font-mono font-bold text-accent">{attributes[attr] || 50}</span>
                      </div>
                      <Slider 
                        value={[attributes[attr] || 50]} 
                        onValueChange={(v) => setAttributes(prev => ({ ...prev, [attr]: v[0] }))}
                        max={100}
                        min={1}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleSavePlayer} className="w-full h-12 mt-4">
                {editingPlayer ? 'Guardar Cambios' : 'Confirmar Reclutamiento'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input 
          className="pl-10 bg-card border-none h-12 text-lg shadow-lg" 
          placeholder="Buscar agentes disponibles..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredPlayers.map(player => (
          <Card key={player.id} className="border-none bg-card hover:bg-muted/50 transition-colors shadow-lg overflow-hidden">
            <div className="h-1 w-full" style={{ backgroundColor: settings.positionColors[player.position] || 'var(--primary)' }} />
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: (settings.positionColors[player.position] || '#ccc') + '20' }}>
                  <User style={{ color: settings.positionColors[player.position] || 'var(--primary)' }} className="w-5 h-5" />
                </div>
                <span className="text-2xl font-black opacity-10 leading-none">#{player.jerseyNumber}</span>
              </div>
              <h3 className="text-lg font-bold leading-none mb-1">{player.name}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: settings.positionColors[player.position] || 'var(--accent)' }}>
                {player.position}
              </p>
              
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => {
                  setEditingPlayer(player);
                  setIsDialogOpen(true);
                }}>
                  <Pencil className="w-3 h-3 mr-2" /> Editar
                </Button>
                <Button variant="destructive" size="icon" className="w-8 h-8" onClick={() => deletePlayer(player.id)}>
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
