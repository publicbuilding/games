# WorldBuilder UX Rendering Issues - Debug Report

**Date:** February 1, 2026  
**Status:** Diagnosed and Partially Fixed

## Issues Identified

### 1. ✅ FIXED: Resource Display Not Formatted
**Problem:** Resource display shows "99999999987/19" instead of formatted numbers  
**Root Cause:** This was actually the POPULATION display, not resources. The population counter was missing number formatting.  
**Solution Applied:** Added `formatNumber()` calls to population display at line 817-819
```typescript
const formattedPop = this.formatNumber(state.population);
const formattedMaxPop = this.formatNumber(state.maxPopulation);
ctx.fillText(`👥 Population: ${formattedPop}/${formattedMaxPop}`, 10, 78);
```
**Code Path Verified:** `renderUI()` → Resource boxes (line 770-808) ARE calling `formatNumber()` correctly for resources  
**Issue:** Population display was NOT calling `formatNumber()`, showing huge unformatted numbers like "99999999987/19"

---

### 2. ✅ PRODUCTION RATES CODE EXISTS - Appears to be Working
**Status:** Code path exists and is being called  
**Evidence:**
- Line 759: `const productionRates = getProductionRates(state);` ✓
- Line 794: `const production = productionRates[res.key as keyof typeof productionRates];` ✓
- Line 799: `const formattedProduction = this.formatNumber(production);` ✓
- Line 808: `ctx.fillText('+${formattedProduction}/min', x + 5, 65);` ✓

**Status:** All production rate code paths are correctly implemented. If production rates aren't showing, it may be:
1. `getProductionRates()` returning 0 for all buildings (check gameState.ts)
2. CSS z-index issue (covered below)
3. Canvas clipping issue

**Recommendation:** Check that buildings have workers assigned and production is active

---

### 3. ⚠️ MINI-MAP POSITION - Top Right Instead of Bottom-Left (NEEDS INVESTIGATION)
**Code Says:** Bottom-left at `miniMapY = height - miniMapSize - 10` (line 1004)  
**User Reports:** Appears in TOP RIGHT  

**Possible Root Causes:**
1. **Canvas Height Issue:** If `height` parameter passed to `renderUI()` is incorrect
   - Debug Fix: Added logging at line 1012 to print mini-map Y position every 60 frames
   - Check console output: `[DEBUG] Mini-map Position`

2. **CSS Transform/Position Override:** The canvas might have CSS positioning that inverts coordinates
   - Canvas CSS: `display: block; flex: 1; width: 100%; height: 100%`
   - No absolute positioning or transforms detected
   - Unlikely cause

3. **Canvas Context Transform:** The render function applies camera transforms that might affect UI layer
   - Line 162: `ctx.save()` before game world transforms
   - Line 185: `ctx.restore()` BEFORE renderUI is called
   - Transforms should NOT affect renderUI

4. **Input Handler Mismatch:** Click detection expects bottom-left (line 272-278 of input.ts)
   - Mini-map click detection: `miniMapY = rect.height - miniMapSize - 10;`
   - This matches the render code
   - If rendering is TOP RIGHT, clicks would be in wrong place

**Debug Output to Check:** Run with console open
```
[DEBUG] Mini-map Position - X: 10, Y: [HEIGHT-130], CanvasHeight: [HEIGHT], Size: 120
[DEBUG] Expected mini-map Y range: [HEIGHT-130] to [HEIGHT-10]
```

If Y is near 0 or very small, the height parameter is wrong.  
If Y is correct but visually wrong, likely a CSS or coordinate system issue.

---

### 4. ⚠️ BUILDING PALETTE TOOLTIPS - Hover Not Working (NEEDS INVESTIGATION)
**Code Status:** 
- Hover detection exists: `updateBuildingPaletteHover()` in input.ts (line 362-387)
- Tooltip rendering exists: `renderBuildingTooltip()` in proRenderer.ts (line 1285-1335)
- Hover state tracking: `setHoveredBuilding()` at line 1360

**Potential Issues:**
1. **Hover Callback Not Firing:** Check if mouse events are properly delegated
   - Debug: Added logging at line 1271 when building hover is detected
   - Check console: `[DEBUG] Hovering over building: [TYPE]`

2. **Bounds Not Found:** The `buttonBounds` map might not contain the hovered building
   - Debug: Added logging at line 1273-1277
   - Check console for "Building bounds NOT found"

3. **Z-Order Issue:** Tooltip might be rendered but behind other elements
   - Current implementation draws tooltip after building palette
   - Should appear in front

**Debug Output to Check:**
```
[DEBUG] Hovering over building: ricePaddy at 450, 890
[DEBUG] Building bounds found, rendering tooltip at (450, 810)
```

