
"use client";

import { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Users, Globe, Download, Loader2, Star, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { Badge } from '@/components/ui/badge';

export default function GalleryPage() {
  const [publicTournaments, setPublicTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const db = useFirestore();
  const { toast } = useToast();
  const { importData } = useTournamentStore();

  useEffect(() => {
    const fetchGallery = async () => {
      if (!db) return;
      try {
        const q = query(collection(db, 'publicTournaments'), orderBy('publishedAt', 'desc'), limit(24));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPublicTournaments(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, [db]);

  const handleImport = (t: any) => {
    const confirmImport = confirm(`¿Importar universo "${t.name}"? Se fusionará con tus datos actuales.`);
    if (confirmImport && t.snapshot) {
      importData({
        teams: t.snapshot.teams,
        players: t.snapshot.players,
        tournaments: [{
          ...t,
          id: Math.random().toString(36).substr(2, 9), // Nuevo ID local
          ownerId: undefined // Pasa a ser propiedad del usuario local
        }]
      }, true);
      toast({ title: "Universo Importado", description: "El torneo y sus participantes ya están en tu panel." });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <header className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-accent/20 rounded-3xl flex items-center justify-center">
          <Globe className="text-accent w-8 h-8" />
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tighter">Comunidad TourneyCraft</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Explora e importa los universos deportivos creados por otros arquitectos de l'Horta.</p>
      </header>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="font-bold uppercase text-xs">Conectando con el metaverso...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicTournaments.map((t) => (
            <Card key={t.id} className="border-none bg-card hover:ring-2 hover:ring-accent transition-all shadow-xl rounded-[2.5rem] overflow-hidden group">
              <div className="h-2 bg-accent w-full" />
              <CardHeader className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1 overflow-hidden">
                    <CardTitle className="text-xl mb-1 truncate font-black uppercase tracking-tight">{t.name}</CardTitle>
                    <CardDescription className="uppercase font-black tracking-[0.2em] text-[10px] text-primary">
                      {t.sport} • POR {t.ownerName || 'Anónimo'}
                    </CardDescription>
                  </div>
                  <div className="p-3 bg-accent/10 rounded-2xl">
                    <Trophy className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/30 rounded-2xl text-center">
                    <Users className="w-4 h-4 mx-auto mb-1 opacity-50" />
                    <p className="text-xs font-black">{t.participants?.length || 0}</p>
                    <p className="text-[8px] font-bold uppercase opacity-50">Equipos</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-2xl text-center">
                    <Calendar className="w-4 h-4 mx-auto mb-1 opacity-50" />
                    <p className="text-xs font-black">S{t.currentSeason}</p>
                    <p className="text-[8px] font-bold uppercase opacity-50">Progreso</p>
                  </div>
                </div>

                <Button onClick={() => handleImport(t)} className="w-full h-12 rounded-xl font-black bg-primary shadow-lg shadow-primary/20">
                  <Download className="w-4 h-4 mr-2" /> IMPORTAR UNIVERSO
                </Button>
              </CardContent>
            </Card>
          ))}
          
          {publicTournaments.length === 0 && (
            <div className="col-span-full py-20 text-center bg-muted/10 rounded-[3rem] border-2 border-dashed">
              <Globe className="w-16 h-16 text-muted mx-auto mb-4 opacity-20" />
              <p className="text-xl font-bold text-muted-foreground uppercase">La galería está vacía</p>
              <p className="text-sm text-muted-foreground mt-2">¡Sé el primero en publicar un torneo desde tu panel!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
