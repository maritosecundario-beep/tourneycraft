'use client';

import { useAuth, useUser } from '@/firebase/provider';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

export function LoginButton({ compact = false }: { compact?: boolean }) {
  const auth = useAuth();
  const user = useUser();
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!auth) {
      toast({ title: 'Autenticación no disponible', description: 'No se ha podido conectar con Firebase.', variant: 'destructive' });
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
      toast({ title: 'No se pudo iniciar sesión', description: 'Comprueba la configuración de Firebase y vuelve a intentarlo.', variant: 'destructive' });
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
      toast({ title: 'No se pudo cerrar sesión', description: 'Inténtalo de nuevo.', variant: 'destructive' });
    }
  };

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={compact ? 'outline' : 'ghost'}
            aria-label={compact ? `Cuenta de ${user.displayName || user.email}` : 'Abrir menú de cuenta'}
            className={compact
              ? 'h-10 min-w-10 gap-2 rounded-full border-primary/30 px-2.5'
              : 'relative h-10 w-10 rounded-full'}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
              <AvatarFallback className="bg-primary/10 text-primary font-black uppercase">
                {user.displayName?.charAt(0) || <User className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
            {compact && <span className="max-w-24 truncate text-xs font-bold">{user.displayName?.split(' ')[0] || 'Cuenta'}</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-black uppercase leading-none">{user.displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer font-black uppercase text-xs">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar Sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleLogin} 
      aria-label="Iniciar sesión con Google"
      className={compact
        ? 'h-10 rounded-xl border-primary px-3 text-xs font-black text-primary'
        : 'h-10 rounded-xl border-primary text-[10px] font-black uppercase text-primary hover:bg-primary'}
    >
      <LogIn className={compact ? 'mr-1.5 h-4 w-4' : 'mr-2 h-4 w-4'} />
      {compact ? 'Entrar' : 'ENTRAR CON GOOGLE'}
    </Button>
  );
}
