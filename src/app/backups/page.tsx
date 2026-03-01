
"use client";

import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Trash2, Cloud, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';
import { useUser } from '@/firebase';

export default function BackupsPage() {
  const { teams, players, tournaments, settings, updateSettings } = useTournamentStore();
  const { toast } = useToast();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = {
      teams,
      players,
      tournaments,
      settings,
      exportDate: new Date().toISOString(),
      version: "1.0"
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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Basic validation
        if (!data.teams || !data.players || !data.tournaments) {
          throw new Error("Formato de archivo inválido");
        }

        // We use a confirm-like flow here
        if (confirm("¿Estás seguro? Esto reemplazará todos tus datos actuales.")) {
          // This is a direct store update
          localStorage.setItem('tourneycraft-store', JSON.stringify(data));
          window.location.reload(); // Refresh to apply changes
        }
      } catch (err) {
        toast({ title: "Error al importar", description: "El archivo no es un backup válido de TourneyCraft.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Cloud className="text-primary" /> Cloud & Backups
        </h1>
        <p className="text-muted-foreground">Gestiona la persistencia de tus datos y portabilidad.</p>
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
                    ? `Sincronizado con la cuenta: ${user.email}` 
                    : "Tus datos se guardan solo en este navegador. Inicia sesión para habilitar la nube."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="p-4 bg-accent/10 rounded-xl border border-accent/20">
                <p className="text-sm text-accent font-medium">
                  Tus datos están protegidos. Cualquier cambio que hagas se reflejará en todos tus dispositivos.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20 flex gap-3">
                <AlertTriangle className="text-yellow-500 shrink-0" />
                <p className="text-sm text-yellow-500">
                  Cuidado: Si borras los datos de tu navegador o cambias de dispositivo, perderás tu progreso actual si no usas Cloud Sync o Backups manuales.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none bg-card shadow-xl hover:ring-1 hover:ring-primary transition-all">
            <CardHeader>
              <CardTitle className="text-lg">Exportar Datos</CardTitle>
              <CardDescription>Descarga una copia local de todo tu universo deportivo.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleExport} className="w-full h-12 shadow-lg shadow-primary/20">
                <Download className="w-4 h-4 mr-2" /> Descargar .json
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none bg-card shadow-xl hover:ring-1 hover:ring-accent transition-all">
            <CardHeader>
              <CardTitle className="text-lg">Importar Datos</CardTitle>
              <CardDescription>Carga un archivo de backup previo para restaurar datos.</CardDescription>
            </CardHeader>
            <CardContent>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".json"
              />
              <Button onClick={handleImportClick} variant="secondary" className="w-full h-12">
                <Upload className="w-4 h-4 mr-2" /> Seleccionar Archivo
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none bg-card shadow-xl border-t-4 border-destructive/20">
          <CardHeader>
            <CardTitle className="text-lg text-destructive">Zona de Peligro</CardTitle>
            <CardDescription>Acciones destructivas permanentes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" className="w-full h-12 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white border border-destructive/20" onClick={() => {
              if (confirm("¿BORRAR TODO? Esta acción no se puede deshacer.")) {
                localStorage.removeItem('tourneycraft-store');
                window.location.reload();
              }
            }}>
              <Trash2 className="w-4 h-4 mr-2" /> Borrar Datos Locales
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';
