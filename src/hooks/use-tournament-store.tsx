"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Team, Player, Tournament, GlobalSettings } from '@/lib/types';

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
  positions: ['GK', 'DF', 'MD', 'FW'],
  attributeNames: ['Shoot', 'Defense', 'Speed', 'Passing'],
  theme: 'dark',
};

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('tourneycraft-store');
    if (saved) {
      const parsed = JSON.parse(saved);
      setTeams(parsed.teams || []);
      setPlayers(parsed.players || []);
      setTournaments(parsed.tournaments || []);
      setSettings(parsed.settings || defaultSettings);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('tourneycraft-store', JSON.stringify({ teams, players, tournaments, settings }));
    }
  }, [teams, players, tournaments, settings, isLoaded]);

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
