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
  kitCustomization?: string;
};

export type KitDesign = 'solid' | 'stripes' | 'hoops' | 'halves' | 'gradient';
export type CrestType = 'shield' | 'circle' | 'square' | 'modern';
export type StadiumSurface = 'grass' | 'artificial' | 'clay' | 'hardcourt';

export type Team = {
  id: string;
  name: string;
  abbreviation: string;
  rating: number; // 1-100
  crestUrl?: string;
  crestType: CrestType;
  primaryColor: string;
  secondaryColor: string;
  kitDesign: KitDesign;
  stadiumName: string;
  stadiumCapacity: number;
  stadiumSurface: StadiumSurface;
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
  isPrimary?: boolean; // For dual league
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
  attributeNames: string[];
  theme: 'dark' | 'midnight' | 'obsidian';
};