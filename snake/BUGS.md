# Snake Game - Bug Report & Fixes

## Bugs Found During Development

### Bug #1: Shallow Copy of DEFAULT_SKINS (Critical)
**Location:** `src/skins.ts` - `loadSkins()` method

**Issue:** When localStorage was empty, the `loadSkins()` method returned `[...DEFAULT_SKINS]` which creates a new array but the skin objects inside were the same references as `DEFAULT_SKINS`. When `checkUnlocks()` set `skin.unlocked = true`, it mutated the original `DEFAULT_SKINS` objects.

**Impact:** In test environments (and potentially in production with certain race conditions), skins would appear unlocked even after clearing localStorage because the original const was mutated.

**Fix:** Changed `return [...DEFAULT_SKINS]` to `return DEFAULT_SKINS.map(skin => ({ ...skin }))` to create deep copies of each skin object.

### Bug #2: Incorrect Test Expectation for Rapid Direction Changes
**Location:** `src/game-state.test.ts`

**Issue:** Test expected that calling `setDirection(Up)` then `setDirection(Left)` would result in direction being `Left`. But since the snake starts going `Right`, and `Left` is the opposite of `Right`, the `Left` direction is rejected.

**Impact:** Test failure, no gameplay impact.

**Fix:** Updated test to use valid direction sequences and added a new test to verify 180° turn prevention.

### Bug #3: Win Condition Not Distinguished from Loss
**Location:** `src/main.ts` - `showGameOver()` method

**Issue:** When player fills the entire grid (wins), the game showed "Game Over" instead of indicating a victory.

**Impact:** Poor user experience - player wouldn't know they achieved the extremely rare win condition.

**Fix:** Added check for snake length equaling grid size and display "🎉 You Win!" with appropriate message.

## Edge Cases Handled

1. **Self-collision on eating food** - Collision check happens before snake grows, preventing false positives.

2. **180° turn prevention** - `setDirection()` validates against current direction's opposite.

3. **Pause timing** - When unpaused, game resumes normally without teleporting snake.

4. **Win condition** - When snake fills entire grid, `generateFood()` returns `{-1, -1}` which triggers game over with win status.

5. **Touch vs Tap** - Touch controls distinguish between tap (pause) and swipe (direction) using time and distance thresholds.

6. **localStorage errors** - All localStorage operations wrapped in try-catch to handle private browsing or quota exceeded.

## Potential Improvements (Not Bugs)

1. **Pause resume timing** - Currently snake moves immediately when unpaused. Could add a brief countdown.

2. **Event listener cleanup** - Controls `destroy()` method is a stub. In a larger app, should properly remove listeners.

3. **High score tie** - When score equals high score, shows "New High Score!" which is technically correct but could be clearer.
