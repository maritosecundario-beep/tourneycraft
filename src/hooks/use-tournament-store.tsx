'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Team, Player, Tournament, GlobalSettings, Match, TournamentIncident } from '@/lib/types';
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
    // 70% chance for the highest value player
    return Math.random() < 0.7 ? sorted[0].id : sorted[Math.floor(Math.random() * sorted.length)].id;
  }, [players]);

  const generateScoreByRules = useCallback((t: Tournament, hId: string, aId: string) => {
    let hScore = 0;
    let aScore = 0;
    const val = t.scoringValue || 9;
    
    const hTeam = teams.find(team => team.id === hId);
    const aTeam = teams.find(team => team.id === aId);
    
    // Advantage for local: +5% rating boost
    const hRating = (hTeam?.rating || 50) + 5;
    const aRating = aTeam?.rating || 50;
    const chaos = (t.variability || 15) / 100;
    const total = hRating + aRating;
    
    const baseWinProb = (hRating / total) + (Math.random() * chaos - (chaos / 2));

    if (t.scoringRuleType === 'bestOfN') {
      hScore = Math.round(val * baseWinProb);
      aScore = val - hScore;
    } else if (t.scoringRuleType === 'firstToN') {
      const homeWins = Math.random() < baseWinProb;
      if (homeWins) {
        hScore = val;
        aScore = Math.floor(Math.random() * val);
      } else {
        aScore = val;
        hScore = Math.floor(Math.random() * val);
      }
    } else if (t.scoringRuleType === 'nToNRange') {
      const min = t.nToNRangeMin || 0;
      const max = t.nToNRangeMax || 10;
      const totalSum = Math.floor(Math.random() * (max - min + 1)) + min;
      hScore = Math.round(totalSum * baseWinProb);
      aScore = totalSum - hScore;
    }
    return { hScore, aScore };
  }, [teams]);

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
    setTournaments(prev => prev.map(t => t.id === tournamentId ? { ...t, matches: [], dualLeagueMatches: [], currentMatchday: 1 } : t));
  }, []);

  const transferPlayerInternal = (playerId: string, toTeamId: string | undefined) => {
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
  };

  const resolveMatch = useCallback((tournamentId: string, matchId: string, homeScore: number, awayScore: number, isDual: boolean, homePlayerId?: string, awayPlayerId?: string) => {
    setTournaments(prev => prev.map(t => {
      if (t.id !== tournamentId) return t;
      
      const matchSource = isDual ? t.dualLeagueMatches : t.matches;
      const targetMatch = matchSource.find(m => m.id === matchId);
      if (!targetMatch) return t;

      const newIncidents: TournamentIncident[] = [...(t.incidents || [])];
      
      // Random incidents only for non-dual simulation
      if (!isDual) {
        if (Math.random() < 0.20) {
          const otherTeams = teams.filter(team => team.id !== t.managedParticipantId);
          if (otherTeams.length >= 2) {
            const seller = otherTeams[Math.floor(Math.random() * otherTeams.length)];
            const buyer = teams[Math.floor(Math.random() * teams.length)];
            const sellerPlayers = players.filter(p => p.teamId === seller.id);
            if (sellerPlayers.length > 0 && seller.id !== buyer.id) {
              const player = sellerPlayers[Math.floor(Math.random() * sellerPlayers.length)];
              if (buyer.budget >= player.monetaryValue) {
                const isOfferForUser = buyer.id === t.managedParticipantId;
                const incident: TournamentIncident = {
                  id: `inc-${Date.now()}`,
                  date: new Date().toLocaleDateString(),
                  message: isOfferForUser 
                    ? `OFERTA RECIBIDA: El club ${seller.name} ofrece a ${player.name} por ${player.monetaryValue} ${settings.currency}.`
                    : `Traspaso Táctico: ${player.name} deja ${seller.name} por ${buyer.name} (${player.monetaryValue} ${settings.currency})`,
                  type: 'transfer',
                  status: isOfferForUser ? 'pending' : 'accepted',
                  playerId: player.id,
                  fromTeamId: seller.id,
                  toTeamId: buyer.id,
                  value: player.monetaryValue
                };
                newIncidents.push(incident);
                if (!isOfferForUser) {
                  setTimeout(() => transferPlayerInternal(player.id, buyer.id), 0);
                }
              }
            }
          }
        }

        if (Math.random() < 0.05) {
          const randomTeam = teams[Math.floor(Math.random() * teams.length)];
          const penalty = Math.floor(Math.random() * 50) + 10;
          newIncidents.push({
            id: `inc-sanc-${Date.now()}`,
            date: new Date().toLocaleDateString(),
            message: `Sanción Administrativa: ${randomTeam.name} multado con ${penalty} ${settings.currency} por irregularidades.`,
            type: 'sanction'
          });
          setTimeout(() => setTeams(prev => prev.map(team => team.id === randomTeam.id ? { ...team, budget: Math.max(0, team.budget - penalty) } : team)), 0);
        }
      }

      const hPlayerId = homePlayerId || getBestPlayerId(targetMatch.homeId);
      const aPlayerId = awayPlayerId || getBestPlayerId(targetMatch.awayId);

      // Decrement suspensions for participating players
      setPlayers(pPrev => pPrev.map(p => {
        if ((p.teamId === targetMatch.homeId || p.teamId === targetMatch.awayId) && p.suspensionMatchdays > 0) {
          return { ...p, suspensionMatchdays: p.suspensionMatchdays - 1 };
        }
        return p;
      }));

      const updateMatchList = (mList: Match[]) => mList.map(m => {
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
          return { 
            ...m, 
            homeScore, awayScore, isSimulated: true, 
            homePlayerId: hPlayerId, awayPlayerId: aPlayerId, 
            winnerId: homeScore > awayScore ? m.homeId : homeScore < awayScore ? m.awayId : undefined 
          };
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
          const scores = generateScoreByRules(t, targetDual.homeId, targetDual.awayId);
          nextDualMatches = nextDualMatches.map(dm => 
            dm.id === dualMatchId 
              ? { ...dm, homeScore: scores.hScore, awayScore: scores.aScore, isSimulated: true, homePlayerId: getBestPlayerId(dm.homeId), awayPlayerId: getBestPlayerId(dm.awayId) } 
              : dm
          );
        }
      }

      return { ...t, matches: nextMatches, dualLeagueMatches: nextDualMatches, incidents: newIncidents };
    }));
  }, [generateScoreByRules, players, teams, getBestPlayerId, settings.currency]);

  const processIncidentDecision = (tournamentId: string, incidentId: string, accept: boolean) => {
    setTournaments(prev => prev.map(t => {
      if (t.id !== tournamentId) return t;
      const incident = t.incidents.find(i => i.id === incidentId);
      if (!incident || incident.status !== 'pending') return t;

      if (accept && incident.playerId && incident.toTeamId) {
        setTimeout(() => transferPlayerInternal(incident.playerId!, incident.toTeamId), 0);
      }

      return {
        ...t,
        incidents: t.incidents.map(i => i.id === incidentId ? { ...i, status: accept ? 'accepted' : 'rejected' } : i)
      };
    }));
  };

  const transferPlayer = useCallback((playerId: string, toTeamId: string | undefined) => {
    transferPlayerInternal(playerId, toTeamId);
  }, []);

  const applySanction = useCallback((tournamentId: string, type: 'team' | 'player', targetId: string, value: number) => {
    if (type === 'team') {
      setTeams(prev => prev.map(t => t.id === targetId ? { ...t, budget: Math.max(0, t.budget - value) } : t));
    } else {
      setPlayers(prev => prev.map(p => p.id === targetId ? { ...p, suspensionMatchdays: value } : p));
    }
    setTournaments(prev => prev.map(t => {
      if (t.id !== tournamentId) return t;
      const targetName = type === 'team' ? teams.find(x => x.id === targetId)?.name : players.find(x => x.id === targetId)?.name;
      return {
        ...t,
        incidents: [...(t.incidents || []), {
          id: `manual-sanc-${Date.now()}`,
          date: new Date().toLocaleDateString(),
          message: `Sanción del Comité: ${targetName} recibe castigo de ${value} ${type === 'team' ? settings.currency : 'jornadas'}.`,
          type: 'sanction'
        }]
      };
    }));
  }, [teams, players, settings.currency]);

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
    teams, players, tournaments, settings, addTeam, updateTeam, deleteTeam, addPlayer, updatePlayer, deletePlayer, addTournament, updateTournament, deleteTournament, updateSettings, importData, transferPlayer, generateSchedule, resetSchedule, resolveMatch, applySanction, processIncidentDecision
  }), [teams, players, tournaments, settings, generateSchedule, resetSchedule, resolveMatch, transferPlayer, importData, applySanction, processIncidentDecision]);

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>;
}

export function useTournamentStore() {
  const context = useContext(TournamentContext);
  if (!context) throw new Error('useTournamentStore debe usarse dentro de un TournamentProvider');
  return context;
}