
"use client";

import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Trash2, Cloud, AlertTriangle, CheckCircle2, PlusCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRef, useState } from 'react';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function BackupsPage() {
  const { teams, players, tournaments, settings, importData } = useTournamentStore();
  const { toast } = useToast();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [pendingData, setPendingData] = useState<any>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleExport = () => {
    const data = {
      teams,
      players,
      tournaments,
      settings,
      exportDate: new Date().toISOString(),
      version: "1.2"
    };
    
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (!data.teams && !data.players && !data.tournaments) {
          throw new Error("Formato inválido");
        }

        setPendingData(data);
        setIsImportModalOpen(true);
      } catch (err) {
        toast({ title: "Error al importar", description: "El archivo no es un backup válido.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
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
          <Cloud className="text-primary" /> Cloud & Data Sync
        </h1>
        <p className="text-muted-foreground">Gestiona la persistencia, portabilidad y fusión de tus datos.</p>
      </header>

      <div className="grid gap-6">
        <Card className="border-none bg-card shadow-xl overflow-hidden">
          <div className={cn("h-1 w-full", user ? "bg-accent" : "bg-yellow-500")} />
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Cloud Synchronization {user && <CheckCircle2 className="w-5 h-5 text-accent" />}
                </CardTitle>
                <CardDescription>
                  {user 
                    ? `Sincronizado con: ${user.email}` 
                    : "Tus datos se guardan localmente. Conecta para habilitar la nube."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="p-4 bg-accent/10 rounded-xl border border-accent/20">
                <p className="text-sm text-accent font-medium">
                  Tus datos están protegidos. Los cambios se sincronizan en tiempo real con tu cuenta.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20 flex gap-3">
                <AlertTriangle className="text-yellow-500 shrink-0" />
                <p className="text-sm text-yellow-500">
                  Cuidado: Si borras los datos de tu navegador perderás tu progreso. Usa backups manuales o conecta con Google.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none bg-card shadow-xl hover:ring-2 hover:ring-primary transition-all rounded-[2rem]">
            <CardHeader>
              <CardTitle className="text-lg">Exportar JSON</CardTitle>
              <CardDescription>Descarga una copia completa de tu universo deportivo.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleExport} className="w-full h-12 shadow-lg shadow-primary/20 rounded-xl font-black">
                <Download className="w-4 h-4 mr-2" /> DESCARGAR BACKUP
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none bg-card shadow-xl hover:ring-2 hover:ring-accent transition-all rounded-[2rem]">
            <CardHeader>
              <CardTitle className="text-lg">Importar JSON</CardTitle>
              <CardDescription>Carga un archivo externo para fusionar o restaurar.</CardDescription>
            </CardHeader>
            <CardContent>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".json"
              />
              <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="w-full h-12 rounded-xl font-black">
                <Upload className="w-4 h-4 mr-2" /> SELECCIONAR ARCHIVO
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none bg-card shadow-xl border-t-4 border-destructive/20 rounded-[2rem]">
          <CardHeader>
            <CardTitle className="text-lg text-destructive">Zona de Peligro</CardTitle>
            <CardDescription>Acciones destructivas permanentes sobre el almacenamiento local.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" className="w-full h-12 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white border border-destructive/20 rounded-xl font-black" onClick={() => {
              if (confirm("¿BORRAR TODO? Se eliminarán todos los datos locales.")) {
                localStorage.removeItem('tourneycraft-store');
                window.location.reload();
              }
            }}>
              <Trash2 className="w-4 h-4 mr-2" /> BORRAR DATOS LOCALES
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">¿Cómo deseas importar?</DialogTitle>
            <DialogDescription>
              El archivo contiene {pendingData?.teams?.length || 0} clubs, {pendingData?.players?.length || 0} agentes y {pendingData?.tournaments?.length || 0} torneos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button 
              onClick={() => executeImport(true)} 
              className="h-16 rounded-2xl flex flex-col items-start px-6 gap-0 bg-accent hover:bg-accent/90"
            >
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> <span className="font-black uppercase">Unir (Merge)</span>
              </div>
              <span className="text-[10px] opacity-80 normal-case font-medium">Añade los nuevos elementos sin borrar tu trabajo actual.</span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => executeImport(false)} 
              className="h-16 rounded-2xl flex flex-col items-start px-6 gap-0 border-destructive/50 text-destructive hover:bg-destructive hover:text-white"
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> <span className="font-black uppercase">Reemplazar Todo</span>
              </div>
              <span className="text-[10px] opacity-80 normal-case font-medium">BORRA todo tu contenido actual y lo sustituye por el del archivo.</span>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsImportModalOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
