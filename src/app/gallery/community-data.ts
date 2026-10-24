import type { Player, Team, Tournament, GlobalSettings } from '@/lib/types';

export const COMMUNITY_PAYLOAD_MAX_BYTES = 850_000;
export const COMMUNITY_DOCUMENT_MAX_BYTES = 900_000;

export type CommunityKind = 'profile' | 'team' | 'player' | 'tournament';

export interface CommunityPackage {
  teams: Team[];
  players: Player[];
  tournaments: Tournament[];
  settings?: GlobalSettings;
  exportDate?: string;
  version?: string;
}

export interface CommunityItem {
  id: string;
  ownerId: string;
  authorName: string;
  type: CommunityKind;
  title: string;
  payloadJson: string;
  createdAt: string;
  updatedAt: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString);

function isJsonValue(value: unknown, depth = 0): boolean {
  if (depth > 20) return false;
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'string') return value.length <= 10_000;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) {
    return value.length <= 10_000 && value.every((entry) => isJsonValue(entry, depth + 1));
  }
  if (!isRecord(value)) return false;
  const entries = Object.entries(value);
  return entries.length <= 200 && entries.every(
    ([key, entry]) => key.length <= 100 && isJsonValue(entry, depth + 1),
  );
}

function isTeam(value: unknown): value is Team {
  if (!isRecord(value)) return false;
  return isString(value.id) && isString(value.name) && isString(value.abbreviation) &&
    isFiniteNumber(value.rating) && isFiniteNumber(value.budget) &&
    isString(value.emblemShape) && isString(value.emblemPattern) &&
    isString(value.crestPrimary) && isString(value.crestSecondary) &&
    isString(value.crestBorderWidth) && isString(value.venueName) &&
    isFiniteNumber(value.venueCapacity) && isString(value.venueSurface) &&
    isString(value.venueSize) && isStringArray(value.players);
}

function isPlayer(value: unknown): value is Player {
  if (!isRecord(value) || !Array.isArray(value.attributes)) return false;
  return isString(value.id) && isString(value.name) && isString(value.position) &&
    isFiniteNumber(value.monetaryValue) && isFiniteNumber(value.jerseyNumber) &&
    isFiniteNumber(value.suspensionMatchdays) &&
    value.attributes.every((attribute) => isRecord(attribute) &&
      isString(attribute.name) && isFiniteNumber(attribute.value)) &&
    isString(value.uniformStyle) && isString(value.kitPrimary) &&
    isString(value.kitSecondary) && isString(value.crestPlacement) &&
    isString(value.sponsorPlacement) && isString(value.brandPlacement);
}

function isTournament(value: unknown): value is Tournament {
  if (!isRecord(value)) return false;
  return isString(value.id) && isString(value.name) && isString(value.sport) &&
    isString(value.mode) && isString(value.entryType) && isString(value.format) &&
    isString(value.scoringRuleType) && typeof value.groupIsolation === 'boolean' &&
    isStringArray(value.participants) && Array.isArray(value.matches) &&
    Array.isArray(value.dualLeagueMatches) && typeof value.dualLeagueEnabled === 'boolean' &&
    typeof value.settingsLocked === 'boolean' && Array.isArray(value.incidents) &&
    ['winReward', 'lossPenalty', 'drawReward', 'variability', 'winPoints', 'lossPoints',
      'drawPoints', 'playoffSpots', 'relegationSpots', 'currentSeason', 'currentMatchday']
      .every((key) => isFiniteNumber(value[key]));
}

export function isCommunityPackage(value: unknown): value is CommunityPackage {
  if (!isRecord(value) || !isJsonValue(value)) return false;
  if (!Array.isArray(value.teams) || value.teams.length > 2_000 ||
      !value.teams.every(isTeam)) return false;
  if (!Array.isArray(value.players) || value.players.length > 5_000 ||
      !value.players.every(isPlayer)) return false;
  if (!Array.isArray(value.tournaments) || value.tournaments.length > 1_000 ||
      !value.tournaments.every(isTournament)) return false;
  if (value.settings !== undefined && !isRecord(value.settings)) return false;
  if (value.exportDate !== undefined && !isString(value.exportDate)) return false;
  if (value.version !== undefined && !isString(value.version)) return false;
  return true;
}

