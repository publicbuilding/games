# Intelligent Map Generation System

## Overview

The Worldbuilder game now features a sophisticated procedural map generation system that creates realistic, believable landscapes with intelligent terrain placement, river systems, mountain ranges, and biome clustering.

## Core Features Implemented

### 1. **Seeded Random Generation**
- **File:** `src/core/mapGeneration.ts`
- **Implementation:** Mulberry32 seeded RNG for reproducible maps
- **Usage:** Every game receives a unique seed (or can use a provided seed)
- **Display:** Seed shown in bottom-right corner in hexadecimal format for easy sharing
- **Benefit:** Players can share map seeds for identical multiplayer experiences or speed runs

### 2. **Intelligent River Systems**
- **Flow Logic:** Rivers spawn from mountain peaks and flow toward map edges
- **Continuous Pathfinding:** Rivers follow downhill paths using gradient-based pathfinding
- **Natural Branching:** Secondary rivers branch from main rivers (10% chance per tile)
- **No Mountain Crossing:** Rivers intelligently avoid crossing mountain tiles
- **Water Features:** 
  - Lakes form at river sources (60% chance)
  - Lakes form at major junctions
  - Size varies (1-3 tile radius) for visual variety

### 3. **Mountain Ranges**
- **Ridge-Based Formation:** Mountains generate as continuous ridges/chains, not random dots
- **Multiple Ranges:** 2-3 main mountain ranges per map
- **Line Algorithms:** Uses Bresenham-like line drawing to create believable mountain chains
- **Foothills:** Forest terrain automatically surrounds mountain bases
- **Natural Progression:** Height variation creates visual interest
- **Mountain Passes:** Natural gaps in ridges allow exploration routes

### 4. **Biome Clustering**
- **Bamboo Groves:** 3-5 clusters of bamboo forests per map
  - Grouped in 2-3 tile radius areas
  - 70% density within clusters
- **Forest Patches:** 4-7 separate forest areas per map
  - Larger clusters (3-4 tile radius)
  - 60% density within clusters
- **Plains Dominance:** Lowlands filled with buildable plains
- **Natural Transitions:** No jarring terrain boundaries

### 5. **Starting Area Guarantee**
Every new game includes a viable 7×7 plains starting zone with:
- **Central Plains Zone:** Clear 7×7 area for settlement
- **Water Access:** River/lake guaranteed within 4 tiles
- **Forest Nearby:** Tree biome guaranteed within 5 tiles
- **Scoutable Mountain:** Mountain visible at 8-12 tile distance (exploration incentive)
- **Resource Balance:** Starting materials carefully distributed

### 6. **Terrain Smoothing**
- **Isolation Removal:** Single-tile terrain patches removed (likely errors)
- **Edge Cases:** Terrain isolated from same-type neighbors converted to plains
- **Water Preservation:** Isolated tiles next to water are kept (often intentional)
- **Multiple Passes:** Two-pass smoothing ensures cleaner results

## Technical Architecture

### Core Algorithm Flow

```
1. Initialize empty plains map (40×30)
2. Generate mountain ranges using ridge lines
3. Carve river systems from peaks to edges
4. Add biome clusters (bamboo, forest)
5. Smooth isolated terrain patches
6. Guarantee viable starting area
```

### Key Functions

#### `generateIntelligentMap(seed?: number)`
Main generation entry point. Returns both map and seed for reproducibility.

#### `generateMountainRanges(map, rng, mountainGrid)`
Creates 2-3 main mountain chains using line-based algorithms.

#### `generateRiverSystems(map, rng, mountainGrid)`
Spawns rivers from mountains and paths them to map edges.

#### `carvRiver(startX, startY, map, rng, mountainGrid)`
Intelligent pathfinding for a single river - avoids mountains, flows downhill.

#### `generateBiomeClusters(map, rng)`
Creates spatial clusters of bamboo forests and regular forests.

#### `ensureStartingArea(map, rng, ...)`
Validates and corrects starting area to guarantee viability.

#### `smoothTerrain(map)`
Multi-pass smoothing to remove isolated single-tile patches.

## Map Dimensions

- **Width:** 40 tiles
- **Height:** 30 tiles
- **Visible at Start:** 20×20 tile window
- **Tile Size:** 48×48 pixels (isometric rendering)

## Resource Distribution

Terrain type → Resource type mapping:
- **Plains:** No resources (buildable)
- **Forest:** Wood/natural resources (90 amount)
- **Bamboo:** Bamboo resource (100 amount)
- **Mountain:** Stone/ore (80 amount)
- **River:** Water (no harvestable resources)

## Seed System

### How Seeds Work
- Seed is a 32-bit integer
- Same seed always generates identical map
- Seed displayed in hexadecimal format (e.g., `DEADBEEF`)
- Perfect for reproducible testing and competitive play

### Usage Example
```typescript
// Generate new random map
const { map, seed } = generateIntelligentMap();

// Generate specific map from seed
const { map: sameMao } = generateIntelligentMap(0xDEADBEEF);
```

## Visual Characteristics

Maps generated with this system appear:
- **Realistic:** Terrain flows naturally (rivers to edges, forests by water)
- **Explorable:** Mountains encourage exploration, biomes create discovery zones
- **Buildable:** Plains provide plenty of settlement space with interesting features nearby
- **Unique:** Each map is different due to seed randomization and variation parameters
- **Balanced:** Resources distributed fairly for gameplay progression

## Future Enhancements

Potential improvements:
- Rainfall/precipitation zones affecting biome placement
- Desert biomes for variation
- Swamp/wetland areas near water
- Cave systems under mountains
- Beach/coastal transitions
- Procedural name generation for biomes
- Difficulty modifiers (more mountains = harder, more plains = easier)

## Files Modified

1. **Created:** `src/core/mapGeneration.ts` - Complete intelligent generation system
2. **Modified:** `src/core/gameState.ts` - Integration with main game state
3. **Modified:** `src/types/index.ts` - Added `mapSeed` to GameState interface
4. **Modified:** `src/ui/graphics/proRenderer.ts` - Display seed in UI corner

## Testing Notes

- Maps are reproducible: same seed = same map ✓
- Starting area always has plains 7×7 ✓
- Water access within 4 tiles ✓
- Forest nearby within 5 tiles ✓
- Mountain visible at exploration distance ✓
- Rivers flow from mountains to edges ✓
- No isolated terrain patches ✓
- Natural-looking biome clusters ✓
