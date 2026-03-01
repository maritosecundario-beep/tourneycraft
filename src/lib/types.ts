
export type PlayerAttribute = {
  name: string;
  value: number; // 1-100
};

export type Player = {
  id: string;
  name: string;
  monetaryValue: number;
  jerseyNumber: number;
  position: string;
  attributes: PlayerAttribute[];
  teamId?: string;
  // Kit Configuration
  uniformStyle: UniformStyle;
  kitPrimary: string;
  kitSecondary: string;
  kitTertiary?: string;
  kitAccent?: string;
  brand?: string;
  sponsor?: string;
  crestPlacement: ElementPlacement;
  sponsorPlacement: VerticalPlacement;
  brandPlacement: ElementPlacement;
  crestSize?: ElementSize;
};

export type UniformStyle = 
  | 'solid' | 'stripes' | 'hoops' | 'halves' | 'gradient' | 'minimal' 
  | 'sash' | 'pinstripes' | 'checks' | 'quarters' | 'waves' | 'zigzag' 
  | 'pixel' | 'honeycomb' | 'shoulders' | 'side-panels' | 'camouflage' | 'stars'
  | 'double-stripes' | 'fade-vertical' | 'asymmetric';

export type EmblemShape = 
  | 'shield' | 'circle' | 'square' | 'modern' | 'diamond' | 'vintage' 
  | 'crown' | 'star' | 'hexagon' | 'oval' | 'triangle' | 'banner' | 'wings' | 'eagle' | 'lion';

export type EmblemPattern = 'none' | 'vertical-split' | 'horizontal-split' | 'diagonal-split' | 'cross' | 'saltire' | 'quarters';
export type ElementPlacement = 'left' | 'center' | 'right';
export type VerticalPlacement = 'top' | 'middle' | 'bottom';
export type ElementSize = 'small' | 'medium' | 'large';

export type VenueSurface = 'grass' | 'artificial' | 'clay' | 'hardcourt' | 'parquet' | 'ice' | 'sand';
export type VenueSize = 'small' | 'medium' | 'large' | 'monumental';

export type Team = {
  id: string;
  name: string;
  abbreviation: string;
  rating: number; // 1-100
  region?: 'Sud' | 'Nord';
  emblemShape: EmblemShape;
  emblemPattern: EmblemPattern;
  crestPrimary: string;
  crestSecondary: string;
  crestTertiary?: string;
  crestAccent?: string;
  crestBorderWidth: 'none' | 'thin' | 'thick';
  venueName: string;
  venueCapacity: number;
  venueSurface: VenueSurface;
  venueSize: VenueSize;
  players: string[]; // IDs
};

export type ScoringRuleType = 'nToNRange' | 'bestOfN' | 'firstToN';

export type TournamentMode = 'normal' | 'arcade';
export type TournamentFormat = 'league' | 'knockout';
export type LeagueType = 'single-table' | 'groups' | 'conferences';
export type TournamentEntryType = 'teams' | 'players';

export type Match = {
  id: string;
  homeId: string; // Puede ser Team ID o Player ID
  awayId: string; // Puede ser Team ID o Player ID
  homeScore?: number;
  awayScore?: number;
  isSimulated: boolean;
  matchday: number;
  winnerId?: string;
};

export type TournamentGroup = {
  name: string;
  participantIds: string[];
};

export type Tournament = {
  id: string;
  name: string;
  sport: string;
  mode: TournamentMode;
  entryType: TournamentEntryType;
  managedParticipantId?: string;
  format: TournamentFormat;
  leagueType?: LeagueType;
  groups?: TournamentGroup[];
  scoringRuleType: ScoringRuleType;
  scoringValue?: number; // N para bestOfN o firstToN
  participants: string[]; // IDs de equipos o jugadores
  matches: Match[];
  settingsLocked: boolean;
  // Economía
  winReward: number;
  lossPenalty: number;
  drawReward: number;
  variability: number; // 0-100 (porcentaje de rango de cambio)
  playoffSpots: number;
  relegationSpots: number;
  currentSeason: number;
};

export type GlobalSettings = {
  currency: string;
  positions: string[];
  positionColors: Record<string, string>;
  attributeNames: string[];
  theme: 'dark' | 'midnight' | 'obsidian' | 'light' | 'nord' | 'retro';
};
