'use client';

import { Lightbulb } from 'lucide-react';

interface TipsSectionProps {
  tips: string[];
  isHeb: boolean;
}

export default function TipsSection({ tips, isHeb }: TipsSectionProps) {
  if (!tips.length) return null;

  return (
    <div className="paper-card p-6 bg-honey-50/50 animate-fade-in animation-delay-600">
      <h3 className="font-display text-lg font-bold text-charcoal mb-4 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-honey-500" />
        {isHeb ? 'טיפים' : 'Tips'}
      </h3>
      <ul className="space-y-2" dir={isHeb ? 'rtl' : 'ltr'}>
        {tips.map((tip, index) => (
          <li key={index} className="flex items-start gap-2 text-charcoal/80">
            <span className="text-honey-500 mt-1">*</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
