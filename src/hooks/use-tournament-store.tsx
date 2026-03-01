'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Team, Player, Tournament, GlobalSettings, Match } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import hortaData from '@/data/horta-league.json';

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
  generateSchedule: (tournamentId: string) => void;
  resolveMatch: (tournamentId: string, matchId: string, homeScore: number, awayScore: number, isDual: boolean, homePlayerId?: string, awayPlayerId?: string) => void;
}

const defaultSettings: GlobalSettings = hortaData.settings as GlobalSettings;

const generateSeedData = () => {
  const allTeams: Team[] = hortaData.teams.map(t => ({ ...t, players: [] })) as Team[];
  const allPlayers: Player[] = [];

  allTeams.forEach(team => {
    const isTop = team.rating >= 90;
    const teamNameNoId = team.name;
    
    hortaData.settings.positions.forEach((pos, i) => {
      const pId = `${team.id}-p-${i}`;
      
      let bio = "";
      if (pos === 'Sharpshooter') bio = `Francotirador de élite de ${teamNameNoId}. Posee un lanzamiento de seda capaz de romper cualquier defensa desde el perímetro.`;
      if (pos === 'Blitz') bio = `Motor incansable de ${teamNameNoId}. Destaca por su explosividad en el primer paso y su visión de juego panorámica.`;
      if (pos === 'Defenseman') bio = `Muralla inexpugnable de ${teamNameNoId}. Especialista en lectura defensiva, tapones y sacrificio por el bloque.`;

      const player: Player = {
        id: pId,
        name: `${pos} ${teamNameNoId}`,
        description: bio,
        monetaryValue: isTop ? 45000 : 12000,
        jerseyNumber: i + 1,
        position: pos,
        teamId: team.id,
        suspensionMatchdays: 0,
        attributes: hortaData.settings.attributeNames.map(attr => ({
          name: attr,
          value: isTop ? 82 + Math.floor(Math.random() * 16) : 55 + Math.floor(Math.random() * 32)
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
  });

  return { 
    teams: allTeams, 
    players: allPlayers, 
    tournaments: [] 
  };
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
      setTournaments([]); 
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
    }
  }, [settings.theme, isLoaded]);

  const generateSchedule = useCallback((tournamentId: string) => {
    setTournaments(prev => prev.map(t => {
      if (t.id !== tournamentId) return t;

      const schedule: Match[] = [];
      const dualSchedule: Match[] = [];
      let matchIdCounter = 1;

      const createMatchesForList = (participants: string[], baseMatchday: number = 0) => {
        const n = participants.length;
        const rounds = n % 2 === 0 ? n - 1 : n;
        const matchesPerRound = Math.floor(n / 2);
        
        const tempParticipants = [...participants];
        if (n % 2 !== 0) tempParticipants.push('BYE');

        for (let round = 0; round < rounds; round++) {
          const matchday = baseMatchday + round + 1;
          for (let i = 0; i < matchesPerRound; i++) {
            const home = tempParticipants[i];
            const away = tempParticipants[tempParticipants.length - 1 - i];

            if (home !== 'BYE' && away !== 'BYE') {
              const mId = `${t.id}-m-${matchIdCounter++}`;
              schedule.push({
                id: mId,
                homeId: home,
                awayId: away,
                matchday,
                isSimulated: false,
              });

              if (t.dualLeagueEnabled) {
                dualSchedule.push({
                  id: `dual-${mId}`,
                  homeId: away, // Mirror
                  awayId: home,
                  matchday,
                  isSimulated: false,
                });
              }
            }
          }
          // Rotate for Round Robin
          tempParticipants.splice(1, 0, tempParticipants.pop()!);
        }
      };

      if (t.leagueType === 'groups' && t.groupIsolation && t.groups) {
        t.groups.forEach(group => {
          createMatchesForList(group.participantIds);
        });
      } else {
        createMatchesForList(t.participants);
      }

      return { ...t, matches: schedule, dualLeagueMatches: dualSchedule, currentMatchday: 1 };
    }));
  }, []);

  const resolveMatch = useCallback((tournamentId: string, matchId: string, homeScore: number, awayScore: number, isDual: boolean, homePlayerId?: string, awayPlayerId?: string) => {
    setTournaments(prev => prev.map(t => {
      if (t.id !== tournamentId) return t;
      
      const updateMatches = (matches: Match[]) => matches.map(m => {
        if (m.id === matchId) {
          return { ...m, homeScore, awayScore, isSimulated: true, homePlayerId, awayPlayerId, winnerId: homeScore > awayScore ? m.homeId : awayScore > homeScore ? m.awayId : undefined };
        }
        return m;
      });

      if (isDual) {
        return { ...t, dualLeagueMatches: updateMatches(t.dualLeagueMatches) };
      } else {
        return { ...t, matches: updateMatches(t.matches) };
      }
    }));
  }, []);

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
      setTeams(prev => prev.map(t => t.id === targetId ? { ...t, budget: Math.max(0, t.budget - value) } : t));
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
  const addTournament = useCallback((t: Tournament) => {
    setTournaments(p => [...p, t]);
  }, []);
  const updateTournament = useCallback((t: Tournament) => {
    setTournaments(p => p.map(t2 => t2.id === t.id ? t : t2));
  }, []);
  const updateSettings = useCallback((s: Partial<GlobalSettings>) => setSettings(p => ({ ...p, ...s })), []);

  const value = useMemo(() => ({
    teams, players, tournaments, settings, addTeam, updateTeam, deleteTeam, addPlayer, updatePlayer, deletePlayer, addTournament, updateTournament, updateSettings, importData, transferPlayer, applySanction, generateSchedule, resolveMatch
  }), [teams, players, tournaments, settings, addTeam, updateTeam, deleteTeam, addPlayer, updatePlayer, deletePlayer, addTournament, updateTournament, updateSettings, importData, transferPlayer, applySanction, generateSchedule, resolveMatch]);

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>;
}

export function useTournamentStore() {
  const context = useContext(TournamentContext);
  if (!context) throw new Error('useTournamentStore must be used within a TournamentProvider');
  return context;
}
