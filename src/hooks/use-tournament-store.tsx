'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Team, Player, Tournament, GlobalSettings, Match, TournamentIncident, ChallengeSport } from '@/lib/types';
import hortaData from '@/data/horta-league.json';
import { useFirestore, useUser } from '@/firebase/provider';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { generateScore, getScoreRuleError } from '@/lib/scoring';
import { useToast } from '@/hooks/use-toast';
import { applyPlayerMatchDevelopment } from '@/lib/player-development';

type ProfileData = {
  teams: Team[];
  players: Player[];
  tournaments: Tournament[];
  settings: GlobalSettings;
};

type Profile = { id: string; name: string; data: ProfileData };

interface TournamentContextType {
  teams: Team[];
  players: Player[];
  tournaments: Tournament[];
  settings: GlobalSettings;
  profiles: { id: string; name: string }[];
  activeProfileId: string;
  createProfile: (name: string) => void;
  renameProfile: (id: string, name: string) => void;
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
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
  transferPlayer: (playerId: string, toTeamId: string | undefined) => boolean;
  importData: (data: any, merge: boolean) => void;
  generateSchedule: (tournamentId: string) => void;
  resetSchedule: (tournamentId: string) => void;
  resetMatchday: (tournamentId: string, matchdayNumber: number) => void;
  resolveMatch: (tournamentId: string, matchId: string, homeScore: number, awayScore: number, isDual: boolean, homePlayerId?: string, awayPlayerId?: string, autoSim?: boolean) => boolean;
  simulateMatchday: (tournamentId: string, matchdayNumber?: number) => void;
  applySanction: (tournamentId: string, type: 'team' | 'player', targetId: string, value: number) => void;
  processIncidentDecision: (tournamentId: string, incidentId: string, accept: boolean) => boolean;
}

const defaultSettings: GlobalSettings = {
  ...(hortaData.settings as GlobalSettings),
  theme: 'retro'
};

