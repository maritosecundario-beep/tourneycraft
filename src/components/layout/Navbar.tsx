
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Users, UserPlus, Settings, LayoutDashboard, Database, LogIn, LogOut, MoreHorizontal, Sparkles, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useAuth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export function Navbar() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!auth) {
      toast({ title: "Error", description: "Servicio de autenticación no disponible.", variant: "destructive" });
      return;
    }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Bienvenido", description: "Has iniciado sesión correctamente." });
    } catch (error: any) {
      console.error("Auth Error:", error);
      let message = "No se pudo completar la autenticación.";
      if (error.code === 'auth/operation-not-allowed') {
        message = "El proveedor de Google no está habilitado. Actívalo en el Firebase Console.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        message = "Has cerrado la ventana de inicio de sesión.";
      }
      toast({ 
        title: "Error de Acceso", 
        description: message, 
        variant: "destructive" 
      });
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({ title: "Sesión cerrada", description: "Vuelve pronto." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cerrar la sesión.", variant: "destructive" });
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Comunidad', href: '/gallery', icon: Globe },
    { name: 'AI Studio', href: '/ai-studio', icon: Sparkles, highlight: true },
    { name: 'Clubs', href: '/teams', icon: Users },
    { name: 'Agentes', href: '/players', icon: UserPlus },
    { name: 'Torneos', href: '/tournaments', icon: Trophy },
  ];

  const moreItems = [
    { name: 'Data Sync', href: '/backups', icon: Database },
    { name: 'Ajustes', href: '/settings', icon: Settings },
  ];

  return (
    <>
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-card border-r border-border flex-col py-8 z-50">
        <div className="px-6 mb-12 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Trophy className="text-primary-foreground w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Tourney<span className="text-accent">Craft</span>
          </span>
        </div>

        <div className="flex-1 px-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" 
                    : "hover:bg-muted text-muted-foreground hover:text-foreground",
                  item.highlight && !isActive && "text-accent"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "" : "group-hover:text-accent")} />
                <span className="font-bold text-sm">{item.name}</span>
                {item.highlight && !isActive && <span className="absolute right-3 w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />}
              </Link>
            );
          })}
          
          <div className="pt-4 mt-4 border-t border-border/50">
            {moreItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "" : "group-hover:text-accent")} />
                  <span className="font-bold text-sm">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="px-4 mt-auto">
          {!isUserLoading && (
            <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
              {user ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border-2 border-primary/50">
                      <AvatarImage src={user.photoURL || undefined} />
                      <AvatarFallback className="font-bold">{user.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <p className="text-[11px] font-black truncate uppercase tracking-tight">{user.displayName}</p>
                      <p className="text-[9px] text-accent uppercase font-black tracking-widest">Conectado</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full justify-start h-8 px-2 hover:bg-destructive/10 hover:text-destructive" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    <span className="text-xs font-bold">Cerrar Sesión</span>
                  </Button>
                </div>
              ) : (
                <Button variant="default" size="sm" className="w-full h-10 shadow-lg shadow-primary/20 font-black" onClick={handleLogin}>
                  <LogIn className="w-4 h-4 mr-2" />
                  <span>CONECTAR</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </nav>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        {navItems.filter(i => i.name !== 'Torneos' && i.name !== 'Comunidad').map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-black uppercase tracking-tight">{item.name}</span>
              {isActive && <span className="absolute top-0 w-8 h-1 bg-primary rounded-b-full" />}
            </Link>
          );
        })}
        
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground outline-none">
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[9px] font-black uppercase tracking-tight">Más</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-[2.5rem] border-none bg-card p-6 outline-none max-h-[80vh] overflow-y-auto scrollbar-hide">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-left text-xl font-black uppercase tracking-tighter">Opciones</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/gallery" className="flex flex-col items-center gap-3 p-6 bg-muted/30 rounded-3xl border border-border/50 hover:bg-muted/50 transition-colors">
                <Globe className="w-6 h-6 text-accent" />
                <span className="font-black text-xs uppercase tracking-tight text-foreground">Comunidad</span>
              </Link>
              <Link href="/tournaments" className="flex flex-col items-center gap-3 p-6 bg-muted/30 rounded-3xl border border-border/50 hover:bg-muted/50 transition-colors">
                <Trophy className="w-6 h-6 text-primary" />
                <span className="font-black text-xs uppercase tracking-tight text-foreground">Torneos</span>
              </Link>
              {moreItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className="flex flex-col items-center gap-3 p-6 bg-muted/30 rounded-3xl border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <item.icon className="w-6 h-6 text-primary" />
                  <span className="font-black text-xs uppercase tracking-tight text-foreground">{item.name}</span>
                </Link>
              ))}
            </div>
            <div className="mt-8 pt-8 border-t border-border">
              {!isUserLoading && (
                user ? (
                  <div className="flex items-center justify-between bg-muted/20 p-4 rounded-3xl">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-primary/50 shadow-lg">
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback className="font-bold text-lg">{user.displayName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden">
                        <p className="font-black text-sm uppercase truncate max-w-[120px]">{user.displayName}</p>
                        <p className="text-[10px] text-accent font-black uppercase tracking-widest">Cuenta Vinculada</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl font-bold border-destructive/50 text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full h-14 shadow-lg shadow-primary/20 rounded-2xl font-black text-lg" onClick={handleLogin}>
                    <LogIn className="w-5 h-5 mr-3" /> CONECTAR GOOGLE
                  </Button>
                )
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  );
}
