
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Users, UserPlus, Settings, LayoutDashboard, Database, LogIn, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useAuth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

export function Navbar() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Bienvenido", description: "Sesión iniciada con éxito." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo iniciar sesión.", variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    toast({ title: "Sesión cerrada", description: "Tus datos locales siguen disponibles." });
  };

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Teams', href: '/teams', icon: Users },
    { name: 'Free Agents', href: '/players', icon: UserPlus },
    { name: 'Tournaments', href: '/tournaments', icon: Trophy },
    { name: 'Backups', href: '/backups', icon: Database },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <nav className="fixed left-0 top-0 h-full w-20 md:w-64 bg-card border-r border-border flex flex-col items-center md:items-stretch py-8 z-50">
      <div className="px-6 mb-12 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
          <Trophy className="text-primary-foreground w-6 h-6" />
        </div>
        <span className="text-xl font-bold hidden md:block tracking-tight">
          Tourney<span className="text-accent">Craft</span>
        </span>
      </div>

      <div className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
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
              <span className="font-medium hidden md:block">{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="px-4 mt-auto space-y-4">
        {!isUserLoading && (
          <div className="p-4 bg-muted/30 rounded-2xl">
            {user ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border-2 border-primary/50">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block overflow-hidden">
                    <p className="text-xs font-bold truncate">{user.displayName}</p>
                    <p className="text-[10px] text-accent uppercase font-black">Cloud Synced</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="w-full justify-start h-8 px-2 md:px-3" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="hidden md:inline">Log Out</span>
                </Button>
              </div>
            ) : (
              <Button variant="default" size="sm" className="w-full justify-start h-10 shadow-lg shadow-primary/20" onClick={handleLogin}>
                <LogIn className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Sign In</span>
              </Button>
            )}
          </div>
        )}
        
        <div className="p-4 bg-muted/50 rounded-2xl hidden md:block">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Status</p>
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", user ? "bg-accent" : "bg-yellow-500")} />
            <span className="text-sm font-medium">{user ? "Cloud Active" : "Local Mode"}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