const emptyProfileData: ProfileData = {
  teams: [],
  players: [],
  tournaments: [],
  settings: defaultSettings
};

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const user = useUser();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState('default');
  const [isLoaded, setIsLoaded] = useState(false);
  const processedIncidents = useRef(new Set<string>());
  const loadedWorkspaceOwner = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadWorkspace = async () => {
      setIsLoaded(false);
      loadedWorkspaceOwner.current = user?.uid || 'guest';
      const localKey = `tourneycraft-profiles-v2:${user?.uid || 'guest'}`;
      let localProfiles: Profile[] = [];
      let localActiveId = 'default';
      try {
        const saved = localStorage.getItem(localKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          localProfiles = parsed.profiles || [];
          localActiveId = parsed.activeProfileId || localProfiles[0]?.id || 'default';
        } else if (!user) {
          const legacy = localStorage.getItem('tourneycraft-store');
          if (legacy) {
            const parsed = JSON.parse(legacy);
            localProfiles = [{
              id: 'default',
              name: 'Mi perfil',
              data: {
                teams: parsed.teams || hortaData.teams,
                players: parsed.players || hortaData.players,
                tournaments: parsed.tournaments || hortaData.tournaments,
                settings: parsed.settings || defaultSettings,
              }
            }];
          }
        }
      } catch (error) {
        console.error('No se pudieron cargar los perfiles locales:', error);
      }
      if (user && localProfiles.length === 0) {
        try {
          const guestWorkspace = localStorage.getItem('tourneycraft-profiles-v2:guest');
          if (guestWorkspace) {
            const parsed = JSON.parse(guestWorkspace);
            localProfiles = parsed.profiles || [];
            localActiveId = parsed.activeProfileId || localProfiles[0]?.id || 'default';
          } else {
            const legacy = localStorage.getItem('tourneycraft-store');
            if (legacy) {
              const parsed = JSON.parse(legacy);
              localProfiles = [{
                id: 'default',
                name: 'Mi perfil',
                data: {
                  teams: parsed.teams || hortaData.teams,
                  players: parsed.players || hortaData.players,
                  tournaments: parsed.tournaments || hortaData.tournaments,
                  settings: parsed.settings || defaultSettings,
                }
              }];
            }
          }
        } catch (error) {
          console.error('No se pudieron importar los datos locales a la cuenta:', error);
        }
      }
      if (localProfiles.length === 0) {
        localProfiles = [{
          id: 'default',
          name: 'Mi perfil',
          data: user ? emptyProfileData : {
            teams: hortaData.teams as Team[],
            players: hortaData.players as Player[],
            tournaments: hortaData.tournaments as Tournament[],
            settings: defaultSettings,
          }
        }];
        localActiveId = 'default';
      }

      let loadedProfiles = localProfiles;
      let loadedActiveId = localActiveId;
      if (user && firestore) {
        try {
          const indexReference = doc(firestore, 'users', user.uid, 'workspace', 'profiles');
          const cloudIndex = await getDoc(indexReference);
          const indexData = cloudIndex.data();
          if (cloudIndex.exists() && Array.isArray(indexData?.profileIds) && indexData.profileIds.length > 0) {
            const cloudProfiles = await Promise.all(indexData.profileIds.map(async (profileId: string) => {
              const snapshot = await getDoc(doc(firestore, 'users', user.uid, 'profiles', profileId));
              return snapshot.exists() ? snapshot.data() as Profile : null;
            }));
            loadedProfiles = cloudProfiles.filter((profile): profile is Profile => profile !== null);
            loadedActiveId = indexData.activeProfileId || loadedProfiles[0]?.id || 'default';
          } else if (cloudIndex.exists() && Array.isArray(indexData?.profiles) && indexData.profiles.length > 0) {
            loadedProfiles = indexData.profiles as Profile[];
            loadedActiveId = indexData.activeProfileId || loadedProfiles[0].id;
          }
        } catch (error) {
          console.error('No se pudieron sincronizar los perfiles de la cuenta:', error);
          toast({ title: 'Error al sincronizar la cuenta', description: 'Tus datos locales se mantienen en este dispositivo.', variant: 'destructive' });
        }
      }
      if (cancelled) return;
      const activeProfile = loadedProfiles.find(profile => profile.id === loadedActiveId) || loadedProfiles[0];
      setProfiles(loadedProfiles);
      setActiveProfileId(activeProfile.id);
      setTeams(activeProfile.data.teams || []);
      setPlayers(activeProfile.data.players || []);
      setTournaments(activeProfile.data.tournaments || []);
      setSettings(activeProfile.data.settings || defaultSettings);
      setIsLoaded(true);
    };
    void loadWorkspace();
    return () => { cancelled = true; };
  }, [user, firestore, toast]);

  useEffect(() => {
    if (isLoaded && loadedWorkspaceOwner.current === (user?.uid || 'guest')) {
      document.body.className = settings.theme;
      const activeData = { teams, players, tournaments, settings };
      const savedProfiles = profiles.map(profile => profile.id === activeProfileId
        ? { ...profile, data: activeData }
        : profile);
      const currentProfile = profiles.find(profile => profile.id === activeProfileId);
      const profileDataChanged = !currentProfile || JSON.stringify(currentProfile.data) !== JSON.stringify(activeData);
      const persistedProfiles = profileDataChanged
        ? savedProfiles
        : profiles;
      if (!currentProfile) {
        persistedProfiles.push({ id: activeProfileId, name: 'Mi perfil', data: activeData });
      }
      if (profileDataChanged) setProfiles(persistedProfiles);
      const localKey = `tourneycraft-profiles-v2:${user?.uid || 'guest'}`;
      try {
        localStorage.setItem(localKey, JSON.stringify({ profiles: persistedProfiles, activeProfileId }));
      } catch (error) {
        console.error('No se pudieron guardar los perfiles localmente:', error);
        toast({ title: 'Error al guardar localmente', description: 'Puede que el almacenamiento del navegador esté lleno.', variant: 'destructive' });
      }
      if (user && firestore) {
        const saveTimeout = window.setTimeout(() => {
          void Promise.all(persistedProfiles.map(profile => setDoc(
            doc(firestore, 'users', user.uid, 'profiles', profile.id),
            profile,
          ))).then(() => setDoc(doc(firestore, 'users', user.uid, 'workspace', 'profiles'), {
            profileIds: persistedProfiles.map(profile => profile.id),
            activeProfileId,
            updatedAt: new Date().toISOString(),
          })).catch(error => {
            console.error('No se pudieron guardar los perfiles en la cuenta:', error);
            toast({ title: 'Error al guardar en la cuenta', description: 'Los datos siguen guardados localmente; inténtalo de nuevo.', variant: 'destructive' });
          });
        }, 400);
        return () => window.clearTimeout(saveTimeout);
      }
    }
  }, [teams, players, tournaments, settings, profiles, activeProfileId, isLoaded, user, firestore, toast]);

  const getBestPlayerId = useCallback((teamId: string, excludePlayerId?: string) => {
    const teamPlayers = players.filter(p => p.teamId === teamId && p.suspensionMatchdays === 0 && p.id !== excludePlayerId);
    if (teamPlayers.length === 0) return undefined;
    const sorted = [...teamPlayers].sort((a, b) => b.monetaryValue - a.monetaryValue);
    const rand = Math.random();
    if (rand < 0.7) return sorted[0].id;
    if (rand < 0.9 && sorted.length > 1) return sorted[1].id;
    if (sorted.length > 2) {
      const remainingIndex = 2 + Math.floor(Math.random() * (sorted.length - 2));
      return sorted[remainingIndex].id;
    }
    return sorted[Math.floor(Math.random() * sorted.length)].id;
  }, [players]);

  const generateScoreByRules = useCallback((t: Tournament, hPlayerId?: string, aPlayerId?: string) => {
    const hPlayer = players.find(p => p.id === hPlayerId);
    const aPlayer = players.find(p => p.id === aPlayerId);
    const hRating = (hPlayer?.monetaryValue || 50) + 5; 
    const aRating = (aPlayer?.monetaryValue || 50);
    const chaos = (t.variability || 15) / 100;
    const winProb = (hRating / (hRating + aRating)) + (Math.random() * chaos - chaos / 2);
    return generateScore(t, Math.max(0.05, Math.min(0.95, winProb)));
  }, [players]);

  const applyFinancialPressure = useCallback((t: Tournament, homeId: string, awayId: string, score: { homeScore: number; awayScore: number }) => {
    if (t.mode !== 'arcade' || t.arcadeMaxBrokeMatchdays === undefined || !t.arcadeSanctionPoints) return score;
    const homeBroke = (t.teamBrokeMatchdays?.[homeId] || 0) >= t.arcadeMaxBrokeMatchdays;
    const awayBroke = (t.teamBrokeMatchdays?.[awayId] || 0) >= t.arcadeMaxBrokeMatchdays;
    if (homeBroke === awayBroke) return score;

    if (t.scoringRuleType === 'firstToN') {
      const brokeTeamWon = homeBroke
        ? score.homeScore > score.awayScore
        : score.awayScore > score.homeScore;
      return brokeTeamWon ? { homeScore: score.awayScore, awayScore: score.homeScore } : score;
    }

    const penalty = Math.max(0, Math.floor(t.arcadeSanctionPoints));
    if (homeBroke) {
      const shifted = Math.min(penalty, score.homeScore);
      return { homeScore: score.homeScore - shifted, awayScore: score.awayScore + shifted };
    }
    const shifted = Math.min(penalty, score.awayScore);
    return { homeScore: score.homeScore + shifted, awayScore: score.awayScore - shifted };
  }, []);

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
    const currentTournament = tournaments.find(item => item.id === tournamentId);
    const currentMatch = currentTournament && (isDual
      ? currentTournament.dualLeagueMatches || []
      : currentTournament.matches).find(match => match.id === matchId);
    if (!currentTournament || !currentMatch) return false;
    if (!autoSim && currentTournament.mode !== 'challenge' && getScoreRuleError(
      currentTournament.scoringRuleType,
      currentTournament.scoringValue || 9,
      currentTournament.nToNRangeMin ?? 0,
      currentTournament.nToNRangeMax ?? 10,
      hScoreInput,
      aScoreInput,
    )) return false;

    setTournaments(prev => prev.map(t => {
      if (t.id !== tournamentId) return t;
      
      let nextT = { ...t };
      const matchSource = isDual ? (t.dualLeagueMatches || []) : (t.matches || []);
      const targetMatch = matchSource.find(m => m.id === matchId);
      if (!targetMatch) return t;

      const hPlayerId = homePlayerId || (t.mode === 'challenge' ? targetMatch.homeId : getBestPlayerId(targetMatch.homeId));
      const aPlayerId = awayPlayerId || (t.mode === 'challenge' ? targetMatch.awayId : getBestPlayerId(targetMatch.awayId));

      let hScore = hScoreInput;
      let aScore = aScoreInput;

      if (autoSim) {
        const baseScore = generateScoreByRules(t, hPlayerId, aPlayerId);
        const res = applyFinancialPressure(t, targetMatch.homeId, targetMatch.awayId, baseScore);
        hScore = res.homeScore; aScore = res.awayScore;
      } else {
        const res = applyFinancialPressure(t, targetMatch.homeId, targetMatch.awayId, { homeScore: hScore, awayScore: aScore });
        hScore = res.homeScore; aScore = res.awayScore;
      }

      const updateMatchList = (mList: Match[]) => mList.map(m => m.id === matchId ? { ...m, homeScore: hScore, awayScore: aScore, isSimulated: true, homePlayerId: hPlayerId, awayPlayerId: aPlayerId } : m);
      
      if (isDual) {
        nextT.dualLeagueMatches = updateMatchList(t.dualLeagueMatches || []);
      } else {
        nextT.matches = updateMatchList(t.matches);
      }

      if (t.mode === 'arcade' && t.dualLeagueEnabled && !isDual) {
        const dualM = (nextT.dualLeagueMatches || []).find(dm => dm.matchday === targetMatch.matchday && ((dm.homeId === targetMatch.homeId && dm.awayId === targetMatch.awayId) || (dm.homeId === targetMatch.awayId && dm.awayId === targetMatch.homeId)));
        if (dualM && !dualM.isSimulated) {
           const dualHPlayer = getBestPlayerId(dualM.homeId, dualM.homeId === targetMatch.homeId ? hPlayerId : aPlayerId);
           const dualAPlayer = getBestPlayerId(dualM.awayId, dualM.awayId === targetMatch.awayId ? aPlayerId : hPlayerId);
           const dualBaseScore = generateScoreByRules(t, dualHPlayer, dualAPlayer);
           const dualRes = applyFinancialPressure(t, dualM.homeId, dualM.awayId, dualBaseScore);
           const dHScore = dualRes.homeScore;
           const dAScore = dualRes.awayScore;
           
           nextT.dualLeagueMatches = nextT.dualLeagueMatches.map(nm => nm.id === dualM.id ? { ...nm, homeScore: dHScore, awayScore: dAScore, isSimulated: true, homePlayerId: dualHPlayer, awayPlayerId: dualAPlayer } : nm);
           
           setTimeout(() => {
             setPlayers(pPrev => pPrev.map(pl => {
               if (pl.id === dualHPlayer) return applyPlayerMatchDevelopment(pl, dHScore, dAScore);
               if (pl.id === dualAPlayer) return applyPlayerMatchDevelopment(pl, dAScore, dHScore);
               return pl;
             }));
           }, 0);
        }
      }

      if (t.mode !== 'challenge' && !isDual) {
        const isHomeWin = hScore > aScore;
        const isAwayWin = aScore > hScore;
        const hChange = isHomeWin ? t.winReward : isAwayWin ? -t.lossPenalty : t.drawReward;
        const aChange = isAwayWin ? t.winReward : isHomeWin ? -t.lossPenalty : t.drawReward;
        
        let ntBroke = { ...(t.teamBrokeMatchdays || {}) };
        
        setTimeout(() => {
          setTeams(tPrev => tPrev.map(team => {
            if (team.id === targetMatch.homeId) return { ...team, budget: Math.max(0, team.budget + hChange) };
            if (team.id === targetMatch.awayId) return { ...team, budget: Math.max(0, team.budget + aChange) };
            return team;
          }));
          setPlayers(pPrev => pPrev.map(pl => {
             if (pl.id === hPlayerId) return applyPlayerMatchDevelopment(pl, hScore, aScore);
             if (pl.id === aPlayerId) return applyPlayerMatchDevelopment(pl, aScore, hScore);
             return pl;
          }));
        }, 0);

        const curHTeam = teams.find(tm => tm.id === targetMatch.homeId);
        const curATeam = teams.find(tm => tm.id === targetMatch.awayId);
        if (curHTeam && curHTeam.budget + hChange <= 0) ntBroke[targetMatch.homeId] = (ntBroke[targetMatch.homeId] || 0) + 1;
        else ntBroke[targetMatch.homeId] = 0;
        
        if (curATeam && curATeam.budget + aChange <= 0) ntBroke[targetMatch.awayId] = (ntBroke[targetMatch.awayId] || 0) + 1;
        else ntBroke[targetMatch.awayId] = 0;
        
        nextT.teamBrokeMatchdays = ntBroke;
      }

      if (t.mode === 'challenge' && !isDual) {
        setTimeout(() => {
          setPlayers(previous => previous.map(player => {
            if (player.id === hPlayerId) return applyPlayerMatchDevelopment(player, hScore, aScore);
            if (player.id === aPlayerId) return applyPlayerMatchDevelopment(player, aScore, hScore);
            return player;
          }));
        }, 0);
      }

      return nextT;
    }));
    return true;
  }, [generateScoreByRules, applyFinancialPressure, getBestPlayerId, teams, tournaments]);

  const simulateMatchday = useCallback((tournamentId: string, matchdayNumber?: number) => {
    setTournaments(prev => prev.map(t => {
      if (t.id !== tournamentId) return t;
      let nextT = { ...t };
      const dayMatches = t.matches.filter(m => m.matchday === matchdayNumber && !m.isSimulated);
      let ntBroke = { ...(t.teamBrokeMatchdays || {}) };
      let newIncidents: TournamentIncident[] = [];
      
      dayMatches.forEach(m => {
        const isUserMatch = (t.mode === 'arcade' && (m.homeId === t.managedParticipantId || m.awayId === t.managedParticipantId)) || (t.mode === 'challenge');
        if (!isUserMatch) {
          const hPlayerId = getBestPlayerId(m.homeId);
          const aPlayerId = getBestPlayerId(m.awayId);
          
          const baseScore = generateScoreByRules(t, hPlayerId, aPlayerId);
          const { homeScore: hScore, awayScore: aScore } = applyFinancialPressure(t, m.homeId, m.awayId, baseScore);
          
          nextT.matches = nextT.matches.map(nm => nm.id === m.id ? { ...nm, homeScore: hScore, awayScore: aScore, isSimulated: true, homePlayerId: hPlayerId, awayPlayerId: aPlayerId } : nm);
          
          if (t.mode === 'arcade' && t.dualLeagueEnabled) {
            const dualM = (nextT.dualLeagueMatches || []).find(dm => dm.matchday === m.matchday && ((dm.homeId === m.homeId && dm.awayId === m.awayId) || (dm.homeId === m.awayId && dm.awayId === m.homeId)));
            if (dualM && !dualM.isSimulated) {
               const dualHPlayer = getBestPlayerId(dualM.homeId, dualM.homeId === m.homeId ? hPlayerId : aPlayerId);
               const dualAPlayer = getBestPlayerId(dualM.awayId, dualM.awayId === m.awayId ? aPlayerId : hPlayerId);
               const dualBaseScore = generateScoreByRules(t, dualHPlayer, dualAPlayer);
               const dualRes = applyFinancialPressure(t, dualM.homeId, dualM.awayId, dualBaseScore);
               const dHScore = dualRes.homeScore;
               const dAScore = dualRes.awayScore;
               
               nextT.dualLeagueMatches = (nextT.dualLeagueMatches || []).map(nm => nm.id === dualM.id ? { ...nm, homeScore: dHScore, awayScore: dAScore, isSimulated: true, homePlayerId: dualHPlayer, awayPlayerId: dualAPlayer } : nm);
               
               setTimeout(() => {
                 setPlayers(pPrev => pPrev.map(pl => {
                   if (pl.id === dualHPlayer) return applyPlayerMatchDevelopment(pl, dHScore, dAScore);
                   if (pl.id === dualAPlayer) return applyPlayerMatchDevelopment(pl, dAScore, dHScore);
                   return pl;
                 }));
               }, 0);
            }
          }

          if (t.mode !== 'challenge') {
            const isHomeWin = hScore > aScore;
            const isAwayWin = aScore > hScore;
            const hChange = isHomeWin ? t.winReward : isAwayWin ? -t.lossPenalty : t.drawReward;
            const aChange = isAwayWin ? t.winReward : isHomeWin ? -t.lossPenalty : t.drawReward;
            
            const curHTeam = teams.find(tm => tm.id === m.homeId);
            const curATeam = teams.find(tm => tm.id === m.awayId);
            if (curHTeam && curHTeam.budget + hChange <= 0) ntBroke[m.homeId] = (ntBroke[m.homeId] || 0) + 1;
            else ntBroke[m.homeId] = 0;
            
            if (curATeam && curATeam.budget + aChange <= 0) ntBroke[m.awayId] = (ntBroke[m.awayId] || 0) + 1;
            else ntBroke[m.awayId] = 0;

            setTimeout(() => {
              setTeams(tPrev => tPrev.map(team => {
                if (team.id === m.homeId) return { ...team, budget: Math.max(0, team.budget + hChange) };
                if (team.id === m.awayId) return { ...team, budget: Math.max(0, team.budget + aChange) };
                return team;
              }));
              setPlayers(pPrev => pPrev.map(pl => {
                 if (pl.id === hPlayerId) return applyPlayerMatchDevelopment(pl, hScore, aScore);
                 if (pl.id === aPlayerId) return applyPlayerMatchDevelopment(pl, aScore, hScore);
                 return pl;
              }));
            }, 0);
          }
          
          if (t.mode === 'arcade' && Math.random() < 0.05) {
             const sanctionTarget = Math.random() < 0.5 ? 'team' : 'player';
             const isHome = Math.random() < 0.5;
             const targetTeamId = isHome ? m.homeId : m.awayId;
             const targetTeam = teams.find(tm => tm.id === targetTeamId);
             if (sanctionTarget === 'team') {
                const sanctionVal = Math.min(
                  Math.max(1, Math.round((targetTeam?.budget || 0) * (0.03 + Math.random() * 0.05))),
                  250,
                  targetTeam?.budget || 0,
                );
                if (sanctionVal <= 0) return;
                newIncidents.push({
                   id: `inc-sanc-${Date.now()}-${Math.random()}`,
                   date: `Jornada ${matchdayNumber}`,
                   message: `La liga multa a ${targetTeam?.name || 'el equipo'} con ${sanctionVal} CR por incumplir las normas financieras.`,
                   type: 'sanction',
                   status: targetTeamId === t.managedParticipantId ? 'pending' : 'accepted',
                   fromTeamId: targetTeamId,
                   value: sanctionVal
                });
                if (targetTeamId !== t.managedParticipantId) {
                  setTimeout(() => setTeams(previous => previous.map(team => team.id === targetTeamId
                    ? { ...team, budget: Math.max(0, team.budget - sanctionVal) }
                    : team)), 0);
                }
             } else {
                const targetPlayerId = isHome ? hPlayerId : aPlayerId;
                const targetPlayer = players.find(pl => pl.id === targetPlayerId);
                if (!targetPlayer) return;
                newIncidents.push({
                   id: `inc-susp-${Date.now()}-${Math.random()}`,
                   date: `Jornada ${matchdayNumber}`,
                   message: `${targetPlayer.name} (${targetTeam?.name || 'su equipo'}) queda suspendido un partido tras una revisión disciplinaria.`,
                   type: 'sanction',
                   status: targetTeamId === t.managedParticipantId ? 'pending' : 'accepted',
                   playerId: targetPlayerId,
                   value: 1
                });
                if (targetTeamId !== t.managedParticipantId) {
                  setTimeout(() => setPlayers(previous => previous.map(player => player.id === targetPlayerId
                    ? { ...player, suspensionMatchdays: player.suspensionMatchdays + 1 }
                    : player)), 0);
                }
             }
          }
        }
      });
      const hasPendingOffer = [...(t.incidents || []), ...newIncidents].some(incident => incident.type === 'transfer' && incident.status === 'pending');
      if (t.mode === 'arcade' && !hasPendingOffer && Math.random() < 0.3 && t.managedParticipantId) {
        const aiTeamIds = t.participants.filter(participantId => participantId !== t.managedParticipantId && teams.some(team => team.id === participantId));
        const userSells = Math.random() < 0.5;
        const sourceTeamId = userSells
          ? t.managedParticipantId
          : aiTeamIds[Math.floor(Math.random() * aiTeamIds.length)];
        const targetTeamId = userSells
          ? aiTeamIds[Math.floor(Math.random() * aiTeamIds.length)]
          : t.managedParticipantId;
        const sourceTeamPlayers = players.filter(player => player.teamId === sourceTeamId && player.suspensionMatchdays === 0);
        const buyer = teams.find(team => team.id === targetTeamId);
        const sourceTeam = teams.find(team => team.id === sourceTeamId);
        if (sourceTeamPlayers.length > 0 && buyer && sourceTeam && buyer.budget > 0) {
          const player = sourceTeamPlayers[Math.floor(Math.random() * sourceTeamPlayers.length)];
          const fairValue = Math.max(1, Math.round(player.monetaryValue * 10));
          const offer = Math.min(fairValue, Math.max(1, Math.floor(buyer.budget * 0.35)));
          newIncidents.push({
            id: `inc-trans-${Date.now()}-${Math.random()}`,
            date: `Jornada ${matchdayNumber}`,
            message: `${buyer.name} ofrece ${offer.toLocaleString()} CR por ${player.name} (${player.monetaryValue}/100) al ${sourceTeam.name}.`,
            type: 'transfer',
            status: 'pending',
            opened: false,
            playerId: player.id,
            fromTeamId: sourceTeamId,
            toTeamId: targetTeamId,
            value: offer,
          });
        }
      }
      nextT.teamBrokeMatchdays = ntBroke;
      nextT.incidents = [...(nextT.incidents || []), ...newIncidents];
      return nextT;
    }));
  }, [generateScoreByRules, applyFinancialPressure, getBestPlayerId, teams, players]);

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
    profiles: profiles.map(({ id, name }) => ({ id, name })),
    activeProfileId,
    createProfile: (name: string) => {
      const id = `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const data: ProfileData = {
        ...emptyProfileData,
        settings: {
          ...defaultSettings,
          positions: [...defaultSettings.positions],
          positionColors: { ...defaultSettings.positionColors },
          attributeNames: [...defaultSettings.attributeNames],
        },
      };
      setProfiles(previous => [...previous, { id, name: name.trim() || 'Nuevo perfil', data }]);
      setActiveProfileId(id);
      setTeams(data.teams);
      setPlayers(data.players);
      setTournaments(data.tournaments);
      setSettings(data.settings);
    },
    renameProfile: (id: string, name: string) => {
      const normalizedName = name.trim();
      if (normalizedName) setProfiles(previous => previous.map(profile => profile.id === id ? { ...profile, name: normalizedName } : profile));
    },
    deleteProfile: (id: string) => {
      if (profiles.length <= 1) return;
      const remaining = profiles.filter(profile => profile.id !== id);
      setProfiles(remaining);
      if (user && firestore) {
        void deleteDoc(doc(firestore, 'users', user.uid, 'profiles', id)).catch(error => {
          console.error('No se pudo eliminar el perfil de la cuenta:', error);
          toast({ title: 'No se pudo eliminar de la cuenta', description: 'El perfil se ha quitado de este dispositivo, pero no de la nube.', variant: 'destructive' });
        });
      }
      if (id === activeProfileId) {
        const next = remaining[0];
        setActiveProfileId(next.id);
        setTeams(next.data.teams);
        setPlayers(next.data.players);
        setTournaments(next.data.tournaments);
        setSettings(next.data.settings);
      }
    },
    setActiveProfile: (id: string) => {
      const profile = profiles.find(item => item.id === id);
      if (!profile || profile.id === activeProfileId) return;
      setActiveProfileId(profile.id);
      setTeams(profile.data.teams);
      setPlayers(profile.data.players);
      setTournaments(profile.data.tournaments);
      setSettings(profile.data.settings);
    },
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
      const player = players.find(item => item.id === pId);
      if (!player || player.teamId === tId) return false;
      const buyer = tId ? teams.find(team => team.id === tId) : undefined;
      if (tId && (!buyer || buyer.budget < player.monetaryValue)) return false;
      setPlayers(previous => previous.map(item => item.id === pId ? { ...item, teamId: tId } : item));
      setTeams(previous => previous.map(team => {
        if (team.id === tId) return { ...team, budget: team.budget - player.monetaryValue };
        if (team.id === player.teamId) return { ...team, budget: team.budget + player.monetaryValue };
        return team;
      }));
      return true;
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
      const incidentKey = `${tId}:${incidentId}`;
      if (processedIncidents.current.has(incidentKey)) return false;
      const currentIncident = tournaments.find(tournament => tournament.id === tId)?.incidents.find(incident => incident.id === incidentId);
      if (!currentIncident || currentIncident.status !== 'pending') return false;
      if (accept && currentIncident.type === 'transfer') {
        const buyer = teams.find(team => team.id === currentIncident.toTeamId);
        const player = players.find(item => item.id === currentIncident.playerId);
        if (!buyer || !player || player.teamId !== currentIncident.fromTeamId || !currentIncident.value || buyer.budget < currentIncident.value) return false;
      }
      processedIncidents.current.add(incidentKey);
      const incObj: TournamentIncident | undefined = currentIncident;
      setTournaments(prev => prev.map(t => {
        if (t.id !== tId) return t;
        const inc = t.incidents.find(i => i.id === incidentId);
        if (!inc || inc.status !== 'pending') return t;
        return { ...t, incidents: t.incidents.map(i => i.id === incidentId ? { ...i, status: accept ? 'accepted' : 'rejected' } : i) };
      }));
      
      setTimeout(() => {
        if (accept && incObj) {
           if (incObj.type === 'transfer' && incObj.playerId && incObj.toTeamId && incObj.fromTeamId && incObj.value) {
              setPlayers(pPrev => pPrev.map(p => p.id === incObj.playerId ? { ...p, teamId: incObj.toTeamId } : p));
              setTeams(tPrev => tPrev.map(t => {
                 if (t.id === incObj.toTeamId) return { ...t, budget: t.budget - incObj.value! };
                 if (t.id === incObj.fromTeamId) return { ...t, budget: t.budget + incObj.value! };
                 return t;
              }));
           } else if (incObj.type === 'sanction' && incObj.value) {
              if (incObj.playerId) {
                 setPlayers(pPrev => pPrev.map(p => p.id === incObj.playerId ? { ...p, suspensionMatchdays: (p.suspensionMatchdays || 0) + incObj.value! } : p));
              } else if (incObj.fromTeamId) {
                 setTeams(tPrev => tPrev.map(t => t.id === incObj.fromTeamId ? { ...t, budget: Math.max(0, t.budget - incObj.value!) } : t));
              }
           }
        }
      }, 0);
      return true;
    }
  }), [teams, players, tournaments, settings, profiles, activeProfileId, user, firestore, toast, generateSchedule, resetSchedule, resetMatchday, resolveMatch, simulateMatchday, createScheduleInternal]);

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>;
}

export function useTournamentStore() {
  const context = useContext(TournamentContext);
  if (!context) throw new Error('useTournamentStore debe usarse dentro de un TournamentProvider');
  return context;
}