"use client";

import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings, Coins, MapPin, ListPlus, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function SettingsPage() {
  const { settings, updateSettings } = useTournamentStore();
  const { toast } = useToast();
  
  const [currency, setCurrency] = useState(settings.currency);
  const [positions, setPositions] = useState(settings.positions.join(', '));
  const [attributes, setAttributes] = useState(settings.attributeNames.join(', '));

  const handleSave = () => {
    updateSettings({
      currency,
      positions: positions.split(',').map(s => s.trim()).filter(s => s.length > 0),
      attributeNames: attributes.split(',').map(s => s.trim()).filter(s => s.length > 0),
    });
    
    toast({ title: "Universe Configured", description: "Global sport parameters have been updated." });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="text-primary" /> Universe Architect
        </h1>
        <p className="text-muted-foreground">Define the rules and metadata for your competitive ecosystem.</p>
      </header>

      <Card className="border-none bg-accent/10 border-l-4 border-accent">
        <CardContent className="p-4 flex gap-3">
          <Info className="text-accent shrink-0" />
          <p className="text-sm">
            Los cambios realizados aquí afectarán a todos los nuevos jugadores y equipos. Puedes configurar esto para <strong>Baloncesto</strong> (PF, C, PG...), <strong>eSports</strong> (Mid, Jungle...), o cualquier disciplina.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card className="border-none bg-card shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Coins className="text-primary w-5 h-5" />
              </div>
              <div>
                <CardTitle>Economics</CardTitle>
                <CardDescription>Configure currency symbols for contracts and rewards.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency Unit</Label>
              <Input 
                id="currency" 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)} 
                className="max-w-[200px]"
              />
              <p className="text-xs text-muted-foreground">e.g. Credits, Gold, USD, Coins.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <MapPin className="text-accent w-5 h-5" />
              </div>
              <div>
                <CardTitle>Role Definitions</CardTitle>
                <CardDescription>Define positions or roles available in this sport.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="positions">Positions (comma separated)</Label>
              <Input 
                id="positions" 
                value={positions} 
                onChange={(e) => setPositions(e.target.value)} 
              />
              <p className="text-xs text-muted-foreground">e.g. Tank, Healer, DPS or PG, SG, SF, PF, C</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <ListPlus className="text-yellow-500 w-5 h-5" />
              </div>
              <div>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Custom stats that define athlete quality.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="attributes">Attribute Names (comma separated)</Label>
              <Input 
                id="attributes" 
                value={attributes} 
                onChange={(e) => setAttributes(e.target.value)} 
              />
              <p className="text-xs text-muted-foreground">e.g. Aim, Reflexes, Stamina or 3PT%, Rebounding, Steals.</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} size="lg" className="w-full md:w-auto shadow-lg shadow-primary/20 px-12">
            Reconstruct Universe
          </Button>
        </div>
      </div>
    </div>
  );
}