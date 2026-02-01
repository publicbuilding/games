/**
 * Premium Store - 100+ Purchasable Items
 * Categories: Buildings, Decorations, Cosmetics, Boosters, Expansion
 */

export type StoreItemCategory = 'buildings' | 'decorations' | 'cosmetics' | 'boosters' | 'expansion';
export type CurrencyType = 'coins' | 'gems';

export interface StoreItem {
  id: string;
  name: string;
  category: StoreItemCategory;
  description: string;
  cost: {
    coins?: number;
    gems?: number;
  };
  icon: string; // Emoji or icon reference
  imageUrl?: string;
  onSale?: boolean;
  saleDiscount?: number; // Percentage off
  effect?: {
    type: string;
    value?: number;
    duration?: number; // milliseconds
  };
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  limited?: boolean; // Time-limited item
}

// ===== BUILDINGS (20+ items) =====

const BUILDING_ITEMS: StoreItem[] = [
  // Luxury Temples & Palaces
  {
    id: 'golden-temple',
    name: 'Golden Temple',
    category: 'buildings',
    description: 'A magnificent golden temple that increases culture and attracts monks',
    cost: { coins: 5000, gems: 50 },
    icon: '🏯',
    rarity: 'legendary',
    effect: { type: 'culture_boost', value: 25 }
  },
  {
    id: 'imperial-palace',
    name: 'Imperial Palace',
    category: 'buildings',
    description: 'Seat of power. Increases all production by 15%',
    cost: { coins: 8000, gems: 75 },
    icon: '👑',
    rarity: 'legendary',
    effect: { type: 'production_multiplier', value: 1.15 }
  },
  {
    id: 'dragon-gate',
    name: 'Dragon Gate',
    category: 'buildings',
    description: 'Legendary gate that brings prosperity',
    cost: { coins: 6000, gems: 60 },
    icon: '🐉',
    rarity: 'legendary',
    effect: { type: 'resource_boost', value: 20 }
  },
  {
    id: 'zen-garden',
    name: 'Zen Garden',
    category: 'buildings',
    description: 'Peaceful garden for meditation and harmony',
    cost: { coins: 3000, gems: 30 },
    icon: '🌿',
    rarity: 'rare',
    effect: { type: 'happiness_boost', value: 15 }
  },
  // Luxury Residences
  {
    id: 'luxury-house',
    name: 'Luxury House',
    category: 'buildings',
    description: 'Premium housing for wealthy inhabitants',
    cost: { coins: 2500, gems: 25 },
    icon: '🏠',
    rarity: 'uncommon',
    effect: { type: 'population_capacity', value: 50 }
  },
  {
    id: 'noble-estate',
    name: 'Noble Estate',
    category: 'buildings',
    description: 'Sprawling estate fit for nobility',
    cost: { coins: 4000, gems: 40 },
    icon: '🏰',
    rarity: 'rare',
    effect: { type: 'population_capacity', value: 100 }
  },
  // Decorative Structures
  {
    id: 'jade-pagoda',
    name: 'Jade Pagoda',
    category: 'buildings',
    description: 'Beautiful jade pagoda - decorative landmark',
    cost: { coins: 1500, gems: 15 },
    icon: '🏯',
    rarity: 'uncommon'
  },
  {
    id: 'golden-statue',
    name: 'Golden Statue',
    category: 'buildings',
    description: 'Statue honoring ancestors',
    cost: { coins: 1000, gems: 10 },
    icon: '🗿',
    rarity: 'common'
  },
  {
    id: 'bell-tower',
    name: 'Bell Tower',
    category: 'buildings',
    description: 'Tower with ceremonial bells',
    cost: { coins: 2000, gems: 20 },
    icon: '🔔',
    rarity: 'uncommon',
    effect: { type: 'area_happiness', value: 10 }
  },
  {
    id: 'moonlight-pavilion',
    name: 'Moonlight Pavilion',
    category: 'buildings',
    description: 'Elegant pavilion for gatherings',
    cost: { coins: 3500, gems: 35 },
    icon: '⛩️',
    rarity: 'rare'
  },
  // Advanced Production
  {
    id: 'master-workshop',
    name: 'Master Workshop',
    category: 'buildings',
    description: 'Advanced crafting facility (+20% production)',
    cost: { coins: 3000, gems: 30 },
    icon: '🔨',
    rarity: 'rare',
    effect: { type: 'production_multiplier', value: 1.20 }
  },
  {
    id: 'royal-treasury',
    name: 'Royal Treasury',
    category: 'buildings',
    description: 'Massive vault for wealth storage',
    cost: { coins: 4500, gems: 45 },
    icon: '💰',
    rarity: 'rare',
    effect: { type: 'storage_multiplier', value: 1.50 }
  },
  // Defense & Military
  {
    id: 'samurai-training-hall',
    name: 'Samurai Training Hall',
    category: 'buildings',
    description: 'Elite warrior training center',
    cost: { coins: 3500, gems: 35 },
    icon: '⚔️',
    rarity: 'rare'
  },
  {
    id: 'fortress',
    name: 'Fortress',
    category: 'buildings',
    description: 'Impenetrable defensive structure',
    cost: { coins: 5500, gems: 55 },
    icon: '🏯',
    rarity: 'legendary'
  },
  // Harbor & Trade
  {
    id: 'grand-harbor',
    name: 'Grand Harbor',
    category: 'buildings',
    description: 'Premium port for increased trade',
    cost: { coins: 4000, gems: 40 },
    icon: '⛵',
    rarity: 'rare',
    effect: { type: 'trade_multiplier', value: 1.25 }
  },
  {
    id: 'silk-exchange',
    name: 'Silk Exchange',
    category: 'buildings',
    description: 'Luxury marketplace specializing in silk',
    cost: { coins: 2500, gems: 25 },
    icon: '🧵',
    rarity: 'uncommon'
  },
  // Cultural Facilities
  {
    id: 'academy',
    name: 'Academy',
    category: 'buildings',
    description: 'Center of learning and wisdom',
    cost: { coins: 3000, gems: 30 },
    icon: '📚',
    rarity: 'rare',
    effect: { type: 'research_boost', value: 20 }
  },
  {
    id: 'theater',
    name: 'Theater',
    category: 'buildings',
    description: 'Entertainment venue for the masses',
    cost: { coins: 2000, gems: 20 },
    icon: '🎭',
    rarity: 'uncommon',
    effect: { type: 'happiness_boost', value: 10 }
  },
  {
    id: 'temple-complex',
    name: 'Temple Complex',
    category: 'buildings',
    description: 'Multi-building spiritual sanctuary',
    cost: { coins: 6000, gems: 60 },
    icon: '⛩️',
    rarity: 'legendary',
    effect: { type: 'spirituality', value: 50 }
  }
];

