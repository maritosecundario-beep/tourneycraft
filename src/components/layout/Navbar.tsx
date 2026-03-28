"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Users, UserPlus, Settings, LayoutDashboard, Database, MoreHorizontal, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { LoginButton } from '@/components/auth/LoginButton';

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'AI Studio', href: '/ai-studio', icon: Sparkles, highlight: true },
    { name: 'Clubs', href: '/teams', icon: Users },
    { name: 'Agentes', href: '/players', icon: UserPlus },
    { name: 'Torneos', href: '/tournaments', icon: Trophy },
  ];

  const moreItems = [
    { name: 'Backup', href: '/backups', icon: Database },
    { name: 'Ajustes', href: '/settings', icon: Settings },
  ];

  return (
    <>
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-card border-r border-border flex-col py-8 z-50">
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Trophy className="text-primary-foreground w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Tourney<span className="text-accent">Craft</span>
          </span>
        </div>

        <div className="px-6 mb-8">
          <LoginButton />
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
          <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 text-center">
            <p className="text-[10px] font-black uppercase text-muted-foreground">Versión 1.9 - Producción</p>
            <p className="text-[9px] text-accent uppercase font-bold mt-1">TourneyCraft Web</p>
            <p className="text-[8px] opacity-50 uppercase font-black mt-2">hecho por Mario Ormeño Navarro</p>
          </div>
        </div>
      </nav>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        {navItems.map((item) => {
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
              {moreItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-3 p-6 bg-muted/30 rounded-3xl border border-border/50 hover:bg-muted/50 transition-colors",
                    pathname === item.href && "border-primary bg-primary/10"
                  )}
                >
                  <item.icon className={cn("w-6 h-6", pathname === item.href ? "text-primary" : "text-muted-foreground")} />
                  <span className="font-black text-xs uppercase tracking-tight text-foreground">{item.name}</span>
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  );
}