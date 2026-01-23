/**
 * Zod schemas for Cooking Mode feature
 * Defines the structure for AI-enhanced cooking steps
 */

import { z } from 'zod';

/**
 * Timer extracted from step text
 * e.g., "bake for 20 minutes" -> { durationSeconds: 1200, label: "Bake" }
 */
export const CookingTimerSchema = z.object({
  durationSeconds: z.number().describe('Timer duration in seconds'),
  label: z.string().describe('Timer label (e.g., "Bake", "Simmer", "Rest")'),
  labelHe: z.string().nullable().describe('Hebrew label if applicable'),
  isOptional: z.boolean().default(false).describe('Whether this timer is optional/approximate'),
});

export type CookingTimer = z.infer<typeof CookingTimerSchema>;

/**
 * Ingredient reference for a micro-step
 * Maps to an ingredient from the original recipe with the quantity needed for this step
 */
export const StepIngredientSchema = z.object({
  item: z.string().describe('Ingredient name'),
  quantity: z.number().nullable().describe('Quantity needed for this specific step'),
  unit: z.string().nullable().describe('Unit code (cup, tbsp, g, etc.)'),
  originalIndex: z.number().describe('Index in the original recipe ingredients array'),
});

export type StepIngredient = z.infer<typeof StepIngredientSchema>;

/**
 * A single micro-step (1-2 actions)
 * The atomic unit of a cooking instruction
 */
export const MicroStepSchema = z.object({
  id: z.string().describe('Unique ID for this micro-step'),
  action: z.string().describe('The action to perform (1-2 clear actions max)'),
  actionHe: z.string().nullable().describe('Hebrew version of the action'),
  ingredients: z.array(StepIngredientSchema).describe('Ingredients used in this micro-step'),
  timer: CookingTimerSchema.nullable().describe('Timer if this step requires waiting'),
  tip: z.string().nullable().describe('Contextual cooking tip for this step'),
  tipHe: z.string().nullable().describe('Hebrew version of the tip'),
  equipment: z.array(z.string()).describe('Equipment/tools needed (e.g., "mixing bowl", "whisk")'),
  technique: z.string().nullable().describe('Cooking technique being used (e.g., "folding", "sauteing")'),
});

export type MicroStep = z.infer<typeof MicroStepSchema>;

/**
 * A major step group (corresponds to one original recipe step)
 * Contains multiple micro-steps
 */
export const CookingStepGroupSchema = z.object({
  groupId: z.string().describe('Unique ID for this step group'),
  title: z.string().describe('Short title for this step group'),
  titleHe: z.string().nullable().describe('Hebrew title'),
  originalStepIndex: z.number().describe('Index of the original recipe step'),
  originalStepText: z.string().describe('Original step text for reference'),
  microSteps: z.array(MicroStepSchema).describe('Broken down micro-steps'),
  estimatedMinutes: z.number().nullable().describe('Estimated time for this group'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('easy'),
  milestone: z.string().nullable().describe('Achievement text (e.g., "Dough is ready!")'),
  milestoneHe: z.string().nullable().describe('Hebrew milestone'),
});

export type CookingStepGroup = z.infer<typeof CookingStepGroupSchema>;

/**
 * Achievement that can be unlocked during cooking
 */
export const AchievementSchema = z.object({
  id: z.string().describe('Unique achievement ID'),
  title: z.string().describe('Achievement title'),
  titleHe: z.string().nullable().describe('Hebrew title'),
  description: z.string().describe('Achievement description'),
  icon: z.string().describe('Lucide icon name (e.g., "trophy", "star", "flame")'),
  unlocksAtStep: z.number().describe('Step group index where this unlocks'),
});

export type Achievement = z.infer<typeof AchievementSchema>;

/**
 * Pre-cooking checklist item
 */
export const PrepChecklistItemSchema = z.object({
  item: z.string().describe('Item description'),
  itemHe: z.string().nullable().describe('Hebrew version'),
  category: z.enum(['ingredient', 'equipment', 'prep']).describe('Category of item'),
});

export type PrepChecklistItem = z.infer<typeof PrepChecklistItemSchema>;

/**
 * Full enhanced cooking data
 * This is the complete structure returned by the cooking-mode API
 */
export const EnhancedCookingDataSchema = z.object({
  recipeId: z.string().nullable().describe('Database recipe ID (UUID)'),
  recipeTitle: z.string().describe('Recipe title'),
  language: z.enum(['he', 'en', 'mixed']),
  totalStepGroups: z.number().describe('Total number of step groups'),
  totalMicroSteps: z.number().describe('Total number of micro-steps'),
  estimatedTotalMinutes: z.number().nullable().describe('Estimated total cooking time'),
  stepGroups: z.array(CookingStepGroupSchema).describe('All step groups'),
  prepChecklist: z.array(PrepChecklistItemSchema).describe('Pre-cooking checklist'),
  achievements: z.array(AchievementSchema).describe('Achievements to unlock'),
  createdAt: z.string().describe('ISO timestamp when generated'),
});

export type EnhancedCookingData = z.infer<typeof EnhancedCookingDataSchema>;

/**
 * Schema for LLM output (what Claude generates)
 * Subset of full data - we add metadata after
 * prepChecklist and achievements are optional to handle long recipes
 * where the LLM output may be truncated
 */
export const LLMCookingOutputSchema = z.object({
  stepGroups: z.array(CookingStepGroupSchema),
  prepChecklist: z.array(PrepChecklistItemSchema).optional().default([]),
  achievements: z.array(AchievementSchema).optional().default([]),
  estimatedTotalMinutes: z.number().nullable().optional().default(null),
});

export type LLMCookingOutput = z.infer<typeof LLMCookingOutputSchema>;
