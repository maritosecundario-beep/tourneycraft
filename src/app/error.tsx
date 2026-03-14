'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Crash:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center px-4">
      <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
        <AlertTriangle className="w-10 h-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-black uppercase tracking-tighter">Fallo de Sistema</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Se ha detectado una inconsistencia en los datos o un error de carga local. 
          Asegúrate de que tu navegador no esté bloqueando el almacenamiento local.
        </p>
      </div>
      <div className="flex gap-4">
        <Button onClick={() => window.location.reload()} variant="outline" className="rounded-xl font-black">
          RECARGAR PÁGINA
        </Button>
        <Button onClick={() => reset()} className="rounded-xl font-black shadow-lg shadow-primary/20">
          <RefreshCw className="w-4 h-4 mr-2" /> REINTENTAR
        </Button>
      </div>
    </div>
  );
}