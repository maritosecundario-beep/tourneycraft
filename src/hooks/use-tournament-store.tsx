'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Team, Player, Tournament, GlobalSettings, Match } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase/provider';
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
  importData: (data: any, merge: boolean) => void;
  generateSchedule: (tournamentId: string) => void;
  resetSchedule: (tournamentId: string) => void;
  resolveMatch: (tournamentId: string, matchId: string, homeScore: number, awayScore: number, isDual: boolean, homePlayerId?: string, awayPlayerId?: string) => void;
}

const defaultSettings: GlobalSettings = {
  ...(hortaData.settings as GlobalSettings),
  theme: 'retro'
};

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

const sanitizeData = (data: any): any => {
  if (data === null || data === undefined) return null;
  if (Array.isArray(data)) return data.map(sanitizeData);
  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const key in data) {
      if (data[key] !== undefined) {
        sanitized[key] = sanitizeData(data[key]);
      }
    }
    return sanitized;
  }
  if (typeof data === 'number') return isNaN(data) ? 0 : data;
  return data;
};

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const user = useUser();
  const db = useFirestore();

  useEffect(() => {
    const saved = localStorage.getItem('tourneycraft-store');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTeams(parsed.teams || hortaData.teams);
        setPlayers(parsed.players || hortaData.players);
        setTournaments(parsed.tournaments || hortaData.tournaments);
        setSettings(parsed.settings || defaultSettings);
      } catch (e) {
        console.error("Store Corrupto:", e);
      }
    } else {
      setTeams(hortaData.teams as any[]);
      setPlayers(hortaData.players as any[]);
      setTournaments(hortaData.tournaments as any[]); 
      setSettings(defaultSettings);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      document.body.className = settings.theme;
      const timer = setTimeout(() => {
        const rawData = { teams, players, tournaments, settings };
        localStorage.setItem('tourneycraft-store', JSON.stringify(rawData));
        
        if (user?.uid && db) {
          const sanitized = sanitizeData({
            teams, players, tournaments, settings,
            updatedAt: new Date().toISOString(),
            ownerId: user.uid
          });
          const userDocRef = doc(db, 'users', user.uid, 'backups', 'latest');
          setDocumentNonBlocking(userDocRef, sanitized, { merge: true });
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [teams, players, tournaments, settings, isLoaded, user?.uid, db]);

  const generateScoreByRules = useCallback((t: Tournament) => {
    let hScore = 0;
    let aScore = 0;
    const val = t.scoringValue || 9;

    if (t.scoringRuleType === 'bestOfN') {
      // Suma total debe ser exactamente N
      hScore = Math.floor(Math.random() * (val + 1));
      aScore = val - hScore;
    } else if (t.scoringRuleType === 'firstToN') {
      // Ganador llega a N, perdedor menos
      const winnerIdx = Math.random() > 0.5 ? 0 : 1;
      if (winnerIdx === 0) {
        hScore = val;
        aScore = Math.floor(Math.random() * val);
      } else {
        aScore = val;
        hScore = Math.floor(Math.random() * val);
      }
    } else if (t.scoringRuleType === 'nToNRange') {
      // Suma total entre min y max
      const min = t.nToNRangeMin || 0;
      const max = t.nToNRangeMax || 10;
      const totalSum = Math.floor(Math.random() * (max - min + 1)) + min;
      hScore = Math.floor(Math.random() * (totalSum + 1));
      aScore = totalSum - hScore;
    } else {
      hScore = Math.floor(Math.random() * 5);
      aScore = Math.floor(Math.random() * 5);
    }
    return { hScore, aScore };
  }, []);

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

  const resetSchedule = useCallback((tournamentId: string) => {
    setTournaments(prev => prev.map(t => t.id === tournamentId ? { ...t, matches: [], dualLeagueMatches: [], currentMatchday: 1 } : t));
  }, []);

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
                let change = isWin ? (t.winReward || 0) : isLoss ? -(t.lossPenalty || 0) : (t.drawReward || 0);
                return { ...team, budget: Math.max(0, (team.budget || 0) + change) };
              }
              return team;
            }));
          }
          return { ...m, homeScore, awayScore, isSimulated: true, homePlayerId, awayPlayerId, winnerId: homeScore > awayScore ? m.homeId : homeScore < awayScore ? m.awayId : undefined };
        }
        return m;
      });

      if (isDual) return { ...t, dualLeagueMatches: updateMatches(t.dualLeagueMatches || []) };
      
      // Auto-simulate dual match if enabled
      let nextDualMatches = t.dualLeagueMatches || [];
      if (t.dualLeagueEnabled && !isDual) {
        const dualMatchId = `dual-${matchId}`;
        const targetDual = nextDualMatches.find(dm => dm.id === dualMatchId);
        if (targetDual && !targetDual.isSimulated) {
          const scores = generateScoreByRules(t);
          nextDualMatches = nextDualMatches.map(dm => 
            dm.id === dualMatchId 
              ? { ...dm, homeScore: scores.hScore, awayScore: scores.aScore, isSimulated: true, winnerId: scores.hScore > scores.aScore ? dm.homeId : scores.hScore < scores.aScore ? dm.awayId : undefined } 
              : dm
          );
        }
      }

      return { ...t, matches: updateMatches(t.matches || []), dualLeagueMatches: nextDualMatches };
    }));
  }, [generateScoreByRules]);

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
    teams, players, tournaments, settings, addTeam, updateTeam, deleteTeam, addPlayer, updatePlayer, deletePlayer, addTournament, updateTournament, deleteTournament, updateSettings, importData, transferPlayer, generateSchedule, resetSchedule, resolveMatch
  }), [teams, players, tournaments, settings, generateSchedule, resetSchedule, resolveMatch, transferPlayer, importData, createSchedule]);

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>;
}

export function useTournamentStore() {
  const context = useContext(TournamentContext);
  if (!context) throw new Error('useTournamentStore debe usarse dentro de un TournamentProvider');
  return context;
}
