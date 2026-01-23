'use client';

interface StepItemProps {
  step: string;
  index: number;
  isHeb: boolean;
}

export default function StepItem({
  step,
  index,
  isHeb,
}: StepItemProps) {
  return (
    <div
      className="flex gap-4 animate-slide-up opacity-0"
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
      dir={isHeb ? 'rtl' : 'ltr'}
    >
      <div className="flex-shrink-0">
        <div className="step-number">{index + 1}</div>
        {/* Connecting line */}
        <div className="w-0.5 h-full bg-terracotta-200 mx-auto mt-2" />
      </div>
      <div className="flex-1 pb-8">
        <p className="text-charcoal leading-relaxed">{step}</p>
      </div>
    </div>
  );
}
