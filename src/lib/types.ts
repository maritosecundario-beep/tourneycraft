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
};

export type UniformStyle = 'solid' | 'stripes' | 'hoops' | 'halves' | 'gradient' | 'minimal' | 'clash' | 'sash' | 'pinstripes' | 'checks' | 'quarters';
export type EmblemShape = 'shield' | 'circle' | 'square' | 'modern' | 'diamond' | 'vintage' | 'crown' | 'star';
export type VenueSurface = 'grass' | 'artificial' | 'clay' | 'hardcourt' | 'parquet' | 'ice' | 'sand';
export type VenueSize = 'small' | 'medium' | 'large' | 'monumental';

export type Team = {
  id: string;
  name: string;
  abbreviation: string;
  rating: number; // 1-100
  emblemShape: EmblemShape;
  primaryColor: string; // Color 1
  secondaryColor: string; // Color 2
  tertiaryColor?: string; // Color 3 (Trim/Cuello)
  accentColor?: string; // Color 4 (Logos/Detalles)
  uniformStyle: UniformStyle;
  venueName: string;
  venueCapacity: number;
  venueSurface: VenueSurface;
  venueSize: VenueSize;
  brand?: string;
  sponsor?: string;
  players: Player[];
};

export type ScoringRuleType = 'nToNRange' | 'bestOfN' | 'firstToN';

export type TournamentMode = 'normal' | 'arcade';
export type TournamentFormat = 'league' | 'knockout';
export type LeagueType = 'single-table' | 'groups' | 'conferences';

export type Match = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  isSimulated: boolean;
  matchday: number;
  winnerId?: string;
};

export type Tournament = {
  id: string;
  name: string;
  sport: string;
  mode: TournamentMode;
  format: TournamentFormat;
  leagueType?: LeagueType;
  scoringRuleType: ScoringRuleType;
  teams: string[]; // IDs
  matches: Match[];
  settingsLocked: boolean;
  winReward: number;
  lossPenalty: number;
  drawReward: number;
  variability: number;
};

export type GlobalSettings = {
  currency: string;
  positions: string[];
  positionColors: Record<string, string>;
  attributeNames: string[];
  theme: 'dark' | 'midnight' | 'obsidian' | 'light' | 'nord' | 'retro';
};
