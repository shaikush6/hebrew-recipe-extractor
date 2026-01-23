'use client';

import { useState, useMemo } from 'react';
import { Check, Leaf, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import { Ingredient } from '@/types/recipe';
import { formatUnit } from '@/lib/format';
import { getSeasonalInfo } from '@/data/seasonal-produce';
import { findDiasporaInfo, getRegionalSubstitutes } from '@/data/diaspora-ingredients';

interface IngredientItemProps {
  ingredient: Ingredient;
  isHeb: boolean;
  index: number;
  showSeasonalInfo?: boolean;
  showDiasporaInfo?: boolean;
}

export default function IngredientItem({
  ingredient,
  isHeb,
  index,
  showSeasonalInfo = true,
  showDiasporaInfo = true,
}: IngredientItemProps) {
  const [checked, setChecked] = useState(false);
  const [showDiasporaTips, setShowDiasporaTips] = useState(false);

  // Get seasonal and diaspora info
  const seasonalInfo = useMemo(
    () => showSeasonalInfo ? getSeasonalInfo(ingredient.item) : null,
    [ingredient.item, showSeasonalInfo]
  );

  const diasporaInfo = useMemo(
    () => showDiasporaInfo ? findDiasporaInfo(ingredient.item) : null,
    [ingredient.item, showDiasporaInfo]
  );

  const generalSubstitute = diasporaInfo
    ? getRegionalSubstitutes(ingredient.item, 'general')
    : null;

  const toggleText = checked
    ? (isHeb ? 'הסר סימון מ' : 'Uncheck ')
    : (isHeb ? 'סמן את ' : 'Check ');

  return (
    <div
      className={clsx(
        "flex flex-col gap-2 py-3 px-4 rounded-lg transition-all duration-200 animate-slide-up opacity-0",
        checked ? "bg-olive-50/50" : "hover:bg-cream-dark/50"
      )}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
      dir={isHeb ? 'rtl' : 'ltr'}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => setChecked(!checked)}
          aria-pressed={checked}
          aria-label={`${toggleText}${ingredient.item}`}
          className={clsx(
            "ingredient-checkbox flex-shrink-0 mt-0.5",
            checked && "checked"
          )}
        >
          {checked && <Check className="w-3 h-3 text-white" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className={clsx(
            "flex items-baseline gap-2 flex-wrap",
            checked && "line-through text-charcoal/50"
          )}>
            {ingredient.quantity && (
              <span className="font-bold text-terracotta-600">
                {ingredient.quantity}
              </span>
            )}
            {ingredient.unit && (
              <span className="text-olive-600 font-medium">
                {formatUnit(ingredient.unit, isHeb)}
              </span>
            )}
            <span className="text-charcoal font-medium">
              {ingredient.item}
            </span>

            {/* Seasonal indicator */}
            {seasonalInfo && seasonalInfo.produce && (
              <span
                className={clsx(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                  seasonalInfo.inSeason
                    ? "bg-olive-100 text-olive-700"
                    : "bg-amber-100 text-amber-700"
                )}
                title={seasonalInfo.inSeason
                  ? (isHeb ? 'בעונה' : 'In season')
                  : (isHeb ? `לא בעונה - תחליפים: ${seasonalInfo.substitutes?.join(', ')}` : `Off season - substitutes: ${seasonalInfo.substitutes?.join(', ')}`)}
              >
                <Leaf className="w-3 h-3" />
                {seasonalInfo.inSeason
                  ? (isHeb ? 'בעונה' : 'In season')
                  : (isHeb ? 'לא בעונה' : 'Off season')}
              </span>
            )}

            {/* Diaspora tip indicator */}
            {diasporaInfo && (
              <button
                onClick={() => setShowDiasporaTips(!showDiasporaTips)}
                className={clsx(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors",
                  "bg-blue-100 text-blue-700 hover:bg-blue-200"
                )}
                aria-expanded={showDiasporaTips}
                aria-label={isHeb ? 'טיפים לגולים' : 'Diaspora tips'}
              >
                <Globe className="w-3 h-3" />
                {isHeb ? 'טיפים לגולים' : 'Abroad?'}
                {showDiasporaTips ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
          {ingredient.comments && (
            <p className={clsx(
              "text-sm text-charcoal/60 mt-0.5",
              checked && "line-through"
            )}>
              {ingredient.comments}
            </p>
          )}
        </div>
      </div>

      {/* Diaspora tips expansion */}
      {showDiasporaTips && diasporaInfo && (
        <div
          className="mr-8 ml-8 p-3 bg-blue-50 rounded-lg text-sm animate-in slide-in-from-top-2 duration-200"
          role="region"
          aria-label={isHeb ? 'טיפים למציאת המוצר בחו״ל' : 'Tips for finding this ingredient abroad'}
        >
          <p className="text-blue-800 font-medium mb-1">
            {diasporaInfo.description}
          </p>
          {generalSubstitute && (
            <div className="space-y-1 text-blue-700">
              <p>
                <strong>{isHeb ? 'תחליף:' : 'Substitute:'}</strong> {generalSubstitute.substitute}
              </p>
              {generalSubstitute.whereToFind && (
                <p>
                  <strong>{isHeb ? 'איפה למצוא:' : 'Where to find:'}</strong> {generalSubstitute.whereToFind}
                </p>
              )}
              {generalSubstitute.notes && (
                <p className="text-blue-600 italic">
                  {generalSubstitute.notes}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
