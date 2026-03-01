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
  // Crest Configuration
  emblemShape: EmblemShape;
  emblemPattern: EmblemPattern;
  crestPrimary: string;
  crestSecondary: string;
  crestTertiary?: string;
  crestAccent?: string;
  crestBorderWidth: 'none' | 'thin' | 'thick';
  // Kit Configuration
  kitPrimary: string;
  kitSecondary: string;
  kitTertiary?: string;
  kitAccent?: string;
  uniformStyle: UniformStyle;
  brand?: string;
  sponsor?: string;
  crestPlacement: ElementPlacement;
  sponsorPlacement: VerticalPlacement;
  brandPlacement: ElementPlacement;
  crestSize?: ElementSize;
  // Venue Configuration
  venueName: string;
  venueCapacity: number;
  venueSurface: VenueSurface;
  venueSize: VenueSize;
  // Relationships
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
