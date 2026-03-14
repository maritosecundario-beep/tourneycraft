"use client";

import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Trash2, Database, AlertTriangle, RefreshCw, PlusCircle, ClipboardCopy, ClipboardPaste } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function BackupsPage() {
  const { teams, players, tournaments, settings, importData } = useTournamentStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [pendingData, setPendingData] = useState<any>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const getExportData = () => ({
    teams,
    players,
    tournaments,
    settings,
    exportDate: new Date().toISOString(),
    version: "1.5"
  });

  const handleExportFile = () => {
    const data = getExportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tourneycraft-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Backup Exportado", description: "Tu archivo JSON está listo." });
  };

  const handleExportClipboard = () => {
    const data = getExportData();
    navigator.clipboard.writeText(JSON.stringify(data));
    toast({ title: "Copiado al Portapapeles", description: "Puedes pegar este código en otro dispositivo." });
  };

  const handleImportClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const data = JSON.parse(text);
      if (!data.teams && !data.players && !data.tournaments) throw new Error();
      setPendingData(data);
      setIsImportModalOpen(true);
    } catch (e) {
      toast({ title: "Error al Importar", description: "El contenido del portapapeles no es válido.", variant: "destructive" });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (!data.teams && !data.players && !data.tournaments) throw new Error();
        setPendingData(data);
        setIsImportModalOpen(true);
      } catch (err) {
        toast({ title: "Error al importar", description: "El archivo no es un backup válido.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };

  const executeImport = (merge: boolean) => {
    if (!pendingData) return;
    importData(pendingData, merge);
    toast({ 
      title: merge ? "Datos Fusionados" : "Datos Restaurados", 
      description: merge ? "Los nuevos elementos se han añadido a tu sesión." : "Todo el contenido ha sido reemplazado." 
    });
    setIsImportModalOpen(false);
    setPendingData(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      <header>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <Database className="text-primary" /> Persistencia de Datos
        </h1>
        <p className="text-muted-foreground">Gestiona la exportación, importación y seguridad de tu universo deportivo local.</p>
      </header>

      <div className="grid gap-6">
        <div className="p-6 bg-yellow-500/10 rounded-[2rem] border-2 border-dashed border-yellow-500/20 flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center shrink-0">
            <AlertTriangle className="text-yellow-500 w-8 h-8" />
          </div>
          <div className="text-center md:text-left space-y-1">
            <h3 className="font-black uppercase text-yellow-600">Aviso de Almacenamiento Local</h3>
            <p className="text-sm text-yellow-600/80 leading-relaxed">
              Tus datos se guardan exclusivamente en la memoria de este navegador. Si borras los datos de navegación o usas una ventana de incógnito, perderás tu progreso. Recomendamos exportar un backup periódicamente.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none bg-card shadow-xl rounded-[2.5rem]">
            <CardHeader>
              <CardTitle className="text-lg">Exportar Universo</CardTitle>
              <CardDescription>Crea un punto de restauración de tu trabajo actual.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleExportFile} className="w-full h-12 shadow-lg shadow-primary/20 rounded-xl font-black">
                <Download className="w-4 h-4 mr-2" /> DESCARGAR .JSON
              </Button>
              <Button onClick={handleExportClipboard} variant="outline" className="w-full h-12 rounded-xl font-black border-primary text-primary">
                <ClipboardCopy className="w-4 h-4 mr-2" /> COPIAR CÓDIGO
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none bg-card shadow-xl rounded-[2.5rem]">
            <CardHeader>
              <CardTitle className="text-lg">Importar Universo</CardTitle>
              <CardDescription>Carga datos externos para restaurar o fusionar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
              <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="w-full h-12 rounded-xl font-black">
                <Upload className="w-4 h-4 mr-2" /> SUBIR ARCHIVO
              </Button>
              <Button onClick={handleImportClipboard} variant="outline" className="w-full h-12 rounded-xl font-black border-accent text-accent">
                <ClipboardPaste className="w-4 h-4 mr-2" /> PEGAR CÓDIGO
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none bg-card shadow-xl border-t-4 border-destructive/20 rounded-[2.5rem]">
          <CardHeader>
            <CardTitle className="text-lg text-destructive font-black">BORRADO DEFINITIVO</CardTitle>
            <CardDescription>Esta acción vaciará completamente el simulador en este dispositivo.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" className="w-full h-12 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white border border-destructive/20 rounded-xl font-black" onClick={() => {
              if (confirm("¿ESTÁS SEGURO? Se borrarán todos los equipos, jugadores y torneos.")) {
                localStorage.removeItem('tourneycraft-store');
                window.location.reload();
              }
            }}>
              <Trash2 className="w-4 h-4 mr-2" /> REINICIAR TODA LA APP
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">¿Cómo deseas importar?</DialogTitle>
            <DialogDescription>
              Detectados {pendingData?.teams?.length || 0} clubs y {pendingData?.players?.length || 0} agentes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button onClick={() => executeImport(true)} className="h-16 rounded-2xl flex flex-col items-start px-6 gap-0 bg-accent">
              <div className="flex items-center gap-2"><PlusCircle className="w-4 h-4" /> <span className="font-black uppercase">Unir (Merge)</span></div>
              <span className="text-[10px] opacity-80 normal-case font-medium">Añade los nuevos elementos a tu trabajo actual.</span>
            </Button>
            <Button variant="outline" onClick={() => executeImport(false)} className="h-16 rounded-2xl flex flex-col items-start px-6 gap-0 border-destructive/50 text-destructive">
              <div className="flex items-center gap-2"><RefreshCw className="w-4 h-4" /> <span className="font-black uppercase">Reemplazar Todo</span></div>
              <span className="text-[10px] opacity-80 normal-case font-medium">Borra tu contenido actual y usa el del backup.</span>
            </Button>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setIsImportModalOpen(false)}>Cancelar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}