// ===== DECORATIONS (30+ items) =====

const DECORATION_ITEMS: StoreItem[] = [
  // Cherry Blossom Trees (5 variants)
  {
    id: 'cherry-blossom-spring',
    name: 'Spring Cherry Blossoms',
    category: 'decorations',
    description: 'Pink spring blossoms',
    cost: { coins: 200, gems: 2 },
    icon: '🌸',
    rarity: 'common'
  },
  {
    id: 'cherry-blossom-white',
    name: 'White Cherry Blossoms',
    category: 'decorations',
    description: 'Pure white blossoms',
    cost: { coins: 250, gems: 3 },
    icon: '🌸',
    rarity: 'uncommon'
  },
  {
    id: 'cherry-blossom-deep-pink',
    name: 'Deep Pink Cherry Blossoms',
    category: 'decorations',
    description: 'Vibrant deep pink blossoms',
    cost: { coins: 300, gems: 3 },
    icon: '🌸',
    rarity: 'uncommon'
  },
  {
    id: 'cherry-blossom-golden',
    name: 'Golden Cherry Blossoms',
    category: 'decorations',
    description: 'Rare golden-tinged blossoms',
    cost: { coins: 500, gems: 5 },
    icon: '🌸',
    rarity: 'rare'
  },
  {
    id: 'cherry-blossom-mystical',
    name: 'Mystical Cherry Blossoms',
    category: 'decorations',
    description: 'Glowing enchanted blossoms',
    cost: { coins: 800, gems: 8 },
    icon: '🌸',
    rarity: 'legendary'
  },
  // Stone Lanterns (5 variants)
  {
    id: 'stone-lantern-classic',
    name: 'Classic Stone Lantern',
    category: 'decorations',
    description: 'Traditional Japanese lantern',
    cost: { coins: 150, gems: 2 },
    icon: '🏮',
    rarity: 'common'
  },
  {
    id: 'stone-lantern-jade',
    name: 'Jade Stone Lantern',
    category: 'decorations',
    description: 'Lantern carved from jade',
    cost: { coins: 300, gems: 3 },
    icon: '🏮',
    rarity: 'uncommon'
  },
  {
    id: 'stone-lantern-golden',
    name: 'Golden Stone Lantern',
    category: 'decorations',
    description: 'Luminous golden lantern',
    cost: { coins: 400, gems: 4 },
    icon: '🏮',
    rarity: 'rare'
  },
  {
    id: 'stone-lantern-crystal',
    name: 'Crystal Stone Lantern',
    category: 'decorations',
    description: 'Lantern with crystal panes',
    cost: { coins: 600, gems: 6 },
    icon: '🏮',
    rarity: 'rare'
  },
  {
    id: 'stone-lantern-enchanted',
    name: 'Enchanted Stone Lantern',
    category: 'decorations',
    description: 'Lantern with magical glow',
    cost: { coins: 1000, gems: 10 },
    icon: '🏮',
    rarity: 'legendary'
  },
  // Bridges (5 variants)
  {
    id: 'bridge-wooden',
    name: 'Wooden Bridge',
    category: 'decorations',
    description: 'Simple wooden footbridge',
    cost: { coins: 250, gems: 3 },
    icon: '🌉',
    rarity: 'common'
  },
  {
    id: 'bridge-stone-arch',
    name: 'Stone Arch Bridge',
    category: 'decorations',
    description: 'Elegant stone arch crossing',
    cost: { coins: 400, gems: 4 },
    icon: '🌉',
    rarity: 'uncommon'
  },
  {
    id: 'bridge-ornate',
    name: 'Ornate Dragon Bridge',
    category: 'decorations',
    description: 'Decorated bridge with dragon motifs',
    cost: { coins: 600, gems: 6 },
    icon: '🌉',
    rarity: 'rare'
  },
  {
    id: 'bridge-hanging',
    name: 'Hanging Bridge',
    category: 'decorations',
    description: 'Rope bridge over gorge',
    cost: { coins: 500, gems: 5 },
    icon: '🌉',
    rarity: 'rare'
  },
  {
    id: 'bridge-moonlight',
    name: 'Moonlight Bridge',
    category: 'decorations',
    description: 'Glowing bridge for night travel',
    cost: { coins: 900, gems: 9 },
    icon: '🌉',
    rarity: 'legendary'
  },
  // Fences & Walls (8 variants)
  {
    id: 'fence-bamboo',
    name: 'Bamboo Fence',
    category: 'decorations',
    description: 'Traditional bamboo fencing',
    cost: { coins: 100, gems: 1 },
    icon: '🪵',
    rarity: 'common'
  },
  {
    id: 'fence-wood-picket',
    name: 'Picket Fence',
    category: 'decorations',
    description: 'Classic wooden picket fence',
    cost: { coins: 150, gems: 2 },
    icon: '🪵',
    rarity: 'common'
  },
  {
    id: 'wall-stone',
    name: 'Stone Wall',
    category: 'decorations',
    description: 'Sturdy stone boundary wall',
    cost: { coins: 250, gems: 3 },
    icon: '🧱',
    rarity: 'uncommon'
  },
  {
    id: 'wall-jade',
    name: 'Jade Wall',
    category: 'decorations',
    description: 'Ornate jade-inlaid wall',
    cost: { coins: 500, gems: 5 },
    icon: '🧱',
    rarity: 'rare'
  },
  {
    id: 'fence-iron',
    name: 'Iron Fence',
    category: 'decorations',
    description: 'Wrought iron protective fence',
    cost: { coins: 300, gems: 3 },
    icon: '⛓️',
    rarity: 'uncommon'
  },
  {
    id: 'wall-golden',
    name: 'Golden Wall',
    category: 'decorations',
    description: 'Shimmering golden wall',
    cost: { coins: 700, gems: 7 },
    icon: '✨',
    rarity: 'legendary'
  },
  {
    id: 'fence-living-hedge',
    name: 'Living Hedge Fence',
    category: 'decorations',
    description: 'Growing hedge barrier',
    cost: { coins: 200, gems: 2 },
    icon: '🌿',
    rarity: 'uncommon'
  },
  {
    id: 'wall-ancient-stone',
    name: 'Ancient Stone Wall',
    category: 'decorations',
    description: 'Weathered ancient wall',
    cost: { coins: 450, gems: 4 },
    icon: '🧱',
    rarity: 'uncommon'
  },
  // Statues (5 variants)
  {
    id: 'statue-buddha',
    name: 'Buddha Statue',
    category: 'decorations',
    description: 'Serene meditation statue',
    cost: { coins: 400, gems: 4 },
    icon: '🗿',
    rarity: 'rare'
  },
  {
    id: 'statue-warrior',
    name: 'Warrior Statue',
    category: 'decorations',
    description: 'Noble warrior in combat stance',
    cost: { coins: 350, gems: 4 },
    icon: '🗿',
    rarity: 'uncommon'
  },
  {
    id: 'statue-dragon',
    name: 'Dragon Statue',
    category: 'decorations',
    description: 'Majestic dragon sculpture',
    cost: { coins: 500, gems: 5 },
    icon: '🐉',
    rarity: 'rare'
  },
  {
    id: 'statue-ancestor',
    name: 'Ancestor Statue',
    category: 'decorations',
    description: 'Monument to ancestors',
    cost: { coins: 300, gems: 3 },
    icon: '🗿',
    rarity: 'uncommon'
  },
  {
    id: 'statue-phoenix',
    name: 'Phoenix Statue',
    category: 'decorations',
    description: 'Legendary phoenix sculpture',
    cost: { coins: 700, gems: 7 },
    icon: '🦅',
    rarity: 'legendary'
  },
  // Garden Elements
  {
    id: 'pond-koi',
    name: 'Koi Pond',
    category: 'decorations',
    description: 'Serene pond with colorful koi',
    cost: { coins: 300, gems: 3 },
    icon: '💧',
    rarity: 'uncommon'
  },
  {
    id: 'rock-garden',
    name: 'Rock Garden',
    category: 'decorations',
    description: 'Zen rock garden arrangement',
    cost: { coins: 250, gems: 3 },
    icon: '🪨',
    rarity: 'uncommon'
  },
  {
    id: 'path-stone',
    name: 'Stone Path',
    category: 'decorations',
    description: 'Winding stepping stone path',
    cost: { coins: 150, gems: 2 },
    icon: '🛤️',
    rarity: 'common'
  },
  {
    id: 'pathway-jade',
    name: 'Jade Pathway',
    category: 'decorations',
    description: 'Luxurious jade stone pathway',
    cost: { coins: 400, gems: 4 },
    icon: '✨',
    rarity: 'rare'
  },
  {
    id: 'fountain-ornate',
    name: 'Ornate Fountain',
    category: 'decorations',
    description: 'Beautiful water fountain',
    cost: { coins: 350, gems: 4 },
    icon: '⛲',
    rarity: 'rare'
  }
];

