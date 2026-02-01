import { Tile, TileType } from '../types';

const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;

/**
 * Seeded random number generator (Mulberry32)
 * Allows reproducible map generation from seed
 */
class SeededRandom {
  private a: number;

  constructor(seed: number) {
    this.a = seed;
  }

  next(): number {
    this.a |= 0;
    this.a = (this.a + 0x6d2b79f5) | 0;
    let t = Math.imul(this.a ^ (this.a >>> 15), 1 | this.a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

/**
 * Simplex-like noise using multiple sine waves for realistic terrain
 */
function simplexLike(x: number, y: number, rng: SeededRandom, scale: number = 10): number {
  const n1 = Math.sin(x / scale) * Math.cos(y / scale * 0.5);
  const n2 = Math.sin(y / scale * 0.7) * Math.cos(x / scale * 0.3);
  const n3 = Math.sin((x + y) / scale * 0.4) * 0.5;
  
  const random = rng.next();
  return (n1 + n2 + n3) * 0.33 + random * 0.1;
}

/**
 * Generate mountain range ridges using line-based approach
 * Creates believable mountain chains rather than scattered peaks
 */
function generateMountainRanges(
  map: Tile[][],
  rng: SeededRandom,
  mountainGrid: number[][]
): void {
  // Create 2-3 main mountain ridges
  const ridgeCount = rng.next() < 0.5 ? 2 : 3;
  
  for (let r = 0; r < ridgeCount; r++) {
    // Random ridge parameters
    const startX = rng.next() * MAP_WIDTH;
    const startY = rng.next() * MAP_HEIGHT;
    const endX = rng.next() * MAP_WIDTH;
    const endY = rng.next() * MAP_HEIGHT;
    const ridgeWidth = 2 + Math.floor(rng.next() * 3); // Width 2-4 tiles
    const ridgeHeight = 0.3 + rng.next() * 0.4; // 0.3-0.7 intensity
    
    // Draw line from start to end using Bresenham-like algorithm
    drawRidgeLine(startX, startY, endX, endY, ridgeWidth, ridgeHeight, mountainGrid, rng);
  }
  
  // Add scattered peaks around ridges
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (mountainGrid[y][x] > 0.5) {
        // Already a ridge
        map[y][x].type = 'mountain';
      } else if (mountainGrid[y][x] > 0.3) {
        // Foothills around mountains
        map[y][x].type = 'forest';
      }
    }
  }
}

/**
 * Draw a mountain ridge line on the grid
 */
function drawRidgeLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  width: number,
  height: number,
  grid: number[][],
  rng: SeededRandom
): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  
  for (let i = 0; i <= steps; i++) {
    const t = steps > 0 ? i / steps : 0;
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t);
    
    // Add noise variation
    const noise = rng.next() * 0.3;
    
    // Draw circle of mountains around this point
    for (let dy = -width; dy <= width; dy++) {
      for (let dx = -width; dx <= width; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
          const distance = Math.hypot(dx, dy) / width;
          const value = (height + noise) * Math.max(0, 1 - distance);
          grid[ny][nx] = Math.max(grid[ny][nx], value);
        }
      }
    }
  }
}

/**
 * Generate river systems that flow from mountains to edges
 */
function generateRiverSystems(
  map: Tile[][],
  rng: SeededRandom,
  mountainGrid: number[][]
): void {
  const riverCount = 2 + Math.floor(rng.next() * 2); // 2-3 rivers
  
  for (let r = 0; r < riverCount; r++) {
    // Find a mountain peak to start from
    let startX = Math.floor(rng.next() * MAP_WIDTH);
    let startY = Math.floor(rng.next() * MAP_HEIGHT);
    
    // Find nearby mountain
    let bestDist = Infinity;
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (mountainGrid[y][x] > 0.5) {
          const dist = Math.hypot(x - startX, y - startY);
          if (dist < bestDist) {
            bestDist = dist;
            startX = x;
            startY = y;
          }
        }
      }
    }
    
    // Carve river from mountain to edge
    carvRiver(startX, startY, map, rng, mountainGrid);
  }
}

/**
 * Carve a single river from mountains toward the edge
 */
