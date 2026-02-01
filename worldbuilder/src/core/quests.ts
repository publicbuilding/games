import { GameState, Quest, QuestObjective } from '../types';

/**
 * Quest System for Phase 3 Gameplay Depth
 * Provides tutorials, missions, and exploration guidance
 */

// Tutorial steps
export const TUTORIAL_STEPS = [
  {
    step: 1,
    message: 'Welcome to the Eastern Realm! First, build a house to increase housing.',
    objective: 'Build a house to provide shelter for your people.',
  },
  {
    step: 2,
    message: 'Good! Now build a Rice Paddy to produce food for your population.',
    objective: 'Build a Rice Paddy to feed your people.',
  },
  {
    step: 3,
    message: 'Excellent! Now place workers on the paddy by clicking it.',
    objective: 'Assign workers to the Rice Paddy.',
  },
  {
    step: 4,
    message: 'Your realm is growing! Build more houses and paddies to expand.',
    objective: 'Continue building your settlement.',
  },
];

/**
 * Predefined quests
 */
export const QUEST_TEMPLATES: Record<string, Quest> = {
  exploreMountain: {
    id: 'explore-mountain',
    name: '⛰️ Explore the Mountain Pass',
    description: 'Send scouts to explore the mountain regions to discover jade deposits and secure trade routes.',
    type: 'explore',
    status: 'available',
    objectives: [
      {
        type: 'exploreArea',
        targetArea: { x: 15, y: 2, radius: 3 },
        description: 'Explore the northern mountain pass',
      },
    ],
    reward: { gold: 200, resources: { jade: 50 } },
    progress: 0,
  },

  tradeRoute: {
    id: 'establish-trade',
    name: '⛵ Establish Trade Route',
    description: 'Build a harbor and shipyard to establish sea trade and generate wealth.',
    type: 'trade',
    status: 'available',
    objectives: [
      {
        type: 'buildBuilding',
        buildingType: 'harbor',
        description: 'Build a Harbor',
      },
      {
        type: 'buildBuilding',
        buildingType: 'shipyard',
        description: 'Build a Shipyard',
      },
      {
        type: 'gatherResource',
        resourceType: 'silk',
        targetAmount: 100,
        description: 'Gather 100 silk for trade',
      },
    ],
    reward: { gold: 500, population: 5 },
    progress: 0,
  },

  buildTemple: {
    id: 'build-temple',
    name: '⛩️ Build a Sacred Temple',
    description: 'Construct a temple to attract monks and receive spiritual blessings.',
    type: 'culture',
    status: 'available',
    objectives: [
      {
        type: 'buildTemple',
        description: 'Build a Temple',
      },
    ],
    reward: { gold: 300, population: 3, resources: { jade: 10 } },
    progress: 0,
  },

  defendRealm: {
    id: 'defend-realm',
    name: '🥋 Prepare Defense',
    description: 'Build watchtowers and a dojo to prepare for potential threats.',
    type: 'defense',
    status: 'available',
    objectives: [
      {
        type: 'buildBuilding',
        buildingType: 'watchtower',
        description: 'Build a Watchtower',
      },
      {
        type: 'buildBuilding',
        buildingType: 'dojo',
        description: 'Build a Dojo for warrior training',
      },
    ],
    reward: { gold: 250, population: 2 },
    progress: 0,
  },

  populationGrowth: {
    id: 'population-growth',
    name: '👥 Grow Your Population',
    description: 'Build sufficient housing and farms to grow your population to 50.',
    type: 'population',
    status: 'available',
    objectives: [
      {
        type: 'reachPopulation',
        targetAmount: 50,
        description: 'Reach a population of 50',
      },
    ],
    reward: { gold: 400, population: 5 },
    timeLimit: 600000, // 10 minutes
    progress: 0,
  },

  luxuryGoodsProduction: {
    id: 'luxury-production',
    name: '🪡 Master Luxury Goods',
    description: 'Build and manage tea plantation, silk farm, and market.',
    type: 'trade',
    status: 'available',
    objectives: [
      {
        type: 'buildBuilding',
        buildingType: 'teaPlantation',
        description: 'Build a Tea Plantation',
      },
      {
        type: 'buildBuilding',
        buildingType: 'silkFarm',
        description: 'Build a Silk Farm',
      },
      {
        type: 'buildBuilding',
        buildingType: 'market',
        description: 'Build a Market',
      },
      {
        type: 'gatherResource',
        resourceType: 'tea',
        targetAmount: 50,
        description: 'Produce 50 tea',
      },
    ],
    reward: { gold: 350, resources: { silk: 25 } },
    progress: 0,
  },
};