// ===== COSMETICS (20+ items) =====

const COSMETIC_ITEMS: StoreItem[] = [
  // Seasonal Themes
  {
    id: 'theme-spring-festival',
    name: 'Spring Festival Theme',
    category: 'cosmetics',
    description: 'Festive spring aesthetic',
    cost: { gems: 30 },
    icon: '🌸',
    rarity: 'rare',
    effect: { type: 'ui_theme', value: 1 }
  },
  {
    id: 'theme-autumn-harvest',
    name: 'Autumn Harvest Theme',
    category: 'cosmetics',
    description: 'Rich autumn colors',
    cost: { gems: 30 },
    icon: '🍂',
    rarity: 'rare',
    effect: { type: 'ui_theme', value: 1 }
  },
  {
    id: 'theme-winter-snow',
    name: 'Winter Snow Theme',
    category: 'cosmetics',
    description: 'Snowy winter landscape',
    cost: { gems: 30 },
    icon: '❄️',
    rarity: 'rare',
    effect: { type: 'ui_theme', value: 1 }
  },
  {
    id: 'theme-summer-garden',
    name: 'Summer Garden Theme',
    category: 'cosmetics',
    description: 'Vibrant summer colors',
    cost: { gems: 30 },
    icon: '🌻',
    rarity: 'rare',
    effect: { type: 'ui_theme', value: 1 }
  },
  {
    id: 'theme-night-moon',
    name: 'Night Moon Theme',
    category: 'cosmetics',
    description: 'Moonlit nighttime aesthetic',
    cost: { gems: 40 },
    icon: '🌙',
    rarity: 'rare',
    effect: { type: 'ui_theme', value: 1 }
  },
  // Color Palettes
  {
    id: 'palette-gold',
    name: 'Golden Palette',
    category: 'cosmetics',
    description: 'Buildings display in golden tones',
    cost: { gems: 20 },
    icon: '✨',
    rarity: 'uncommon',
    effect: { type: 'color_palette', value: 1 }
  },
  {
    id: 'palette-jade',
    name: 'Jade Palette',
    category: 'cosmetics',
    description: 'Buildings display in jade green',
    cost: { gems: 20 },
    icon: '💚',
    rarity: 'uncommon',
    effect: { type: 'color_palette', value: 1 }
  },
  {
    id: 'palette-crimson',
    name: 'Crimson Palette',
    category: 'cosmetics',
    description: 'Buildings display in deep red',
    cost: { gems: 20 },
    icon: '❤️',
    rarity: 'uncommon',
    effect: { type: 'color_palette', value: 1 }
  },
  {
    id: 'palette-silver',
    name: 'Silver Palette',
    category: 'cosmetics',
    description: 'Buildings display in silver tones',
    cost: { gems: 20 },
    icon: '⚪',
    rarity: 'uncommon',
    effect: { type: 'color_palette', value: 1 }
  },
  // Particle Effects
  {
    id: 'effect-fireflies',
    name: 'Firefly Effect',
    category: 'cosmetics',
    description: 'Enchanted fireflies float around buildings',
    cost: { gems: 25 },
    icon: '✨',
    rarity: 'rare',
    effect: { type: 'particle_effect', value: 1 }
  },
  {
    id: 'effect-sakura-petals',
    name: 'Sakura Petal Effect',
    category: 'cosmetics',
    description: 'Falling cherry blossom petals',
    cost: { gems: 25 },
    icon: '🌸',
    rarity: 'rare',
    effect: { type: 'particle_effect', value: 1 }
  },
  {
    id: 'effect-snow',
    name: 'Falling Snow Effect',
    category: 'cosmetics',
    description: 'Gentle snowfall across the map',
    cost: { gems: 25 },
    icon: '❄️',
    rarity: 'rare',
    effect: { type: 'particle_effect', value: 1 }
  },
  {
    id: 'effect-golden-rain',
    name: 'Golden Rain Effect',
    category: 'cosmetics',
    description: 'Shimmering golden rain particles',
    cost: { gems: 35 },
    icon: '✨',
    rarity: 'legendary',
    effect: { type: 'particle_effect', value: 1 }
  },
  {
    id: 'effect-mystical-aura',
    name: 'Mystical Aura Effect',
    category: 'cosmetics',
    description: 'Purple magical aura around buildings',
    cost: { gems: 40 },
    icon: '🔮',
    rarity: 'legendary',
    effect: { type: 'particle_effect', value: 1 }
  },
  // UI Themes
  {
    id: 'ui-paper-scroll',
    name: 'Paper Scroll UI Theme',
    category: 'cosmetics',
    description: 'Traditional paper scroll interface',
    cost: { gems: 25 },
    icon: '📜',
    rarity: 'rare',
    effect: { type: 'ui_theme', value: 1 }
  },
  {
    id: 'ui-brush-stroke',
    name: 'Brush Stroke UI Theme',
    category: 'cosmetics',
    description: 'Artistic brush stroke aesthetic',
    cost: { gems: 25 },
    icon: '🎨',
    rarity: 'rare',
    effect: { type: 'ui_theme', value: 1 }
  },
  {
    id: 'ui-lacquer',
    name: 'Lacquer UI Theme',
    category: 'cosmetics',
    description: 'Polished lacquer finish interface',
    cost: { gems: 30 },
    icon: '💎',
    rarity: 'rare',
    effect: { type: 'ui_theme', value: 1 }
  },
  {
    id: 'ui-hologram',
    name: 'Hologram UI Theme',
    category: 'cosmetics',
    description: 'Futuristic holographic interface',
    cost: { gems: 40 },
    icon: '🌐',
    rarity: 'legendary',
    effect: { type: 'ui_theme', value: 1 }
  },
  {
    id: 'ui-gold-trim',
    name: 'Gold Trim UI Theme',
    category: 'cosmetics',
    description: 'Luxurious gold-trimmed interface',
    cost: { gems: 35 },
    icon: '👑',
    rarity: 'rare',
    effect: { type: 'ui_theme', value: 1 }
  },
  {
    id: 'ui-minimalist',
    name: 'Minimalist UI Theme',
    category: 'cosmetics',
    description: 'Clean, simple interface',
    cost: { gems: 20 },
    icon: '◼️',
    rarity: 'uncommon',
    effect: { type: 'ui_theme', value: 1 }
  }
];