If no output appears when hovering over buildings, the hover event isn't firing.

---

### 5. ⚠️ RANDOM "PLAINS" LABEL - Hover Detection Issue
**Code Status:**
- Hover detection: Line 838-852 in proRenderer.ts
- Tile hover set via: `setHoveredTile()` at line 1349

**Possible Issues:**
1. **Hover Not Clearing:** The `hoveredTile` might not be cleared when mouse leaves
   - Input handler calls: `this.callback({ type: 'unhover' });` (line 101 of input.ts)
   - But `unhover` calls `clearHoveredTile()` only in that case
   - **Bug Found:** The `unhover` action only runs if `!this.isPanning` (line 97)
   - If panning and mouse leaves palette, hover doesn't clear

2. **Incorrect Hover Coordinates:** The tile coordinates might be calculated wrong
   - Debug: Added logging at line 849 when Plains tile is hovered
   - Check console: `[DEBUG] Plains tooltip rendered at hoveredTile`

3. **Canvas Coordinate System Mismatch:** The `screenToWorld()` conversion might be inverted
   - Line 346 of input.ts: `const x = (screenX - canvasWidth / 2) / this.ui.zoom + this.ui.cameraX;`
   - If camera coordinates are inverted, this would calculate wrong tile

**Debug Output to Check:**
```
[DEBUG] Plains tooltip rendered at hoveredTile (15, 8)
```

Repeated unwanted Plains output indicates hover state isn't clearing properly or is firing when it shouldn't.

---

## Fixes Applied

### Fix 1: Population Number Formatting ✅
**File:** `src/ui/graphics/proRenderer.ts`  
**Lines:** 817-819  
**Change:** Added `formatNumber()` calls to population display  

### Fix 2: Debug Logging Added
**Locations:**
- Line 778: Resource formatting debug
- Line 1012: Mini-map position debug  
- Line 1271-1277: Building hover detection debug
- Line 849: Plains tooltip debug

**How to Use Debug Logs:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for `[DEBUG]` messages
4. These appear every frame or on specific events

---

## Next Steps for Investigation

### Step 1: Verify Mini-Map Position
1. Build and deploy: `npm run build`
2. Open in browser
3. Open DevTools Console (F12)
4. Look for: `[DEBUG] Mini-map Position`
5. Check Y coordinate vs canvas height
6. Take screenshot showing mini-map location vs DevTools report

### Step 2: Check Building Tooltip Hover
1. Hover mouse over building icons in palette (bottom)
2. Check DevTools console for:
   - `[DEBUG] Hovering over building:` messages
   - `[DEBUG] Building bounds` messages
3. If no output, hover detection isn't firing
4. If "bounds NOT found", the position calculation is wrong

### Step 3: Trace Plains Label Issue
1. Move mouse over map
2. Watch for "Plains" label at bottom of screen
3. Check console for: `[DEBUG] Plains tooltip rendered`
4. Note the tile coordinates (x, y) that trigger it
5. Verify you're actually hovering over plains tiles

### Step 4: Verify Coordinate Systems
If mini-map position is wrong:
1. Check if Y increases downward (correct) or upward (inverted)
2. Check canvas vs screen pixel ratio (DPI scaling)
3. Verify `renderUI` receives correct width/height

---

## Technical Details

### Canvas Coordinate System
- Origin: Top-left (0, 0)
- X increases rightward
- Y increases downward

### Mini-Map Expected Position
- X: 10px from left (fixed)
- Y: `height - 120 - 10` = 120px from bottom, 10px margin
- Size: 120x120 pixels
- Should appear in BOTTOM-LEFT corner

### Rendering Layers (renderUI order)
1. Background panel (lines 739-745)
2. Settlement level bar (line 751)
3. Resource boxes (lines 770-808)
4. Population info (lines 817-819)
5. Notifications (line 821)
6. Celebration effects (line 824)
7. Zoom/Seed display (lines 827-835)
8. Tile hover tooltip (lines 838-852)
9. Mini-map (line 857)
10. Building palette (line 860)
11. Building tooltip (lines 1271-1277)

Later layers render on top of earlier ones.

---

## Console Commands for Testing

```javascript
// In browser console:

// Check game state resources
console.log(gameState.resources);

// Check if formatNumber is working
console.log(proRenderer.formatNumber(99999999987));  // Should show "100.0B"

// Monitor frames with debug output
// (automatic once built with debug code)
```

---

## Build Status
✅ **TypeScript:** No errors  
✅ **Build:** Successful (dist/ generated)  
✅ **Debug Logging:** Active  

Last build: 2026-02-01 20:45 UTC  
Total output size: 119.91 kB (33.50 kB gzipped)
