import { Position, SnowTarget } from '../types.ts';

export interface WorldStation {
  id: string;
  name: string;
  icon: string;
  x: number;
  y: number;
  radius: number;
  description: string;
  keyLabel: string;
}

export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 640;

export const STATIONS: WorldStation[] = [
  {
    id: 'santa',
    name: "Santa's Sleigh",
    icon: '🎅',
    x: 480,
    y: 190,
    radius: 75,
    description: 'Visit Santa Claus, his magic gift sleigh & festive cheer!',
    keyLabel: 'Meet Santa'
  },
  {
    id: 'snowball_range',
    name: 'Target Range',
    icon: '🎯',
    x: 230,
    y: 200,
    radius: 75,
    description: 'Throw snowballs at targets & ringing winter bells!',
    keyLabel: 'Throw Snowballs'
  },
  {
    id: 'snowman_builder',
    name: 'Snowman Yard',
    icon: '⛄',
    x: 740,
    y: 210,
    radius: 80,
    description: 'Roll fresh snow & sculpt custom decorated snowmen!',
    keyLabel: 'Build Snowman'
  },
  {
    id: 'snow_angel',
    name: 'Powder Meadow',
    icon: '✨',
    x: 240,
    y: 470,
    radius: 75,
    description: 'Carve sparkling snow angels in pristine powdered snow!',
    keyLabel: 'Make Snow Angel'
  },
  {
    id: 'frost_crate',
    name: 'Frost Crate Depot',
    icon: '📦',
    x: 730,
    y: 470,
    radius: 80,
    description: 'Unearth simulated RF frost collectibles & treasures!',
    keyLabel: 'Excavate Crates'
  }
];

export function createInitialTargets(): SnowTarget[] {
  return [
    {
      id: 'target-1',
      x: 140,
      y: 90,
      baseX: 140,
      baseY: 90,
      vx: 1.2,
      radius: 26,
      type: 'target_board',
      points: 25,
      label: 'Bullseye'
    },
    {
      id: 'target-2',
      x: 230,
      y: 70,
      baseX: 230,
      baseY: 70,
      vx: -1.6,
      radius: 20,
      type: 'frost_crystal',
      points: 50,
      label: 'Frost Crystal'
    },
    {
      id: 'target-3',
      x: 320,
      y: 100,
      baseX: 320,
      baseY: 100,
      vx: 0.9,
      radius: 22,
      type: 'golden_bell',
      points: 100,
      label: 'Winter Bell'
    },
    {
      id: 'target-4',
      x: 200,
      y: 125,
      baseX: 200,
      baseY: 125,
      vx: 2.2,
      radius: 18,
      type: 'ice_sprite',
      points: 150,
      label: 'Ice Sprite'
    }
  ];
}

export function isWalkable(x: number, y: number): boolean {
  // World bounds margin
  if (x < 60 || x > WORLD_WIDTH - 60 || y < 140 || y > WORLD_HEIGHT - 60) {
    return false;
  }

  // Central frozen pond obstacle (can walk around, or slide on edge)
  // Let's make it walkable like ice with a slick friction or allow traversal
  // Tree & boulder obstacle zones
  const obstacles: { x: number; y: number; r: number }[] = [
    { x: 100, y: 150, r: 35 }, // Pine cluster
    { x: 480, y: 110, r: 40 }, // Mountain crest
    { x: 860, y: 140, r: 38 }, // North-east pines
    { x: 480, y: 460, r: 30 }, // Central frozen fountain
    { x: 90, y: 340, r: 25 },  // Left rock outcrop
    { x: 880, y: 360, r: 25 }, // Right rock outcrop
  ];

  for (const obs of obstacles) {
    const dist = Math.hypot(x - obs.x, y - obs.y);
    if (dist < obs.r) return false;
  }

  return true;
}

export function findNearbyStation(pos: Position): WorldStation | null {
  for (const station of STATIONS) {
    const d = Math.hypot(pos.x - station.x, pos.y - station.y);
    if (d <= station.radius) {
      return station;
    }
  }
  return null;
}
