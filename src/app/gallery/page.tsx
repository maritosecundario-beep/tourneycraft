'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase/provider';
import { useTournamentStore } from '@/hooks/use-tournament-store';
import { useToast } from '@/hooks/use-toast';
import { LoginButton } from '@/components/auth/LoginButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertCircle,
  ArrowDownToLine,
  BookOpen,
  Globe2,
  Loader2,
  PackageOpen,
  Share2,
  Trash2,
  Users,
} from 'lucide-react';
import {
  buildCommunityPackage,
  COMMUNITY_DOCUMENT_MAX_BYTES,
  COMMUNITY_PAYLOAD_MAX_BYTES,
  communityPackageCounts,
  isCommunityItem,
  isCommunityKind,
  inferCommunityKind,
  parseCommunityPackage,
  type CommunityItem,
  type CommunityKind,
} from './community-data';

const kindLabels: Record<CommunityKind, string> = {
  profile: 'Perfil completo',
  team: 'Equipo',
  player: 'Jugador',
  tournament: 'Torneo',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readableError(error: unknown): string {
  if (error instanceof Error) {
    const code = 'code' in error ? error.code : undefined;
    if (code === 'permission-denied') {
      return 'Firebase ha rechazado la operación. Para publicar debes iniciar sesión con Google y tener desplegadas las reglas de Firestore de este proyecto.';
    }
    if (code === 'auth/unauthorized-domain') {
      return 'Este dominio no está autorizado en Firebase Authentication. Añade tourneycraft.vercel.app a los dominios autorizados del proyecto.';
    }
    return error.message;
  }
  return 'Ocurrió un error inesperado.';
}

export default function GalleryPage() {
  const db = useFirestore();
  const user = useUser();
  const { teams, players, tournaments, settings, importData } = useTournamentStore();
  const { toast } = useToast();
  const [items, setItems] = useState<CommunityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [invalidItems, setInvalidItems] = useState(0);
  const [kind, setKind] = useState<CommunityKind>('team');
  const [selectedId, setSelectedId] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [workingItemId, setWorkingItemId] = useState<string | null>(null);
  const communityFileInputRef = useRef<HTMLInputElement>(null);

  const options = useMemo(() => {
    if (kind === 'team') return teams.map((item) => ({ id: item.id, name: item.name }));
    if (kind === 'player') return players.map((item) => ({ id: item.id, name: item.name }));
    if (kind === 'tournament') return tournaments.map((item) => ({ id: item.id, name: item.name }));
    return [];
  }, [kind, teams, players, tournaments]);

  const isGoogleUser = !!user?.providerData.some((provider) => provider.providerId === 'google.com');

  useEffect(() => {
    if (!db) {
      setIsLoading(true);
      return;
    }
    const communityQuery = query(
      collection(db, 'communityItems'),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    setIsLoading(true);
    setLoadError(null);
    return onSnapshot(
      communityQuery,
      (snapshot) => {
        const validItems: CommunityItem[] = [];
        let invalidCount = 0;
        snapshot.forEach((entry) => {
          const data = entry.data();
          if (isCommunityItem(data)) validItems.push({ ...data, id: entry.id });
          else invalidCount += 1;
        });
        setItems(validItems);
        setInvalidItems(invalidCount);
        setLoadError(null);
        setIsLoading(false);
      },
      (error) => {
        setLoadError(`No se pudo cargar la comunidad: ${error.message}`);
        setIsLoading(false);
      },
    );
  }, [db]);

  const publishPackage = async (
    shareKind: CommunityKind,
    payload: ReturnType<typeof buildCommunityPackage>,
    itemTitle: string,
  ) => {
    if (!db) {
      toast({ title: 'Servicio no disponible', description: 'No se pudo conectar con la base de datos.', variant: 'destructive' });
      return;
    }
    if (!user || !isGoogleUser) {
      toast({ title: 'Inicia sesión con Google', description: 'Solo las cuentas de Google pueden publicar en la comunidad.', variant: 'destructive' });
      return;
    }
    setIsSharing(true);
    try {
      const payloadJson = JSON.stringify(payload);
      const payloadBytes = new TextEncoder().encode(payloadJson).length;
      if (payloadBytes > COMMUNITY_PAYLOAD_MAX_BYTES) {
        throw new Error('El paquete supera el límite de 850 KB. Comparte elementos individuales o reduce su contenido.');
      }
      parseCommunityPackage(payloadJson);
      const now = new Date().toISOString();
      const item = {
        ownerId: user.uid,
        authorName: (user.displayName || 'Jugador').slice(0, 80),
        type: shareKind,
        title: itemTitle.slice(0, 100),
        payloadJson,
        createdAt: now,
        updatedAt: now,
      };
      if (!isCommunityItem(item) ||
          new TextEncoder().encode(JSON.stringify(item)).length >= COMMUNITY_DOCUMENT_MAX_BYTES) {
        throw new Error('El contenido no cumple el formato o el tamaño permitido para publicar.');
      }
      await addDoc(collection(db, 'communityItems'), item);
      toast({ title: 'Publicado en la comunidad', description: `${kindLabels[shareKind]} ya está disponible públicamente.` });
    } catch (error) {
      toast({ title: 'No se pudo publicar', description: readableError(error), variant: 'destructive' });
    } finally {
      setIsSharing(false);
    }
  };

  const shareItem = async (shareKind: CommunityKind, id?: string) => {
    try {
      const payload = buildCommunityPackage(shareKind, id, teams, players, tournaments, settings);
      const title = shareKind === 'profile'
        ? `${user?.displayName || 'Perfil'} — perfil completo`
        : options.find((option) => option.id === id)?.name ||
          [...teams, ...players, ...tournaments].find((entry) => entry.id === id)?.name ||
          kindLabels[shareKind];
      await publishPackage(shareKind, payload, title);
    } catch (error) {
      toast({ title: 'No se pudo preparar el contenido', description: readableError(error), variant: 'destructive' });
    }
  };

  const handleCommunityFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const fileContents = await file.text();
      const fileData: unknown = JSON.parse(fileContents);
      const payload = parseCommunityPackage(fileContents);
      const fileKind = isRecord(fileData) && fileData.format === 'tourneycraft-profile'
        ? 'profile'
        : inferCommunityKind(payload);
      const itemName = fileKind === 'profile'
        ? `${user?.displayName || 'Perfil'} — ${file.name.replace(/\.json$/i, '')}`
        : fileKind === 'team'
          ? payload.teams[0].name
          : fileKind === 'player'
            ? payload.players[0].name
            : payload.tournaments[0].name;
      await publishPackage(fileKind, payload, itemName);
    } catch (error) {
      toast({ title: 'No se pudo compartir el archivo', description: readableError(error), variant: 'destructive' });
    } finally {
      event.target.value = '';
    }
  };

  const loadItem = (item: CommunityItem) => {
    setWorkingItemId(item.id);
    try {
      const payload = parseCommunityPackage(item.payloadJson);
      importData(payload, true);
      toast({
        title: 'Contenido añadido',
        description: communityPackageCounts(payload) || 'Se importó la configuración compartida.',
      });
    } catch (error) {
      toast({ title: 'No se pudo cargar el contenido', description: readableError(error), variant: 'destructive' });
    } finally {
      setWorkingItemId(null);
    }
  };

  const removeItem = async (item: CommunityItem) => {
    if (!db || !user || item.ownerId !== user.uid || !isGoogleUser) return;
    setWorkingItemId(item.id);
    try {
      await deleteDoc(doc(db, 'communityItems', item.id));
    } catch (error) {
      toast({ title: 'No se pudo eliminar', description: readableError(error), variant: 'destructive' });
    } finally {
      setWorkingItemId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <Globe2 className="h-5 w-5" />
          <p className="text-xs font-black uppercase tracking-[0.2em]">TourneyCraft</p>
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">Comunidad</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Descubre equipos, jugadores, torneos y perfiles compartidos. El contenido publicado es visible para todo el mundo.
        </p>
      </header>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-black uppercase">
            <Share2 className="h-5 w-5 text-primary" /> Compartir con la comunidad
          </CardTitle>
          <CardDescription>
            Publica un paquete de exportación reutilizable. Solo las cuentas con sesión de Google pueden publicar o eliminar sus elementos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="file"
            ref={communityFileInputRef}
            onChange={handleCommunityFileChange}
            className="hidden"
            accept=".json,application/json"
          />
          {!isGoogleUser && (
            <div className="flex flex-col items-start justify-between gap-3 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center">
              <p className="text-sm text-muted-foreground">Inicia sesión con Google para publicar tu contenido.</p>
              <LoginButton />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
            <Select value={kind} onValueChange={(value) => {
              if (isCommunityKind(value)) setKind(value);
              setSelectedId('');
            }}>
              <SelectTrigger aria-label="Tipo de contenido">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="team">Equipo</SelectItem>
                <SelectItem value="player">Jugador</SelectItem>
                <SelectItem value="tournament">Torneo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedId} onValueChange={setSelectedId} disabled={options.length === 0}>
              <SelectTrigger aria-label="Seleccionar contenido">
                <SelectValue placeholder={options.length ? 'Elige qué compartir' : `No tienes ${kindLabels[kind].toLowerCase()} disponibles`} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              onClick={() => shareItem(kind, selectedId)}
              disabled={!isGoogleUser || !selectedId || isSharing}
              className="font-bold uppercase"
            >
              {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
              Compartir elemento
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => shareItem('profile')}
            disabled={!isGoogleUser || isSharing}
            className="w-full sm:w-auto"
          >
            <Users className="h-4 w-4" /> Compartir perfil y paquete completo
          </Button>
          <div className="rounded-xl border border-dashed p-4">
            <p className="mb-3 text-sm text-muted-foreground">
              También puedes publicar directamente un archivo JSON exportado desde TourneyCraft: perfil, torneo, equipo o jugador.
            </p>
            <Button
              variant="secondary"
              onClick={() => communityFileInputRef.current?.click()}
              disabled={!isGoogleUser || isSharing}
              className="w-full sm:w-auto"
            >
              {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
              Publicar archivo JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Explorar publicaciones</h2>
            <p className="text-sm text-muted-foreground">Las 50 publicaciones más recientes</p>
          </div>
          <Badge variant="secondary" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Abierto al público
          </Badge>
        </div>

        {invalidItems > 0 && (
          <div role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-muted-foreground">
            Se omitieron {invalidItems} publicación{invalidItems === 1 ? '' : 'es'} con formato no válido.
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Cargando publicaciones…
          </div>
        ) : loadError ? (
          <Card role="alert">
            <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 py-10 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <div>
                <h3 className="font-bold">No se pudieron cargar las publicaciones</h3>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  {loadError} Comprueba tu conexión o inténtalo de nuevo más tarde.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 py-10 text-center">
              <PackageOpen className="h-10 w-10 text-muted-foreground/60" />
              <div>
                <h3 className="font-bold">Todavía no hay publicaciones</h3>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  Cuando alguien comparta contenido, podrás explorarlo y añadirlo a tu colección.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const owned = item.ownerId === user?.uid;
              const counts = communityPackageCounts(parseCommunityPackage(item.payloadJson)) || 'Paquete compartido';
              return (
                <Card key={item.id} className="flex flex-col">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <Badge variant="outline">{kindLabels[item.type]}</Badge>
                      {owned && <Badge variant="secondary">Tu publicación</Badge>}
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="line-clamp-2 text-lg">{item.title}</CardTitle>
                      <CardDescription>Compartido por {item.authorName}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="mt-auto space-y-4">
                    <p className="min-h-5 text-xs text-muted-foreground">{counts}</p>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => loadItem(item)}
                        disabled={workingItemId === item.id}
                      >
                        {workingItemId === item.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <ArrowDownToLine className="h-4 w-4" />}
                        Añadir a mi colección
                      </Button>
                      {owned && (
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label={`Eliminar ${item.title}`}
                          onClick={() => removeItem(item)}
                          disabled={workingItemId === item.id}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
