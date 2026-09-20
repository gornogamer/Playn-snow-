/**
 * Types for Play'n with Snow - Rare Friends Vibeathon
 */

export type ActivityMode =
  | 'roam'
  | 'snowball_range'
  | 'snowman_builder'
  | 'snow_angel'
  | 'frost_crate'
  | 'inventory'
  | 'vibeathon_submission'
  | 'friend_selector'
  | 'santa';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
  x: number;
  y: number;
}

export interface SnowmanDecoration {
  hat: 'none' | 'tophat' | 'beanie' | 'crown' | 'earmuffs' | 'santa_hat';
  scarfColor: string; // e.g. '#EF4444' | '#3B82F6' | '#10B981' | '#F59E0B'
  hasCarrot: boolean;
  hasTwigArms: boolean;
  beard?: 'none' | 'white_beard' | 'curly_beard';
  suit?: 'classic' | 'santa_suit';
  buttons: 'charcoal' | 'berries' | 'gold' | 'candy_cane' | 'none';
  name: string;
}

export interface SantaState {
  hasMetSanta: boolean;
  santaHatEquipped: boolean;
  magicSnowballs: boolean;
  giftsOpened: number;
  sleighFlying: boolean;
}

export interface PlacedSnowman extends SnowmanDecoration {
  id: string;
  x: number;
  y: number;
  baseRadius: number;
  torsoRadius: number;
  headRadius: number;
  completedAt: number;
}

export interface SnowAngel {
  id: string;
  x: number;
  y: number;
  createdAt: number;
  flaps: number;
  sparkles: { x: number; y: number; alpha: number; size: number }[];
}

export interface SnowballProjectile {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  currentZ: number; // Vertical height arc
  progress: number; // 0 to 1
  hit: boolean;
}

export interface SnowTarget {
  id: string;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  radius: number;
  type: 'target_board' | 'frost_crystal' | 'golden_bell' | 'ice_sprite';
  points: number;
  hitTimer?: number;
  label: string;
}

export interface Footprint {
  x: number;
  y: number;
  angle: number;
  isLeft: boolean;
  opacity: number;
}

export interface ParticleBurst {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface Snowflake {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  swaySpeed: number;
  swayOffset: number;
}

export interface GameStats {
  snowballsThrown: number;
  targetsHit: number;
  snowballScore: number;
  snowmenBuilt: number;
  snowAngelsMade: number;
  cratesOpened: number;
  rfRedeemed: string;
}

export interface RareFriendPreset {
  id: bigint;
  name: string;
  family: string;
  tagline: string;
  bio: string;
  hatColor: string;
}
