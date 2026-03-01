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
  visualCustomization?: string;
};

export type UniformStyle = 'solid' | 'stripes' | 'hoops' | 'halves' | 'gradient' | 'minimal';
export type EmblemShape = 'shield' | 'circle' | 'square' | 'modern' | 'diamond';
export type VenueSurface = 'grass' | 'artificial' | 'clay' | 'hardcourt' | 'parquet' | 'ice' | 'sand';

export type Team = {
  id: string;
  name: string;
  abbreviation: string;
  rating: number; // 1-100
  logoUrl?: string;
  emblemShape: EmblemShape;
  primaryColor: string;
  secondaryColor: string;
  uniformStyle: UniformStyle;
  venueName: string;
  venueCapacity: number;
  venueSurface: VenueSurface;
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
  isPrimary?: boolean;
};

export type Tournament = {
  id: string;
  name: string;
  sport: string;
  mode: TournamentMode;
  format: TournamentFormat;
  leagueType?: LeagueType;
  scoringRuleType: ScoringRuleType;
  scoringRuleValueMin?: number;
  scoringRuleValueMax?: number;
  isDualLeague?: boolean;
  controlledTeamId?: string;
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
