'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { Check, Timer, Lightbulb, ArrowRight } from 'lucide-react';
import type { MicroStep, CookingStepGroup } from '@/schemas/cooking-mode';

interface CookingStepCardProps {
  stepGroup: CookingStepGroup;
  currentMicroStepIndex: number;
  onMicroStepComplete: (microStepId: string) => void;
  onStartTimer: (durationSeconds: number, label: string) => void;
  completedMicroSteps: Set<string>;
  isHebrew: boolean;
}

// Unit display helper
const UNIT_DISPLAY: Record<string, { en: string; he: string }> = {
  cup: { en: 'cup', he: 'כוס' },
  tbsp: { en: 'tbsp', he: 'כף' },
  tsp: { en: 'tsp', he: 'כפית' },
  g: { en: 'g', he: 'גרם' },
  kg: { en: 'kg', he: 'ק"ג' },
  ml: { en: 'ml', he: 'מ"ל' },
  l: { en: 'l', he: 'ליטר' },
  piece: { en: 'pc', he: 'יח\'' },
};

function formatUnit(unit: string | null, isHebrew: boolean): string {
  if (!unit) return '';
  return UNIT_DISPLAY[unit]?.[isHebrew ? 'he' : 'en'] || unit;
}

export function CookingStepCard({
  stepGroup,
  currentMicroStepIndex,
  onMicroStepComplete,
  onStartTimer,
  completedMicroSteps,
  isHebrew,
}: CookingStepCardProps) {
  const currentMicroStep = stepGroup.microSteps[currentMicroStepIndex];
  const [isAnimating, setIsAnimating] = useState(false);

  if (!currentMicroStep) return null;

  const handleComplete = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onMicroStepComplete(currentMicroStep.id);
      setIsAnimating(false);
    }, 300);
  };

  const actionText = isHebrew
    ? currentMicroStep.actionHe || currentMicroStep.action
    : currentMicroStep.action;

  const tipText = currentMicroStep.tip
    ? isHebrew
      ? currentMicroStep.tipHe || currentMicroStep.tip
      : currentMicroStep.tip
    : null;

  return (
    <div
      className={clsx(
        'flex-1 flex flex-col p-6 md:p-8',
        'transition-all duration-300',
        isAnimating && 'scale-95 opacity-50'
      )}
      dir={isHebrew ? 'rtl' : 'ltr'}
    >
      {/* Step group title */}
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-terracotta-100 text-terracotta-700 text-sm font-medium">
          {isHebrew ? stepGroup.titleHe || stepGroup.title : stepGroup.title}
        </span>
      </div>

      {/* Main action card */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
        <div className="w-full paper-card p-8 md:p-12 text-center animate-scale-in">
          {/* Action text - large and readable */}
          <h2 className="font-display text-2xl md:text-4xl font-bold text-charcoal mb-6 leading-relaxed">
            {actionText}
          </h2>

          {/* Ingredients for this step */}
          {currentMicroStep.ingredients.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {currentMicroStep.ingredients.map((ing, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-olive-100 text-olive-700 text-sm font-medium"
                >
                  {ing.quantity && (
                    <span className="font-bold">{ing.quantity}</span>
                  )}
                  {ing.unit && <span>{formatUnit(ing.unit, isHebrew)}</span>}
                  <span>{ing.item}</span>
                </span>
              ))}
            </div>
          )}

          {/* Timer button if applicable */}
          {currentMicroStep.timer && (
            <button
              onClick={() =>
                onStartTimer(
                  currentMicroStep.timer!.durationSeconds,
                  currentMicroStep.timer!.label
                )
              }
              className={clsx(
                'inline-flex items-center gap-2 px-6 py-3 rounded-xl mb-6',
                'bg-honey-100 text-honey-700 font-bold text-lg',
                'hover:bg-honey-200 transition-colors',
                'border-2 border-honey-300'
              )}
            >
              <Timer className="w-6 h-6" />
              <span>
                {Math.floor(currentMicroStep.timer.durationSeconds / 60)}{' '}
                {isHebrew ? 'דקות' : 'min'}
              </span>
              <span className="text-honey-500">
                ({isHebrew
                  ? currentMicroStep.timer.labelHe || currentMicroStep.timer.label
                  : currentMicroStep.timer.label})
              </span>
            </button>
          )}

          {/* Tip if available */}
          {tipText && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-honey-50 border border-honey-200 text-right mb-6">
              <Lightbulb className="w-5 h-5 text-honey-500 flex-shrink-0 mt-0.5" />
              <p className="text-charcoal/80 text-sm">{tipText}</p>
            </div>
          )}

          {/* Complete button - large touch target */}
          <button
            onClick={handleComplete}
            className={clsx(
              'w-full max-w-md mx-auto flex items-center justify-center gap-3',
              'px-8 py-5 rounded-2xl font-bold text-xl',
              'bg-gradient-to-r from-olive-500 to-olive-600',
              'text-white shadow-xl',
              'transform transition-all duration-200',
              'hover:scale-105 active:scale-95',
              'focus:outline-none focus:ring-4 focus:ring-olive-300'
            )}
          >
            <Check className="w-7 h-7" />
            <span>{isHebrew ? 'סיימתי!' : 'Done!'}</span>
            <ArrowRight className={clsx('w-6 h-6', isHebrew && 'rotate-180')} />
          </button>
        </div>
      </div>

      {/* Micro-step indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {stepGroup.microSteps.map((ms, idx) => (
          <div
            key={ms.id}
            className={clsx(
              'w-3 h-3 rounded-full transition-all duration-300',
              completedMicroSteps.has(ms.id)
                ? 'bg-olive-500 scale-110'
                : idx === currentMicroStepIndex
                ? 'bg-terracotta-500 scale-125'
                : 'bg-charcoal/20'
            )}
          />
        ))}
      </div>

      {/* Milestone preview */}
      {stepGroup.milestone && (
        <p className="text-center text-sm text-charcoal/50 mt-4">
          {isHebrew ? 'בסיום:' : 'Goal:'}{' '}
          <span className="font-medium">
            {isHebrew ? stepGroup.milestoneHe || stepGroup.milestone : stepGroup.milestone}
          </span>
        </p>
      )}
    </div>
  );
}
