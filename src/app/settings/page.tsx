"use client";

import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Coins, MapPin, ListPlus, Info, Palette, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { settings, updateSettings } = useTournamentStore();
  const { toast } = useToast();
  
  const [currency, setCurrency] = useState(settings.currency);
  const [theme, setTheme] = useState(settings.theme);
  const [positions, setPositions] = useState(settings.positions.join(', '));
  const [posColors, setPosColors] = useState<Record<string, string>>(settings.positionColors || {});
  const [attributes, setAttributes] = useState(settings.attributeNames.join('\n'));

  // Sync state with settings when they change (e.g. from cloud)
  useEffect(() => {
    setCurrency(settings.currency);
    setTheme(settings.theme);
    setPositions(settings.positions.join(', '));
    setPosColors(settings.positionColors || {});
    setAttributes(settings.attributeNames.join('\n'));
  }, [settings]);

  const handleSave = () => {
    const posList = positions.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const attrList = attributes.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    
    // Ensure colors exist for all positions
    const newColors = { ...posColors };
    posList.forEach(pos => {
      if (!newColors[pos]) newColors[pos] = '#3b82f6';
    });

    updateSettings({
      currency,
      theme,
      positions: posList,
      positionColors: newColors,
      attributeNames: attrList,
    });
    
    toast({ title: "Universo Configurado", description: "Los parámetros globales han sido actualizados." });
  };

  const handleColorChange = (pos: string, color: string) => {
    setPosColors(prev => ({ ...prev, [pos]: color }));
  };

  const currentPositionsList = positions.split(',').map(s => s.trim()).filter(s => s.length > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="text-primary" /> Arquitecto del Universo
        </h1>
        <p className="text-muted-foreground">Define las reglas base y la estética de tu ecosistema competitivo.</p>
      </header>

      <Card className="border-none bg-accent/10 border-l-4 border-accent">
        <CardContent className="p-4 flex gap-3">
          <Info className="text-accent shrink-0" />
          <p className="text-sm">
            Configura aquí la base de tu deporte. Los cambios afectarán a los nuevos registros. 
            <strong>Consejo:</strong> Usa el área de Atributos para definir métricas específicas por línea.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 pb-20">
        <Card className="border-none bg-card shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Palette className="text-primary w-5 h-5" />
              </div>
              <div>
                <CardTitle>Estética de la Interfaz</CardTitle>
                <CardDescription>Elige el tema visual predominante.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Tema Visual</Label>
              <Select value={theme} onValueChange={(v: any) => setTheme(v)}>
                <SelectTrigger className="max-w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Standard Dark</SelectItem>
                  <SelectItem value="midnight">Midnight Blue</SelectItem>
                  <SelectItem value="obsidian">Deep Obsidian</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Coins className="text-primary w-5 h-5" />
              </div>
              <div>
                <CardTitle>Economía</CardTitle>
                <CardDescription>Configura la unidad monetaria del ecosistema.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="currency">Nombre de la Moneda</Label>
              <Input 
                id="currency" 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)} 
                className="max-w-[200px]"
                placeholder="Ej. Créditos, CR, Gold..."
              />
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
                <CardTitle>Definición de Roles</CardTitle>
                <CardDescription>Gestiona las posiciones y sus identificadores visuales.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="positions">Nombres de Posiciones (separados por coma)</Label>
              <Input 
                id="positions" 
                value={positions} 
                onChange={(e) => setPositions(e.target.value)} 
                placeholder="Ej. GK, DF, MF, FW"
              />
            </div>
            
            {currentPositionsList.length > 0 && (
              <div className="space-y-4">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Configurar Colores de Posición</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {currentPositionsList.map(pos => (
                    <div key={pos} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
                      <input 
                        type="color" 
                        value={posColors[pos] || '#3b82f6'} 
                        onChange={(e) => handleColorChange(pos, e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                      />
                      <span className="text-sm font-bold truncate">{pos}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <ListPlus className="text-yellow-500 w-5 h-5" />
              </div>
              <div>
                <CardTitle>Métricas de Rendimiento</CardTitle>
                <CardDescription>Define los atributos que determinan la calidad de un atleta.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="attributes">Atributos (uno por párrafo/línea)</Label>
              <Textarea 
                id="attributes" 
                value={attributes} 
                onChange={(e) => setAttributes(e.target.value)} 
                placeholder="Fuerza&#10;Velocidad&#10;Táctica..."
                className="min-h-[150px] font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <div className="fixed bottom-8 right-8 left-20 md:left-64 flex justify-center pointer-events-none md:justify-end md:pr-8">
          <Button onClick={handleSave} size="lg" className="pointer-events-auto shadow-2xl shadow-primary/40 px-12 h-14 text-lg font-bold gap-2">
            <CheckCircle2 className="w-5 h-5" /> Guardar Configuración
          </Button>
        </div>
      </div>
    </div>
  );
}
