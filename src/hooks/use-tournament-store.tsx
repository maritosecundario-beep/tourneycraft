
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
  importData: (data: { teams?: Team[], players?: Player[], tournaments?: Tournament[], settings?: GlobalSettings }, merge: boolean) => void;
}

const defaultSettings: GlobalSettings = {
  currency: 'CR',
  positions: ['PG', 'SG', 'SF', 'PF', 'C'],
  positionColors: {
    'PG': '#3b82f6',
    'SG': '#f59e0b',
    'SF': '#10b981',
    'PF': '#ef4444',
    'C': '#8b5cf6'
  },
  attributeNames: ['Triples', 'Tiro Medio', 'Tiro Libre', 'Mate', 'Bandeja', 'Drible', 'Físico', 'Estilo', 'Tapón', 'Robo'],
  theme: 'dark',
};

// Seed Data helper
const generateSeedData = () => {
  const sudNames = ['Torrent', 'Mislata', 'Alaquàs', 'Aldaia', 'Manises', 'Xirivella', 'Quart de Poblet', 'Paiporta', 'Catarroja', 'Alfafar'];
  const nordNames = ['Paterna', 'Burjassot', 'Alboraia', 'Moncada', 'Puçol', 'El Puig', 'Rafelbunyol', 'Meliana', 'Foios', 'Almàssera'];
  
  const allTeams: Team[] = [];
  const allPlayers: Player[] = [];

  const createTeam = (name: string, region: 'Sud' | 'Nord', isTop: boolean) => {
    const id = name.toLowerCase().replace(/\s/g, '-');
    const team: Team = {
      id,
      name,
      abbreviation: name.substring(0, 3).toUpperCase(),
      rating: isTop ? 92 : 75 + Math.floor(Math.random() * 15),
      region,
      emblemShape: 'shield',
      emblemPattern: 'none',
      crestPrimary: region === 'Sud' ? PREDEFINED_COLORS[24] : PREDEFINED_COLORS[0],
      crestSecondary: PREDEFINED_COLORS[35],
      crestBorderWidth: 'thin',
      venueName: `Pavelló Municipal ${name}`,
      venueCapacity: isTop ? 5000 : 1500,
      venueSurface: 'parquet',
      venueSize: isTop ? 'large' : 'medium',
      players: []
    };

    // Create 3 players for each team
    ['Estrella', 'Capità', 'Base'].forEach((role, i) => {
      const pId = `${id}-p-${i}`;
      const player: Player = {
        id: pId,
        name: `${role} de ${name}`,
        monetaryValue: isTop ? 50000 : 12000,
        jerseyNumber: i + 7,
        position: i === 0 ? 'PG' : i === 1 ? 'SF' : 'C',
        teamId: id,
        attributes: defaultSettings.attributeNames.map(name => ({
          name,
          value: isTop ? 85 + Math.floor(Math.random() * 15) : 60 + Math.floor(Math.random() * 30)
        })),
        uniformStyle: 'stripes',
        kitPrimary: team.crestPrimary,
        kitSecondary: team.crestSecondary,
        crestPlacement: 'left',
        sponsorPlacement: 'middle',
        brandPlacement: 'right'
      };
      allPlayers.push(player);
    });

    return team;
  };

  sudNames.forEach(name => allTeams.push(createTeam(name, 'Sud', name === 'Torrent' || name === 'Mislata')));
  nordNames.forEach(name => allTeams.push(createTeam(name, 'Nord', name === 'Paterna' || name === 'Burjassot')));

  const tourney: Tournament = {
    id: 'lliga-horta-1',
    name: "Lliga Basket l'Horta",
    sport: 'Basketball',
    mode: 'arcade',
    managedTeamId: 'alaquàs',
    format: 'league',
    leagueType: 'groups',
    groups: [
      { name: "Grup Sud (l'Horta Sud)", teamIds: allTeams.filter(t => t.region === 'Sud').map(t => t.id) },
      { name: "Grup Nord (l'Horta Nord)", teamIds: allTeams.filter(t => t.region === 'Nord').map(t => t.id) }
    ],
    scoringRuleType: 'nToNRange',
    teams: allTeams.map(t => t.id),
    matches: [],
    settingsLocked: false,
    winReward: 100,
    lossPenalty: 25,
    drawReward: 40,
    variability: 15,
    playoffSpots: 4,
    relegationSpots: 2,
    currentSeason: 1
  };

  return { teams: allTeams, players: allPlayers, tournaments: [tourney] };
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
        setTeams(parsed.teams || []);
        setPlayers(parsed.players || []);
        setTournaments(parsed.tournaments || []);
        setSettings(parsed.settings || defaultSettings);
      } catch (e) {
        console.error("Store Load Error:", e);
      }
    } else {
      // Seed with Horta Sud/Nord data if empty
      const seed = generateSeedData();
      setTeams(seed.teams);
      setPlayers(seed.players);
      setTournaments(seed.tournaments);
      setSettings(defaultSettings);
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

  const importData = useCallback((data: any, merge: boolean) => {
    if (merge) {
      setTeams(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        const newOnes = (data.teams || []).filter((t: any) => !existingIds.has(t.id));
        return [...prev, ...newOnes];
      });
      setPlayers(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newOnes = (data.players || []).filter((p: any) => !existingIds.has(p.id));
        return [...prev, ...newOnes];
      });
      setTournaments(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        const newOnes = (data.tournaments || []).filter((t: any) => !existingIds.has(t.id));
        return [...prev, ...newOnes];
      });
      if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
    } else {
      setTeams(data.teams || []);
      setPlayers(data.players || []);
      setTournaments(data.tournaments || []);
      if (data.settings) setSettings(data.settings);
    }
  }, []);

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
    importData,
  }), [teams, players, tournaments, settings, addTeam, updateTeam, deleteTeam, addPlayer, updatePlayer, deletePlayer, addTournament, updateTournament, updateSettings, importData]);

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
