'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Team, Player, Tournament, GlobalSettings, Match, TournamentIncident, ChallengeSport } from '@/lib/types';
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
  resetMatchday: (tournamentId: string, matchdayNumber: number) => void;
  resolveMatch: (tournamentId: string, matchId: string, homeScore: number, awayScore: number, isDual: boolean, homePlayerId?: string, awayPlayerId?: string, autoSim?: boolean) => void;
  simulateMatchday: (tournamentId: string, matchdayNumber?: number) => void;
  applySanction: (tournamentId: string, type: 'team' | 'player', targetId: string, value: number) => void;
  processIncidentDecision: (tournamentId: string, incidentId: string, accept: boolean) => void;
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
  const [isLoaded, setIsLoaded] = useState(false);

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
      localStorage.setItem('tourneycraft-store', JSON.stringify({ teams, players, tournaments, settings }));
    }
  }, [teams, players, tournaments, settings, isLoaded]);

  const getBestPlayerId = useCallback((teamId: string) => {
    const teamPlayers = players.filter(p => p.teamId === teamId && p.suspensionMatchdays === 0);
    if (teamPlayers.length === 0) return undefined;
    const sorted = [...teamPlayers].sort((a, b) => b.monetaryValue - a.monetaryValue);
    return Math.random() < 0.7 ? sorted[0].id : sorted[Math.floor(Math.random() * sorted.length)].id;
  }, [players]);

  const generateScoreByRules = useCallback((t: Tournament, hId: string, aId: string) => {
    let hScore = 0;
    let aScore = 0;
    const val = t.scoringValue || 9;
    
    const hTeam = teams.find(team => team.id === hId);
    const aTeam = teams.find(team => team.id === aId);
    const hRating = (hTeam?.rating || 50) + 5; 
    const aRating = (aTeam?.rating || 50);
    const chaos = (t.variability || 15) / 100;
    const baseWinProb = (hRating / (hRating + aRating)) + (Math.random() * chaos - chaos/2);
    const winProb = Math.max(0.05, Math.min(0.95, baseWinProb));

    // Simulation Point by Point (Binomial)
    for (let i = 0; i < val; i++) {
      if (Math.random() < winProb) hScore++;
      else aScore++;
    }
    return { hScore, aScore };
  }, [teams]);

  const createScheduleInternal = useCallback((t: Tournament): Tournament => {
    const schedule: Match[] = [];
    const dualSchedule: Match[] = [];
    let matchIdCounter = 1;

    if (t.mode === 'challenge' && t.participants.length === 2 && t.challengeSports) {
      const p1 = t.participants[0];
      const p2 = t.participants[1];
      const rounds = t.challengeRounds || 1;
      let day = 1;
      for (let r = 0; r < rounds; r++) {
        t.challengeSports.forEach((sport) => {
          const isHomeP1 = day % 2 !== 0;
          schedule.push({ id: `${t.id}-ch-${matchIdCounter++}`, homeId: isHomeP1 ? p1 : p2, awayId: isHomeP1 ? p2 : p1, matchday: day++, isSimulated: false, challengeSportId: sport.id });
        });
      }
      return { ...t, matches: schedule, currentMatchday: 1, incidents: [] };
    }

    const createMatchesForList = (participants: string[], groupPrefix: string = "") => {
      const n = participants.length;
      if (n < 2) return;
      const tempParticipants = [...participants];
      if (n % 2 !== 0) tempParticipants.push('BYE');
      const numParticipants = tempParticipants.length;
      const rounds = numParticipants - 1;
      const matchesPerRound = numParticipants / 2;

      for (let roundIdx = 0; roundIdx < rounds; roundIdx++) {
        const matchday = roundIdx + 1;
        for (let i = 0; i < matchesPerRound; i++) {
          const home = tempParticipants[i];
          const away = tempParticipants[numParticipants - 1 - i];
          if (home !== 'BYE' && away !== 'BYE') {
            const mId = `${t.id}${groupPrefix}-m-${matchIdCounter++}`;
            schedule.push({ id: mId, homeId: home, awayId: away, matchday, isSimulated: false });
            if (t.dualLeagueEnabled) dualSchedule.push({ id: `dual-${mId}`, homeId: away, awayId: home, matchday, isSimulated: false });
          }
        }
        tempParticipants.splice(1, 0, tempParticipants.pop()!);
      }
    };

    if (t.format === 'league') {
      if ((t.leagueType === 'groups' || t.leagueType === 'conferences') && t.groups && t.groups.length > 0) {
        t.groups.forEach((group, idx) => createMatchesForList(group.participantIds, `-g${idx}`));
      } else {
        createMatchesForList(t.participants);
      }
    }
    return { ...t, matches: schedule, dualLeagueMatches: dualSchedule, currentMatchday: 1, incidents: t.incidents || [] };
  }, []);

  const generateSchedule = useCallback((tournamentId: string) => {
    setTournaments(prev => prev.map(t => {
      if (t.id !== tournamentId) return t;
      return createScheduleInternal(t);
    }));
  }, [createScheduleInternal]);

  const resetSchedule = useCallback((tournamentId: string) => {
    setTournaments(prev => prev.map(t => {
      if (t.id !== tournamentId) return t;
      const resetList = (mList: Match[]) => mList.map(m => ({ ...m, isSimulated: false, homeScore: undefined, awayScore: undefined, homePlayerId: undefined, awayPlayerId: undefined }));
      return { ...t, matches: resetList(t.matches), dualLeagueMatches: resetList(t.dualLeagueMatches || []), currentMatchday: 1, incidents: [] };
    }));
  }, []);

  const resolveMatch = useCallback((tournamentId: string, matchId: string, hScoreInput: number, aScoreInput: number, isDual: boolean, homePlayerId?: string, awayPlayerId?: string, autoSim?: boolean) => {
    setTournaments(prev => prev.map(t => {
      if (t.id !== tournamentId) return t;
      const matchSource = isDual ? (t.dualLeagueMatches || []) : (t.matches || []);
      const targetMatch = matchSource.find(m => m.id === matchId);
      if (!targetMatch) return t;

      let hScore = hScoreInput;
      let aScore = aScoreInput;
      if (autoSim) {
        const res = generateScoreByRules(t, targetMatch.homeId, targetMatch.awayId);
        hScore = res.hScore; aScore = res.aScore;
      }

      const hPlayerId = homePlayerId || (t.mode === 'challenge' ? targetMatch.homeId : getBestPlayerId(targetMatch.homeId));
      const aPlayerId = awayPlayerId || (t.mode === 'challenge' ? targetMatch.awayId : getBestPlayerId(targetMatch.awayId));

      const updateMatchList = (mList: Match[]) => mList.map(m => m.id === matchId ? { ...m, homeScore: hScore, awayScore: aScore, isSimulated: true, homePlayerId: hPlayerId, awayPlayerId: aPlayerId } : m);

      if (t.mode !== 'challenge' && !isDual) {
        const isHomeWin = hScore > aScore;
        const isAwayWin = aScore > hScore;
        const hChange = isHomeWin ? t.winReward : isAwayWin ? -t.lossPenalty : t.drawReward;
        const aChange = isAwayWin ? t.winReward : isHomeWin ? -t.lossPenalty : t.drawReward;
        
        setTimeout(() => {
          setTeams(tPrev => tPrev.map(team => {
            if (team.id === targetMatch.homeId) return { ...team, budget: Math.max(0, team.budget + hChange) };
            if (team.id === targetMatch.awayId) return { ...team, budget: Math.max(0, team.budget + aChange) };
            return team;
          }));
        }, 0);
      }

      if (isDual) return { ...t, dualLeagueMatches: updateMatchList(t.dualLeagueMatches || []) };
      return { ...t, matches: updateMatchList(t.matches) };
    }));
  }, [generateScoreByRules, getBestPlayerId]);

  const simulateMatchday = useCallback((tournamentId: string, matchdayNumber?: number) => {
    setTournaments(prev => prev.map(t => {
      if (t.id !== tournamentId) return t;
      let nextT = { ...t };
      const dayMatches = t.matches.filter(m => m.matchday === matchdayNumber && !m.isSimulated);
      dayMatches.forEach(m => {
        const isUserMatch = (t.mode === 'arcade' && (m.homeId === t.managedParticipantId || m.awayId === t.managedParticipantId)) || (t.mode === 'challenge');
        if (!isUserMatch) {
          const { hScore, aScore } = generateScoreByRules(t, m.homeId, m.awayId);
          const hPlayerId = getBestPlayerId(m.homeId);
          const aPlayerId = getBestPlayerId(m.awayId);
          nextT.matches = nextT.matches.map(nm => nm.id === m.id ? { ...nm, homeScore: hScore, awayScore: aScore, isSimulated: true, homePlayerId: hPlayerId, awayPlayerId: aPlayerId } : nm);
          
          if (t.mode !== 'challenge') {
            const isHomeWin = hScore > aScore;
            const isAwayWin = aScore > hScore;
            const hChange = isHomeWin ? t.winReward : isAwayWin ? -t.lossPenalty : t.drawReward;
            const aChange = isAwayWin ? t.winReward : isHomeWin ? -t.lossPenalty : t.drawReward;
            setTimeout(() => {
              setTeams(tPrev => tPrev.map(team => {
                if (team.id === m.homeId) return { ...team, budget: Math.max(0, team.budget + hChange) };
                if (team.id === m.awayId) return { ...team, budget: Math.max(0, team.budget + aChange) };
                return team;
              }));
            }, 0);
          }
        }
      });
      return nextT;
    }));
  }, [generateScoreByRules, getBestPlayerId]);

  const resetMatchday = useCallback((tournamentId: string, matchdayNumber: number) => {
    setTournaments(prev => prev.map(t => {
      if (t.id !== tournamentId) return t;
      const resetList = (mList: Match[]) => mList.map(m => {
        if (m.matchday === matchdayNumber && m.isSimulated) {
          if (t.mode !== 'challenge') {
            const isHomeWin = (m.homeScore || 0) > (m.awayScore || 0);
            const isAwayWin = (m.awayScore || 0) > (m.homeScore || 0);
            const hChange = isHomeWin ? t.winReward : isAwayWin ? -t.lossPenalty : t.drawReward;
            const aChange = isAwayWin ? t.winReward : isHomeWin ? -t.lossPenalty : t.drawReward;
            setTimeout(() => {
              setTeams(tPrev => tPrev.map(team => {
                if (team.id === m.homeId) return { ...team, budget: Math.max(0, team.budget - hChange) };
                if (team.id === m.awayId) return { ...team, budget: Math.max(0, team.budget - aChange) };
                return team;
              }));
            }, 0);
          }
          return { ...m, isSimulated: false, homeScore: undefined, awayScore: undefined, homePlayerId: undefined, awayPlayerId: undefined };
        }
        return m;
      });
      return { ...t, matches: resetList(t.matches), dualLeagueMatches: resetList(t.dualLeagueMatches || []) };
    }));
  }, []);

  const value = useMemo(() => ({
    teams, players, tournaments, settings, 
    addTeam: (team: Team) => setTeams(p => [...p, team]),
    updateTeam: (team: Team) => setTeams(p => p.map(t => t.id === team.id ? team : t)),
    deleteTeam: (id: string) => setTeams(p => p.filter(t => t.id !== id)),
    addPlayer: (player: Player) => setPlayers(p => [...p, player]),
    updatePlayer: (player: Player) => setPlayers(p => p.map(p2 => p2.id === player.id ? player : p2)),
    deletePlayer: (id: string) => setPlayers(p => p.filter(p2 => p2.id !== id)),
    addTournament: (t: Tournament) => setTournaments(p => [...p, createScheduleInternal(t)]),
    updateTournament: (t: Tournament) => setTournaments(p => p.map(t2 => t2.id === t.id ? t : t2)),
    deleteTournament: (id: string) => setTournaments(p => p.filter(t => t.id !== id)),
    updateSettings: (s: Partial<GlobalSettings>) => setSettings(p => ({ ...p, ...s })),
    transferPlayer: (pId: string, tId: string | undefined) => {
      setPlayers(prev => prev.map(p => {
        if (p.id === pId) {
          const oldT = p.teamId;
          const val = p.monetaryValue;
          setTeams(tPrev => tPrev.map(t => {
            if (t.id === tId) return { ...t, budget: Math.max(0, t.budget - val) };
            if (t.id === oldT) return { ...t, budget: t.budget + val };
            return t;
          }));
          return { ...p, teamId: tId };
        }
        return p;
      }));
    },
    importData: (data: any, merge: boolean) => {
      if (merge) {
        setTeams(prev => [...prev, ...(data.teams || []).filter((t: any) => !prev.find(x => x.id === t.id))]);
        setPlayers(prev => [...prev, ...(data.players || []).filter((p: any) => !prev.find(x => x.id === p.id))]);
        setTournaments(prev => [...prev, ...(data.tournaments || []).filter((t: any) => !prev.find(x => x.id === t.id))]);
        if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
      } else {
        setTeams(data.teams || []); setPlayers(data.players || []); setTournaments(data.tournaments || []);
        if (data.settings) setSettings(data.settings);
      }
    },
    generateSchedule, resetSchedule, resetMatchday, resolveMatch, simulateMatchday, 
    applySanction: (tId: string, type: 'team' | 'player', targetId: string, val: number) => {
      if (type === 'team') setTeams(p => p.map(t => t.id === targetId ? { ...t, budget: Math.max(0, t.budget - val) } : t));
      else setPlayers(p => p.map(pl => pl.id === targetId ? { ...pl, suspensionMatchdays: val } : pl));
    },
    processIncidentDecision: (tId: string, incidentId: string, accept: boolean) => {
      setTournaments(prev => prev.map(t => {
        if (t.id !== tId) return t;
        const inc = t.incidents.find(i => i.id === incidentId);
        if (!inc || inc.status !== 'pending') return t;
        return { ...t, incidents: t.incidents.map(i => i.id === incidentId ? { ...i, status: accept ? 'accepted' : 'rejected' } : i) };
      }));
    }
  }), [teams, players, tournaments, settings, generateSchedule, resetSchedule, resetMatchday, resolveMatch, simulateMatchday, createScheduleInternal]);

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>;
}

export function useTournamentStore() {
  const context = useContext(TournamentContext);
  if (!context) throw new Error('useTournamentStore debe usarse dentro de un TournamentProvider');
  return context;
}