"use client";

import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings, Coins, MapPin, ListPlus } from 'lucide-react';
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
    
    toast({ title: "Settings Saved", description: "Global configuration has been updated." });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="text-primary" /> Settings
        </h1>
        <p className="text-muted-foreground">Configure global defaults and app behaviors.</p>
      </header>

      <div className="grid gap-6">
        <Card className="border-none bg-card shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Coins className="text-primary w-5 h-5" />
              </div>
              <div>
                <CardTitle>Economics</CardTitle>
                <CardDescription>Customize the default currency and monetary settings.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="currency">Default Currency Symbol</Label>
              <Input 
                id="currency" 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)} 
                className="max-w-[200px]"
              />
              <p className="text-xs text-muted-foreground">Used throughout the app for player values and rewards (e.g., CR, $, €).</p>
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
                <CardTitle>Player Positions</CardTitle>
                <CardDescription>Define the roles available for player profiles.</CardDescription>
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
              <p className="text-xs text-muted-foreground">e.g. GK, DF, MD, FW or QB, WR, RB, TE</p>
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
                <CardTitle>Player Attributes</CardTitle>
                <CardDescription>Custom stats that define player quality.</CardDescription>
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
              <p className="text-xs text-muted-foreground">These will appear on every player creation screen.</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} size="lg" className="w-full md:w-auto shadow-lg shadow-primary/20 px-12">
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}
