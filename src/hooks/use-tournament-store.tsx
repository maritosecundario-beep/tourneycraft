'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Team, Player, Tournament, GlobalSettings } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { PREDEFINED_COLORS } from '@/lib/colors';

interface TournamentContextType {
  teams: Team[];
  players: Player[];
  tournaments: Tournament[];
  settings: GlobalSettings;
  addTeam: (team: Team) => void;
  updateTeam: (team: Team) => void;
  deleteTeam: (id: string) => void;
  addPlayer: (player: Player) => void;
  updatePlayer: (player: Player) => void;
  deletePlayer: (id: string) => void;
  addTournament: (tournament: Tournament) => void;
  updateTournament: (tournament: Tournament) => void;
  updateSettings: (settings: Partial<GlobalSettings>) => void;
}

const defaultSettings: GlobalSettings = {
  currency: 'CR',
  positions: ['GK', 'DF', 'MF', 'FW'],
  positionColors: {
    'GK': '#f59e0b',
    'DF': '#3b82f6',
    'MF': '#10b981',
    'FW': '#ef4444'
  },
  attributeNames: ['Poder', 'Velocidad', 'Técnica', 'Defensa', 'Mental'],
  theme: 'dark',
};

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const { user } = useUser();
  const db = useFirestore();

  useEffect(() => {
    const saved = localStorage.getItem('tourneycraft-store');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Data Migration/Cleanup
        const migratedTeams = (parsed.teams || []).map((t: any) => ({
          ...t,
          emblemPattern: t.emblemPattern || 'none',
          crestBorderWidth: t.crestBorderWidth || 'thin',
          crestPrimary: t.crestPrimary || t.kitPrimary || '#3b82f6',
          crestSecondary: t.crestSecondary || t.kitSecondary || '#ffffff',
          emblemShape: t.emblemShape || 'shield',
          venueName: t.venueName || 'Arena Principal',
          venueCapacity: t.venueCapacity || 5000,
          venueSurface: t.venueSurface || 'grass',
          venueSize: t.venueSize || 'medium'
        }));

        const migratedPlayers = (parsed.players || []).map((p: any) => ({
          ...p,
          uniformStyle: p.uniformStyle || 'solid',
          kitPrimary: p.kitPrimary || PREDEFINED_COLORS[24],
          kitSecondary: p.kitSecondary || PREDEFINED_COLORS[35],
          crestPlacement: 'left',
          sponsorPlacement: 'middle',
          brandPlacement: 'right'
        }));
        
        setTeams(migratedTeams);
        setPlayers(migratedPlayers);
        setTournaments(parsed.tournaments || []);
        setSettings(parsed.settings || defaultSettings);
      } catch (e) {
        console.error("Store Migration Error:", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (user && db && isLoaded) {
      const userDocRef = doc(db, 'users', user.uid, 'backups', 'latest');
      getDoc(userDocRef).then((snapshot) => {
        if (snapshot.exists()) {
          const cloudData = snapshot.data();
          setTeams(cloudData.teams || []);
          setPlayers(cloudData.players || []);
          setTournaments(cloudData.tournaments || []);
          setSettings(cloudData.settings || defaultSettings);
          localStorage.setItem('tourneycraft-store', JSON.stringify(cloudData));
        }
      });
    }
  }, [user?.uid, db, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      document.documentElement.className = settings.theme || 'dark';
    }
  }, [settings.theme, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => {
        const dataToSave = { teams, players, tournaments, settings };
        localStorage.setItem('tourneycraft-store', JSON.stringify(dataToSave));
        
        if (user && db) {
          const userDocRef = doc(db, 'users', user.uid, 'backups', 'latest');
          setDocumentNonBlocking(userDocRef, {
            ...dataToSave,
            updatedAt: new Date().toISOString(),
            ownerId: user.uid
          }, { merge: true });
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [teams, players, tournaments, settings, isLoaded, user?.uid, db]);

  const addTeam = useCallback((team: Team) => setTeams((prev) => [...prev, team]), []);
  const updateTeam = useCallback((team: Team) => setTeams((prev) => prev.map((t) => (t.id === team.id ? team : t))), []);
  const deleteTeam = useCallback((id: string) => setTeams((prev) => prev.filter((t) => t.id !== id)), []);

  const addPlayer = useCallback((player: Player) => setPlayers((prev) => [...prev, player]), []);
  const updatePlayer = useCallback((player: Player) => setPlayers((prev) => prev.map((p) => (p.id === player.id ? player : p))), []);
  const deletePlayer = useCallback((id: string) => setPlayers((prev) => prev.filter((p) => p.id !== id)), []);

  const addTournament = useCallback((tournament: Tournament) => setTournaments((prev) => [...prev, tournament]), []);
  const updateTournament = useCallback((tournament: Tournament) => setTournaments((prev) => prev.map((t) => (t.id === tournament.id ? tournament : t))), []);

  const updateSettings = useCallback((newSettings: Partial<GlobalSettings>) => setSettings((prev) => ({ ...prev, ...newSettings })), []);

  const value = useMemo(() => ({
    teams,
    players,
    tournaments,
    settings,
    addTeam,
    updateTeam,
    deleteTeam,
    addPlayer,
    updatePlayer,
    deletePlayer,
    addTournament,
    updateTournament,
    updateSettings,
  }), [teams, players, tournaments, settings, addTeam, updateTeam, deleteTeam, addPlayer, updatePlayer, deletePlayer, addTournament, updateTournament, updateSettings]);

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournamentStore() {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournamentStore must be used within a TournamentProvider');
  }
  return context;
}
