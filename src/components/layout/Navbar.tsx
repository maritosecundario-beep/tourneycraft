"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Users, UserPlus, Settings, LayoutDashboard, Database, LogIn, LogOut, Menu, MoreHorizontal } from 'lucide-react';
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
    { name: 'Agents', href: '/players', icon: UserPlus },
    { name: 'Tourneys', href: '/tournaments', icon: Trophy },
  ];

  const moreItems = [
    { name: 'Backups', href: '/backups', icon: Database },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-card border-r border-border flex-col py-8 z-50">
        <div className="px-6 mb-12 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Trophy className="text-primary-foreground w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Tourney<span className="text-accent">Craft</span>
          </span>
        </div>

        <div className="flex-1 px-4 space-y-2">
          {[...navItems, ...moreItems].map((item) => {
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
                <span className="font-medium">{item.name}</span>
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
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold truncate">{user.displayName}</p>
                      <p className="text-[10px] text-accent uppercase font-black">Cloud Synced</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full justify-start h-8 px-3" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Log Out</span>
                  </Button>
                </div>
              ) : (
                <Button variant="default" size="sm" className="w-full justify-start h-10 shadow-lg shadow-primary/20" onClick={handleLogin}>
                  <LogIn className="w-4 h-4 mr-2" />
                  <span>Sign In</span>
                </Button>
              )}
            </div>
          )}
          
          <div className="p-4 bg-muted/50 rounded-2xl">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Status</p>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full animate-pulse", user ? "bg-accent" : "bg-yellow-500")} />
              <span className="text-sm font-medium">{user ? "Cloud Active" : "Local Mode"}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 z-50">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{item.name}</span>
            </Link>
          );
        })}
        
        {/* MOBILE MORE MENU */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground">
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] font-bold">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl border-none bg-card p-6">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-left text-xl font-black">Universe Options</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-4">
              {moreItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className="flex flex-col items-center gap-3 p-6 bg-muted/30 rounded-2xl"
                >
                  <item.icon className="w-6 h-6 text-primary" />
                  <span className="font-bold">{item.name}</span>
                </Link>
              ))}
            </div>
            <div className="mt-8 pt-8 border-t border-border">
              {!isUserLoading && (
                user ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-primary/50">
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold">{user.displayName}</p>
                        <p className="text-xs text-accent font-black uppercase tracking-widest">Connected</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" /> Log Out
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full h-12 shadow-lg shadow-primary/20" onClick={handleLogin}>
                    <LogIn className="w-4 h-4 mr-2" /> Sign In with Google
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