/**
 * Initialize quests for a new game
 */
export function initializeQuests(state: GameState): void {
  // Start with the first major quests available
  state.quests = [
    JSON.parse(JSON.stringify(QUEST_TEMPLATES.tradeRoute)),
    JSON.parse(JSON.stringify(QUEST_TEMPLATES.buildTemple)),
    JSON.parse(JSON.stringify(QUEST_TEMPLATES.defendRealm)),
    JSON.parse(JSON.stringify(QUEST_TEMPLATES.populationGrowth)),
  ];
}

/**
 * Check if a quest objective is complete
 */
export function checkObjectiveComplete(
  state: GameState,
  objective: QuestObjective
): boolean {
  switch (objective.type) {
    case 'buildBuilding':
      return state.buildings.some((b) => b.type === objective.buildingType);

    case 'buildTemple':
      return state.buildings.some((b) => b.type === 'temple');

    case 'gatherResource':
      return (state.resources as any)[objective.resourceType!] >=
        (objective.targetAmount ?? 0);

    case 'reachPopulation':
      return state.population >= (objective.targetAmount ?? 0);

    case 'exploreArea':
      if (!objective.targetArea) return false;
      const area = objective.targetArea;
      for (let x = area.x - area.radius; x <= area.x + area.radius; x++) {
        for (let y = area.y - area.radius; y <= area.y + area.radius; y++) {
          const key = `${x},${y}`;
          if (!state.exploredAreas.has(key)) return false;
        }
      }
      return true;

    case 'establishTrade':
      return (
        state.buildings.some((b) => b.type === 'market') &&
        state.resources.gold > 100
      );

    case 'defendAttack':
      return (
        state.buildings.some((b) => b.type === 'watchtower') &&
        state.buildings.some((b) => b.type === 'dojo')
      );

    default:
      return false;
  }
}

/**
 * Update quest progress
 */
export function updateQuestProgress(state: GameState): void {
  for (const quest of state.quests) {
    if (quest.status !== 'active' && quest.status !== 'available') continue;

    // Check all objectives
    let completedObjectives = 0;
    for (const objective of quest.objectives) {
      if (checkObjectiveComplete(state, objective)) {
        completedObjectives++;
      }
    }

    const newProgress = completedObjectives / quest.objectives.length;
    quest.progress = Math.min(newProgress, 1);

    // Mark as completed if all objectives done
    if (quest.progress === 1 && quest.status === 'active') {
      completeQuest(state, quest.id);
    }
  }
}

/**
 * Activate a quest
 */
export function activateQuest(state: GameState, questId: string): void {
  const quest = state.quests.find((q) => q.id === questId);
  if (quest && quest.status === 'available') {
    quest.status = 'active';
  }
}

/**
 * Complete a quest and apply rewards
 */
export function completeQuest(state: GameState, questId: string): void {
  const quest = state.quests.find((q) => q.id === questId);
  if (quest && quest.status === 'active') {
    quest.status = 'completed';
    state.completedQuests.push(questId);

    // Apply rewards
    state.resources.gold += quest.reward.gold;
    if (quest.reward.resources) {
      for (const [resource, amount] of Object.entries(quest.reward.resources)) {
        const current = (state.resources as any)[resource] ?? 0;
        (state.resources as any)[resource] = Math.min(
          current + (amount ?? 0),
          (state.maxResources as any)[resource]
        );
      }
    }
    if (quest.reward.population) {
      state.population = Math.min(
        state.population + quest.reward.population,
        state.maxPopulation
      );
    }
  }
}

/**
 * Get current tutorial message
 */
export function getTutorialMessage(step: number): string | null {
  const tutorial = TUTORIAL_STEPS.find((t) => t.step === step);
  return tutorial ? tutorial.message : null;
}

/**
 * Advance tutorial
 */
export function advanceTutorial(state: GameState): void {
  state.tutorialStep++;
  if (state.tutorialStep > TUTORIAL_STEPS.length) {
    state.tutorialStep = 0; // Tutorial complete
  }
}
