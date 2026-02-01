#!/usr/bin/env node
/**
 * SPRINT 1 Verification Script
 * Verifies all UI/UX changes are properly implemented
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const checks = {
  passed: [],
  failed: [],
};

function check(description, condition) {
  if (condition) {
    checks.passed.push(description);
    console.log(`✅ ${description}`);
  } else {
    checks.failed.push(description);
    console.log(`❌ ${description}`);
  }
}

console.log('🔍 SPRINT 1 VERIFICATION\n');

// 1. Check buildings.ts for categories
const buildingsTs = fs.readFileSync(path.join(__dirname, 'src/core/buildings.ts'), 'utf-8');
check('BUILDING_CATEGORIES defined in buildings.ts', buildingsTs.includes('export const BUILDING_CATEGORIES'));
check('CATEGORY_LABELS defined in buildings.ts', buildingsTs.includes('export const CATEGORY_LABELS'));
check('Housing category contains House, Inn, Dojo', buildingsTs.includes("housing: ['house', 'inn', 'dojo']"));
check('Production category has 7 buildings', buildingsTs.includes("production: ['ricePaddy', 'teaPlantation', 'silkFarm', 'fishingDock', 'blacksmith', 'teaHouse', 'shipyard']"));

// 2. Check types for BuildingCategory export
const typesTs = fs.readFileSync(path.join(__dirname, 'src/types/index.ts'), 'utf-8');
check('BuildingCategory type exported in types/index.ts', typesTs.includes("export type BuildingCategory"));

// 3. Check CSS button positioning
const styleCss = fs.readFileSync(path.join(__dirname, 'src/style.css'), 'utf-8');
const uiOverlaySection = styleCss.match(/#ui-overlay\s*\{[\s\S]*?\n\}/);
check('UI overlay buttons moved to top: 140px', uiOverlaySection && uiOverlaySection[0].includes('top: 140px'));

const marketPanelSection = styleCss.match(/#market-panel\s*\{[\s\S]*?\n\}/);
check('Market panel moved to top: 140px', marketPanelSection && marketPanelSection[0].includes('top: 140px'));

// 4. Check proRenderer for mini-map changes
const proRendererTs = fs.readFileSync(path.join(__dirname, 'src/ui/graphics/proRenderer.ts'), 'utf-8');
check('Mini-map uses top-right positioning', proRendererTs.includes('width - miniMapSize - 10'));
check('Mini-map Y position is 10', proRendererTs.includes('miniMapY = 10'));
check('renderBuildingPalette uses BUILDING_CATEGORIES', proRendererTs.includes('BUILDING_CATEGORIES[category]'));
check('renderBuildingPalette grouped by category', proRendererTs.includes('for (const category of categories)'));
check('Enhanced tooltips with dynamic height', proRendererTs.includes('let contentLines'));
check('Tooltip shows production rates', proRendererTs.includes('+${this.formatNumber(production)}/min'));

// 5. Check dist build
const distExists = fs.existsSync(path.join(__dirname, 'dist'));
check('Production build exists in dist/', distExists);

if (distExists) {
  const assetsDir = path.join(__dirname, 'dist/assets');
  const hasAssets = fs.existsSync(assetsDir) && fs.readdirSync(assetsDir).length > 0;
  check('dist/ contains compiled assets', hasAssets);
}

// Summary
console.log('\n📊 VERIFICATION SUMMARY\n');
console.log(`✅ Passed: ${checks.passed.length}`);
console.log(`❌ Failed: ${checks.failed.length}`);

if (checks.failed.length === 0) {
  console.log('\n🎉 ALL CHECKS PASSED! Sprint 1 is ready for deployment.\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some checks failed. Please review the implementation.\n');
  checks.failed.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
}
