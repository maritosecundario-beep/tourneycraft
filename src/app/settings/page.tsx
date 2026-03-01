'use client';

import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Coins, MapPin, ListPlus, Palette, CheckCircle2, Plus, Trash2, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { GlobalSettings } from '@/lib/types';
import { PREDEFINED_COLORS } from '@/lib/colors';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function SettingsPage() {
  const { settings, updateSettings } = useTournamentStore();
  const { toast } = useToast();
  
  const [currency, setCurrency] = useState(settings.currency);
  const [theme, setTheme] = useState<GlobalSettings['theme']>(settings.theme);
  const [positions, setPositions] = useState<string[]>(settings.positions);
  const [posColors, setPosColors] = useState<Record<string, string>>(settings.positionColors || {});
  const [attributes, setAttributes] = useState(settings.attributeNames.join('\n'));

  useEffect(() => {
    setCurrency(settings.currency);
    setTheme(settings.theme);
    setPositions(settings.positions);
    setPosColors(settings.positionColors || {});
    setAttributes(settings.attributeNames.join('\n'));
  }, [settings]);

  const handleSave = () => {
    const attrList = attributes.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    
    updateSettings({
      currency,
      theme,
      positions,
      positionColors: posColors,
      attributeNames: attrList,
    });
    
    toast({ title: "Configuración Guardada", description: "Tu universo ha sido actualizado correctamente." });
  };

  const addPosition = () => {
    const newPos = `POS ${positions.length + 1}`;
    setPositions([...positions, newPos]);
    setPosColors({ ...posColors, [newPos]: PREDEFINED_COLORS[10] }); // Default to Blue
  };

  const removePosition = (index: number) => {
    const posToRemove = positions[index];
    const newPositions = positions.filter((_, i) => i !== index);
    const newColors = { ...posColors };
    delete newColors[posToRemove];
    setPositions(newPositions);
    setPosColors(newColors);
  };

  const updatePositionName = (index: number, newName: string) => {
    const oldName = positions[index];
    const newPositions = [...positions];
    newPositions[index] = newName;
    
    const newColors = { ...posColors };
    newColors[newName] = newColors[oldName] || PREDEFINED_COLORS[10];
    if (oldName !== newName) delete newColors[oldName];
    
    setPositions(newPositions);
    setPosColors(newColors);
  };

  const handleColorChange = (pos: string, color: string) => {
    setPosColors(prev => ({ ...prev, [pos]: color }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      <header>
        <h1 className="text-3xl md:text-4xl font-black flex items-center gap-3 text-foreground">
          <Settings className="text-primary w-8 h-8 md:w-10 md:h-10" /> AJUSTES GLOBALES
        </h1>
        <p className="text-muted-foreground text-base md:text-lg">Personaliza la base estructural y estética de tu simulador.</p>
      </header>

      <div className="grid gap-6 md:gap-8">
        {/* TEMAS Y ESTÉTICA */}
        <Card className="border-none bg-card shadow-xl md:shadow-2xl overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-accent to-yellow-500" />
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Palette className="text-primary w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <CardTitle className="text-lg md:text-xl">Atmósfera Visual</CardTitle>
                <CardDescription className="text-xs md:text-sm">Look & feel de la plataforma.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-4">
              <Label>Tema Seleccionado</Label>
              <Select value={theme} onValueChange={(v: any) => setTheme(v)}>
                <SelectTrigger className="h-12 text-base md:text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">☀️ Light Professional</SelectItem>
                  <SelectItem value="dark">🌙 Dark Standard</SelectItem>
                  <SelectItem value="midnight">🌊 Midnight Blue</SelectItem>
                  <SelectItem value="obsidian">🌑 Deep Obsidian</SelectItem>
                  <SelectItem value="nord">❄️ Nord Arctic</SelectItem>
                  <SelectItem value="retro">💾 Retro Classic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="hidden md:flex p-6 bg-muted/30 rounded-2xl border items-center justify-center gap-4">
               <div className="w-8 h-8 rounded-full bg-background border shadow-sm" />
               <div className="w-8 h-8 rounded-full bg-primary shadow-sm" />
               <div className="w-8 h-8 rounded-full bg-accent shadow-sm" />
               <div className="w-8 h-8 rounded-full bg-muted shadow-sm" />
               <p className="text-xs text-muted-foreground font-mono">Vista previa de paleta</p>
            </div>
          </CardContent>
        </Card>

        {/* EDITOR DE POSICIONES */}
        <Card className="border-none bg-card shadow-xl">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                <MapPin className="text-accent w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <CardTitle className="text-lg md:text-xl">Roles y Colores</CardTitle>
                <CardDescription className="text-xs md:text-sm">Identificación por rol.</CardDescription>
              </div>
            </div>
            <Button onClick={addPosition} variant="outline" className="w-full md:w-auto border-accent text-accent">
              <Plus className="w-4 h-4 mr-2" /> Añadir Rol
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {positions.map((pos, index) => (
                <div key={index} className="group flex items-center gap-4 p-3 md:p-4 bg-muted/20 hover:bg-muted/40 rounded-2xl border transition-all">
                  <div 
                    className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-[10px] md:text-xs font-black shadow-lg shrink-0"
                    style={{ backgroundColor: posColors[pos] || PREDEFINED_COLORS[10], color: '#fff' }}
                  >
                    {pos.substring(0, 3).toUpperCase()}
                  </div>
                  <div className="flex-1 space-y-1">
                    <Input 
                      value={pos} 
                      onChange={(e) => updatePositionName(index, e.target.value)}
                      className="h-7 bg-transparent border-none font-bold text-base md:text-lg focus-visible:ring-0 p-0"
                    />
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button 
                            className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-white shadow-sm cursor-pointer"
                            style={{ backgroundColor: posColors[pos] || PREDEFINED_COLORS[10] }}
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3 bg-card border-border">
                          <div className="grid grid-cols-5 gap-2">
                            {PREDEFINED_COLORS.map(color => (
                              <button
                                key={color}
                                onClick={() => handleColorChange(pos, color)}
                                className={cn(
                                  "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                                  posColors[pos] === color ? "border-foreground" : "border-transparent"
                                )}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:opacity-0 md:group-hover:opacity-100 text-destructive"
                    onClick={() => removePosition(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ATRIBUTOS */}
        <Card className="border-none bg-card shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ListPlus className="text-primary w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <CardTitle className="text-lg md:text-xl">Atributos</CardTitle>
                <CardDescription className="text-xs md:text-sm">Estadísticas por párrafo.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea 
              value={attributes} 
              onChange={(e) => setAttributes(e.target.value)} 
              placeholder="Ej: Fuerza&#10;Resistencia..."
              className="min-h-[150px] md:min-h-[200px] text-base md:text-lg font-medium p-4 md:p-6 bg-muted/10"
            />
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-20 md:bottom-10 right-4 md:right-10 left-4 md:left-auto flex justify-end z-40">
        <Button 
          onClick={handleSave} 
          size="lg" 
          className="w-full md:w-auto shadow-2xl shadow-primary/40 h-14 md:h-16 text-lg md:text-xl font-black gap-3 rounded-2xl"
        >
          <CheckCircle2 className="w-6 h-6" /> GUARDAR UNIVERSO
        </Button>
      </div>
    </div>
  );
}
