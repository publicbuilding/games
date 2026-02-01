# World Builder 🏰

An Anno-style city builder game built with TypeScript and HTML5 Canvas.

## Features

### Core Gameplay
- **Tile-based map** with grass, water, trees, and rocks
- **4 resource types**: Wood 🪵, Stone 🪨, Food 🍎, Gold 🪙
- **6 building types**:
  - 🏠 **House** - Provides housing for 4 people
  - 🌾 **Farm** - Produces food (no adjacency needed)
  - 🪓 **Lumber Mill** - Produces wood (must be next to trees)
  - ⛏️ **Quarry** - Extracts stone (must be next to rocks)
  - 🏪 **Market** - Sell resources for gold
  - 📦 **Warehouse** - Increases storage capacity

### Production Chains
- Trees → Lumber Mill → Wood
- Rocks → Quarry → Stone
- Farms → Food
- Market: Wood/Stone/Food → Gold

### Population System
- Population grows when food is abundant (>20) and housing available
- Workers are assigned to buildings for production
- Starvation causes population decline (but never below 1)

### Premium Features (Freemium Mock)
- 💎 Gems currency (start with 10)
- ⭐ **Auto Factory** - Generates gold without workers (50 gems)
- ⭐ **Mansion** - Houses 12 people (50 gems)
- ⚡ **Speed Boost** - 2x production for 60s (5 gems)

## Controls

### Desktop
- **Click** building palette to select
- **Click** map to place building
- **Shift+Click** to demolish
- **Right-click** to deselect
- **Scroll wheel** to zoom
- **Middle-click drag** or **Alt+drag** to pan
- **Arrow keys** to pan
- **+/-** to zoom
- **1-8** keys to select buildings
- **Escape** to deselect

### Mobile
- **Tap** palette to select building
- **Tap** map to place
- **Single finger drag** to pan
- **Pinch** to zoom

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Project Structure

```
worldbuilder/
├── src/
│   ├── core/
│   │   ├── actions.ts      # Building placement, demolition, trading
│   │   ├── buildings.ts    # Building definitions and costs
│   │   ├── gameState.ts    # State management, save/load
│   │   └── production.ts   # Resource production, population
│   ├── ui/
│   │   ├── renderer.ts     # Canvas rendering
│   │   └── input.ts        # Mouse/touch/keyboard handling
│   ├── types/
│   │   └── index.ts        # TypeScript type definitions
│   ├── tests/
│   │   ├── production.test.ts  # Production & population tests
│   │   ├── actions.test.ts     # Building & trading tests
│   │   └── balance.test.ts     # Game balance analysis
│   ├── main.ts             # Game initialization
│   └── style.css           # UI styling
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Game Balance

### Starting Resources
- Wood: 100, Stone: 50, Food: 200, Gold: 200
- Population: 5 (with 5 base housing)
- Gems: 10

### Resource Rates
- Food consumption: 0.5 per person per second
- Farm production: 3 food/s (needs 2 workers)
- Lumber Mill: 2 wood/s (needs 2 workers, adjacent trees)
- Quarry: 1.5 stone/s (needs 3 workers, adjacent rocks)

### Market Prices
- Wood: 5 gold each
- Stone: 8 gold each
- Food: 3 gold each

### Balance Notes
- Starting food lasts ~80 seconds (enough time to build farm)
- 1 farm can sustain 6 people (produces 3 food/s, 6 people consume 3 food/s)
- Build houses for population growth, then production buildings
- Always keep food positive to avoid death spiral

## Bugs Found & Fixed

1. **Starting food too low** - Originally 50 food only lasted 20 seconds with 5 population. Increased to 200.

2. **Demolish refund capped by maxResources** - Refunds were being capped at the original max storage, potentially losing resources.

## Recommendations for Future Development

1. **Visual Feedback** - Add animations for production, building placement effects
2. **Sound Effects** - Building placement, production completion, warnings
3. **Tutorial** - Guide new players through first farm + house
4. **Achievements** - Milestone rewards for engagement
5. **Events** - Random events like droughts, windfalls
6. **Building Upgrades** - Level up buildings for efficiency
7. **Tech Tree** - Unlock advanced buildings through research
8. **Multiplayer** - Trade resources with other players
