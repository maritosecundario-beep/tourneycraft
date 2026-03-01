"use client";

import { useState } from 'react';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Search, User, DollarSign, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

export default function PlayersPage() {
  const { players, settings, addPlayer, deletePlayer } = useTournamentStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // New Player Form State
  const [name, setName] = useState('');
  const [value, setValue] = useState(1000);
  const [number, setNumber] = useState(10);
  const [position, setPosition] = useState(settings.positions[0] || 'FW');
  const [attributes, setAttributes] = useState<Record<string, number>>(
    settings.attributeNames.reduce((acc, name) => ({ ...acc, [name]: 50 }), {})
  );

  const filteredPlayers = players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) && !p.teamId);

  const handleAddPlayer = () => {
    if (!name) return;

    addPlayer({
      id: Math.random().toString(36).substr(2, 9),
      name,
      monetaryValue: value,
      jerseyNumber: number,
      position,
      attributes: Object.entries(attributes).map(([k, v]) => ({ name: k, value: v })),
    });

    setName('');
    setValue(1000);
    setNumber(10);
    setIsDialogOpen(false);
    toast({ title: "Free Agent Signed", description: `${name} is now available for recruitment.` });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Free Agents</h1>
          <p className="text-muted-foreground">Players currently without a contract.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/20">
              <UserPlus className="w-4 h-4 mr-2" /> Recruit Player
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-card border-none max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Recruit New Player</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="pname">Full Name</Label>
                  <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Position</Label>
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
                  <Label>Market Value ({settings.currency})</Label>
                  <Input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
                </div>
                <div className="grid gap-2">
                  <Label>Jersey Number</Label>
                  <Input type="number" value={number} onChange={(e) => setNumber(Number(e.target.value))} />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-bold text-sm uppercase tracking-widest text-primary">Attributes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {settings.attributeNames.map(attr => (
                    <div key={attr} className="space-y-2">
                      <div className="flex justify-between">
                        <Label>{attr}</Label>
                        <span className="text-xs font-mono font-bold text-accent">{attributes[attr]}</span>
                      </div>
                      <Slider 
                        value={[attributes[attr]]} 
                        onValueChange={(v) => setAttributes(prev => ({ ...prev, [attr]: v[0] }))}
                        max={100}
                        min={1}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleAddPlayer} className="w-full h-12 mt-4">Confirm Recruitment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input 
          className="pl-10 bg-card border-none h-12 text-lg shadow-lg" 
          placeholder="Search available players..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredPlayers.map(player => (
          <Card key={player.id} className="border-none bg-card hover:bg-muted/50 transition-colors shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="text-primary w-6 h-6" />
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black opacity-10 leading-none">#{player.jerseyNumber}</span>
                </div>
              </div>
              <h3 className="text-lg font-bold leading-none mb-1">{player.name}</h3>
              <p className="text-xs text-accent font-bold uppercase tracking-widest mb-4">{player.position}</p>
              
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Market Value</span>
                  <span className="font-bold flex items-center gap-1">
                    {player.monetaryValue.toLocaleString()} <span className="text-[10px] text-muted-foreground">{settings.currency}</span>
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1">Details</Button>
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
