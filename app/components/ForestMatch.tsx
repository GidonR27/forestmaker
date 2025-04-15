'use client';

import { Forest } from '../data/forests';

interface ForestMatchProps {
  forest: Forest | null;
}

export default function ForestMatch({ forest }: ForestMatchProps) {
  return (
    <div className="text-center flex flex-col justify-start">
      {!forest ? (
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-white/90">Forest Maker</h2>
          <p className="text-sm md:text-base text-white/70">
            Turn your phone's sound ON. Tap sounds and use sliders to create your perfect forest atmosphere.
          </p>
        </div>
      ) : (
        <>
          <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-white/90">{forest.name}</h2>
          <p className="text-sm md:text-base text-white/70 mb-2 md:mb-3">{forest.location}</p>
          <div className="flex flex-wrap justify-center gap-1 md:gap-2">
            {forest.vibe.split(',').map((word, index) => (
              <span
                key={index}
                className="px-3 md:px-3 py-1.5 md:py-1 rounded-full text-[10px] md:text-sm font-medium bg-black/10 backdrop-blur-md text-white border border-white/20 shadow-lg shadow-black/5 touch-manipulation"
              >
                {word.trim()}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 