export function isCommunityKind(value: unknown): value is CommunityKind {
  return value === 'profile' || value === 'team' || value === 'player' || value === 'tournament';
}

export function inferCommunityKind(payload: CommunityPackage): CommunityKind {
  if (payload.tournaments.length === 1) return 'tournament';
  if (payload.teams.length === 1 && payload.tournaments.length === 0) return 'team';
  if (payload.players.length === 1 && payload.teams.length === 0 && payload.tournaments.length === 0) {
    return 'player';
  }
  if (payload.teams.length || payload.players.length || payload.tournaments.length) return 'profile';
  throw new Error('El archivo no contiene equipos, jugadores ni torneos para compartir.');
}

function normalizePackageForCommunity(value: Record<string, unknown>): Record<string, unknown> {
  const teams = Array.isArray(value.teams) ? value.teams.map((entry) => {
    if (!isRecord(entry)) return entry;
    const name = isString(entry.name) ? entry.name : '';
    return {
      ...entry,
      abbreviation: isString(entry.abbreviation) ? entry.abbreviation : name.slice(0, 3).toUpperCase(),
      emblemShape: isString(entry.emblemShape) ? entry.emblemShape : 'shield',
      emblemPattern: isString(entry.emblemPattern) ? entry.emblemPattern : 'none',
      crestPrimary: isString(entry.crestPrimary) ? entry.crestPrimary : '#1f2937',
      crestSecondary: isString(entry.crestSecondary) ? entry.crestSecondary : '#ffffff',
      crestBorderWidth: isString(entry.crestBorderWidth) ? entry.crestBorderWidth : 'thin',
      venueName: isString(entry.venueName) ? entry.venueName : 'Estadio',
      venueCapacity: isFiniteNumber(entry.venueCapacity) ? entry.venueCapacity : 0,
      venueSurface: isString(entry.venueSurface) ? entry.venueSurface : 'grass',
      venueSize: isString(entry.venueSize) ? entry.venueSize : 'medium',
      players: isStringArray(entry.players) ? entry.players : [],
    };
  }) : value.teams;
  const players = Array.isArray(value.players) ? value.players.map((entry) => {
    if (!isRecord(entry)) return entry;
    return {
      ...entry,
      position: isString(entry.position) ? entry.position : 'Jugador',
      monetaryValue: isFiniteNumber(entry.monetaryValue) ? entry.monetaryValue : 1,
      jerseyNumber: isFiniteNumber(entry.jerseyNumber) ? entry.jerseyNumber : 0,
      suspensionMatchdays: isFiniteNumber(entry.suspensionMatchdays) ? entry.suspensionMatchdays : 0,
      attributes: Array.isArray(entry.attributes) ? entry.attributes : [],
      uniformStyle: isString(entry.uniformStyle) ? entry.uniformStyle : 'solid',
      kitPrimary: isString(entry.kitPrimary) ? entry.kitPrimary : '#1f2937',
      kitSecondary: isString(entry.kitSecondary) ? entry.kitSecondary : '#ffffff',
      crestPlacement: isString(entry.crestPlacement) ? entry.crestPlacement : 'left',
      sponsorPlacement: isString(entry.sponsorPlacement) ? entry.sponsorPlacement : 'middle',
      brandPlacement: isString(entry.brandPlacement) ? entry.brandPlacement : 'right',
    };
  }) : value.players;
  const tournaments = Array.isArray(value.tournaments) ? value.tournaments.map((entry) => {
    if (!isRecord(entry)) return entry;
    const defaults: Record<string, unknown> = {
      scoringRuleType: 'bestOfN',
      scoringValue: 9,
      groupIsolation: false,
      participants: [],
      matches: [],
      dualLeagueMatches: [],
      dualLeagueEnabled: false,
      settingsLocked: false,
      incidents: [],
      winReward: 0,
      lossPenalty: 0,
      drawReward: 0,
      variability: 0,
      winPoints: 3,
      lossPoints: 0,
      drawPoints: 1,
      playoffSpots: 0,
      relegationSpots: 0,
      currentSeason: 1,
      currentMatchday: 1,
    };
    const arrayFields = new Set(['participants', 'matches', 'dualLeagueMatches', 'incidents']);
    const numericFields = new Set([
      'winReward', 'lossPenalty', 'drawReward', 'variability', 'winPoints', 'lossPoints',
      'drawPoints', 'playoffSpots', 'relegationSpots', 'currentSeason', 'currentMatchday',
    ]);
    return Object.fromEntries(Object.entries({ ...defaults, ...entry }).map(([key, item]) => {
      if (arrayFields.has(key) && !Array.isArray(item)) return [key, defaults[key]];
      if (numericFields.has(key) && !isFiniteNumber(item)) return [key, defaults[key]];
      if (key === 'scoringRuleType' && !['nToNRange', 'bestOfN', 'firstToN'].includes(String(item))) {
        return [key, defaults[key]];
      }
      if (['groupIsolation', 'dualLeagueEnabled', 'settingsLocked'].includes(key) && typeof item !== 'boolean') {
        return [key, defaults[key]];
      }
      return [key, item];
    }));
  }) : value.tournaments;
  return { ...value, teams, players, tournaments };
}

