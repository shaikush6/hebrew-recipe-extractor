'use client';

import { Scale } from 'lucide-react';
import { Nutrition } from '@/types/recipe';

interface NutritionPanelProps {
  nutrition: Nutrition;
  isHeb: boolean;
}

export default function NutritionPanel({ nutrition, isHeb }: NutritionPanelProps) {
  const items = [
    { label: isHeb ? 'קלוריות' : 'Calories', value: nutrition.calories, unit: 'kcal' },
    { label: isHeb ? 'חלבון' : 'Protein', value: nutrition.protein, unit: 'g' },
    { label: isHeb ? 'פחמימות' : 'Carbs', value: nutrition.carbohydrates, unit: 'g' },
    { label: isHeb ? 'שומן' : 'Fat', value: nutrition.fat, unit: 'g' },
    { label: isHeb ? 'סיבים' : 'Fiber', value: nutrition.fiber, unit: 'g' },
  ].filter(item => item.value !== null);

  if (items.length === 0) return null;

  return (
    <div className="paper-card p-6 animate-fade-in animation-delay-500">
      <h3 className="font-display text-lg font-bold text-charcoal mb-4 flex items-center gap-2">
        <Scale className="w-5 h-5 text-olive-500" />
        {isHeb ? 'ערכים תזונתיים' : 'Nutrition Facts'}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {items.map((item) => (
          <div key={item.label} className="text-center p-3 bg-cream-dark/50 rounded-lg">
            <div className="text-2xl font-bold text-terracotta-600">
              {item.value}
              <span className="text-sm font-normal text-charcoal/60">{item.unit}</span>
            </div>
            <div className="text-xs text-charcoal/70 mt-1">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
