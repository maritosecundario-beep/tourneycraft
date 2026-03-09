"use client";

import { useSearchParams } from 'next/navigation';
import { TournamentDetailView } from './tournament-detail-view';
import { Suspense } from 'react';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function ManageTournamentContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  if (!id) {
    return (
      <div className="p-20 text-center space-y-4">
        <Trophy className="text-muted w-16 h-16 mx-auto opacity-20" />
        <h2 className="text-2xl font-black uppercase">Torneo no especificado</h2>
        <Button asChild variant="outline" className="rounded-xl font-black">
          <Link href="/tournaments">VOLVER AL PANEL</Link>
        </Button>
      </div>
    );
  }

  return <TournamentDetailView id={id} />;
}

export default function ManageTournamentPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="font-black uppercase text-muted-foreground animate-pulse">Cargando Competición...</p>
      </div>
    }>
      <ManageTournamentContent />
    </Suspense>
  );
}