function coerceCommunityPackage(value: unknown): unknown {
  if (Array.isArray(value)) {
    return {
      teams: value.filter(entry => isRecord(entry) && ('budget' in entry || 'rating' in entry)),
      players: value.filter(entry => isRecord(entry) && ('position' in entry || 'attributes' in entry)),
      tournaments: value.filter(entry => isRecord(entry) && 'sport' in entry && 'participants' in entry),
    };
  }
  if (!isRecord(value)) return value;
  if (Array.isArray(value.teams) || Array.isArray(value.players) || Array.isArray(value.tournaments)) {
    return {
      ...value,
      teams: Array.isArray(value.teams) ? value.teams : [],
      players: Array.isArray(value.players) ? value.players : [],
      tournaments: Array.isArray(value.tournaments) ? value.tournaments : [],
    };
  }
  if (isRecord(value.team)) return { teams: [value.team], players: [], tournaments: [] };
  if (isRecord(value.player)) return { teams: [], players: [value.player], tournaments: [] };
  if (isRecord(value.tournament)) return { teams: [], players: [], tournaments: [value.tournament] };
  if ('id' in value && 'sport' in value && 'participants' in value) {
    return { teams: [], players: [], tournaments: [value] };
  }
  if ('id' in value && 'position' in value) return { teams: [], players: [value], tournaments: [] };
  if ('id' in value && ('budget' in value || 'rating' in value)) return { teams: [value], players: [], tournaments: [] };
  return value;
}

export function parseCommunityPackage(payloadJson: string): CommunityPackage {
  if (new TextEncoder().encode(payloadJson).length > COMMUNITY_PAYLOAD_MAX_BYTES) {
    throw new Error('Este contenido compartido supera el tamaño permitido.');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(payloadJson);
  } catch {
    throw new Error('El contenido compartido no contiene un paquete JSON válido.');
  }
  parsed = coerceCommunityPackage(parsed);
  if (isRecord(parsed)) parsed = normalizePackageForCommunity(parsed);
  if (!isCommunityPackage(parsed)) {
    throw new Error('El contenido compartido no tiene un formato de exportación válido.');
  }
  return parsed;
}

