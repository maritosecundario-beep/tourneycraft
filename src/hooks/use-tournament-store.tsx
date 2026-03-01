
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Team, Player, Tournament, GlobalSettings } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
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
  transferPlayer: (playerId: string, toTeamId: string | undefined) => void;
  applySanction: (targetId: string, type: 'team-budget' | 'player-suspension', value: number) => void;
  importData: (data: { teams?: Team[], players?: Player[], tournaments?: Tournament[], settings?: GlobalSettings }, merge: boolean) => void;
}

const defaultSettings: GlobalSettings = {
  currency: 'CR',
  positions: ['Sharpshooter', 'Blitz', 'Defenseman'],
  positionColors: {
    'Sharpshooter': '#ef4444',
    'Blitz': '#0ea5e9',
    'Defenseman': '#22c55e',
  },
  attributeNames: [
    'Triples', 'Tiro Medio', 'Tiro Libre', 'Mate', 'Bandeja', 
    'Drible', 'Físico', 'Estilo', 'Tapón', 'Robo'
  ],
  theme: 'midnight',
};

const generateSeedData = () => {
  const sudNames = [
    { name: 'Torrent', top: true },
    { name: 'Mislata', top: true },
    { name: 'Alaquàs', top: false }, // Player team
    { name: 'Aldaia', top: false },
    { name: 'Manises', top: false },
    { name: 'Xirivella', top: false },
    { name: 'Quart de Poblet', top: false },
    { name: 'Paiporta', top: false },
    { name: 'Catarroja', top: false },
    { name: 'Alfafar', top: false }
  ];

  const nordNames = [
    { name: 'Paterna', top: true },
    { name: 'Burjassot', top: true },
    { name: 'Alboraia', top: false },
    { name: 'Moncada', top: false },
    { name: 'Puçol', top: false },
    { name: 'El Puig', top: false },
    { name: 'Rafelbunyol', top: false },
    { name: 'Meliana', top: false },
    { name: 'Foios', top: false },
    { name: 'Almàssera', top: false }
  ];
  
  const allTeams: Team[] = [];
  const allPlayers: Player[] = [];

  const createTeam = (name: string, region: 'Sud' | 'Nord', isTop: boolean) => {
    const id = name.toLowerCase().replace(/\s/g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const team: Team = {
      id,
      name,
      abbreviation: name.substring(0, 3).toUpperCase(),
      rating: isTop ? 90 : 72 + Math.floor(Math.random() * 15),
      budget: isTop ? 150000 : 45000,
      region,
      emblemShape: isTop ? 'shield' : 'circle',
      emblemPattern: 'none',
      crestPrimary: region === 'Sud' ? PREDEFINED_COLORS[24] : PREDEFINED_COLORS[0],
      crestSecondary: PREDEFINED_COLORS[35],
      crestBorderWidth: 'thin',
      venueName: `Arena ${name}`,
      venueCapacity: isTop ? 6000 : 2000,
      venueSurface: 'parquet',
      venueSize: isTop ? 'large' : 'medium',
      players: []
    };

    ['Alpha', 'Beta', 'Gamma'].forEach((role, i) => {
      const pId = `${id}-p-${i}`;
      const player: Player = {
        id: pId,
        name: `${role} de ${name}`,
        monetaryValue: isTop ? 40000 : 10000,
        jerseyNumber: i + 10,
        position: defaultSettings.positions[i % 3],
        teamId: id,
        suspensionMatchdays: 0,
        attributes: defaultSettings.attributeNames.map(name => ({
          name,
          value: isTop ? 80 + Math.floor(Math.random() * 20) : 55 + Math.floor(Math.random() * 35)
        })),
        uniformStyle: 'solid',
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

  sudNames.forEach(t => allTeams.push(createTeam(t.name, 'Sud', t.top)));
  nordNames.forEach(t => allTeams.push(createTeam(t.name, 'Nord', t.top)));

  const tourney: Tournament = {
    id: 'horta-elite-league',
    name: "Lliga l'Horta Élite",
    sport: 'Basketball',
    mode: 'arcade',
    managedParticipantId: 'alaquas',
    entryType: 'teams',
    format: 'league',
    leagueType: 'groups',
    groups: [
      { name: "Horta Sud", participantIds: allTeams.filter(t => t.region === 'Sud').map(t => t.id) },
      { name: "Horta Nord", participantIds: allTeams.filter(t => t.region === 'Nord').map(t => t.id) }
    ],
    scoringRuleType: 'nToNRange',
    nToNRangeMin: 80,
    nToNRangeMax: 150,
    participants: allTeams.map(t => t.id),
    matches: [],
    settingsLocked: false,
    winReward: 6000,
    lossPenalty: 1500,
    drawReward: 2500,
    variability: 12,
    playoffSpots: 4,
    reliciationSpots: 2,
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
      const seed = generateSeedData();
      setTeams(seed.teams);
      setPlayers(seed.players);
      setTournaments(seed.tournaments);
      setSettings(defaultSettings);
    }
    setIsLoaded(true);
  }, []);

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
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [teams, players, tournaments, settings, isLoaded, user?.uid, db]);

  useEffect(() => {
    if (isLoaded) {
      const themeList = ['light', 'dark', 'midnight', 'obsidian', 'nord', 'retro'];
      document.documentElement.classList.remove(...themeList);
      document.documentElement.classList.add(settings.theme);
      if (['dark', 'midnight', 'obsidian'].includes(settings.theme)) {
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.style.colorScheme = 'light';
      }
    }
  }, [settings.theme, isLoaded]);

  const transferPlayer = useCallback((playerId: string, toTeamId: string | undefined) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        const oldTeamId = p.teamId;
        const playerVal = p.monetaryValue;
        if (toTeamId) {
          setTeams(tPrev => tPrev.map(t => {
            if (t.id === toTeamId) return { ...t, budget: t.budget - playerVal };
            if (t.id === oldTeamId) return { ...t, budget: t.budget + playerVal };
            return t;
          }));
        } else if (oldTeamId) {
          setTeams(tPrev => tPrev.map(t => {
            if (t.id === oldTeamId) return { ...t, budget: t.budget + playerVal };
            return t;
          }));
        }
        return { ...p, teamId: toTeamId };
      }
      return p;
    }));
  }, []);

  const applySanction = useCallback((targetId: string, type: 'team-budget' | 'player-suspension', value: number) => {
    if (type === 'team-budget') {
      setTeams(prev => prev.map(t => t.id === targetId ? { ...t, budget: t.budget - value } : t));
    } else {
      setPlayers(prev => prev.map(p => p.id === targetId ? { ...p, suspensionMatchdays: p.suspensionMatchdays + value } : p));
    }
  }, []);

  const importData = useCallback((data: any, merge: boolean) => {
    if (merge) {
      setTeams(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        return [...prev, ...(data.teams || []).filter((t: any) => !existingIds.has(t.id))];
      });
      setPlayers(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        return [...prev, ...(data.players || []).filter((p: any) => !existingIds.has(p.id))];
      });
      setTournaments(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        return [...prev, ...(data.tournaments || []).filter((t: any) => !existingIds.has(t.id))];
      });
      if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
    } else {
      setTeams(data.teams || []);
      setPlayers(data.players || []);
      setTournaments(data.tournaments || []);
      if (data.settings) setSettings(data.settings);
    }
  }, []);

  const addTeam = useCallback((team: Team) => setTeams(p => [...p, team]), []);
  const updateTeam = useCallback((team: Team) => setTeams(p => p.map(t => t.id === team.id ? team : t)), []);
  const deleteTeam = useCallback((id: string) => setTeams(p => p.filter(t => t.id !== id)), []);
  const addPlayer = useCallback((player: Player) => setPlayers(p => [...p, player]), []);
  const updatePlayer = useCallback((player: Player) => setPlayers(p => p.map(p2 => p2.id === player.id ? player : p2)), []);
  const deletePlayer = useCallback((id: string) => setPlayers(p => p.filter(p2 => p2.id !== id)), []);
  const addTournament = useCallback((t: Tournament) => setTournaments(p => [...p, t]), []);
  const updateTournament = useCallback((t: Tournament) => setTournaments(p => p.map(t2 => t2.id === t.id ? t : t2)), []);
  const updateSettings = useCallback((s: Partial<GlobalSettings>) => setSettings(p => ({ ...p, ...s })), []);

  const value = useMemo(() => ({
    teams, players, tournaments, settings, addTeam, updateTeam, deleteTeam, addPlayer, updatePlayer, deletePlayer, addTournament, updateTournament, updateSettings, importData, transferPlayer, applySanction
  }), [teams, players, tournaments, settings, addTeam, updateTeam, deleteTeam, addPlayer, updatePlayer, deletePlayer, addTournament, updateTournament, updateSettings, importData, transferPlayer, applySanction]);

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>;
}

export function useTournamentStore() {
  const context = useContext(TournamentContext);
  if (!context) throw new Error('useTournamentStore must be used within a TournamentProvider');
  return context;
}