// ===== BOOSTERS (15+ items) =====

const BOOSTER_ITEMS: StoreItem[] = [
  // Production Speed Boosts
  {
    id: 'boost-speed-25',
    name: 'Speed Boost +25%',
    category: 'boosters',
    description: 'Increase production speed by 25% for 1 hour',
    cost: { gems: 10 },
    icon: '⚡',
    rarity: 'common',
    effect: { type: 'production_speed', value: 1.25, duration: 3600000 }
  },
  {
    id: 'boost-speed-50',
    name: 'Speed Boost +50%',
    category: 'boosters',
    description: 'Increase production speed by 50% for 2 hours',
    cost: { gems: 20 },
    icon: '⚡',
    rarity: 'uncommon',
    effect: { type: 'production_speed', value: 1.50, duration: 7200000 }
  },
  {
    id: 'boost-speed-100',
    name: 'Speed Boost +100%',
    category: 'boosters',
    description: 'Double production speed for 4 hours',
    cost: { gems: 35 },
    icon: '⚡',
    rarity: 'rare',
    effect: { type: 'production_speed', value: 2.0, duration: 14400000 }
  },
  // Resource Multipliers
  {
    id: 'boost-resource-150',
    name: 'Resource Multiplier x1.5',
    category: 'boosters',
    description: 'All resources +50% for 30 minutes',
    cost: { gems: 25 },
    icon: '💎',
    rarity: 'uncommon',
    effect: { type: 'resource_multiplier', value: 1.5, duration: 1800000 }
  },
  {
    id: 'boost-resource-200',
    name: 'Resource Multiplier x2.0',
    category: 'boosters',
    description: 'Double all resource generation for 1 hour',
    cost: { gems: 40 },
    icon: '💎',
    rarity: 'rare',
    effect: { type: 'resource_multiplier', value: 2.0, duration: 3600000 }
  },
  // Instant Build
  {
    id: 'instant-build-1',
    name: 'Instant Build Token (1x)',
    category: 'boosters',
    description: 'Instantly complete one building',
    cost: { gems: 30 },
    icon: '🏗️',
    rarity: 'rare',
    effect: { type: 'instant_build', value: 1 }
  },
  {
    id: 'instant-build-5',
    name: 'Instant Build Tokens (5x)',
    category: 'boosters',
    description: 'Instantly complete 5 buildings',
    cost: { gems: 120 },
    icon: '🏗️',
    rarity: 'legendary',
    effect: { type: 'instant_build', value: 5 }
  },
  // Population & Happiness
  {
    id: 'boost-happiness',
    name: 'Happiness Boost',
    category: 'boosters',
    description: 'Increase population happiness by 30% for 2 hours',
    cost: { gems: 20 },
    icon: '😊',
    rarity: 'uncommon',
    effect: { type: 'happiness', value: 1.3, duration: 7200000 }
  },
  {
    id: 'boost-population',
    name: 'Population Growth Boost',
    category: 'boosters',
    description: 'Attract +100 population',
    cost: { gems: 25 },
    icon: '👥',
    rarity: 'uncommon',
    effect: { type: 'population_increase', value: 100 }
  },
  // Auto-Harvest
  {
    id: 'auto-harvest-1h',
    name: 'Auto-Harvest 1 Hour',
    category: 'boosters',
    description: 'Automatically harvest resources for 1 hour',
    cost: { gems: 20 },
    icon: '🤖',
    rarity: 'uncommon',
    effect: { type: 'auto_harvest', value: 1, duration: 3600000 }
  },
  {
    id: 'auto-harvest-4h',
    name: 'Auto-Harvest 4 Hours',
    category: 'boosters',
    description: 'Automatically harvest resources for 4 hours',
    cost: { gems: 60 },
    icon: '🤖',
    rarity: 'rare',
    effect: { type: 'auto_harvest', value: 1, duration: 14400000 }
  },
  {
    id: 'auto-harvest-24h',
    name: 'Auto-Harvest 24 Hours',
    category: 'boosters',
    description: 'Automatically harvest resources for a full day',
    cost: { gems: 150 },
    icon: '🤖',
    rarity: 'legendary',
    effect: { type: 'auto_harvest', value: 1, duration: 86400000 }
  },
  // Special Boosters
  {
    id: 'boost-coin-rain',
    name: 'Coin Rain',
    category: 'boosters',
    description: 'Receive 10,000 bonus coins immediately',
    cost: { gems: 30 },
    icon: '💰',
    rarity: 'rare',
    effect: { type: 'bonus_coins', value: 10000 }
  },
  {
    id: 'boost-worker-efficiency',
    name: 'Worker Efficiency +',
    category: 'boosters',
    description: 'Workers 40% more efficient for 3 hours',
    cost: { gems: 35 },
    icon: '⚙️',
    rarity: 'rare',
    effect: { type: 'worker_efficiency', value: 1.4, duration: 10800000 }
  }
];