export function isCommunityItem(value: unknown): value is Omit<CommunityItem, 'id'> {
  if (!isRecord(value)) return false;
  const allowed = ['ownerId', 'authorName', 'type', 'title', 'payloadJson', 'createdAt', 'updatedAt'];
  if (Object.keys(value).some((key) => !allowed.includes(key)) ||
      allowed.some((key) => !(key in value))) return false;
  if (!isString(value.ownerId) || value.ownerId.length === 0 || value.ownerId.length > 128 ||
      !isString(value.authorName) || value.authorName.length > 80 ||
      !isCommunityKind(value.type) || !isString(value.title) ||
      value.title.length === 0 || value.title.length > 100 ||
      !isString(value.payloadJson) ||
      !isString(value.createdAt) || !isString(value.updatedAt)) return false;
  const payloadBytes = new TextEncoder().encode(value.payloadJson).length;
  if (payloadBytes === 0 || payloadBytes > COMMUNITY_PAYLOAD_MAX_BYTES) return false;
  try {
    const payload = parseCommunityPackage(value.payloadJson);
    if (value.type === 'team' && (payload.teams.length !== 1 || payload.tournaments.length !== 0)) return false;
    if (value.type === 'player' &&
        (payload.players.length !== 1 || payload.teams.length !== 0 || payload.tournaments.length !== 0)) return false;
    if (value.type === 'tournament' && payload.tournaments.length !== 1) return false;
    return new TextEncoder().encode(JSON.stringify(value)).length < COMMUNITY_DOCUMENT_MAX_BYTES;
  } catch {
    return false;
  }
}

export function buildCommunityPackage(
  kind: CommunityKind,
  id: string | undefined,
  teams: Team[],
  players: Player[],
  tournaments: Tournament[],
  settings: GlobalSettings,
): CommunityPackage {
  if (kind === 'profile') {
    return { teams, players, tournaments, settings, exportDate: new Date().toISOString(), version: '1.5' };
  }
  const selectedTeam = teams.find((team) => team.id === id);
  const selectedPlayer = players.find((player) => player.id === id);
  const selectedTournament = tournaments.find((tournament) => tournament.id === id);

  if (kind === 'team' && selectedTeam) {
    const rosterIds = new Set(selectedTeam.players);
    const roster = players.filter((player) => player.teamId === selectedTeam.id || rosterIds.has(player.id));
    return packageForItem([selectedTeam], roster, []);
  }
  if (kind === 'player' && selectedPlayer) {
    return packageForItem([], [selectedPlayer], []);
  }
  if (kind === 'tournament' && selectedTournament) {
    return buildTournamentPackage(selectedTournament, teams, players);
  }
  throw new Error('No se encontró el elemento seleccionado para compartir.');
}

export function buildTournamentPackage(
  tournament: Tournament,
  teams: Team[],
  players: Player[],
): CommunityPackage {
  const participantIds = new Set(tournament.participants);
  const participantTeams = teams.filter((team) => participantIds.has(team.id));
  const selectedPlayers = players.filter((player) =>
    participantIds.has(player.id) ||
    participantTeams.some((team) => team.id === player.teamId || team.players.includes(player.id)),
  );
  const relatedTeamIds = new Set(selectedPlayers.map((player) => player.teamId).filter(
    (teamId): teamId is string => !!teamId,
  ));
  const tournamentTeams = teams.filter((team) =>
    participantIds.has(team.id) || relatedTeamIds.has(team.id),
  );
  const tournamentPlayerIds = new Set(selectedPlayers.map((player) => player.id));
  for (const team of tournamentTeams) {
    for (const playerId of team.players) tournamentPlayerIds.add(playerId);
  }
  const tournamentPlayers = players.filter((player) => tournamentPlayerIds.has(player.id));
  return packageForItem(tournamentTeams, tournamentPlayers, [tournament]);
}

function packageForItem(
  teams: Team[],
  players: Player[],
  tournaments: Tournament[],
): CommunityPackage {
  return { teams, players, tournaments, exportDate: new Date().toISOString(), version: '1.5' };
}

export function communityPackageCounts(payload: CommunityPackage): string {
  const parts = [
    payload.teams.length ? `${payload.teams.length} equipo${payload.teams.length === 1 ? '' : 's'}` : '',
    payload.players.length ? `${payload.players.length} jugador${payload.players.length === 1 ? '' : 'es'}` : '',
    payload.tournaments.length ? `${payload.tournaments.length} torneo${payload.tournaments.length === 1 ? '' : 's'}` : '',
  ].filter(Boolean);
  return parts.join(' · ');
}
