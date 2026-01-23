'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { Trophy, Star, ChefHat, PartyPopper, Share2, Home, Sparkles } from 'lucide-react';
import type { Achievement } from '@/schemas/cooking-mode';

interface CookingCompleteProps {
  recipeTitle: string;
  totalSteps: number;
  totalMicroSteps: number;
  cookingTimeMinutes: number;
  achievements: Achievement[];
  isHebrew: boolean;
}

// Confetti colors matching the theme
const CONFETTI_COLORS = ['#C45C26', '#4A5D23', '#E8A838', '#F5A385', '#A6B97F'];

export function CookingComplete({
  recipeTitle,
  totalSteps,
  totalMicroSteps,
  cookingTimeMinutes,
  achievements,
  isHebrew,
}: CookingCompleteProps) {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(true);
  const [statsVisible, setStatsVisible] = useState(false);

  // Stagger animations
  useEffect(() => {
    const timer = setTimeout(() => setStatsVisible(true), 500);
    const confettiTimer = setTimeout(() => setShowConfetti(false), 5000);
    return () => {
      clearTimeout(timer);
      clearTimeout(confettiTimer);
    };
  }, []);

  // Handle share
  const handleShare = async () => {
    const shareData = {
      title: isHebrew ? `סיימתי להכין ${recipeTitle}!` : `I just made ${recipeTitle}!`,
      text: isHebrew
        ? `השלמתי ${totalSteps} שלבים ב-${cookingTimeMinutes} דקות`
        : `Completed ${totalSteps} steps in ${cookingTimeMinutes} minutes`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}`);
        alert(isHebrew ? 'הועתק!' : 'Copied to clipboard!');
      }
    } catch {
      // User cancelled or error
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-b from-cream to-cream-dark overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 50 }).map((_, idx) => (
            <div
              key={idx}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-5%',
                backgroundColor: CONFETTI_COLORS[idx % CONFETTI_COLORS.length],
                width: `${8 + Math.random() * 8}px`,
                height: `${8 + Math.random() * 8}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="paper-card p-8 md:p-12 max-w-lg w-full text-center animate-scale-in">
        {/* Trophy icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-honey-300 to-honey-500 flex items-center justify-center shadow-xl animate-float">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <PartyPopper className="absolute -top-2 -right-2 w-8 h-8 text-terracotta-400 animate-bounce" />
          <Sparkles className="absolute -bottom-2 -left-2 w-8 h-8 text-olive-400 animate-pulse" />
        </div>

        {/* Title */}
        <h1 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-2">
          {isHebrew ? '!בתיאבון' : 'Bon Appetit!'}
        </h1>
        <p className="text-charcoal/60 mb-6" dir={isHebrew ? 'rtl' : 'ltr'}>
          {isHebrew ? `סיימת להכין ${recipeTitle}` : `You've completed ${recipeTitle}`}
        </p>

        {/* Stats */}
        <div
          className={clsx(
            'grid grid-cols-3 gap-4 mb-8 transition-all duration-500',
            statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <div className="text-center p-4 bg-terracotta-50 rounded-xl">
            <ChefHat className="w-6 h-6 text-terracotta-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-terracotta-600">{totalSteps}</p>
            <p className="text-xs text-terracotta-500">
              {isHebrew ? 'שלבים' : 'Steps'}
            </p>
          </div>
          <div className="text-center p-4 bg-olive-50 rounded-xl">
            <Star className="w-6 h-6 text-olive-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-olive-600">{totalMicroSteps}</p>
            <p className="text-xs text-olive-500">
              {isHebrew ? 'פעולות' : 'Actions'}
            </p>
          </div>
          <div className="text-center p-4 bg-honey-50 rounded-xl">
            <Trophy className="w-6 h-6 text-honey-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-honey-600">{cookingTimeMinutes}</p>
            <p className="text-xs text-honey-500">
              {isHebrew ? 'דקות' : 'Minutes'}
            </p>
          </div>
        </div>

        {/* Achievements earned */}
        {achievements.length > 0 && (
          <div className="mb-8">
            <h3 className="font-display text-lg font-bold text-charcoal mb-3">
              {isHebrew ? 'הישגים שנפתחו' : 'Achievements Unlocked'}
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {achievements.map((achievement) => (
                <span
                  key={achievement.id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-honey-100 text-honey-700 text-sm font-medium animate-achievement"
                >
                  <Star className="w-4 h-4" />
                  {isHebrew
                    ? achievement.titleHe || achievement.title
                    : achievement.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cream-dark hover:bg-terracotta-100 text-charcoal font-bold transition-colors"
          >
            <Home className="w-5 h-5" />
            {isHebrew ? 'חזרה' : 'Home'}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold transition-colors"
          >
            <Share2 className="w-5 h-5" />
            {isHebrew ? 'שתף' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
}
