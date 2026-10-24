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
    const participants = new Set(selectedTournament.participants);
    const tournamentTeams = selectedTournament.entryType === 'teams'
      ? teams.filter((team) => participants.has(team.id))
      : [];
    const tournamentPlayers = selectedTournament.entryType === 'players'
      ? players.filter((player) => participants.has(player.id))
      : [];
    return packageForItem(tournamentTeams, tournamentPlayers, [selectedTournament]);
  }
  throw new Error('No se encontró el elemento seleccionado para compartir.');
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
