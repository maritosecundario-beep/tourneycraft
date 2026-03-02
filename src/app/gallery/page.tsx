
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GalleryPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirigir al dashboard ya que la comunidad ha sido deshabilitada para resolver fallos de permisos
    router.push('/');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="font-black uppercase text-muted-foreground animate-pulse">Redirigiendo...</p>
    </div>
  );
}
