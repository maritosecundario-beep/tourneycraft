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
      const rawData = { teams, players, tournaments, settings };
      localStorage.setItem('tourneycraft-store', JSON.stringify(rawData));
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
    
    if (t.mode === 'challenge') {
      const p1 = players.find(p => p.id === hId);
      const p2 = players.find(p => p.id === aId);
      const p1Avg = p1 ? p1.attributes.reduce((a,b) => a + b.value, 0) / p1.attributes.length : 50;
      const p2Avg = p2 ? p2.attributes.reduce((a,b) => a + b.value, 0) / p2.attributes.length : 50;
      const winProb = p1Avg / (p1Avg + p2Avg);
      
      for(let i=0; i<10; i++) {
        if(Math.random() < winProb) hScore++;
        else aScore++;
      }
      return { hScore, aScore };
    }

    const hTeam = teams.find(team => team.id === hId);
    const aTeam = teams.find(team => team.id === aId);
    const hRating = (hTeam?.rating || 50) + 5; 
    const aRating = (aTeam?.rating || 50);
    const chaos = (t.variability || 15) / 100;
    const winProb = Math.max(0.05, Math.min(0.95, (hRating / (hRating + aRating)) + (Math.random() * chaos - chaos/2)));

    if (t.scoringRuleType === 'bestOfN') {
      for (let i = 0; i < val; i++) {
        if (Math.random() < winProb) hScore++;
        else aScore++;
      }
    } else if (t.scoringRuleType === 'firstToN') {
      while (hScore < val && aScore < val) {
        if (Math.random() < winProb) hScore++;
        else aScore++;
      }
    } else if (t.scoringRuleType === 'nToNRange') {
      const min = t.nToNRangeMin || 0;
      const max = t.nToNRangeMax || 10;
      const totalSum = Math.floor(Math.random() * (max - min + 1)) + min;
      for (let i = 0; i < totalSum; i++) {
        if (Math.random() < winProb) hScore++;
        else aScore++;
      }
    }
    return { hScore, aScore };
  }, [teams, players]);

  const createSchedule = useCallback((t: Tournament): Tournament => {
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
          schedule.push({
            id: `${t.id}-ch-${matchIdCounter++}`,
            homeId: isHomeP1 ? p1 : p2,
            awayId: isHomeP1 ? p2 : p1,
            matchday: day++,
            isSimulated: false,
            challengeSportId: sport.id
          });
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
      if ((t.leagueType === 'groups' || t.leagueType === 'conferences') && t.groups && t.groups.length > 0) {
        t.groups.forEach((group, idx) => {
          createMatchesForList(group.participantIds, `-g${idx}`);
        });
      } else {
        createMatchesForList(t.participants);
      }
    }
    return { ...t, matches: schedule, dualLeagueMatches: dualSchedule, currentMatchday: 1, incidents: t.incidents || [] };
  }, []);

  const generateSchedule = useCallback((tournamentId: string) => {
    setTournaments(prev => prev.map(t => t.id === tournamentId ? createSchedule(t) : t));
  }, [createSchedule]);

  const resetSchedule = useCallback((tournamentId: string) => {
    setTournaments(prev => prev.map(t => t.id === tournamentId ? { ...t, matches: [], dualLeagueMatches: [], currentMatchday: 1, incidents: [] } : t));
  }, []);

  const resetMatchday = useCallback((tournamentId: string, matchdayNumber: number) => {
    setTournaments(prev => prev.map(t => {
      if (t.id !== tournamentId) return t;
      
      const resetList = (mList: Match[]) => mList.map(m => {
        if (m.matchday === matchdayNumber && m.isSimulated) {
          if (t.mode !== 'challenge') {
            const isHomeWin = (m.homeScore || 0) > (m.awayScore || 0);
            const isAwayWin = (m.awayScore || 0) > (m.homeScore || 0);
            const hChange = isHomeWin ? (t.winReward || 0) : isAwayWin ? -(t.lossPenalty || 0) : (t.drawReward || 0);
            const aChange = isAwayWin ? (t.winReward || 0) : isHomeWin ? -(t.lossPenalty || 0) : (t.drawReward || 0);
            
            setTimeout(() => setTeams(tPrev => tPrev.map(team => {
              if (team.id === m.homeId) return { ...team, budget: Math.max(0, team.budget - hChange) };
              if (team.id === m.awayId) return { ...team, budget: Math.max(0, team.budget - aChange) };
              return team;
            })), 0);
          }
          return { ...m, isSimulated: false, homeScore: undefined, awayScore: undefined, homePlayerId: undefined, awayPlayerId: undefined };
        }
        return m;
      });

      return { 
        ...t, 
        matches: resetList(t.matches), 
        dualLeagueMatches: resetList(t.dualLeagueMatches || []),
        incidents: (t.incidents || []).filter(inc => !inc.message.includes(`Jornada ${matchdayNumber}`))
      };
    }));
  }, []);

  const transferPlayerInternal = useCallback((playerId: string, toTeamId: string | undefined) => {
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

  const resolveMatch = useCallback((tournamentId: string, matchId: string, hScoreInput: number, aScoreInput: number, isDual: boolean, homePlayerId?: string, awayPlayerId?: string, autoSim?: boolean) => {
    setTournaments(prev => prev.map(t => {
      if (t.id !== tournamentId) return t;
      
      const matchSource = isDual ? t.dualLeagueMatches : t.matches;
      const targetMatch = matchSource.find(m => m.id === matchId);
      if (!targetMatch) return t;

      let hScore = hScoreInput;
      let aScore = aScoreInput;

      if (autoSim) {
        const result = generateScoreByRules(t, targetMatch.homeId, targetMatch.awayId);
        hScore = result.hScore;
        aScore = result.aScore;
      }

      const newIncidents: TournamentIncident[] = [...(t.incidents || [])];
      if (t.mode !== 'challenge' && !isDual && autoSim) {
        if (Math.random() < 0.20) {
          const validTeams = teams.filter(tm => t.participants.includes(tm.id));
          if (validTeams.length >= 2) {
            const seller = validTeams[Math.floor(Math.random() * validTeams.length)];
            const buyer = validTeams[Math.floor(Math.random() * validTeams.length)];
            const sellerPlayers = players.filter(p => p.teamId === seller.id);
            if (sellerPlayers.length > 0 && seller.id !== buyer.id) {
              const player = sellerPlayers[Math.floor(Math.random() * sellerPlayers.length)];
              if (buyer.budget >= player.monetaryValue) {
                const isOfferForUser = buyer.id === t.managedParticipantId;
                newIncidents.push({
                  id: `inc-tr-${Date.now()}`,
                  date: `Jornada ${targetMatch.matchday}`,
                  message: isOfferForUser 
                    ? `OFERTA: El ${seller.name} ofrece a ${player.name} por ${player.monetaryValue} ${settings.currency}.`
                    : `Mercado: ${player.name} ficha por ${buyer.name} (${player.monetaryValue} ${settings.currency}).`,
                  type: 'transfer',
                  status: isOfferForUser ? 'pending' : 'accepted',
                  playerId: player.id, fromTeamId: seller.id, toTeamId: buyer.id, value: player.monetaryValue
                });
                if (!isOfferForUser) setTimeout(() => transferPlayerInternal(player.id, buyer.id), 0);
              }
            }
          }
        }
      }

      if (t.mode !== 'challenge' && !isDual) {
        setTimeout(() => setTeams(tPrev => tPrev.map(team => {
          if (team.id === targetMatch.homeId || team.id === targetMatch.awayId) {
            const isHome = team.id === targetMatch.homeId;
            const isWin = (isHome && hScore > aScore) || (!isHome && aScore > hScore);
            const isLoss = (isHome && aScore > hScore) || (!isHome && hScore > aScore);
            let change = isWin ? (t.winReward || 0) : isLoss ? -(t.lossPenalty || 0) : (t.drawReward || 0);
            return { ...team, budget: Math.max(0, (team.budget || 0) + change) };
          }
          return team;
        })), 0);
      }

      const finalHPlayerId = homePlayerId || (t.mode === 'challenge' ? targetMatch.homeId : getBestPlayerId(targetMatch.homeId));
      const finalAPlayerId = awayPlayerId || (t.mode === 'challenge' ? targetMatch.awayId : getBestPlayerId(targetMatch.awayId));

      const updateMatchList = (mList: Match[]) => mList.map(m => {
        if (m.id === matchId) {
          return { ...m, homeScore: hScore, awayScore: aScore, isSimulated: true, homePlayerId: finalHPlayerId, awayPlayerId: finalAPlayerId };
        }
        return m;
      });

      let nextMatches = updateMatchList(t.matches || []);
      let nextDualMatches = t.dualLeagueMatches || [];

      if (isDual) {
        nextDualMatches = updateMatchList(t.dualLeagueMatches || []);
      } else if (t.dualLeagueEnabled) {
        const dualMatchId = `dual-${matchId}`;
        const targetDual = nextDualMatches.find(dm => dm.id === dualMatchId);
        if (targetDual && !targetDual.isSimulated) {
          const dScores = generateScoreByRules(t, targetDual.homeId, targetDual.awayId);
          nextDualMatches = nextDualMatches.map(dm => dm.id === dualMatchId ? { ...dm, homeScore: dScores.hScore, awayScore: dScores.aScore, isSimulated: true, homePlayerId: getBestPlayerId(dm.homeId), awayPlayerId: getBestPlayerId(dm.awayId) } : dm);
        }
      }

      return { ...t, matches: nextMatches, dualLeagueMatches: nextDualMatches, incidents: newIncidents };
    }));
  }, [generateScoreByRules, getBestPlayerId, teams, players, settings.currency, transferPlayerInternal]);

  const simulateMatchday = useCallback((tournamentId: string, matchdayNumber?: number) => {
    setTournaments(prev => prev.map(t => {
      if (t.id !== tournamentId) return t;
      const unplayed = t.matches.filter(m => !m.isSimulated);
      if (unplayed.length === 0) return t;
      const targetDay = matchdayNumber !== undefined ? matchdayNumber : Math.min(...unplayed.map(m => m.matchday));
      const dayMatches = t.matches.filter(m => m.matchday === targetDay && !m.isSimulated);
      let nextT = { ...t };
      dayMatches.forEach(m => {
        const isUserMatch = (t.mode === 'arcade' && (m.homeId === t.managedParticipantId || m.awayId === t.managedParticipantId)) || (t.mode === 'challenge');
        if (isUserMatch) return;
        const { hScore, aScore } = generateScoreByRules(t, m.homeId, m.awayId);
        if (t.mode !== 'challenge') {
          setTimeout(() => setTeams(tPrev => tPrev.map(team => {
            if (team.id === m.homeId || team.id === m.awayId) {
              const isHome = team.id === m.homeId;
              const isWin = (isHome && hScore > aScore) || (!isHome && aScore > hScore);
              const isLoss = (isHome && aScore > hScore) || (!isHome && hScore > aScore);
              let change = isWin ? (t.winReward || 0) : isLoss ? -(t.lossPenalty || 0) : (t.drawReward || 0);
              return { ...team, budget: Math.max(0, (team.budget || 0) + change) };
            }
            return team;
          })), 0);
        }
        const hPlayerId = getBestPlayerId(m.homeId);
        const aPlayerId = getBestPlayerId(m.awayId);
        nextT.matches = nextT.matches.map(nm => nm.id === m.id ? { ...nm, homeScore: hScore, awayScore: aScore, isSimulated: true, homePlayerId: hPlayerId, awayPlayerId: aPlayerId } : nm);
        if (t.dualLeagueEnabled) {
          const dualId = `dual-${m.id}`;
          const dualMatch = nextT.dualLeagueMatches.find(dm => dm.id === dualId);
          if (dualMatch && !dualMatch.isSimulated) {
            const dScores = generateScoreByRules(t, dualMatch.homeId, dualMatch.awayId);
            nextT.dualLeagueMatches = nextT.dualLeagueMatches.map(dm => dm.id === dualId ? { ...dm, homeScore: dScores.hScore, awayScore: dScores.aScore, isSimulated: true, homePlayerId: getBestPlayerId(dm.homeId), awayPlayerId: getBestPlayerId(dm.awayId) } : dm);
          }
        }
      });
      return { ...nextT, currentMatchday: Math.max(nextT.currentMatchday, targetDay) };
    }));
  }, [generateScoreByRules, getBestPlayerId]);

  const processIncidentDecision = (tournamentId: string, incidentId: string, accept: boolean) => {
    setTournaments(prev => prev.map(t => {
      if (t.id !== tournamentId) return t;
      const incident = t.incidents.find(i => i.id === incidentId);
      if (!incident || incident.status !== 'pending') return t;
      if (accept && incident.playerId && incident.toTeamId) setTimeout(() => transferPlayerInternal(incident.playerId!, incident.toTeamId), 0);
      return { ...t, incidents: t.incidents.map(i => i.id === incidentId ? { ...i, status: accept ? 'accepted' : 'rejected' } : i) };
    }));
  };

  const transferPlayer = useCallback((playerId: string, toTeamId: string | undefined) => transferPlayerInternal(playerId, toTeamId), [transferPlayerInternal]);

  const applySanction = useCallback((tournamentId: string, type: 'team' | 'player', targetId: string, value: number) => {
    if (type === 'team') {
      setTeams(prev => prev.map(t => t.id === targetId ? { ...t, budget: Math.max(0, t.budget - value) } : t));
    } else {
      setPlayers(prev => prev.map(p => p.id === targetId ? { ...p, suspensionMatchdays: value } : p));
    }
    setTournaments(prev => prev.map(t => {
      if (t.id !== tournamentId) return t;
      const tName = type === 'team' ? teams.find(x => x.id === targetId)?.name : players.find(x => x.id === targetId)?.name;
      return { ...t, incidents: [...(t.incidents || []), { id: `sanc-${Date.now()}`, date: 'Manual', message: `Sanción: ${tName} (${value}${type === 'team' ? settings.currency : ' jornadas'}).`, type: 'sanction' }] };
    }));
  }, [teams, players, settings.currency]);

  const importData = useCallback((data: any, merge: boolean) => {
    if (merge) {
      setTeams(prev => [...prev, ...(data.teams || []).filter((t: any) => !prev.find(x => x.id === t.id))]);
      setPlayers(prev => [...prev, ...(data.players || []).filter((p: any) => !prev.find(x => x.id === p.id))]);
      setTournaments(prev => [...prev, ...(data.tournaments || []).filter((t: any) => !prev.find(x => x.id === t.id))]);
      if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
    } else {
      setTeams(data.teams || []); setPlayers(data.players || []); setTournaments(data.tournaments || []);
      if (data.settings) setSettings(data.settings);
    }
  }, []);

  const addTeam = (team: Team) => setTeams(p => [...p, team]);
  const updateTeam = (team: Team) => setTeams(p => p.map(t => t.id === team.id ? team : t));
  const deleteTeam = (id: string) => setTeams(p => p.filter(t => t.id !== id));
  const addPlayer = (player: Player) => setPlayers(p => [...p, player]);
  const updatePlayer = (player: Player) => setPlayers(p => p.map(p2 => p2.id === player.id ? player : p2));
  const deletePlayer = (id: string) => setPlayers(p => p.filter(p2 => p2.id !== id));
  const addTournament = (t: Tournament) => setTournaments(p => [...p, createSchedule(t)]);
  const updateTournament = (t: Tournament) => setTournaments(p => p.map(t2 => t2.id === t.id ? t : t2));
  const deleteTournament = (id: string) => setTournaments(p => p.filter(t => t.id !== id));
  const updateSettings = (s: Partial<GlobalSettings>) => setSettings(p => ({ ...p, ...s }));

  const value = useMemo(() => ({
    teams, players, tournaments, settings, addTeam, updateTeam, deleteTeam, addPlayer, updatePlayer, deletePlayer, addTournament, updateTournament, deleteTournament, updateSettings, importData, transferPlayer, generateSchedule, resetSchedule, resetMatchday, resolveMatch, simulateMatchday, applySanction, processIncidentDecision
  }), [teams, players, tournaments, settings, generateSchedule, resetSchedule, resetMatchday, resolveMatch, simulateMatchday, transferPlayer, importData, applySanction, processIncidentDecision]);

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>;
}

export function useTournamentStore() {
  const context = useContext(TournamentContext);
  if (!context) throw new Error('useTournamentStore debe usarse dentro de un TournamentProvider');
  return context;
}