function carvRiver(
  startX: number,
  startY: number,
  map: Tile[][],
  rng: SeededRandom,
  mountainGrid: number[][]
): void {
  let x = startX;
  let y = startY;
  let lastX = x;
  let lastY = y;
  const visited = new Set<string>();
  let steps = 0;
  const maxSteps = MAP_WIDTH + MAP_HEIGHT;
  
  // Lake at source
  if (rng.next() < 0.6) {
    createLake(x, y, 1 + Math.floor(rng.next() * 2), map);
  }
  
  while (steps < maxSteps) {
    // Place river tile (don't cross mountains)
    if (mountainGrid[y][x] < 0.5) {
      if (map[y][x].type !== 'mountain') {
        map[y][x].type = 'river';
        map[y][x].resourceAmount = undefined;
      }
    }
    
    visited.add(`${x},${y}`);
    
    // Find next step - prefer moving downhill (toward edges)
    let bestDir = { x: 0, y: 0, score: -Infinity };
    
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) {
          // Reached edge - great!
          bestDir = { x: dx, y: dy, score: 1000 };
          continue;
        }
        
        const key = `${nx},${ny}`;
        if (visited.has(key)) continue; // Avoid loops
        
        // Prefer flowing toward edges and away from mountains
        const distToEdge = Math.min(nx, ny, MAP_WIDTH - 1 - nx, MAP_HEIGHT - 1 - ny);
        const mountainPenalty = mountainGrid[ny][nx] > 0.5 ? -100 : 0;
        
        // Slight random variation to create meandering
        const randomVariation = rng.next() * 2 - 1;
        const score = distToEdge * 0.5 + mountainPenalty + randomVariation;
        
        if (score > bestDir.score) {
          bestDir = { x: dx, y: dy, score };
        }
      }
    }
    
    lastX = x;
    lastY = y;
    x += bestDir.x;
    y += bestDir.y;
    
    // Reached edge - river complete
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
      break;
    }
    
    steps++;
    
    // Occasional river branching
    if (steps > 5 && rng.next() < 0.1) {
      carvRiver(x, y, map, rng, mountainGrid);
    }
  }
}

/**
 * Create a small lake at a location
 */
function createLake(centerX: number, centerY: number, radius: number, map: Tile[][]): void {
  for (let y = centerY - radius; y <= centerY + radius; y++) {
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
        if (Math.hypot(x - centerX, y - centerY) <= radius) {
          map[y][x].type = 'river';
          map[y][x].resourceAmount = undefined;
        }
      }
    }
  }
}

/**
 * Generate biome clusters - bamboo groves, forest patches
 */
function generateBiomeClusters(map: Tile[][], rng: SeededRandom): void {
  // Bamboo grove clusters
  const bambooClusterCount = 3 + Math.floor(rng.next() * 2);
  for (let i = 0; i < bambooClusterCount; i++) {
    const centerX = Math.floor(rng.next() * MAP_WIDTH);
    const centerY = Math.floor(rng.next() * MAP_HEIGHT);
    const clusterRadius = 2 + Math.floor(rng.next() * 3);
    
    for (let y = centerY - clusterRadius; y <= centerY + clusterRadius; y++) {
      for (let x = centerX - clusterRadius; x <= centerX + clusterRadius; x++) {
        if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
          if (Math.hypot(x - centerX, y - centerY) <= clusterRadius) {
            if (map[y][x].type === 'plains' && rng.next() < 0.7) {
              map[y][x].type = 'bamboo';
              map[y][x].resourceAmount = 100;
            }
          }
        }
      }
    }
  }
  
  // Forest patches
  const forestClusterCount = 4 + Math.floor(rng.next() * 3);
  for (let i = 0; i < forestClusterCount; i++) {
    const centerX = Math.floor(rng.next() * MAP_WIDTH);
    const centerY = Math.floor(rng.next() * MAP_HEIGHT);
    const clusterRadius = 3 + Math.floor(rng.next() * 4);
    
    for (let y = centerY - clusterRadius; y <= centerY + clusterRadius; y++) {
      for (let x = centerX - clusterRadius; x <= centerX + clusterRadius; x++) {
        if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
          if (Math.hypot(x - centerX, y - centerY) <= clusterRadius) {
            if (map[y][x].type === 'plains' && rng.next() < 0.6) {
              map[y][x].type = 'forest';
              map[y][x].resourceAmount = 90;
            }
          }
        }
      }
    }
  }
}

/**
 * Guarantee a viable starting area with proper resources
 */