// ===== EXPANSION (15+ items) =====

const EXPANSION_ITEMS: StoreItem[] = [
  // Map Size Increases
  {
    id: 'expansion-map-small',
    name: 'Small Map Expansion',
    category: 'expansion',
    description: 'Expand playable area (+5x5 tiles)',
    cost: { coins: 5000, gems: 50 },
    icon: '🗺️',
    rarity: 'uncommon',
    effect: { type: 'map_size', value: 25 }
  },
  {
    id: 'expansion-map-medium',
    name: 'Medium Map Expansion',
    category: 'expansion',
    description: 'Expand playable area (+10x10 tiles)',
    cost: { coins: 10000, gems: 100 },
    icon: '🗺️',
    rarity: 'rare',
    effect: { type: 'map_size', value: 100 }
  },
  {
    id: 'expansion-map-large',
    name: 'Large Map Expansion',
    category: 'expansion',
    description: 'Expand playable area (+20x20 tiles)',
    cost: { coins: 20000, gems: 150 },
    icon: '🗺️',
    rarity: 'legendary',
    effect: { type: 'map_size', value: 400 }
  },
  // Terrain Unlocks
  {
    id: 'terrain-island',
    name: 'Island Terrain Unlock',
    category: 'expansion',
    description: 'Unlock island terrain type',
    cost: { gems: 75 },
    icon: '🏝️',
    rarity: 'rare',
    effect: { type: 'terrain_unlock', value: 1 }
  },
  {
    id: 'terrain-valley',
    name: 'Valley Terrain Unlock',
    category: 'expansion',
    description: 'Unlock valley terrain type',
    cost: { gems: 75 },
    icon: '⛰️',
    rarity: 'rare',
    effect: { type: 'terrain_unlock', value: 1 }
  },
  {
    id: 'terrain-volcanic',
    name: 'Volcanic Terrain Unlock',
    category: 'expansion',
    description: 'Unlock volcanic terrain type',
    cost: { gems: 100 },
    icon: '🌋',
    rarity: 'legendary',
    effect: { type: 'terrain_unlock', value: 1 }
  },
  {
    id: 'terrain-floating-island',
    name: 'Floating Island Unlock',
    category: 'expansion',
    description: 'Unlock magical floating island terrain',
    cost: { gems: 150 },
    icon: '☁️',
    rarity: 'legendary',
    effect: { type: 'terrain_unlock', value: 1 },
    limited: true
  },
  // Save Slots
  {
    id: 'extra-save-slot-1',
    name: 'Extra Save Slot',
    category: 'expansion',
    description: 'Add one additional game save slot',
    cost: { gems: 40 },
    icon: '💾',
    rarity: 'uncommon',
    effect: { type: 'save_slot', value: 1 }
  },
  {
    id: 'extra-save-slot-3',
    name: 'Extra Save Slots (3)',
    category: 'expansion',
    description: 'Add three additional game save slots',
    cost: { gems: 100 },
    icon: '💾',
    rarity: 'rare',
    effect: { type: 'save_slot', value: 3 }
  },
  // New Resources
  {
    id: 'resource-platinum',
    name: 'Platinum Resource Unlock',
    category: 'expansion',
    description: 'Unlock premium platinum resource',
    cost: { gems: 100 },
    icon: '💫',
    rarity: 'legendary',
    effect: { type: 'resource_unlock', value: 1 }
  },
  {
    id: 'resource-crystal',
    name: 'Crystal Resource Unlock',
    category: 'expansion',
    description: 'Unlock magical crystal resource',
    cost: { gems: 100 },
    icon: '🔷',
    rarity: 'legendary',
    effect: { type: 'resource_unlock', value: 1 }
  },
  // Warehouse Upgrades
  {
    id: 'warehouse-storage-1',
    name: 'Storage Upgrade +50%',
    category: 'expansion',
    description: 'Increase storage capacity by 50%',
    cost: { coins: 3000, gems: 30 },
    icon: '🏢',
    rarity: 'uncommon',
    effect: { type: 'storage_increase', value: 0.5 }
  },
  {
    id: 'warehouse-storage-2',
    name: 'Storage Upgrade +100%',
    category: 'expansion',
    description: 'Double storage capacity',
    cost: { coins: 6000, gems: 60 },
    icon: '🏢',
    rarity: 'rare',
    effect: { type: 'storage_increase', value: 1.0 }
  },
  // Worker Slots
  {
    id: 'worker-slots-5',
    name: '+5 Worker Slots',
    category: 'expansion',
    description: 'Accommodate 5 more workers',
    cost: { coins: 2000, gems: 20 },
    icon: '👷',
    rarity: 'uncommon',
    effect: { type: 'worker_slots', value: 5 }
  },
  {
    id: 'worker-slots-15',
    name: '+15 Worker Slots',
    category: 'expansion',
    description: 'Accommodate 15 more workers',
    cost: { coins: 5000, gems: 50 },
    icon: '👷',
    rarity: 'rare',
    effect: { type: 'worker_slots', value: 15 }
  }
];

