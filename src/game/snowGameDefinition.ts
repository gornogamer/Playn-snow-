import { defineChanceGame, RF } from '@rarefriends/friendsdk/game';
import { RareFriendPreset } from '../types.ts';

export { RF };

export interface CollectibleItemMeta {
  name: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  color: string;
  glowColor: string;
  badgeBg: string;
  description: string;
  emoji: string;
}

export const COLLECTIBLE_METADATA: Record<string, CollectibleItemMeta> = {
  'Pinecone Snowball': {
    name: 'Pinecone Snowball',
    rarity: 'Common',
    color: '#94A3B8',
    glowColor: 'rgba(148, 163, 184, 0.4)',
    badgeBg: 'bg-slate-700 text-slate-200 border-slate-500',
    description: 'A tightly packed snowball rolled over a frosted mountain pinecone.',
    emoji: '🌲'
  },
  'Glacial Icicle': {
    name: 'Glacial Icicle',
    rarity: 'Uncommon',
    color: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    badgeBg: 'bg-cyan-950 text-cyan-300 border-cyan-500',
    description: 'Crystalline ice spear sheared from ancient glacial walls. Cold to the touch.',
    emoji: '❄️'
  },
  'Frost Crystal Star': {
    name: 'Frost Crystal Star',
    rarity: 'Rare',
    color: '#818CF8',
    glowColor: 'rgba(129, 140, 248, 0.5)',
    badgeBg: 'bg-indigo-950 text-indigo-300 border-indigo-500',
    description: 'A symmetrical snowflake crystal radiating subtle ultraviolet luminescence.',
    emoji: '⭐'
  },
  'Aurora Snow Globe': {
    name: 'Aurora Snow Globe',
    rarity: 'Epic',
    color: '#E879F9',
    glowColor: 'rgba(232, 121, 249, 0.6)',
    badgeBg: 'bg-fuchsia-950 text-fuchsia-300 border-fuchsia-500',
    description: 'A handcrafted glass sphere trapping dancing green & violet polar auroras.',
    emoji: '🔮'
  },
  'Golden Snow Crown': {
    name: 'Golden Snow Crown',
    rarity: 'Legendary',
    color: '#FBBF24',
    glowColor: 'rgba(251, 191, 36, 0.7)',
    badgeBg: 'bg-amber-950 text-amber-300 border-amber-500',
    description: 'The ancient winter sovereign crown carved from permafrost and infused with gold.',
    emoji: '👑'
  }
};

export const SNOW_GAME_DEFINITION = defineChanceGame({
  name: "Play'n with Snow: Frost Crates",
  consumable: 'Frost Shovel',
  price: 1n * RF, // 1 RF
  outcomes: [
    {
      name: 'Pinecone Snowball',
      chanceBps: 4500, // 45%
      reward: (RF * 25n) / 100n // 0.25 RF
    },
    {
      name: 'Glacial Icicle',
      chanceBps: 2800, // 28%
      reward: (RF * 50n) / 100n // 0.50 RF
    },
    {
      name: 'Frost Crystal Star',
      chanceBps: 1500, // 15%
      reward: (RF * 125n) / 100n // 1.25 RF
    },
    {
      name: 'Aurora Snow Globe',
      chanceBps: 800, // 8%
      reward: (RF * 350n) / 100n // 3.50 RF
    },
    {
      name: 'Golden Snow Crown',
      chanceBps: 400, // 4%
      reward: 10n * RF // 10.00 RF
    }
  ]
});

export const PRESET_FRIENDS: RareFriendPreset[] = [
  {
    id: 1n,
    name: 'Snowy Mask #1',
    family: 'Mask',
    tagline: 'The Mysterious Blizzard Nomad',
    bio: 'Wears a ceremonial frost mask to brave arctic headwinds and scout untouched powdered peaks.',
    hatColor: '#38BDF8'
  },
  {
    id: 2n,
    name: 'Glacier Core #2',
    family: 'Cellular',
    tagline: 'Permafrost Crystal Organism',
    bio: 'Composed of self-replicating cold crystal matrix cells. Loves building giant snow structures.',
    hatColor: '#818CF8'
  },
  {
    id: 7n,
    name: 'Frostbite Kin #7',
    family: 'Family',
    tagline: 'Tundra Clan Protector',
    bio: 'Never goes outside without an extra woolen scarf and a quiver of freshly packed snowballs.',
    hatColor: '#EF4444'
  },
  {
    id: 42n,
    name: 'Aurora Wanderer #42',
    family: 'Family',
    tagline: 'Polar Light Seeker',
    bio: 'Tracks glowing auroras across winter night skies while making pristine snow angels.',
    hatColor: '#10B981'
  },
  {
    id: 88n,
    name: 'Snow Sprite #88',
    family: 'Family',
    tagline: 'Playful Powder Trickster',
    bio: 'Undefeated snowball fight champion across the Robinhood chain.',
    hatColor: '#F59E0B'
  },
  {
    id: 1024n,
    name: 'Genesis Monarch #1024',
    family: 'Cellular',
    tagline: 'Ancient Winter Guardian',
    bio: 'One of the original 1,024 Genesis digital companions awakened by the first snowfall.',
    hatColor: '#EC4899'
  }
];

export function formatRf(amount: bigint): string {
  const whole = amount / RF;
  const remainder = amount % RF;
  const decimals = (remainder / (RF / 100n)).toString().padStart(2, '0');
  return `${whole}.${decimals} RF`;
}
