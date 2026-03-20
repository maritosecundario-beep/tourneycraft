'use client';

import { useAuth, useUser } from '@/firebase/provider';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function LoginButton() {
  const auth = useAuth();
  const user = useUser();

  const handleLogin = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
              <AvatarFallback className="bg-primary/10 text-primary font-black uppercase">
                {user.displayName?.charAt(0) || <User className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
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
      className="rounded-xl font-black uppercase text-[10px] h-10 border-primary text-primary hover:bg-primary"
    >
      <LogIn className="mr-2 h-4 w-4" />
      ENTRAR CON GOOGLE
    </Button>
  );
}