function ensureStartingArea(
  map: Tile[][],
  rng: SeededRandom,
  STARTING_X: number,
  STARTING_Y: number,
  INITIAL_VISIBLE_WIDTH: number,
  INITIAL_VISIBLE_HEIGHT: number
): void {
  const startCenterX = STARTING_X + Math.floor(INITIAL_VISIBLE_WIDTH / 2);
  const startCenterY = STARTING_Y + Math.floor(INITIAL_VISIBLE_HEIGHT / 2);
  
  // Clear 7x7 plains zone for starting area
  for (let y = startCenterY - 3; y <= startCenterY + 3; y++) {
    for (let x = startCenterX - 3; x <= startCenterX + 3; x++) {
      if (map[y] && map[y][x]) {
        map[y][x].type = 'plains';
        map[y][x].resourceAmount = undefined;
      }
    }
  }
  
  // Guarantee water access nearby (within 4 tiles)
  let waterFound = false;
  for (let y = startCenterY - 5; y <= startCenterY + 5; y++) {
    for (let x = startCenterX - 5; x <= startCenterX + 5; x++) {
      if (map[y] && map[y][x] && map[y][x].type === 'river') {
        waterFound = true;
      }
    }
  }
  if (!waterFound) {
    // Place river nearby
    const riverX = startCenterX + (rng.next() < 0.5 ? 4 : -4);
    const riverY = startCenterY + (rng.next() < 0.5 ? 3 : -3);
    if (map[riverY] && map[riverY][riverX]) {
      map[riverY][riverX].type = 'river';
      createLake(riverX, riverY, 1, map);
    }
  }
  
  // Guarantee forest nearby (within 5 tiles)
  let forestFound = false;
  for (let y = startCenterY - 6; y <= startCenterY + 6; y++) {
    for (let x = startCenterX - 6; x <= startCenterX + 6; x++) {
      if (map[y] && map[y][x] && map[y][x].type === 'forest') {
        forestFound = true;
      }
    }
  }
  if (!forestFound) {
    // Place forest cluster nearby
    const forestX = startCenterX + (rng.next() < 0.5 ? 5 : -5);
    const forestY = startCenterY + (rng.next() < 0.5 ? 4 : -4);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const y = forestY + dy;
        const x = forestX + dx;
        if (map[y] && map[y][x] && map[y][x].type !== 'mountain') {
          map[y][x].type = 'forest';
          map[y][x].resourceAmount = 90;
        }
      }
    }
  }
  
  // Guarantee mountain in scoutable distance (8-12 tiles)
  let mountainFound = false;
  for (let y = startCenterY - 12; y <= startCenterY + 12; y++) {
    for (let x = startCenterX - 12; x <= startCenterX + 12; x++) {
      if (map[y] && map[y][x] && map[y][x].type === 'mountain') {
        const dist = Math.hypot(x - startCenterX, y - startCenterY);
        if (dist >= 8 && dist <= 12) {
          mountainFound = true;
        }
      }
    }
  }
  if (!mountainFound) {
    // Place mountain in scoutable distance
    const angle = rng.next() * Math.PI * 2;
    const dist = 8 + rng.next() * 4;
    const mountainX = Math.round(startCenterX + Math.cos(angle) * dist);
    const mountainY = Math.round(startCenterY + Math.sin(angle) * dist);
    if (map[mountainY] && map[mountainY][mountainX]) {
      map[mountainY][mountainX].type = 'mountain';
      map[mountainY][mountainX].resourceAmount = 80;
    }
  }
}

/**
 * Remove isolated single-tile terrain patches
 */
function smoothTerrain(map: Tile[][]): void {
  // Multiple passes to remove isolated tiles
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
      for (let x = 1; x < MAP_WIDTH - 1; x++) {
        const tile = map[y][x];
        
        // Count same-type neighbors
        let sameTypeNeighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            if (map[y + dy][x + dx].type === tile.type) {
              sameTypeNeighbors++;
            }
          }
        }
        
        // If tile is isolated (0-1 neighbors of same type), convert to plains
        if (sameTypeNeighbors <= 1 && tile.type !== 'plains') {
          const waterNeighbors = Array.from({ length: 8 }, (_, i) => {
            const dy = Math.floor(i / 3) - 1;
            const dx = (i % 3) - 1;
            if (dx === 0 && dy === 0) return false;
            return map[y + dy] && map[y + dy][x + dx] && map[y + dy][x + dx].type === 'river';
          }).filter(Boolean).length;
          
          // Don't remove if next to water
          if (waterNeighbors === 0) {
            map[y][x].type = 'plains';
            map[y][x].resourceAmount = undefined;
          }
        }
      }
    }
  }
}

/**
 * Main map generation function with seed support
 */
export function generateIntelligentMap(
  seed?: number
): { map: Tile[][], seed: number } {
  // Use provided seed or generate random one
  const actualSeed = seed ?? Math.floor(Math.random() * 0xFFFFFFFF);
  const rng = new SeededRandom(actualSeed);
  
  const STARTING_X = Math.floor(MAP_WIDTH / 2) - 10;
  const STARTING_Y = Math.floor(MAP_HEIGHT / 2) - 10;
  const INITIAL_VISIBLE_WIDTH = 20;
  const INITIAL_VISIBLE_HEIGHT = 20;
  
  // Initialize map with plains
  const map: Tile[][] = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      row.push({
        type: 'plains',
        x,
        y,
        resourceAmount: undefined,
        animationPhase: rng.next(),
      });
    }
    map.push(row);
  }
  
  // Create mountain grid for pathfinding
  const mountainGrid: number[][] = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: number[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      row.push(0);
    }
    mountainGrid.push(row);
  }
  
  // Generate features in order
  generateMountainRanges(map, rng, mountainGrid);
  generateRiverSystems(map, rng, mountainGrid);
  generateBiomeClusters(map, rng);
  smoothTerrain(map);
  
  // Ensure starting area is viable
  ensureStartingArea(
    map,
    rng,
    STARTING_X,
    STARTING_Y,
    INITIAL_VISIBLE_WIDTH,
    INITIAL_VISIBLE_HEIGHT
  );
  
  return { map, seed: actualSeed };
}

/**
 * Get map dimensions
 */
export function getMapDimensions() {
  return { width: MAP_WIDTH, height: MAP_HEIGHT };
}
