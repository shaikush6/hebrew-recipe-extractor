'use client';

import { useState, useCallback } from 'react';
import {
  ChefHat,
  Clock,
  Users,
  Flame,
  Utensils,
  Download,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Timer,
  Leaf,
  Heart,
} from 'lucide-react';
import { clsx } from 'clsx';

import { Recipe } from '@/types/recipe';
import { isHebrew, formatTime, getDifficultyLabel } from '@/lib/format';
import { CookingModeButton } from '@/components/cooking/CookingModeButton';

import MetaBadge from '@/components/ui/MetaBadge';
import IngredientItem from './IngredientItem';
import StepItem from './StepItem';
import NutritionPanel from './NutritionPanel';
import TipsSection from './TipsSection';

interface RecipeDisplayProps {
  recipe: Recipe;
}

export default function RecipeDisplay({ recipe }: RecipeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const isHeb = recipe.language === 'he' || isHebrew(recipe.title);

  const handleCopyJson = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(recipe, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [recipe]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([JSON.stringify(recipe, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recipe.title.replace(/[^\w\u0590-\u05FF\s-]/g, '')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [recipe]);

  return (
    <div className="space-y-6" dir={isHeb ? 'rtl' : 'ltr'}>
      {/* Hero section */}
      <div className="paper-card overflow-hidden animate-scale-in">
        <div className="relative">
          {recipe.imageUrl ? (
            <div className="relative h-64 md:h-80 bg-cream-dark">
              <img
                src={recipe.imageUrl}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent" />
            </div>
          ) : (
            <div className="h-32 bg-gradient-to-br from-terracotta-100 to-olive-100 flex items-center justify-center">
              <Utensils className="w-16 h-16 text-terracotta-300" />
            </div>
          )}

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">
              {recipe.title}
            </h2>
            {recipe.author && (
              <p className="text-white/80 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                {recipe.author}
              </p>
            )}
          </div>
        </div>

        {/* Meta info and actions */}
        <div className="p-6">
          {recipe.description && (
            <p className="text-charcoal/80 mb-4 leading-relaxed">
              {recipe.description}
            </p>
          )}

          {/* Meta badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            {recipe.meta.prepTime && (
              <MetaBadge
                icon={Timer}
                label={isHeb ? 'הכנה' : 'Prep'}
                value={formatTime(recipe.meta.prepTime)}
                variant="terracotta"
              />
            )}
            {recipe.meta.cookTime && (
              <MetaBadge
                icon={Flame}
                label={isHeb ? 'בישול' : 'Cook'}
                value={formatTime(recipe.meta.cookTime)}
                variant="olive"
              />
            )}
            {recipe.meta.totalTime && (
              <MetaBadge
                icon={Clock}
                label={isHeb ? 'סה"כ' : 'Total'}
                value={formatTime(recipe.meta.totalTime)}
                variant="honey"
              />
            )}
            {recipe.meta.servings && (
              <MetaBadge
                icon={Users}
                label={isHeb ? 'מנות' : 'Servings'}
                value={String(recipe.meta.servings)}
                variant="terracotta"
              />
            )}
            {recipe.meta.difficulty !== 'unknown' && (
              <MetaBadge
                icon={Sparkles}
                label={isHeb ? 'רמה' : 'Level'}
                value={getDifficultyLabel(recipe.meta.difficulty, isHeb)}
                variant="olive"
              />
            )}
          </div>

          {/* Kashrut and dietary tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {/* Kashrut badge */}
            {recipe.kashrut && recipe.kashrut !== 'unknown' && (
              <span
                className={clsx(
                  "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium",
                  recipe.kashrut === 'parve' && "bg-green-100 text-green-700",
                  recipe.kashrut === 'dairy' && "bg-blue-100 text-blue-700",
                  recipe.kashrut === 'meat' && "bg-red-100 text-red-700",
                  recipe.kashrut === 'not_kosher' && "bg-gray-100 text-gray-700",
                )}
              >
                {recipe.kashrut === 'parve' && (isHeb ? 'פרווה' : 'Parve')}
                {recipe.kashrut === 'dairy' && (isHeb ? 'חלבי' : 'Dairy')}
                {recipe.kashrut === 'meat' && (isHeb ? 'בשרי' : 'Meat')}
                {recipe.kashrut === 'not_kosher' && (isHeb ? 'לא כשר' : 'Not Kosher')}
              </span>
            )}

            {/* Dietary tags */}
            {recipe.meta.dietary.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-olive-100 text-olive-700 text-xs font-medium"
              >
                <Leaf className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-cream-dark">
            {/* Cooking Mode Button - Primary CTA */}
            {recipe.id && (
              <CookingModeButton recipeId={recipe.id} isHebrew={isHeb} />
            )}

            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cream-dark hover:bg-terracotta-100 text-charcoal transition-colors text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              {isHeb ? 'מקור' : 'Source'}
            </a>
            <button
              onClick={handleCopyJson}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cream-dark hover:bg-olive-100 text-charcoal transition-colors text-sm font-medium"
            >
              {copied ? <Check className="w-4 h-4 text-olive-600" /> : <Copy className="w-4 h-4" />}
              {copied ? (isHeb ? 'הועתק!' : 'Copied!') : 'JSON'}
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cream-dark hover:bg-honey-100 text-charcoal transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              {isHeb ? 'הורדה' : 'Download'}
            </button>

            {/* Confidence indicator */}
            <div className="ml-auto text-xs text-charcoal/50 flex items-center gap-2">
              <span className={clsx(
                "px-2 py-0.5 rounded-full",
                recipe.extractionMethod === 'json-ld' ? "bg-olive-100 text-olive-700" :
                recipe.extractionMethod === 'llm' ? "bg-terracotta-100 text-terracotta-700" :
                "bg-honey-100 text-honey-700"
              )}>
                {recipe.extractionMethod.toUpperCase()}
              </span>
              <span>{Math.round(recipe.confidence * 100)}% confident</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two column layout for ingredients and steps */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Ingredients column */}
        <div className="lg:col-span-2">
          <div className="paper-card p-6 animate-fade-in animation-delay-200">
            <h3 className="font-display text-xl font-bold text-charcoal mb-4 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-terracotta-500" />
              {isHeb ? 'מרכיבים' : 'Ingredients'}
              <span className="text-sm font-normal text-charcoal/50 mr-auto">
                ({recipe.ingredients.length})
              </span>
            </h3>
            <div className="divide-y divide-cream-dark/50">
              {recipe.ingredients.map((ingredient, index) => (
                <IngredientItem
                  key={index}
                  ingredient={ingredient}
                  isHeb={isHeb}
                  index={index}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Steps column */}
        <div className="lg:col-span-3">
          <div className="paper-card p-6 animate-fade-in animation-delay-300">
            <h3 className="font-display text-xl font-bold text-charcoal mb-6 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-olive-500" />
              {isHeb ? 'הוראות הכנה' : 'Instructions'}
              <span className="text-sm font-normal text-charcoal/50 mr-auto">
                ({recipe.steps.length} {isHeb ? 'שלבים' : 'steps'})
              </span>
            </h3>
            <div className="space-y-0">
              {recipe.steps.map((step, index) => (
                <StepItem
                  key={index}
                  step={step}
                  index={index}
                  isHeb={isHeb}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Nutrition panel */}
      {recipe.nutrition && (
        <NutritionPanel nutrition={recipe.nutrition} isHeb={isHeb} />
      )}

      {/* Tips section */}
      <TipsSection tips={recipe.tips} isHeb={isHeb} />
    </div>
  );
}
