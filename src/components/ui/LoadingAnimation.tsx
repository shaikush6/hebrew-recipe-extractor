'use client';

import { Loader2 } from 'lucide-react';

export default function LoadingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative w-24 h-24 mb-8">
        {/* Pot */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-14 bg-terracotta-500 rounded-b-3xl rounded-t-lg shadow-lg">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-terracotta-600 rounded-full" />
          {/* Handle */}
          <div className="absolute top-1 -right-4 w-4 h-6 bg-terracotta-700 rounded-r-full" />
        </div>
        {/* Steam */}
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-2">
          <div className="steam w-2 h-6 bg-gradient-to-t from-cream/60 to-transparent rounded-full" />
          <div className="steam w-2 h-8 bg-gradient-to-t from-cream/60 to-transparent rounded-full" />
          <div className="steam w-2 h-5 bg-gradient-to-t from-cream/60 to-transparent rounded-full" />
        </div>
      </div>
      <div className="flex items-center gap-2 text-terracotta-600">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="font-medium">Extracting recipe...</span>
      </div>
      <p className="text-charcoal/60 text-sm mt-2">This may take a moment for complex pages</p>
    </div>
  );
}