// ===== COMPILE ALL ITEMS =====

export const ALL_STORE_ITEMS: StoreItem[] = [
  ...BUILDING_ITEMS,
  ...DECORATION_ITEMS,
  ...COSMETIC_ITEMS,
  ...BOOSTER_ITEMS,
  ...EXPANSION_ITEMS
];

export const STORE_ITEMS_BY_CATEGORY: Record<StoreItemCategory, StoreItem[]> = {
  buildings: BUILDING_ITEMS,
  decorations: DECORATION_ITEMS,
  cosmetics: COSMETIC_ITEMS,
  boosters: BOOSTER_ITEMS,
  expansion: EXPANSION_ITEMS
};

// ===== UTILITY FUNCTIONS =====

/**
 * Get items on sale
 */
export function getSaleItems(): StoreItem[] {
  return ALL_STORE_ITEMS.filter(item => item.onSale);
}

/**
 * Get items by rarity
 */
export function getItemsByRarity(rarity: StoreItem['rarity']): StoreItem[] {
  return ALL_STORE_ITEMS.filter(item => item.rarity === rarity);
}

/**
 * Search items by name or description
 */
export function searchItems(query: string): StoreItem[] {
  const q = query.toLowerCase();
  return ALL_STORE_ITEMS.filter(item =>
    item.name.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q)
  );
}

/**
 * Get item by ID
 */
export function getItemById(id: string): StoreItem | undefined {
  return ALL_STORE_ITEMS.find(item => item.id === id);
}

/**
 * Get total item count
 */
export function getTotalItemCount(): number {
  return ALL_STORE_ITEMS.length;
}

/**
 * Get category item count
 */
export function getCategoryItemCount(category: StoreItemCategory): number {
  return STORE_ITEMS_BY_CATEGORY[category].length;
}
