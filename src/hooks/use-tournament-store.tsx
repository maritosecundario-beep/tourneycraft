"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Team, Player, Tournament, GlobalSettings } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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
  attributeNames: ['Power', 'Speed', 'Technique', 'Defense', 'Mental'],
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
      const parsed = JSON.parse(saved);
      const migratedTeams = (parsed.teams || []).map((t: any) => ({
        ...t,
        primaryColor: t.primaryColor || '#3b82f6',
        secondaryColor: t.secondaryColor || '#ffffff',
        uniformStyle: t.uniformStyle || 'solid',
        emblemShape: t.emblemShape || 'shield',
        venueName: t.venueName || 'Main Arena',
        venueCapacity: t.venueCapacity || 5000,
        venueSurface: t.venueSurface || 'hardcourt'
      }));
      
      setTeams(migratedTeams);
      setPlayers(parsed.players || []);
      setTournaments(parsed.tournaments || []);
      
      const baseSettings = parsed.settings || defaultSettings;
      // Migration for old themes
      if (!['dark', 'midnight', 'obsidian', 'light', 'nord', 'retro'].includes(baseSettings.theme)) {
        baseSettings.theme = 'dark';
      }
      setSettings(baseSettings);
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
  }, [user, db, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
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

      // Apply theme class to document
      document.documentElement.className = settings.theme || 'dark';
    }
  }, [teams, players, tournaments, settings, isLoaded, user, db]);

  const addTeam = (team: Team) => setTeams((prev) => [...prev, team]);
  const updateTeam = (team: Team) => setTeams((prev) => prev.map((t) => (t.id === team.id ? team : t)));
  const deleteTeam = (id: string) => setTeams((prev) => prev.filter((t) => t.id !== id));

  const addPlayer = (player: Player) => setPlayers((prev) => [...prev, player]);
  const updatePlayer = (player: Player) => setPlayers((prev) => prev.map((p) => (p.id === player.id ? player : p)));
  const deletePlayer = (id: string) => setPlayers((prev) => prev.filter((p) => p.id !== id));

  const addTournament = (tournament: Tournament) => setTournaments((prev) => [...prev, tournament]);
  const updateTournament = (tournament: Tournament) => setTournaments((prev) => prev.map((t) => (t.id === tournament.id ? tournament : t)));

  const updateSettings = (newSettings: Partial<GlobalSettings>) => setSettings((prev) => ({ ...prev, ...newSettings }));

  return (
    <TournamentContext.Provider
      value={{
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
      }}
    >
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
