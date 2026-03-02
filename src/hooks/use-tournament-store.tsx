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
  deleteTournament: (id: string) => void;
  updateSettings: (settings: Partial<GlobalSettings>) => void;
  transferPlayer: (playerId: string, toTeamId: string | undefined) => void;
  applySanction: (targetId: string, type: 'team-budget' | 'player-suspension', value: number) => void;
  importData: (data: any, merge: boolean) => void;
  generateSchedule: (tournamentId: string) => void;
  resolveMatch: (tournamentId: string, matchId: string, homeScore: number, awayScore: number, isDual: boolean, homePlayerId?: string, awayPlayerId?: string) => void;
  triggerMarketMoves: (tournamentId: string) => void;
}

const defaultSettings: GlobalSettings = {
  ...(hortaData.settings as GlobalSettings),
  theme: 'retro'
};

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);
  const [isLoaded, setIsLoading] = useState(false);
  
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
      setTeams(hortaData.teams as any[]);
      setPlayers(hortaData.players as any[]);
      setTournaments(hortaData.tournaments as any[]); 
      setSettings(defaultSettings);
    }
    setIsLoading(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      document.body.className = settings.theme;
      const timer = setTimeout(() => {
        const dataToSave = { teams, players, tournaments, settings };
        localStorage.setItem('tourneycraft-store', JSON.stringify(dataToSave));
        
        // Sincronización en la nube SOLO si hay usuario y DB lista
        if (user?.uid && db) {
          try {
            const userDocRef = doc(db, 'users', user.uid, 'backups', 'latest');
            setDocumentNonBlocking(userDocRef, {
              ...dataToSave,
              updatedAt: new Date().toISOString(),
              ownerId: user.uid
            }, { merge: true });
          } catch (err) {
            console.error("Cloud Sync Silent Fail:", err);
          }
        }
      }, 1500); // Debounce de 1.5s para evitar exceder cuotas
      return () => clearTimeout(timer);
    }
  }, [teams, players, tournaments, settings, isLoaded, user?.uid, db]);

  const createSchedule = useCallback((t: Tournament): Tournament => {
    const schedule: Match[] = [];
    const dualSchedule: Match[] = [];
    let matchIdCounter = 1;

    const createMatchesForList = (participants: string[], groupPrefix: string = "") => {
      const n = participants.length;
      if (n < 2) return;
      const tempParticipants = [...participants];
      if (n % 2 !== 0) tempParticipants.push('BYE');
      const numParticipants = tempParticipants.length;
      const rounds = numParticipants - 1;
      const matchesPerRound = numParticipants / 2;

      for (let round = 0; round < rounds; round++) {
        const matchday = round + 1;
        for (let i = 0; i < matchesPerRound; i++) {
          const home = tempParticipants[i];
          const away = tempParticipants[numParticipants - 1 - i];
          if (home !== 'BYE' && away !== 'BYE') {
            const mId = `${t.id}${groupPrefix}-m-${matchIdCounter++}`;
            schedule.push({ id: mId, homeId: home, awayId: away, matchday, isSimulated: false });
            if (t.dualLeagueEnabled) {
              dualSchedule.push({ id: `dual-${mId}`, homeId: away, awayId: home, matchday, isSimulated: false });
            }
          }
        }
        tempParticipants.splice(1, 0, tempParticipants.pop()!);
      }
    };

    if (t.format === 'league') {
      if (t.leagueType === 'groups' && t.groups && t.groups.length > 0) {
        t.groups.forEach((group, idx) => {
          createMatchesForList(group.participantIds, `-g${idx}`);
        });
      } else {
        createMatchesForList(t.participants);
      }
    }
    return { ...t, matches: schedule, dualLeagueMatches: dualSchedule, currentMatchday: 1 };
  }, []);

  const generateSchedule = useCallback((tournamentId: string) => {
    setTournaments(prev => prev.map(t => t.id === tournamentId ? createSchedule(t) : t));
  }, [createSchedule]);

  const resolveMatch = useCallback((tournamentId: string, matchId: string, homeScore: number, awayScore: number, isDual: boolean, homePlayerId?: string, awayPlayerId?: string) => {
    setTournaments(prev => prev.map(t => {
      if (t.id !== tournamentId) return t;
      const updateMatches = (matches: Match[]) => matches.map(m => {
        if (m.id === matchId) {
          if (!isDual) {
            setTeams(tPrev => tPrev.map(team => {
              if (team.id === m.homeId || team.id === m.awayId) {
                const isHome = team.id === m.homeId;
                const isWin = (isHome && homeScore > awayScore) || (!isHome && awayScore > homeScore);
                const isLoss = (isHome && awayScore > homeScore) || (!isHome && homeScore > awayScore);
                const isDraw = homeScore === awayScore;
                let change = isWin ? (t.winReward || 0) : isLoss ? -(t.lossPenalty || 0) : (t.drawReward || 0);
                return { ...team, budget: Math.max(0, (team.budget || 0) + change) };
              }
              return team;
            }));
          }
          if (homePlayerId) {
            setPlayers(pPrev => pPrev.map(p => {
              if (p.id === homePlayerId) {
                const perfFactor = (homeScore / (homeScore + awayScore || 1)) * 1.5;
                const valueChange = Math.round((p.monetaryValue || 0) * (perfFactor - 0.5) * 0.05);
                return { ...p, monetaryValue: Math.max(1, (p.monetaryValue || 0) + valueChange) };
              }
              return p;
            }));
          }
          if (awayPlayerId) {
            setPlayers(pPrev => pPrev.map(p => {
              if (p.id === awayPlayerId) {
                const perfFactor = (awayScore / (homeScore + awayScore || 1)) * 1.5;
                const valueChange = Math.round((p.monetaryValue || 0) * (perfFactor - 0.5) * 0.05);
                return { ...p, monetaryValue: Math.max(1, (p.monetaryValue || 0) + valueChange) };
              }
              return p;
            }));
          }
          return { ...m, homeScore, awayScore, isSimulated: true, homePlayerId, awayPlayerId };
        }
        return m;
      });
      if (isDual) return { ...t, dualLeagueMatches: updateMatches(t.dualLeagueMatches) };
      return { ...t, matches: updateMatches(t.matches) };
    }));
  }, []);

  const triggerMarketMoves = useCallback((tournamentId: string) => {
    if (Math.random() > 0.4) return;
    setPlayers(prevPlayers => {
      const updatedPlayers = [...prevPlayers];
      const t = tournaments.find(x => x.id === tournamentId);
      if (!t) return updatedPlayers;
      const aiTeams = teams.filter(tm => tm.id !== t.managedParticipantId && t.participants.includes(tm.id));
      aiTeams.forEach(team => {
        const teamPlayers = updatedPlayers.filter(p => p.teamId === team.id);
        if (teamPlayers.length > 3 && Math.random() > 0.8) {
          const index = updatedPlayers.findIndex(p => p.id === teamPlayers[0].id);
          if (index !== -1) updatedPlayers[index].teamId = undefined;
        }
      });
      const freeAgents = updatedPlayers.filter(p => !p.teamId);
      if (freeAgents.length > 0) {
        aiTeams.forEach(team => {
          if (Math.random() > 0.9) {
            const candidate = freeAgents[Math.floor(Math.random() * freeAgents.length)];
            if ((team.budget || 0) >= (candidate.monetaryValue || 0)) {
              const index = updatedPlayers.findIndex(p => p.id === candidate.id);
              if (index !== -1) updatedPlayers[index].teamId = team.id;
            }
          }
        });
      }
      return updatedPlayers;
    });
  }, [teams, tournaments]);

  const transferPlayer = useCallback((playerId: string, toTeamId: string | undefined) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        const oldTeamId = p.teamId;
        const playerVal = (p.monetaryValue || 0);
        setTeams(tPrev => tPrev.map(t => {
          if (t.id === toTeamId) return { ...t, budget: Math.max(0, (t.budget || 0) - playerVal) };
          if (t.id === oldTeamId) return { ...t, budget: (t.budget || 0) + playerVal };
          return t;
        }));
        return { ...p, teamId: toTeamId };
      }
      return p;
    }));
  }, []);

  const applySanction = useCallback((targetId: string, type: 'team-budget' | 'player-suspension', value: number) => {
    if (type === 'team-budget') {
      setTeams(prev => prev.map(t => t.id === targetId ? { ...t, budget: Math.max(0, (t.budget || 0) - value) } : t));
    } else {
      setPlayers(prev => prev.map(p => p.id === targetId ? { ...p, suspensionMatchdays: (p.suspensionMatchdays || 0) + value } : p));
    }
  }, []);

  const importData = useCallback((data: any, merge: boolean) => {
    if (merge) {
      setTeams(prev => [...prev, ...(data.teams || []).filter((t: any) => !prev.find(x => x.id === t.id))]);
      setPlayers(prev => [...prev, ...(data.players || []).filter((p: any) => !prev.find(x => x.id === p.id))]);
      setTournaments(prev => [...prev, ...(data.tournaments || []).filter((t: any) => !prev.find(x => x.id === t.id))]);
      if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
    } else {
      setTeams(data.teams || []);
      setPlayers(data.players || []);
      setTournaments(data.tournaments || []);
      if (data.settings) setSettings(data.settings);
    }
  }, []);

  const addTeam = (team: Team) => setTeams(p => [...p, team]);
  const updateTeam = (team: Team) => setTeams(p => p.map(t => t.id === team.id ? team : t));
  const deleteTeam = (id: string) => setTeams(p => p.filter(t => t.id !== id));
  const addPlayer = (player: Player) => setPlayers(p => [...p, player]);
  const updatePlayer = (player: Player) => setPlayers(p => p.map(p2 => p2.id === player.id ? player : p2));
  const deletePlayer = (id: string) => setPlayers(p => p.filter(p2 => p2.id !== id));
  const addTournament = (t: Tournament) => { const scheduled = createSchedule(t); setTournaments(p => [...p, scheduled]); };
  const updateTournament = (t: Tournament) => setTournaments(p => p.map(t2 => t2.id === t.id ? t : t2));
  const deleteTournament = (id: string) => setTournaments(p => p.filter(t => t.id !== id));
  const updateSettings = (s: Partial<GlobalSettings>) => setSettings(p => ({ ...p, ...s }));

  const value = useMemo(() => ({
    teams, players, tournaments, settings, addTeam, updateTeam, deleteTeam, addPlayer, updatePlayer, deletePlayer, addTournament, updateTournament, deleteTournament, updateSettings, importData, transferPlayer, applySanction, generateSchedule, resolveMatch, triggerMarketMoves
  }), [teams, players, tournaments, settings, generateSchedule, resolveMatch, triggerMarketMoves, transferPlayer, applySanction, importData, createSchedule]);

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>;
}

export function useTournamentStore() {
  const context = useContext(TournamentContext);
  if (!context) throw new Error('useTournamentStore must be used within a TournamentProvider');
  return context;
}