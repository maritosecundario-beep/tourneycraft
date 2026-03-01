
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, Download, PlusCircle, Loader2, Code2, CheckCircle2 } from 'lucide-react';
import { generateDataJson } from '@/ai/flows/generate-data-json';
import { useToast } from '@/hooks/use-toast';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AIStudioPage() {
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { importData } = useTournamentStore();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!instructions.trim()) return;
    setLoading(true);
    try {
      const data = await generateDataJson({ instructions });
      setResult(data);
      toast({ title: "JSON Generado", description: "La arquitectura de datos está lista." });
    } catch (e) {
      toast({ title: "Error de IA", description: "No se pudieron procesar las instrucciones.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleMerge = () => {
    if (!result) return;
    importData(result, true);
    toast({ title: "Datos Fusionados", description: "Los nuevos elementos se han unido a tu trabajo." });
    setResult(null);
    setInstructions('');
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tourneycraft-ai-gen-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      <header>
        <h1 className="text-4xl font-black flex items-center gap-3">
          <Sparkles className="text-accent" /> AI Content Architect
        </h1>
        <p className="text-muted-foreground text-lg">Crea universos deportivos completos con solo dar instrucciones.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="border-none bg-card shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="text-xl uppercase font-black">Instrucciones</CardTitle>
              <CardDescription>Sé específico con los nombres, ligas y cantidad de jugadores.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Textarea 
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Ej: Crea 4 equipos de la liga argentina con sus colores clásicos y sus 3 mejores delanteros cada uno..."
                className="min-h-[200px] text-lg rounded-2xl bg-muted/10 border-none focus-visible:ring-2 focus-visible:ring-accent"
              />
              <Button 
                onClick={handleGenerate} 
                disabled={loading || !instructions}
                className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-accent/20 bg-accent hover:bg-accent/90"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                ARQUITECTAR DATOS
              </Button>
            </CardContent>
          </Card>
          
          <div className="p-6 bg-accent/5 border-2 border-dashed border-accent/20 rounded-3xl">
            <h4 className="font-black uppercase text-accent mb-2 text-sm">Consejo de Arquitecto</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Puedes pedir estilos de equipación específicos (ej: "camisetas de camuflaje") o heráldica tradicional. La IA conoce los 36 colores del sistema.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {result ? (
            <Card className="border-none bg-card shadow-2xl rounded-[2.5rem] border-2 border-accent/20 animate-in fade-in slide-in-from-right-4 duration-500">
              <CardHeader className="bg-accent/10 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl uppercase font-black text-accent flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Resultado
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={handleDownload} title="Descargar JSON">
                      <Download className="w-5 h-5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setResult(null)} title="Limpiar">
                      <Code2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/30 p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Clubs</p>
                    <p className="text-2xl font-black">{result.teams?.length || 0}</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Agentes</p>
                    <p className="text-2xl font-black">{result.players?.length || 0}</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Torneos</p>
                    <p className="text-2xl font-black">{result.tournaments?.length || 0}</p>
                  </div>
                </div>

                <div className="p-4 bg-muted/20 rounded-2xl border">
                  <p className="text-sm font-bold text-muted-foreground mb-2">Resumen:</p>
                  <p className="text-sm italic">{result.summary}</p>
                </div>

                <ScrollArea className="h-48 rounded-xl border bg-black/5 p-4 font-mono text-[10px]">
                  <pre>{JSON.stringify(result, null, 2)}</pre>
                </ScrollArea>

                <Button 
                  onClick={handleMerge}
                  className="w-full h-14 rounded-2xl font-black text-lg bg-primary shadow-xl shadow-primary/20"
                >
                  <PlusCircle className="w-5 h-5 mr-2" /> FUSIONAR CON MI TRABAJO
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] border-4 border-dashed rounded-[3rem] flex flex-col items-center justify-center p-12 text-center text-muted-foreground opacity-50">
              <Code2 className="w-20 h-20 mb-6" />
              <p className="text-xl font-bold">Sin datos generados</p>
              <p className="max-w-xs mt-2">Introduce instrucciones a la izquierda para ver la arquitectura de tu nuevo universo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
