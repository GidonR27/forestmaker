'use client';

import { useRef, useEffect, useState } from 'react';
import { SoundType } from '../utils/forestMatcher';

interface VisualEffectsProps {
  activeSounds: Set<SoundType>;
  soundValues: Record<SoundType, number>;
}

export default function VisualEffects({ activeSounds, soundValues }: VisualEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(Date.now());
  
  // For debug logs
  const prevActiveSoundsRef = useRef<Set<SoundType>>(new Set());
  const frameCountRef = useRef<number>(0);
  const logIntervalRef = useRef<number>(100); // Log every 100 frames
  
  // Refs to track state without triggering effect reruns
  const particlesRef = useRef<any>(null);
  const nextTriggersRef = useRef<any>(null);
  const flashAlphaRef = useRef<number>(0);
  
  // Refs for visual effects continuity
  const activeVisualsRef = useRef<Set<SoundType>>(new Set()); // Track currently active visuals
  const lastSoundValuesRef = useRef<Record<string, number>>({}); // Track last sound intensity values
  
  // Refs for mammal eye delay logic
  const lastEyePositionTimeRef = useRef<number>(0);
  const needsDelayNextCycleRef = useRef<boolean>(false);
  
  // Initialize particle collections
  const [particles, setParticles] = useState({
    windParticles: [] as { x: number; y: number; speed: number; radius: number }[],
    raindrops: [] as { x: number; y: number; speed: number; length: number }[],
    ripples: [] as { x: number; y: number; radius: number; alpha: number }[],
    birds: [] as { x: number; y: number; dx: number; dy: number }[],
    fireflies: [] as { x: number; y: number; alpha: number; timer: number; pulseInterval: number }[],
    rustles: [] as { x: number; y: number; timer: number; nextAt: number; active: boolean }[],
    embers: [] as { x: number; y: number; speed: number; size: number; color: string }[],
    ambientWaves: [] as { x: number; y: number; amplitude: number; speed: number; offset: number }[],
    pulseRings: [] as { x: number; y: number; radius: number; alpha: number }[],
    lightSpots: [] as { x: number; y: number; size: number; speed: number; alpha: number }[],
    lightningBolts: [] as Array<{ 
      segments: Array<{ x1: number; y1: number; x2: number; y2: number }>;
      width: number;
      alpha: number;
      lifespan: number;
      delay?: number;
    }>,
    localFlashes: [] as { x: number; y: number; radius: number; alpha: number; delay?: number }[],
    animalShadows: [] as { 
      x: number; 
      y: number; 
      width: number;
      height: number;
      opacity: number;
      velocityX: number;
      active: boolean;
      glimpseTimer: number;
      glimpseType: string;
      fadeDirection?: number;
    }[],
    eyePairs: [] as { opacity: number; blinkTimer: number; size?: number; height?: number }[],
    activeEyePositions: [] as { x: number; y: number }[],
    lastEyePositionChange: 0,
    eyeFadeTimestamp: 0,
    thunderFlashLeft: false,
    thunderZigzag: [] as Array<{x: number, y: number}>,
    // Track active sound priorities
    activationTimestamps: {} as Record<string, number>,
    visualPriorities: [] as SoundType[],
    fireLastRendered: false,
    nextEyeReturnDelay: 0, // Add a delay timestamp for when eyes should return
  });
  
  // Next trigger times for events
  const [nextTriggers, setNextTriggers] = useState({
    nextThunder: Date.now(),
    nextWaterRipple: Date.now(),
    nextRustle: Date.now(),
    nextPulseRing: Date.now(),
    nextMammalEyes: Date.now() // Add a trigger for mammal eyes
  });
  
  // Flash alpha for thunder
  const [flashAlpha, setFlashAlpha] = useState(0);

  // Helper function for random values
  const randomBetween = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };

  // Initialize particles based on canvas size - moved inside the resize handler
  useEffect(() => {
    // Skip initialization if there's already an animation running
    if (requestIdRef.current) {
      console.log('[DEBUG] Animation already running, only updating active sounds');
      
      // Update active sounds without restarting the animation
      activeVisualsRef.current = new Set(activeSounds);
      
      // Update last sound values
      Object.keys(soundValues).forEach(key => {
        lastSoundValuesRef.current[key as SoundType] = soundValues[key as SoundType];
      });
      
      return;
    }

    if (!canvasRef.current) return;
    console.log('[DEBUG] Starting animation loop');

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Track if we've initialized particles with proper dimensions
    let hasInitializedWithProperSize = false;
    // Specifically track mammal eyes initialization to prevent multiple initializations
    let hasMammalEyesInitialized = false;
    // Keep track of the initial eye positions to prevent jumping
    let initialEyePositions: { x: number; y: number }[] = [];
    
    // Preserve refs values across animation restarts
    if (lastEyePositionTimeRef.current === 0 && particlesRef.current?.lastEyePositionChange) {
      console.log('[DEBUG] Preserving eye position time ref from previous animation session');
      lastEyePositionTimeRef.current = Date.now() - 30000; // Set to a time that won't trigger immediate cycle
    }
    
    // Initialize all particles based on current dimensions
    const initializeParticles = (w: number, h: number) => {
      console.log(`[DEBUG] Initializing particles - Canvas display size: ${w}x${h}, DPR: ${window.devicePixelRatio || 1}`);
      
      // Only initialize if dimensions are reasonable (prevents tiny initial sizes)
      if (w < 200 || h < 200) {
        console.log(`[DEBUG] Canvas too small for initialization: ${w}x${h}, will try again later`);
        return false; // Failed to initialize with proper dimensions
      }
      
      // Preserve existing particles for continuous visuals if they exist
      const existingParticles = particlesRef.current;
      const preserveExisting = !!existingParticles;
      
      // Get list of sounds that should preserve their visuals
      const soundsToPreserve = preserveExisting ? 
        Array.from(activeVisualsRef.current).filter(sound => activeSounds.has(sound)) : [];
      
      if (preserveExisting && soundsToPreserve.length > 0) {
        console.log(`[DEBUG] Preserving visuals for: ${soundsToPreserve.join(', ')}`);
      }
      
      // Reset all particles with increased quantities and sizes
      const newParticles = {
        // For wind particles, preserve them if wind is active
        windParticles: preserveExisting && soundsToPreserve.includes('wind') ? 
          existingParticles.windParticles.map((p: any) => ({...p})) : 
          Array.from({ length: 50 }, () => ({
            x: Math.random() * w,
            y: Math.random() * h * 0.7,
            speed: 0.4 + Math.random() * 0.5,
            radius: 1.5 + Math.random() * 3
          })),
        
        // For raindrops, preserve them if rain is active
        raindrops: preserveExisting && soundsToPreserve.includes('rain') ? 
          existingParticles.raindrops.map((p: any) => ({...p})) : 
          Array.from({ length: 100 }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            speed: 1.5 + Math.random() * 1.5,
            length: 15 + Math.random() * 15
          })),
        
        // For ripples, preserve if water is active, otherwise empty array
        ripples: preserveExisting && soundsToPreserve.includes('water') ? 
          existingParticles.ripples.map((p: any) => ({...p})) : [],
        
        // For birds, preserve if birds is active
        birds: preserveExisting && soundsToPreserve.includes('birds') ? 
          existingParticles.birds.map((p: any) => ({...p})) : 
          Array.from({ length: 8 }, () => ({
            x: randomBetween(-50, w),
            y: randomBetween(0, h * 0.3),
            dx: 0.8 + Math.random() * 0.7,
            dy: randomBetween(-0.3, 0.3)
          })),
        
        // For fireflies, preserve if insects is active
        fireflies: preserveExisting && soundsToPreserve.includes('insects') ? 
          existingParticles.fireflies.map((p: any) => ({...p})) : 
          Array.from({ length: 25 }, () => ({
            x: randomBetween(0, w),
            y: randomBetween(h * 0.4, h * 0.8),
            alpha: 0,
            timer: Math.random() * 7000,
            pulseInterval: randomBetween(2000, 5000)
          })),
        rustles: [
          { x: 50, y: randomBetween(h * 0.2, h * 0.5), timer: 0, nextAt: randomBetween(5000, 10000), active: false },
          { x: w - 100, y: randomBetween(h * 0.3, h * 0.5), timer: 0, nextAt: randomBetween(5000, 10000), active: false },
          { x: w/2 - 150, y: randomBetween(h * 0.2, h * 0.4), timer: 0, nextAt: randomBetween(5000, 10000), active: false },
          { x: w/2 + 100, y: randomBetween(h * 0.25, h * 0.45), timer: 0, nextAt: randomBetween(5000, 10000), active: false },
          { x: w/3, y: randomBetween(h * 0.2, h * 0.4), timer: 0, nextAt: randomBetween(5000, 10000), active: false }
        ],
        embers: Array.from({ length: 25 }, () => ({
          x: w / 2 + randomBetween(-50, 50),
          y: h - 50 + Math.random() * 20,
          speed: 0.5 + Math.random() * 0.8,
          size: 2 + Math.random() * 3,
          color: `rgba(${255}, ${150 + Math.floor(Math.random() * 105)}, ${50 + Math.floor(Math.random() * 50)}, ${0.5 + Math.random() * 0.5})`
        })),
        ambientWaves: Array.from({ length: 5 }, (_, i) => ({
          x: 0,
          y: h * 0.5 + (i - 2) * 30,
          amplitude: 10 + Math.random() * 10,
          speed: 0.03 + Math.random() * 0.02,
          offset: Math.random() * Math.PI * 2
        })),
        pulseRings: [],
        lightSpots: Array.from({ length: 20 }, () => ({
          x: randomBetween(w * 0.25, w * 0.75),
          y: randomBetween(h * 0.45, h * 0.85),
          size: randomBetween(2, 9),
          speed: randomBetween(0.05, 0.4),
          alpha: randomBetween(0.2, 0.4)
        })),
        lightningBolts: [],
        localFlashes: [],
        animalShadows: [
          { 
            x: w * 0.3, 
            y: h * 0.75, 
            width: randomBetween(80, 140),
            height: randomBetween(25, 45),
            opacity: 0.1,
            velocityX: randomBetween(-0.2, 0.2),
            active: true,
            glimpseTimer: 1000,
            glimpseType: 'eyes'
          },
          { 
            x: w * 0.6, 
            y: h * 0.8, 
            width: randomBetween(80, 140),
            height: randomBetween(25, 45),
            opacity: 0.1,
            velocityX: randomBetween(-0.2, 0.2),
            active: true,
            glimpseTimer: 1500,
            glimpseType: 'silhouette'
          },
          { 
            x: w * 0.8, 
            y: h * 0.7, 
            width: randomBetween(80, 140),
            height: randomBetween(25, 45),
            opacity: 0.1,
            velocityX: randomBetween(-0.2, 0.2),
            active: true,
            glimpseTimer: 500,
            glimpseType: 'movement'
          }
        ],
        eyePairs: [],
        activeEyePositions: [],
        lastEyePositionChange: 0,
        eyeFadeTimestamp: 0,
        thunderFlashLeft: false,
        thunderZigzag: [],
        // Track active sound priorities
        activationTimestamps: {},
        visualPriorities: [],
        fireLastRendered: false,
        nextEyeReturnDelay: 0, // Restore preserved delay if it exists
      };
      
      // Update state and ref
      setParticles(newParticles);
      particlesRef.current = newParticles;
      
      // Set nextTriggers to prevent null reference errors
      setNextTriggers({
        nextThunder: Date.now() + 1000,
        nextWaterRipple: Date.now() + randomBetween(2000, 4000),
        nextRustle: Date.now() + randomBetween(5000, 10000),
        nextPulseRing: Date.now() + randomBetween(4000, 8000),
        nextMammalEyes: Date.now() // Initialize mammal eyes trigger
      });
      
      console.log(`[DEBUG] Particles initialized successfully with dimensions ${w}x${h}`);
      return true;
    };

    // Set canvas to match parent dimensions with proper DPR handling
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      console.log(`[DEBUG] Device pixel ratio: ${dpr}`);
      
      // First set canvas dimensions based on parent or window
      const parentRect = canvas.parentElement?.getBoundingClientRect();
      if (parentRect) {
        // Set the display size (css pixels)
        canvas.style.width = `${parentRect.width}px`;
        canvas.style.height = `${parentRect.height}px`;
        
        // Set the actual size in memory (scaled for DPR)
        canvas.width = Math.floor(parentRect.width * dpr);
        canvas.height = Math.floor(parentRect.height * dpr);
        
        console.log(`[DEBUG] Canvas size set to ${canvas.width}x${canvas.height} (display: ${parentRect.width}x${parentRect.height}, DPR: ${dpr})`);
        
        // Scale the context to ensure correct drawing operations
        ctx.scale(dpr, dpr);
        
        // When canvas is resized, re-initialize particles to use the new dimensions
        // Use display dimensions for calculations (not the DPR-scaled ones)
        const w = parentRect.width;
        const h = parentRect.height;
        
        // Initialize particles if this is the first time with proper dimensions
        if (!hasInitializedWithProperSize) {
          hasInitializedWithProperSize = initializeParticles(w, h);
        } else if (particlesRef.current) {
          // Update positions for eye pairs
          const eyePositions = [
            { x: w * 0.12, y: h * 0.55 },  // left upper
            { x: w * 0.08, y: h * 0.70 },  // left lower
            { x: w * 0.25, y: h * 0.65 },  // left-center 
            { x: w * 0.40, y: h * 0.75 },  // center-left
            { x: w * 0.60, y: h * 0.72 },  // center-right
            { x: w * 0.75, y: h * 0.60 },  // right-center
            { x: w * 0.92, y: h * 0.65 },  // right upper
            { x: w * 0.88, y: h * 0.80 }   // right lower
          ];
          
          // Update active eye positions if they exist
          if (particlesRef.current.activeEyePositions && particlesRef.current.activeEyePositions.length > 0) {
            // Instead of creating new random positions, scale the existing ones to the new dimensions
            // This prevents eyes from jumping to random positions
            const updatedPositions = particlesRef.current.activeEyePositions.map((pos: any) => {
              // If these are our initial positions that we've stored, use those coordinates
              if (initialEyePositions.length > 0 && hasMammalEyesInitialized) {
                const matchingInitialPos = initialEyePositions.find((initPos, idx) => 
                  idx === particlesRef.current.activeEyePositions.indexOf(pos));
                  
                if (matchingInitialPos) {
                  return {
                    x: matchingInitialPos.x * (w / (w || 1)),
                    y: matchingInitialPos.y * (h / (h || 1))
                  };
                }
              }
              
              // Scale existing position to new dimensions
              return {
                x: pos.x * (w / (w || 1)),
                y: pos.y * (h / (h || 1))
              };
            });
            
            setParticles(prev => ({
              ...prev,
              activeEyePositions: updatedPositions
            }));
            console.log(`[DEBUG] Updated eye positions after resize: ${updatedPositions.length} positions (maintained existing positions)`);
          }
          
          // Update animal shadows
          const updatedShadows = particlesRef.current.animalShadows.map((shadow: any) => ({
            ...shadow,
            x: w * (shadow.x / (w || 1)),
            y: h * (shadow.y / (h || 1))
          }));
          
          setParticles(prev => ({
            ...prev,
            animalShadows: updatedShadows
          }));
          
          // If the size changed dramatically, reinitialize all particles
          // BUT preserve mammal eye state
          if (Math.abs(w - (particlesRef.current.windParticles[0]?.x || 0)) > w * 0.5 ||
              Math.abs(h - (particlesRef.current.fireflies[0]?.y || 0)) > h * 0.5) {
            console.log(`[DEBUG] Canvas size changed significantly, reinitializing all particles`);
            // Store mammal eye state before reinitializing
            const preserveMammalState = {
              activeEyePositions: [...(particlesRef.current.activeEyePositions || [])],
              eyePairs: [...(particlesRef.current.eyePairs || [])],
              lastEyePositionChange: particlesRef.current.lastEyePositionChange,
              eyeFadeTimestamp: particlesRef.current.eyeFadeTimestamp,
              nextEyeReturnDelay: particlesRef.current.nextEyeReturnDelay
            };
            
            // Initialize particles
            const success = initializeParticles(w, h);
            
            // Restore mammal eye state if we had any
            if (success && hasMammalEyesInitialized && preserveMammalState.activeEyePositions.length > 0) {
              console.log('[DEBUG] Restoring mammal eye state after reinitialization');
              setParticles(prev => ({
                ...prev,
                activeEyePositions: preserveMammalState.activeEyePositions,
                eyePairs: preserveMammalState.eyePairs,
                lastEyePositionChange: preserveMammalState.lastEyePositionChange,
                eyeFadeTimestamp: preserveMammalState.eyeFadeTimestamp,
                nextEyeReturnDelay: preserveMammalState.nextEyeReturnDelay
              }));
            }
          }
          
          console.log(`[DEBUG] Updated particle positions after resize`);
        }
      } else {
        // Fallback to window dimensions if no parent
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
        
        console.log(`[DEBUG] Canvas fallback size: ${canvas.width}x${canvas.height} (window: ${window.innerWidth}x${window.innerHeight}, DPR: ${dpr})`);
        
        ctx.scale(dpr, dpr);
        
        // Initialize with window dimensions if not yet initialized
        if (!hasInitializedWithProperSize) {
          hasInitializedWithProperSize = initializeParticles(window.innerWidth, window.innerHeight);
        }
      }
    };

    // Initial resize
    resizeCanvas();
    
    // More robust approach: multiple resize attempts with increasing delays
    // This helps with various Vercel deployment scenarios
    const delayedResizes = [100, 500, 1000, 2000, 3000, 5000];
    delayedResizes.forEach((delay, index) => {
      setTimeout(() => {
        console.log(`[DEBUG] Delayed resize #${index + 1} after ${delay}ms`);
        
        // Keep track of mammal eye state before resize
        const preMammalEyeState = {
          hasMammalEyesInitialized: hasMammalEyesInitialized,
          initialEyePositions: [...initialEyePositions],
          eyeFadeTimestamp: particlesRef.current?.eyeFadeTimestamp || 0
        };
        
        resizeCanvas();
        
        // Restore mammal eye state after resize to ensure consistency
        hasMammalEyesInitialized = preMammalEyeState.hasMammalEyesInitialized;
        initialEyePositions = [...preMammalEyeState.initialEyePositions];
        
        // Force reinitialize particles on the last attempt if still not initialized with proper dimensions
        if (!hasInitializedWithProperSize && index === delayedResizes.length - 1) {
          console.log(`[DEBUG] Forcing particle initialization after all resize attempts`);
          const parentRect = canvas.parentElement?.getBoundingClientRect();
          if (parentRect && parentRect.width > 200 && parentRect.height > 200) {
            hasInitializedWithProperSize = initializeParticles(parentRect.width, parentRect.height);
          } else {
            hasInitializedWithProperSize = initializeParticles(window.innerWidth, window.innerHeight);
          }
        }
      }, delay);
    });

    // Add resize listener with debounce
    let resizeTimeout: number | null = null;
    const handleResize = () => {
      if (resizeTimeout) {
        window.clearTimeout(resizeTimeout);
      }
      resizeTimeout = window.setTimeout(() => {
        console.log('[DEBUG] Window resized - updating canvas');
        resizeCanvas();
      }, 100) as unknown as number;
    };
    
    window.addEventListener('resize', handleResize);

    const animate = () => {
      const now = Date.now();
      const deltaTime = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;
      
      // Max deltaTime to prevent huge jumps after tab becomes active again
      const dt = Math.min(deltaTime, 33) / 16; // Normalize for 60fps (16ms frame time)

      // Use display size (not the DPR-scaled size)
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      
      // Clear canvas with transparency for layering effect
      ctx.clearRect(0, 0, w, h);
      
      // Log framing timing periodically
      frameCountRef.current++;
      if (frameCountRef.current % logIntervalRef.current === 0) {
        console.log(`[DEBUG] Frame #${frameCountRef.current}, dt: ${dt.toFixed(2)}ms, canvas: ${w}x${h}`);
        
        // If particles not initialized with proper dimensions yet, try again
        if (!hasInitializedWithProperSize && w > 200 && h > 200) {
          console.log(`[DEBUG] Late initialization of particles in animation frame`);
          hasInitializedWithProperSize = initializeParticles(w, h);
        }
      }
      
      // Always use the latest props from refs instead of closure values
      const currentActiveSounds = activeVisualsRef.current;
      const currentSoundValues = lastSoundValuesRef.current;
      
      // Log when visuals are added or removed (only for debugging)
      if (frameCountRef.current % 100 === 0) {
        // Console logging for debugging only, can be removed in production
      }
      
      // Update all animations using ref values instead of direct state
      const currentParticles = particlesRef.current;
      const currentTriggers = nextTriggersRef.current;
      
      // 1. Wind effect
      if (currentActiveSounds.has('wind') && currentSoundValues.wind > 0) {
        const intensity = currentSoundValues.wind;
        
        // Debug info when wind is activated
        if (frameCountRef.current % 100 === 0) {
          console.log(`[DEBUG] Wind effect active: intensity=${intensity.toFixed(2)}, particles=${currentParticles.windParticles?.length || 0}`);
        }
        
        // If wind particles aren't initialized properly, recreate them
        if (!currentParticles.windParticles || currentParticles.windParticles.length === 0) {
          console.log('[DEBUG] Wind particles missing, initializing them now');
          
          // Create new wind particles
          const newWindParticles = Array.from({ length: 50 }, () => ({
            x: Math.random() * w,
            y: Math.random() * h * 0.7,
            speed: 0.4 + Math.random() * 0.5,
            radius: 1.5 + Math.random() * 3
          }));
          
          // Update particles ref directly to avoid rerendering
          currentParticles.windParticles = newWindParticles;
          
          // Also update state for future renders
          setParticles(prev => ({
            ...prev,
            windParticles: newWindParticles
          }));
          
          console.log(`[DEBUG] Created ${newWindParticles.length} new wind particles`);
        }
        
        // All sound types are treated equally
        ctx.globalAlpha = Math.min(0.5 * intensity, 0.6);  
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        currentParticles.windParticles.forEach(particle => {
          // Update position
          particle.x += particle.speed * intensity * dt;
          if (particle.x > w) particle.x = 0;
          
          // Draw particle with trail effect
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          ctx.fill();
          
          // Add subtle trail
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.beginPath();
          ctx.arc(particle.x - (particle.speed * intensity * dt * 2), particle.y, particle.radius * 0.7, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      
      // 2. Rain effect
      if (currentActiveSounds.has('rain') && currentSoundValues.rain > 0) {
        const intensity = currentSoundValues.rain;
        
        // If rain particles aren't initialized properly, recreate them
        if (!currentParticles.raindrops || currentParticles.raindrops.length === 0) {
          console.log('[DEBUG] Rain particles missing, initializing them now');
          
          // Create new rain particles
          const newRaindrops = Array.from({ length: 100 }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            speed: 1.5 + Math.random() * 1.5,
            length: 15 + Math.random() * 15
          }));
          
          // Update particles ref directly to avoid rerendering
          currentParticles.raindrops = newRaindrops;
          
          // Also update state for future renders
          setParticles(prev => ({
            ...prev,
            raindrops: newRaindrops
          }));
          
          console.log(`[DEBUG] Created ${newRaindrops.length} new raindrops`);
        }
        
        // All sound types are treated equally
        ctx.globalAlpha = Math.min(0.6 * intensity, 0.7);
        ctx.strokeStyle = 'rgba(220, 240, 255, 0.9)';
        ctx.lineWidth = 1.5;
        
        currentParticles.raindrops.forEach(drop => {
          // Update position
          drop.y += drop.speed * intensity * 2 * dt;
          if (drop.y > h) {
            drop.y = 0;
            drop.x = Math.random() * w;
          }
          
          // Draw raindrop with splash effect at the bottom
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x, drop.y + drop.length);
          ctx.stroke();
          
          // Add tiny splash effect for drops near the bottom
          if (drop.y > h - 30 && Math.random() > 0.9) {
            ctx.beginPath();
            ctx.arc(drop.x, h - 5, 2, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(220, 240, 255, 0.7)';
            ctx.stroke();
          }
        });
      }
      
      // 3. Thunder effect with zigzag-shaped flash
      if (currentActiveSounds.has('thunder') && currentSoundValues.thunder > 0) {
        const intensity = currentSoundValues.thunder;
        
        // All sound types are treated equally
        
        // Base trigger probability on intensity only
        const triggerProbability = 0.2 * intensity;
        
        // Check if it's time for a thunder flash
        if (now > currentTriggers.nextThunder && Math.random() < triggerProbability) {
          console.log(`[DEBUG] Thunder triggered - Intensity: ${intensity.toFixed(2)}`);
          
          // Create zigzag points for the flash shape with more pronounced zigzag
          const zigzagPoints = [];
          const zigzagSegments = 8;
          const segmentHeight = h / zigzagSegments;
          let direction = Math.random() > 0.5 ? 1 : -1; // Random initial direction
          
          // Random offset for the flash
          const centerOffset = w * (Math.random() * 0.5 - 0.25);
          
          // Generate more pronounced zigzag points down the screen
          for (let i = 0; i <= zigzagSegments; i++) {
            const y = i * segmentHeight;
            // More dramatic zigzag with larger lateral movement
            const x = w * 0.5 + centerOffset + (direction * w * randomBetween(0.1, 0.25));
            zigzagPoints.push({x, y});
            direction *= -1; // Flip direction each segment
          }
          
          // Determine which side the flash originates from
          const flashLeft = Math.random() > 0.5;
          
          // Create localized circular flashes near the zigzag
          const numFlashes = Math.floor(randomBetween(5, 10)) * intensity;
          const newFlashes = [];
          
          for (let j = 0; j < numFlashes; j++) {
            // Position flashes along the zigzag
            const pointIndex = Math.floor(Math.random() * zigzagPoints.length);
            const point = zigzagPoints[pointIndex];
            
            // Offset from zigzag point, biased toward the flashing side
            const xBias = flashLeft ? -0.1 : 0.1;
            const flashX = point.x + w * (xBias + randomBetween(-0.1, 0.1));
            const flashY = point.y + randomBetween(-h * 0.1, h * 0.1);
            
            newFlashes.push({
              x: flashX,
              y: flashY,
              radius: randomBetween(30, 100) * intensity,
              alpha: randomBetween(0.2, 0.6) * intensity,
              delay: randomBetween(0, 200)
            });
          }
          
          // Set the flash alpha directly (slightly higher for more impact)
          setFlashAlpha(0.4 * intensity);
          
          // Store the zigzag information
          setParticles(prev => ({
            ...prev,
            thunderFlashLeft: flashLeft,
            thunderZigzag: zigzagPoints,
            localFlashes: [...prev.localFlashes, ...newFlashes]
          }));
          
          setNextTriggers(prev => ({
            ...prev,
            nextThunder: now + randomBetween(3000, 8000) / intensity
          }));
        }
        
        // Draw zigzag-shaped thunder flash
        if (flashAlphaRef.current > 0) {
          // Give consistent weight to all thunder effects
          ctx.globalAlpha = flashAlphaRef.current;
          
          // Draw zigzag shaped flash if we have points
          if (currentParticles.thunderZigzag && currentParticles.thunderZigzag.length > 0) {
            // Create a zigzag flash path
            ctx.beginPath();
            
            const isLeftFlash = currentParticles.thunderFlashLeft;
            const zigzag = currentParticles.thunderZigzag;
            
            // Start at top-left or top-right corner
            ctx.moveTo(isLeftFlash ? 0 : w, 0);
            
            // Top edge to first zigzag point
            ctx.lineTo(zigzag[0].x, 0);
            
            // Draw edges along zigzag points
            for (let i = 0; i < zigzag.length - 1; i++) {
              // Create a control point between zigzag points for a curved effect
              const cpX = (zigzag[i].x + zigzag[i+1].x) / 2;
              const cpY = (zigzag[i].y + zigzag[i+1].y) / 2;
              
              // Add some randomness to the control point
              const randomOffsetX = w * randomBetween(-0.05, 0.05);
              
              // Draw a quadratic curve to the next point
              ctx.quadraticCurveTo(
                cpX + randomOffsetX, 
                cpY, 
                zigzag[i+1].x, 
                zigzag[i+1].y
              );
            }
            
            // Bottom edge from last zigzag point to corner
            ctx.lineTo(zigzag[zigzag.length-1].x, h);
            ctx.lineTo(isLeftFlash ? 0 : w, h);
            
            // Close the path
            ctx.closePath();
            
            // Add a glow effect
            ctx.shadowColor = 'rgba(190, 200, 255, 0.8)';
            ctx.shadowBlur = 30;
            
            // Fill the zigzag flash
            ctx.fill();
            
            // Reset shadow for other elements
            ctx.shadowBlur = 0;
          }
          
          // Gradually reduce flash alpha MORE SLOWLY
          const newFlashAlpha = Math.max(0, flashAlphaRef.current - 0.01 * dt); // Slower fade (0.02 -> 0.01)
          if (Math.abs(newFlashAlpha - flashAlphaRef.current) > 0.005) {
            setFlashAlpha(newFlashAlpha);
          }
        }
        
        // Draw the local flashes without the zigzag line
        if (currentParticles.localFlashes && currentParticles.localFlashes.length > 0) {
          const updatedFlashes = currentParticles.localFlashes.filter(flash => {
            if (flash.delay && flash.delay > 0) {
              flash.delay -= dt * 16;
              return true;
            }
            
            // Draw circular flash
            ctx.globalAlpha = flash.alpha;
            
            // Create radial gradient for each flash
            const gradient = ctx.createRadialGradient(
              flash.x, flash.y, 0,
              flash.x, flash.y, flash.radius
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(180, 200, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Decrease alpha
            flash.alpha -= 0.01 * dt;
            
            return flash.alpha > 0;
          });
          
          // Update flashes
          if (updatedFlashes.length !== currentParticles.localFlashes.length) {
            setParticles(prev => ({ ...prev, localFlashes: updatedFlashes }));
          }
        }
      }
      
      // 4. Water effect - SLOWER & BRIGHTER with RAINBOW HUE
      if (currentActiveSounds.has('water') && currentSoundValues.water > 0) {
        const intensity = currentSoundValues.water;
        
        // All sound types are treated equally
        
        // Debug logging
        if (frameCountRef.current % 300 === 0) {
          console.log(`[DEBUG] Water effect - intensity: ${intensity}`);
        }
        
        // Update light spots
        const updatedLightSpots = currentParticles.lightSpots.map(spot => {
          // SLOWER gentle movement
          spot.x += Math.sin(now / 3000 + spot.y * 0.01) * spot.speed * dt * 0.6; // Slowed down movement
          spot.y += Math.cos(now / 3300 + spot.x * 0.01) * spot.speed * dt * 0.3; // Slowed down movement
          
          // Keep in bounds - concentrated in middle area
          if (spot.x < w * 0.2) spot.x = w * 0.2;
          if (spot.x > w * 0.8) spot.x = w * 0.8;
          if (spot.y < h * 0.4) spot.y = h * 0.4;
          if (spot.y > h * 0.9) spot.y = h * 0.9;
          
          // Pulsing effect - slowed down
          const pulse = 0.8 + Math.sin(now / 2500 + spot.x * 0.5) * 0.2;
          
          // Only draw if visible - INCREASED BRIGHTNESS
          ctx.globalAlpha = (spot.alpha * 1.5) * intensity * pulse; // Increased brightness by 50%
          
          // Calculate color based on position and time for rainbow effect
          // Each spot gets one of three colors for a three-color rainbow effect
          let colorIndex = Math.floor(((spot.x / w) * 3 + Math.sin(now / 5000) * 1.5) % 3);
          
          // Default values in case something goes wrong
          let primaryColor = 'rgba(150, 210, 255, 0.8)'; // Default blue
          let secondaryColor = 'rgba(100, 150, 220, 0)';
          
          // Three distinct color combinations for a rainbow effect
          switch(colorIndex) {
            case 0: // Teal/Cyan
              primaryColor = 'rgba(100, 255, 255, 0.8)';
              secondaryColor = 'rgba(50, 200, 210, 0)';
              break;
            case 1: // Purple/Magenta
              primaryColor = 'rgba(240, 150, 255, 0.8)';
              secondaryColor = 'rgba(190, 100, 210, 0)';
              break;
            case 2: // Blue
              primaryColor = 'rgba(150, 210, 255, 0.8)';
              secondaryColor = 'rgba(100, 150, 220, 0)';
              break;
            // Default case already handled by initial values
          }
          
          // Rainbow-hued gradient for light spots
          const gradient = ctx.createRadialGradient(
            spot.x, spot.y, 0,
            spot.x, spot.y, spot.size * 6 // Larger gradient area
          );
          
          // Now these are guaranteed to be strings
          gradient.addColorStop(0, primaryColor); 
          gradient.addColorStop(1, secondaryColor);
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(spot.x, spot.y, spot.size * 6, 0, Math.PI * 2); // Larger spots
          ctx.fill();
          
          return spot;
        });
        
        // Check for ripple creation
        if (now > currentTriggers.nextWaterRipple && Math.random() < 0.4 * intensity) {
          console.log(`[DEBUG] Water ripple created`);
          
          const rippleX = w * randomBetween(0.25, 0.75);
          const rippleY = h * randomBetween(0.5, 0.85);
          
          // Rainbow-colored ripple
          const colorChoice = Math.floor(Math.random() * 3);
          
          // Default ripple color (blue)
          let rippleColor = 'rgba(150, 200, 255, 0.7)';
          
          // Choose one of three colors for the ripple
          switch(colorChoice) {
            case 0: // Teal
              rippleColor = 'rgba(100, 255, 240, 0.7)';
              break;
            case 1: // Purple
              rippleColor = 'rgba(200, 150, 255, 0.7)';
              break;
            case 2: // Blue
              rippleColor = 'rgba(150, 200, 255, 0.7)';
              break;
            // Default case already handled by initial value
          }
          
          // Add new ripple to state with color
          setParticles(prev => ({
            ...prev,
            ripples: [...prev.ripples, {
              x: rippleX,
              y: rippleY,
              radius: 5,
              alpha: 0.5 * intensity, // Increased initial alpha (0.4 -> 0.5)
              color: rippleColor // Now guaranteed to be a string
            }]
          }));
          
          setNextTriggers(prev => ({
            ...prev,
            nextWaterRipple: now + randomBetween(2000, 5000) / intensity
          }));
        }
        
        // Draw and update ripples
        const updatedRipples = currentParticles.ripples.filter(ripple => {
          ripple.radius += 0.3 * dt;
          ripple.alpha -= 0.002 * dt; // Slower fade-out (0.003 -> 0.002)
          
          if (ripple.alpha <= 0) return false;
          
          // Draw gentle ripple - BRIGHTER with RAINBOW COLOR
          ctx.globalAlpha = ripple.alpha * 1.3; // Increased brightness
          
          // Use ripple's assigned color or default to blue-white if not set
          ctx.strokeStyle = ripple.color || 'rgba(150, 200, 255, 0.6)';
          ctx.lineWidth = 1.5; // Thicker line (1 -> 1.5)
          
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
          ctx.stroke();
          
          return true;
        });
        
        // Update ripples
        if (updatedRipples.length !== currentParticles.ripples.length) {
          setParticles(prev => ({ ...prev, ripples: updatedRipples }));
        }
      }
      
      // 5. Mammal shadows with FRONT-FACING EYES
      if (currentActiveSounds.has('mammals') && currentSoundValues.mammals > 0) {
        const intensity = currentSoundValues.mammals;
        
        // Add more frequent debug logging
        if (frameCountRef.current % 100 === 0) {
          console.log(`[DEBUG] Mammal effect check - intensity: ${intensity}, has mammals: ${currentActiveSounds.has('mammals')}`);
          console.log(`[DEBUG] Mammal shadows - frame: ${frameCountRef.current}, eye positions: ${currentParticles.activeEyePositions?.length || 0}`);
        }
        
        // Only draw if mammals are active or intensity > 0
        // All sound types are treated equally
        const showHighDetail = intensity > 0.7; // Base on intensity rather than priority
        
        if (intensity > 0) {
          // Debug logging
          if (frameCountRef.current % 100 === 0) {
            console.log(`[DEBUG] Mammal rendering - intensity: ${intensity.toFixed(3)}, frame: ${frameCountRef.current}, highDetail: ${showHighDetail}`);
          }
          
          // ALWAYS show at least 2 pairs to ensure visibility
          const maxPairs = showHighDetail ? 3 : 2;
          const numEyePairs = Math.min(Math.floor(intensity * 3) + 1, maxPairs); // Increased multiplier from 2 to 3
          
          // Debug what's happening with the eye pairs
          if (frameCountRef.current % 100 === 0) {
            console.log(`[DEBUG] Mammal eyes - numEyePairs: ${numEyePairs}, maxPairs: ${maxPairs}`);
          }
          
          // Define possible positions for eye pairs - expanded to sides and up to half screen height
          const positions = [
            { x: w * 0.12, y: h * 0.55 },  // left upper
            { x: w * 0.08, y: h * 0.70 },  // left lower
            { x: w * 0.25, y: h * 0.65 },  // left-center 
            { x: w * 0.40, y: h * 0.75 },  // center-left
            { x: w * 0.60, y: h * 0.72 },  // center-right
            { x: w * 0.75, y: h * 0.60 },  // right-center
            { x: w * 0.92, y: h * 0.65 },  // right upper
            { x: w * 0.88, y: h * 0.80 }   // right lower
          ];
          
          // Ensure position changes at least every 5 seconds
          if (!currentParticles.lastEyePositionChange) {
            console.log('[DEBUG] Initializing mammal eye positions for the first time');
            
            // IMPORTANT: Only initialize mammal eyes if not already initialized
            if (!hasMammalEyesInitialized) {
              hasMammalEyesInitialized = true;
              console.log('[DEBUG] Setting hasMammalEyesInitialized to true');
            
              // IMPORTANT: On first appearance, limit to 2 pairs maximum regardless of intensity
              // This fixes the issue where too many eyes appear on first activation
              const initialNumPairs = Math.min(2, numEyePairs);
              console.log(`[DEBUG] First mammal appearance - limiting to ${initialNumPairs} eye pairs (was ${numEyePairs})`);
            
              // Save the initial positions to prevent jumping on resize
              const shuffledPositions = [...positions].sort(() => 0.5 - Math.random());
              initialEyePositions = shuffledPositions.slice(0, initialNumPairs);
            
              setParticles(prev => ({
                ...prev,
                lastEyePositionChange: frameCountRef.current,
                // Initialize with shuffled positions and starting with high visibility
                activeEyePositions: initialEyePositions,
                eyePairs: Array(initialNumPairs).fill(0).map((_, i) => ({
                  opacity: 0.01, // Start with very low opacity for proper fade-in
                  blinkTimer: 3000 + Math.random() * 2000,
                  size: 0.64 + Math.random() * 0.32,
                  behavior: i % 2 === 0 ? 'cautious' : 'curious',
                  blinkFrequency: i % 2 === 0 ? 'frequent' : 'rare',
                  lastBlink: 0
                })),
                eyeFadeTimestamp: Date.now(), // Start at beginning of cycle for proper fade-in
                nextEyeReturnDelay: 0 // No initial delay
              }));
            
              console.log('[DEBUG] Initial mammal eyes created with starting opacity 0.01 for proper fade-in');
            } else {
              console.log('[DEBUG] Skipping mammal eyes initialization - already initialized');
            }
          }
          
          // Randomize positions at less frequent intervals to maintain visibility
          const timeSinceLastChange = frameCountRef.current - (currentParticles.lastEyePositionChange || 0);
          
          // Use a timestamp-based approach for fade direction
          const now = Date.now();
          const secondsSincePositionChange = (now - (currentParticles.eyeFadeTimestamp || now)) / 1000;
          
          // Improved fade pattern: 1.5s fade in, 6s visible, 1.5s fade out (9s total cycle)
          const isFadingIn = secondsSincePositionChange < 1.5;
          const isFadingOut = secondsSincePositionChange > 7.5;
          
          // Log eye state periodically for debugging
          if (frameCountRef.current % 100 === 0) {
            console.log(`[DEBUG] Eyes state - fadeTime: ${secondsSincePositionChange.toFixed(1)}s, fading in: ${isFadingIn}, fading out: ${isFadingOut}`);
          }
          
          // Get active positions or fallback to default positions
          const activePositions = currentParticles.activeEyePositions || 
                                 positions.slice(0, numEyePairs);
                                 
          // Only change positions if the eyes have completely faded out and the delay has elapsed,
          // or if no positions exist yet
          const readyForNewPositions = 
            !currentParticles.activeEyePositions || 
            (secondsSincePositionChange > 9.5 && now >= (currentTriggers.nextMammalEyes || 0));
          
          // Debug the delay status periodically
          if (frameCountRef.current % 100 === 0) {
            const delayRemaining = currentTriggers.nextMammalEyes ? 
              Math.max(0, (currentTriggers.nextMammalEyes - now) / 1000) : 0;
            console.log(`[DEBUG] Mammal eyes status - secondsSinceChange: ${secondsSincePositionChange.toFixed(1)}s, delay remaining: ${delayRemaining.toFixed(1)}s, readyForNew: ${readyForNewPositions}`);
          }
          
          // If we're near the end of a cycle but no delay is set, set it now
          if (isFadingOut && secondsSincePositionChange > 8.5 && secondsSincePositionChange < 9.0 && 
              now >= (currentTriggers.nextMammalEyes || 0)) {
            const randomDelay = now + randomBetween(4000, 10000);
            console.log(`[DEBUG] Setting mammal eye delay of ${((randomDelay - now)/1000).toFixed(1)}s during fade out`);
            
            setNextTriggers(prev => {
              const newTriggers = {
                ...prev,
                nextMammalEyes: randomDelay
              };
              // Important: Update the ref immediately to ensure animation frame has latest value
              setTimeout(() => {
                nextTriggersRef.current = newTriggers;
              }, 0);
              return newTriggers;
            });
          }
          
          if (readyForNewPositions) {
            // Shuffle positions array to get random positions
            const shuffled = [...positions].sort(() => 0.5 - Math.random());
            
            // NEVER have zero eyes - always show at least one pair
            const actualNumPairs = Math.min(Math.max(1, numEyePairs), maxPairs);
            
            console.log(`[DEBUG] Time for new mammal eye positions - pairs: ${actualNumPairs}, timeSince: ${timeSinceLastChange}s, secondsSincePositionChange: ${secondsSincePositionChange.toFixed(1)}s`);
            
            const activePositions = shuffled.slice(0, actualNumPairs);
            
            // Update our stored initial positions to prevent jumps on resize
            initialEyePositions = [...activePositions];
            
            // Preserve behaviors when updating positions
            const newEyePairs = activePositions.map((_, i) => {
              const existingPair = currentParticles.eyePairs?.[i];
              return {
                opacity: 0.01, // Start completely invisible for proper fade-in
                blinkTimer: 3000 + Math.random() * 2000,
                size: 0.64 + Math.random() * 0.32, // 20% smaller
                // Preserve or assign new behavior
                behavior: existingPair?.behavior || (i % 2 === 0 ? 'cautious' : 'curious'),
                blinkFrequency: existingPair?.blinkFrequency || (i % 2 === 0 ? 'frequent' : 'rare'),
                lastBlink: 0
              };
            });
            
            // Create a new object to update particles with
            const particleUpdates: Partial<typeof currentParticles> = {
              activeEyePositions: activePositions,
              eyePairs: newEyePairs,
              lastEyePositionChange: frameCountRef.current,
              eyeFadeTimestamp: now, // Reset for accurate fade-in
            };
            
            // Schedule next appearance with delay
            const randomDelay = now + randomBetween(4000, 10000);
            console.log(`[DEBUG] Setting next mammal eyes appearance delay: ${((randomDelay - now)/1000).toFixed(1)}s`);
            
            // Set the next trigger time for mammal eyes - similar to how thunder and water ripples work
            setNextTriggers(prev => {
              const newTriggers = {
                ...prev,
                nextMammalEyes: randomDelay
              };
              // Update ref immediately
              setTimeout(() => {
                nextTriggersRef.current = newTriggers;
              }, 0);
              return newTriggers;
            });
            
            // Update our timestamp for tracking
            lastEyePositionTimeRef.current = Date.now();
            
            console.log(`[DEBUG] Particle update with delayNextCycle=${needsDelayNextCycleRef.current}, delay=${particleUpdates.nextEyeReturnDelay || 0}`);
            
            // Apply all our updates together and immediately sync with ref
            setParticles(prev => {
              const newState = {
                ...prev,
                ...particleUpdates
              };
              // Important: Update the ref immediately to ensure animation frame has latest value
              setTimeout(() => {
                particlesRef.current = newState;
              }, 0);
              return newState;
            });
            
            console.log('[DEBUG] New mammal eyes created with starting opacity 0.01 for proper fade-in');
          } else if (secondsSincePositionChange > 9.5) {
            // If we need to set a delay for the next cycle, do it now
            if (needsDelayNextCycleRef.current && (!currentParticles.nextEyeReturnDelay || currentParticles.nextEyeReturnDelay === 0)) {
              const randomDelay = now + randomBetween(4000, 10000);
              console.log(`[DEBUG] Setting delayed random delay of ${((randomDelay - now)/1000).toFixed(1)}s before new eyes appear`);
              
              // Set the delay and mark that we've handled this cycle
              needsDelayNextCycleRef.current = false;
              
              setParticles(prev => ({
                ...prev,
                nextEyeReturnDelay: randomDelay
              }));
            }
            
            // If we're past the fade out but waiting for delay, log this
            if (frameCountRef.current % 100 === 0) {
              const timeRemaining = currentParticles.nextEyeReturnDelay ? 
                ((currentParticles.nextEyeReturnDelay - now) / 1000).toFixed(1) : 'unknown';
              console.log(`[DEBUG] Eyes faded out, waiting ${timeRemaining}s before new positions`);
            }
          }
          
          // For each active eye pair position
          activePositions.forEach((position, idx) => {
            // Get current state or default values
            const currentPair = currentParticles.eyePairs?.[idx] || {
              opacity: 0.01, // Start with very low opacity for proper fade-in (changed from 0.6)
              blinkTimer: Math.random() * 3000,
              size: 0.64 + Math.random() * 0.32, // 20% smaller
              behavior: idx % 2 === 0 ? 'cautious' : 'curious',
              blinkFrequency: idx % 2 === 0 ? 'frequent' : 'rare',
              lastBlink: 0,
              height: position.y
            };
            
            // Apply different behavior patterns based on assigned behavior
            const behavior = currentPair.behavior || 'cautious';
            const blinkFrequency = currentPair.blinkFrequency || 'frequent';
            
            // Update blink timer based on behavior
            const blinkSpeed = blinkFrequency === 'frequent' ? 2.0 : 1.0; // Frequent blinks are faster
            let blinkTimer = currentPair.blinkTimer - dt * 16 * blinkSpeed;
            let opacity = currentPair.opacity;
            
            // Initialize eye state variables at the beginning of the scope
            let eyesOpen = true;
            let squintAmount = 0; // 0 = fully open, 1 = fully closed
            
            // Handle normal blinking only when fully visible (not during fade transitions)
            if (blinkTimer <= 0 && !isFadingIn && !isFadingOut && opacity > 0.4) {
              // Rapid double blink for cautious eyes
              if (behavior === 'cautious' && !currentPair.lastBlink) {
                // First blink of double-blink
                blinkTimer = 120;
                currentPair.lastBlink = 1;
              } else if (behavior === 'cautious' && currentPair.lastBlink === 1) {
                // Second blink of double-blink
                blinkTimer = 100;
                currentPair.lastBlink = 2;
              } else if (behavior === 'cautious' && currentPair.lastBlink === 2) {
                // Finished double-blink, longer pause
                blinkTimer = 2500 + Math.random() * 2000;
                currentPair.lastBlink = 0;
              } else {
                // Curious eyes have single blinks with variable times
                blinkTimer = behavior === 'curious' ? 
                  1800 + Math.random() * 2500 : // Curious eyes blink less frequently
                  1200 + Math.random() * 1500;  // Cautious eyes blink more frequently
                  
                // 30% chance for a quick blink for curious eyes
                if (behavior === 'curious' && Math.random() < 0.3) {
                  blinkTimer = 180 + Math.random() * 150;
                }
              }
              
              // Log blinking for debugging
              if (Math.random() < 0.2) {
                console.log(`[DEBUG] Eye blink - pair ${idx} (${behavior}), blink pattern: ${blinkFrequency}`);
              }
            }
            
            // Calculate target opacity based on fade state and behavior
            let targetOpacity = 0.8 + Math.random() * 0.15; // Default high visibility
            
            // Curious eyes are slightly more visible than cautious eyes
            if (behavior === 'curious') {
              targetOpacity *= 1.1; // 10% more visible
            } else {
              targetOpacity *= 0.95; // 5% less visible
            }
            
            // Improved fade curves
            if (isFadingIn) {
              // Smoother fade-in curve using easeInOutQuad
              const fadeProgress = secondsSincePositionChange / 1.5;
              const easedProgress = fadeProgress < 0.5 ? 
                2 * fadeProgress * fadeProgress : 
                1 - Math.pow(-2 * fadeProgress + 2, 2) / 2;
              targetOpacity *= easedProgress;
              
              // Always force eyes open during fade-in for better visibility
              eyesOpen = true;
              squintAmount = 0;
              
              if (idx === 0 && frameCountRef.current % 100 === 0) {
                console.log(`[DEBUG] Eye fade IN - progress: ${(easedProgress * 100).toFixed(0)}%, opacity: ${targetOpacity.toFixed(2)}`);
              }
            } else if (isFadingOut) {
              // Smoother fade-out curve using easeInOutQuad
              const fadeProgress = (secondsSincePositionChange - 7.5) / 2;
              const easedProgress = 1 - (fadeProgress < 0.5 ? 
                2 * fadeProgress * fadeProgress : 
                1 - Math.pow(-2 * fadeProgress + 2, 2) / 2);
              targetOpacity *= easedProgress;
              
              // Detect when eyes have almost completely faded out (opacity very low)
              // This is the right moment to set the delay for the next appearance
              if (easedProgress < 0.1 && now >= (currentTriggers.nextMammalEyes || 0)) {
                // Set the delay right when eyes fade out completely
                const randomDelay = now + randomBetween(4000, 10000);
                console.log(`[DEBUG] Eyes almost completely faded out. Setting next appearance delay of ${((randomDelay - now)/1000).toFixed(1)}s`);
                
                // Set the next trigger time for mammal eyes
                setNextTriggers(prev => {
                  const newTriggers = {
                    ...prev,
                    nextMammalEyes: randomDelay
                  };
                  // Update ref immediately
                  setTimeout(() => {
                    nextTriggersRef.current = newTriggers;
                  }, 0);
                  return newTriggers;
                });
              }
              
              // Log fade out progress for debugging
              if (Math.random() < 0.05) {
                console.log(`[DEBUG] Eye fade OUT - progress: ${Math.round(fadeProgress * 100)}%, opacity: ${opacity.toFixed(2)}`);
              }
            }
            
            // Make sure we can go to zero opacity during transitions for complete invisibility
            targetOpacity = isFadingIn && secondsSincePositionChange < 0.2 ? 0 : 
                           isFadingOut && secondsSincePositionChange > 8.8 ? 0 : 
                           Math.max(0.1, targetOpacity);
            
            // Movement based on behavior - cautious eyes move slightly
            if (behavior === 'cautious' && !isFadingIn && !isFadingOut) {
              // Slight position jitter for cautious eyes
              position.x += Math.sin(now / 800 + idx) * 0.2;
              position.y += Math.cos(now / 850 + idx) * 0.1;
            }
            
            // Smoother opacity transition for different behaviors
            // Use faster transition speed during fade states for more visible changes
            const transitionSpeed = isFadingIn || isFadingOut ? 0.15 : 
                                   behavior === 'curious' ? 0.08 : 0.12;
            opacity = opacity + (targetOpacity - opacity) * transitionSpeed;
            
            // Enhanced squinting - more realistic eye closure
            // Update eye state variables based on conditions
            if (isFadingOut) {
              // Gradually close during fade out
              const fadeOutProgress = (secondsSincePositionChange - 7.5) / 1.5;
              squintAmount = Math.min(1, fadeOutProgress * 1.5); // Close faster than fade
              eyesOpen = squintAmount < 0.9; // Only consider fully closed at 90%
            } else if (blinkTimer <= 200) {
              // Calculate blink progress - slower open, faster close
              const blinkProgress = blinkTimer <= 100 ? 
                (100 - blinkTimer) / 100 : // Closing (goes from 0 to 1)
                (blinkTimer - 100) / 100;  // Opening (goes from 1 to 0)
                
              squintAmount = behavior === 'cautious' ? 
                Math.min(1, blinkProgress * 1.5) : // Cautious eyes close more completely
                Math.min(0.9, blinkProgress);      // Curious eyes never fully close
                
              eyesOpen = squintAmount < 0.9;
            }
            
            // Add a subtle "breathing" effect when fully visible
            if (!isFadingIn && !isFadingOut && opacity > 0.5) {
              // Different breathing patterns based on behavior
              const breathFrequency = behavior === 'cautious' ? 800 : 1200; // Cautious breathes faster
              const breathDepth = behavior === 'cautious' ? 0.15 : 0.08;    // Cautious has deeper breaths
              
              const breathFactor = Math.sin(now / breathFrequency + idx) * breathDepth + (1 - breathDepth);
              opacity *= breathFactor;
            }
            
            // Save updated state less frequently to improve performance
            if (frameCountRef.current % 10 === 0) {
              setParticles(prev => {
                const newEyePairs = [...(prev.eyePairs || [])];
                newEyePairs[idx] = {
                  ...currentPair,
                  opacity,
                  blinkTimer,
                  behavior,
                  blinkFrequency
                };
                return { ...prev, eyePairs: newEyePairs };
              });
            }
            
            // Base eye parameters - reduced by 20%
            const shadowSize = 36 * (currentPair.size || 1); // Reduced from 45 to 36 (20% smaller)
            const eyeSize = shadowSize * 0.45;
            const eyeSpacing = eyeSize * 1.4;
            
            // Calculate eye positions
            const centerX = position.x;
            const centerY = position.y;
            const leftEyeX = centerX - eyeSpacing / 2;
            const rightEyeX = centerX + eyeSpacing / 2;
            
            // Only render if opacity is high enough (prevents "black" eyes with no glows)
            if (opacity > 0.05) {
              // Draw shadow behind eyes - INCREASED OPACITY
              ctx.globalAlpha = 0.35 * intensity * opacity;
              ctx.fillStyle = 'rgba(5, 5, 5, 0.8)';
              ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
              ctx.shadowBlur = 12;
              
              // Draw shadow as oval behind both eyes
              ctx.beginPath();
              ctx.ellipse(
                centerX, 
                centerY, 
                eyeSpacing * 1.3,
                eyeSpacing * 0.8,
                0, 0, Math.PI * 2
              );
              ctx.fill();
              
              if (eyesOpen) {
                // Draw eye outlines (dark areas) - INCREASED OPACITY
                ctx.globalAlpha = 0.55 * intensity * opacity;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                ctx.shadowBlur = 5;
                
                // Apply squinting effect to eye shape
                const verticalScale = 1 - squintAmount * 0.7; // Reduces height as squint increases
                
                // Left eye outline - modified for wolf-like triangular shape
                ctx.beginPath();
                // Calculate points for triangular wolf eye
                const eyeAngle = 35; // Angle for the triangular shape (degrees)
                const angleRad = (eyeAngle * Math.PI) / 180;
                const eyeWidth = eyeSize * 1.2; // Wider eye base
                const eyeHeight = eyeSize * 0.9 * verticalScale;
                
                // Left eye points
                const leftInnerX = leftEyeX + eyeWidth * 0.5;
                const leftOuterX = leftEyeX - eyeWidth * 0.7;
                const leftTopY = centerY - eyeHeight * 0.7;
                const leftBottomY = centerY + eyeHeight * 0.5;
                
                // Draw triangular-shaped wolf eye (left)
                ctx.moveTo(leftInnerX, centerY); // Inner corner (closer to nose)
                ctx.quadraticCurveTo(
                  leftInnerX - eyeWidth * 0.2, leftTopY - eyeHeight * 0.1,
                  leftEyeX, leftTopY // Top point
                );
                ctx.quadraticCurveTo(
                  leftOuterX + eyeWidth * 0.1, leftTopY + eyeHeight * 0.2,
                  leftOuterX, centerY // Outer corner (pointed)
                );
                ctx.quadraticCurveTo(
                  leftOuterX + eyeWidth * 0.1, leftBottomY - eyeHeight * 0.1,
                  leftEyeX, leftBottomY // Bottom point
                );
                ctx.quadraticCurveTo(
                  leftInnerX - eyeWidth * 0.2, leftBottomY - eyeHeight * 0.1,
                  leftInnerX, centerY // Back to inner corner
                );
                ctx.fill();
                
                // Right eye outline - modified for wolf-like triangular shape
                ctx.beginPath();
                // Right eye points
                const rightInnerX = rightEyeX - eyeWidth * 0.5;
                const rightOuterX = rightEyeX + eyeWidth * 0.7;
                const rightTopY = centerY - eyeHeight * 0.7;
                const rightBottomY = centerY + eyeHeight * 0.5;
                
                // Draw triangular-shaped wolf eye (right)
                ctx.moveTo(rightInnerX, centerY); // Inner corner (closer to nose)
                ctx.quadraticCurveTo(
                  rightInnerX + eyeWidth * 0.2, rightTopY - eyeHeight * 0.1,
                  rightEyeX, rightTopY // Top point
                );
                ctx.quadraticCurveTo(
                  rightOuterX - eyeWidth * 0.1, rightTopY + eyeHeight * 0.2,
                  rightOuterX, centerY // Outer corner (pointed)
                );
                ctx.quadraticCurveTo(
                  rightOuterX - eyeWidth * 0.1, rightBottomY - eyeHeight * 0.1,
                  rightEyeX, rightBottomY // Bottom point
                );
                ctx.quadraticCurveTo(
                  rightInnerX + eyeWidth * 0.2, rightBottomY - eyeHeight * 0.1,
                  rightInnerX, centerY // Back to inner corner
                );
                ctx.fill();
                
                // Draw glowing irises with behavior-specific variations
                ctx.globalAlpha = 0.85 * intensity * opacity * (1 - squintAmount * 0.5); // Reduce glow during squint
                
                // Add glow effect - different for each behavior
                if (behavior === 'curious') {
                  ctx.shadowColor = 'rgba(255, 220, 100, 0.85)'; // Brighter yellow for curious
                  ctx.shadowBlur = 15;
                } else {
                  ctx.shadowColor = 'rgba(200, 220, 100, 0.75)'; // More greenish for cautious
                  ctx.shadowBlur = 12;
                }
                
                // Choose species-specific eye colors - with behavior variations
                let eyeColor;
                switch(idx % 4) {
                  case 0: // Deer - yellow amber
                    eyeColor = behavior === 'curious' ? 
                      'rgba(235, 220, 100, 0.95)' : // Brighter for curious
                      'rgba(225, 210, 100, 0.9)';   // Dimmer for cautious
                    break;
                  case 1: // Wolf - yellow-green
                    eyeColor = behavior === 'curious' ? 
                      'rgba(220, 240, 120, 0.95)' : // Brighter for curious
                      'rgba(200, 230, 110, 0.9)';   // Dimmer for cautious
                    break;
                  case 2: // Fox - orange amber
                    eyeColor = behavior === 'curious' ? 
                      'rgba(240, 190, 85, 0.95)' :  // Brighter for curious
                      'rgba(230, 180, 80, 0.9)';    // Dimmer for cautious
                    break;
                  case 3: // Cougar - green-yellow
                    eyeColor = behavior === 'curious' ? 
                      'rgba(210, 240, 100, 0.95)' : // Brighter for curious
                      'rgba(200, 230, 90, 0.9)';    // Dimmer for cautious
                    break;
                }
                
                ctx.fillStyle = eyeColor || 'rgba(235, 220, 100, 0.95)';
                
                // Left iris - modified to follow triangular shape but stay rounded
                // Scale down iris from eye outline
                const irisScaleFactor = 0.8;
                const leftIrisWidth = eyeWidth * irisScaleFactor;
                const leftIrisHeight = eyeHeight * irisScaleFactor * verticalScale;
                
                ctx.beginPath();
                // Draw a more oval iris that follows the eye shape but remains rounded
                ctx.ellipse(
                  leftEyeX - eyeWidth * 0.1, // Shifted slightly toward the outer edge
                  centerY,
                  leftIrisWidth * 0.7, // Narrower width
                  leftIrisHeight * 0.8, // Lower height 
                  0, 0, Math.PI * 2
                );
                ctx.fill();
                
                // Right iris - modified to follow triangular shape but stay rounded
                const rightIrisWidth = eyeWidth * irisScaleFactor;
                const rightIrisHeight = eyeHeight * irisScaleFactor * verticalScale;
                
                ctx.beginPath();
                // Draw a more oval iris that follows the eye shape but remains rounded
                ctx.ellipse(
                  rightEyeX + eyeWidth * 0.1, // Shifted slightly toward the outer edge
                  centerY,
                  rightIrisWidth * 0.7, // Narrower width
                  rightIrisHeight * 0.8, // Lower height
                  0, 0, Math.PI * 2
                );
                ctx.fill();
                
                // Add catchlight reflections in eyes - affected by squinting
                if (squintAmount < 0.7) { // Only show catchlights when eyes are open enough
                  ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
                  ctx.shadowBlur = 2;
                  
                  // Adjust catchlight position during squint (moves down slightly as eyes close)
                  const catchlightSquintAdjustment = squintAmount * eyeSize * 0.1;
                  
                  // Different positioning for different behaviors
                  const catchlightOffsetX = behavior === 'curious' ? 
                    eyeSize * 0.22 : // More centered for curious (looking directly at viewer)
                    eyeSize * 0.18;   // More to the side for cautious (looking more to the side)
                    
                  const catchlightOffsetY = -eyeSize * 0.1 + catchlightSquintAdjustment;
                  
                  // Scale down catchlights during squinting
                  const catchlightScale = 1 - squintAmount * 0.6;
                  
                  // Left eye catchlight
                  ctx.beginPath();
                  ctx.arc(
                    leftEyeX - eyeWidth * 0.1 + catchlightOffsetX,
                    centerY + catchlightOffsetY,
                    eyeSize * 0.25 * catchlightScale,
                    0, Math.PI * 2
                  );
                  ctx.fill();
                  
                  // Right eye catchlight
                  ctx.beginPath();
                  ctx.arc(
                    rightEyeX + eyeWidth * 0.1 + catchlightOffsetX,
                    centerY + catchlightOffsetY,
                    eyeSize * 0.25 * catchlightScale,
                    0, Math.PI * 2
                  );
                  ctx.fill();
                }
              } else {
                // Draw closed eyes as thin curved lines (more triangular for wolf-like appearance)
                ctx.globalAlpha = 0.4 * intensity * opacity;
                ctx.strokeStyle = 'rgba(20, 20, 20, 0.8)';
                ctx.lineWidth = 2;
                
                // Left closed eye - curved line with slight angle for wolf-like appearance
                const leftEyeWidth = eyeSize * 1.2;
                ctx.beginPath();
                ctx.moveTo(leftEyeX - leftEyeWidth * 0.7, centerY);
                ctx.lineTo(leftEyeX + leftEyeWidth * 0.5, centerY);
                ctx.stroke();
                
                // Right closed eye - curved line with slight angle for wolf-like appearance
                const rightEyeWidth = eyeSize * 1.2;
                ctx.beginPath();
                ctx.moveTo(rightEyeX - rightEyeWidth * 0.5, centerY);
                ctx.lineTo(rightEyeX + rightEyeWidth * 0.7, centerY);
                ctx.stroke();
              }
            }
          });
          
          // Reset shadow effects
          ctx.shadowBlur = 0;
        }
      }
      
      // 6. Birds effect - Add reinitialization
      if (currentActiveSounds.has('birds') && currentSoundValues.birds > 0) {
        const intensity = currentSoundValues.birds;
        
        // If bird particles aren't initialized properly, recreate them
        if (!currentParticles.birds || currentParticles.birds.length === 0) {
          console.log('[DEBUG] Bird particles missing, initializing them now');
          
          // Create new bird particles
          const newBirds = Array.from({ length: 8 }, () => ({
            x: randomBetween(-50, w),
            y: randomBetween(0, h * 0.3),
            dx: 0.8 + Math.random() * 0.7,
            dy: randomBetween(-0.3, 0.3)
          }));
          
          // Update particles ref directly 
          currentParticles.birds = newBirds;
          
          // Also update state
          setParticles(prev => ({
            ...prev,
            birds: newBirds
          }));
          
          console.log(`[DEBUG] Created ${newBirds.length} new birds`);
        }
        
        // All sound types are treated equally
        ctx.globalAlpha = 0.6 * intensity;
        
        // Update and draw birds
        const updatedBirds = currentParticles.birds.map(bird => {
          // Update position
          bird.x += bird.dx * dt;
          bird.y += bird.dy * dt * Math.sin(now / 1000 + bird.x * 0.01);
          
          // Wrap around screen
          if (bird.x > w + 50) bird.x = -50;
          if (bird.x < -50) bird.x = w + 50;
          if (bird.y > h * 0.5) bird.y = h * 0.1;
          if (bird.y < 0) bird.y = h * 0.3;
          
          // Draw bird
          ctx.fillStyle = 'rgba(40, 40, 40, 0.8)';
          
          // Bird animation - wing flap based on time and position
          const wingFlap = Math.sin(now / 200 + bird.x * 0.1);
          const wingHeight = 3 + Math.abs(wingFlap) * 3;
          
          // Wing position varies with flap
          const leftWingY = bird.y - wingHeight * (wingFlap > 0 ? 1 : 0.5);
          const rightWingY = bird.y - wingHeight * (wingFlap < 0 ? 1 : 0.5);
          
          // Draw bird body
          ctx.beginPath();
          ctx.arc(bird.x, bird.y, 3, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw wings
          ctx.beginPath();
          ctx.moveTo(bird.x, bird.y);
          ctx.lineTo(bird.x - 8, leftWingY);
          ctx.lineTo(bird.x - 2, bird.y);
          ctx.fill();
          
          ctx.beginPath();
          ctx.moveTo(bird.x, bird.y);
          ctx.lineTo(bird.x + 8, rightWingY);
          ctx.lineTo(bird.x + 2, bird.y);
          ctx.fill();
          
          // Draw bird tail
          ctx.beginPath();
          ctx.moveTo(bird.x, bird.y);
          ctx.lineTo(bird.x, bird.y + 5);
          ctx.lineTo(bird.x + (bird.dx > 0 ? 4 : -4), bird.y + 3);
          ctx.fill();
          
          return bird;
        });
        
        // Occasionally add a new bird or remove one
        if (Math.random() > 0.995) {
          console.log(`[DEBUG] Bird flock changing - Current birds: ${updatedBirds.length}`);
          
          // 50% chance to add or remove a bird
          if (Math.random() > 0.5 && updatedBirds.length < 12) {
            // Add new bird from edge of screen
            const fromLeft = Math.random() > 0.5;
            updatedBirds.push({
              x: fromLeft ? -10 : w + 10,
              y: randomBetween(h * 0.05, h * 0.3),
              dx: fromLeft ? randomBetween(0.8, 1.5) : randomBetween(-1.5, -0.8),
              dy: randomBetween(-0.2, 0.2)
            });
            console.log(`[DEBUG] Added new bird, total: ${updatedBirds.length}`);
          } else if (updatedBirds.length > 3) {
            // Remove a random bird
            updatedBirds.splice(Math.floor(Math.random() * updatedBirds.length), 1);
            console.log(`[DEBUG] Removed bird, total: ${updatedBirds.length}`);
          }
        }
        
        setParticles(prev => ({ ...prev, birds: updatedBirds }));
      }
      
      // 7. Insects effect (Fireflies) - Add reinitialization
      if (currentActiveSounds.has('insects') && currentSoundValues.insects > 0) {
        const intensity = currentSoundValues.insects;
        
        // If firefly particles aren't initialized properly, recreate them
        if (!currentParticles.fireflies || currentParticles.fireflies.length === 0) {
          console.log('[DEBUG] Firefly particles missing, initializing them now');
          
          // Create new firefly particles
          const newFireflies = Array.from({ length: 25 }, () => ({
            x: randomBetween(0, w),
            y: randomBetween(h * 0.4, h * 0.8),
            alpha: 0,
            timer: Math.random() * 7000,
            pulseInterval: randomBetween(2000, 5000)
          }));
          
          // Update particles ref directly
          currentParticles.fireflies = newFireflies;
          
          // Also update state
          setParticles(prev => ({
            ...prev,
            fireflies: newFireflies
          }));
          
          console.log(`[DEBUG] Created ${newFireflies.length} new fireflies`);
        }
        
        // All sound types are treated equally
        // Adjust number of fireflies based on intensity only
        const targetFireflies = Math.floor(10 + intensity * 15);
        
        // Update and draw fireflies
        const updatedFireflies = currentParticles.fireflies.map(firefly => {
          // Update timer
          firefly.timer += dt * 16;
          
          // Pulse alpha based on timer
          if (firefly.timer > firefly.pulseInterval) {
            firefly.timer = 0;
          }
          
          // Calculate alpha based on pulse shape (slow rise, quick fall)
          const pulseProgress = firefly.timer / firefly.pulseInterval;
          if (pulseProgress < 0.7) {
            // Slow rise
            firefly.alpha = Math.min(pulseProgress * 1.4, 1) * intensity;
          } else {
            // Quick fall
            firefly.alpha = Math.max(0, (1 - (pulseProgress - 0.7) * 3.3)) * intensity;
          }
          
          // Slow random movement
          firefly.x += Math.sin(now / 1000 + firefly.y * 0.1) * 0.3 * dt;
          firefly.y += (Math.sin(now / 1200 + firefly.x * 0.1) - 0.2) * 0.3 * dt; // Slight upward bias
          
          // Keep within bounds
          if (firefly.x < 0) firefly.x = w;
          if (firefly.x > w) firefly.x = 0;
          if (firefly.y < h * 0.3) firefly.y = h * 0.3;
          if (firefly.y > h * 0.9) firefly.y = h * 0.9;
          
          // Only draw if visible
          if (firefly.alpha > 0.05) {
            // Draw glow
            const glowRadius = 5 + Math.sin(now / 200 + firefly.x) * 2;
            const glow = ctx.createRadialGradient(
              firefly.x, firefly.y, 0,
              firefly.x, firefly.y, glowRadius * 3
            );
            
            // Yellow-green color for fireflies
            glow.addColorStop(0, `rgba(230, 255, 170, ${firefly.alpha})`);
            glow.addColorStop(0.4, `rgba(180, 240, 100, ${firefly.alpha * 0.6})`);
            glow.addColorStop(1, 'rgba(100, 200, 0, 0)');
            
            ctx.globalAlpha = firefly.alpha * 0.7;
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(firefly.x, firefly.y, glowRadius * 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw bright center
            ctx.globalAlpha = firefly.alpha;
            ctx.fillStyle = 'rgba(230, 255, 200, 1.0)';
            ctx.beginPath();
            ctx.arc(firefly.x, firefly.y, glowRadius * 0.6, 0, Math.PI * 2);
            ctx.fill();
          }
          
          return firefly;
        });
        
        // Occasionally add new fireflies or remove existing ones
        if (Math.random() > 0.995) {
          console.log('[DEBUG] Adjusting firefly population');
          
          // Adjust based on intensity - more intensity means more fireflies
          const targetCount = Math.floor(15 + intensity * 20);
          
          if (updatedFireflies.length < targetCount && Math.random() > 0.5) {
            // Add new firefly
            updatedFireflies.push({
              x: randomBetween(w * 0.1, w * 0.9),
              y: randomBetween(h * 0.4, h * 0.8),
              alpha: 0,
              timer: Math.random() * 5000,
              pulseInterval: randomBetween(2000, 5000)
            });
            console.log(`[DEBUG] Added new firefly, total: ${updatedFireflies.length}`);
          } else if (updatedFireflies.length > 10 && Math.random() > 0.7) {
            // Remove a firefly
            updatedFireflies.splice(Math.floor(Math.random() * updatedFireflies.length), 1);
            console.log(`[DEBUG] Removed firefly, total: ${updatedFireflies.length}`);
          }
        }
        
        setParticles(prev => ({ ...prev, fireflies: updatedFireflies }));
      }
      
      // 8. Fire/ember effect
      if (currentActiveSounds.has('fire') && currentSoundValues.fire > 0) {
        const intensity = currentSoundValues.fire;
        
        // Add debug log when fire first renders
        if (!particlesRef.current.fireLastRendered) {
          console.log('[DEBUG] Fire effect rendering started, intensity:', intensity);
          setParticles(prev => ({ ...prev, fireLastRendered: true }));
        }
        
        // Log fire effect periodically
        if (frameCountRef.current % 300 === 0) {
          console.log('[DEBUG] Fire effect active - intensity:', intensity, 'frame:', frameCountRef.current);
        }
        
        // All sound types are treated equally
        ctx.globalAlpha = 0.7 * intensity;
        
        // Draw subtle fire glow at the base
        const fireGradient = ctx.createRadialGradient(
          w / 2, h - 30, 0,
          w / 2, h - 30, 80 * intensity
        );
        fireGradient.addColorStop(0, `rgba(255, 180, 50, ${0.4 * intensity})`);
        fireGradient.addColorStop(1, 'rgba(255, 100, 50, 0)');
        
        ctx.fillStyle = fireGradient;
        ctx.beginPath();
        ctx.ellipse(w / 2, h - 20, 80 * intensity, 40 * intensity, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const updatedEmbers = currentParticles.embers.map(ember => {
          // Update position with more dramatic x wobble
          ember.y -= ember.speed * dt * intensity;
          ember.x += Math.sin(now / 400 + ember.y * 0.1) * 0.6 * dt;  // More dramatic wobble
          
          // Reset when off top of screen
          if (ember.y < 0) {
            ember.y = h - 50 + Math.random() * 20;
            ember.x = w / 2 + randomBetween(-50, 50);  // Wider area
            ember.speed = 0.5 + Math.random() * 0.8;
            ember.size = 2 + Math.random() * 3;
            // More saturated orange/red colors
            ember.color = `rgba(${255}, ${100 + Math.floor(Math.random() * 80)}, ${30 + Math.floor(Math.random() * 40)}, ${0.7 + Math.random() * 0.3})`;
          }
          
          // Draw ember with glow effect
          ctx.globalAlpha = intensity;
          
          // Add glow
          const glowSize = ember.size * 3;
          const glow = ctx.createRadialGradient(
            ember.x, ember.y, 0,
            ember.x, ember.y, glowSize
          );
          glow.addColorStop(0, ember.color);
          glow.addColorStop(1, 'rgba(255, 100, 0, 0)');
          
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(ember.x, ember.y, glowSize, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw core
          ctx.fillStyle = ember.color;
          ctx.beginPath();
          ctx.arc(ember.x, ember.y, ember.size, 0, Math.PI * 2);
          ctx.fill();
          
          return ember;
        });
        
        setParticles(prev => ({ ...prev, embers: updatedEmbers }));
      }
      
      // 9. Ambient/waves effect
      if (currentActiveSounds.has('ambient') && currentSoundValues.ambient > 0) {
        const intensity = currentSoundValues.ambient;
        
        // All sound types are treated equally
        ctx.globalAlpha = 0.5 * intensity;
        
        // Add a subtle background glow
        const ambientGlow = ctx.createLinearGradient(0, 0, 0, h);
        ambientGlow.addColorStop(0, `rgba(100, 150, 255, ${0.05 * intensity})`);
        ambientGlow.addColorStop(0.5, `rgba(150, 200, 255, ${0.1 * intensity})`);
        ambientGlow.addColorStop(1, `rgba(100, 150, 255, ${0.05 * intensity})`);
        
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = ambientGlow;
        ctx.fillRect(0, 0, w, h);
        
        ctx.globalAlpha = 0.25 * intensity;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        
        currentParticles.ambientWaves.forEach((wave, index) => {
          const lineY = wave.y;
          
          // Draw sine wave with gradient
          ctx.beginPath();
          
          // Different colors for different waves
          if (index % 2 === 0) {
            ctx.strokeStyle = 'rgba(220, 240, 255, 0.8)';  // Light blue
          } else {
            ctx.strokeStyle = 'rgba(255, 240, 255, 0.8)';  // Light purple
          }
          
          for (let x = 0; x < w; x += 3) {  // More detail with smaller steps
            const y = lineY + Math.sin((x * wave.speed) + (now / 800) + wave.offset) * wave.amplitude * intensity;
            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        });
      }
      
      // 10. Spiritual effect - IMPROVED RAY VISIBILITY with REVERSED BRIGHTNESS
      if (currentActiveSounds.has('spiritual') && currentSoundValues.spiritual > 0) {
        const intensity = currentSoundValues.spiritual;
        
        // All sound types are treated equally
        ctx.globalAlpha = 0.6 * intensity;
        
        // Debug logging
        if (frameCountRef.current % 300 === 0) {
          console.log(`[DEBUG] Spiritual effect - intensity: ${intensity}`);
        }
        
        // Fill the screen with a top-down gradient (brighter at top, fading down)
        const topGradient = ctx.createLinearGradient(0, 0, 0, h);
        
        // Reversed brightness - stronger at top - WITH GOLDEN HUE
        topGradient.addColorStop(0, `rgba(255, 235, 150, ${0.12 * intensity})`); // Brightest at top - golden
        topGradient.addColorStop(0.4, `rgba(255, 215, 120, ${0.08 * intensity})`); // Medium brightness - amber
        topGradient.addColorStop(0.7, `rgba(245, 200, 100, ${0.05 * intensity})`); // Dimmer - gold
        topGradient.addColorStop(1, 'rgba(230, 190, 80, 0)'); // Fades to nothing at bottom - darker gold
        
        ctx.globalAlpha = 0.9 * intensity; // Increased opacity
        ctx.fillStyle = topGradient;
        ctx.fillRect(0, 0, w, h);
        
        // Add top-focused light rays (brightest at top, fading toward bottom) WITH GOLDEN HUE
        const centerX = w * 0.5;
        const numRays = 6 + Math.floor(intensity * 3);
        const rayWidth = w / (numRays * 1.5);
        
        for (let i = 0; i < numRays; i++) {
          const rayX = w * (i / numRays) + rayWidth * Math.sin(now / 8000 + i);
          
          // Create ray gradient for each ray with GOLDEN HUE
          const rayGradient = ctx.createLinearGradient(0, 0, 0, h);
          rayGradient.addColorStop(0, `rgba(255, 235, 140, ${0.8 * intensity})`); // Very bright at top - light gold
          rayGradient.addColorStop(0.3, `rgba(255, 215, 90, ${0.5 * intensity})`); // Medium brightness - gold
          rayGradient.addColorStop(0.7, `rgba(245, 190, 80, ${0.2 * intensity})`); // Dimmer - darker gold
          rayGradient.addColorStop(1, 'rgba(220, 170, 60, 0)'); // Fades to nothing at bottom - amber
          
          ctx.fillStyle = rayGradient;
          ctx.globalAlpha = 0.3 * intensity;
          
          // Draw ray from top to bottom
          ctx.beginPath();
          ctx.moveTo(rayX, 0);
          ctx.lineTo(rayX + rayWidth, 0);
          ctx.lineTo(centerX + rayWidth * 2, h);
          ctx.lineTo(centerX - rayWidth * 2, h);
          ctx.closePath();
          ctx.fill();
        }
        
        // Add subtle pulse rings (fainter as they're lower on screen) WITH GOLDEN HUE
        if (now > currentTriggers.nextPulseRing && Math.random() < 0.3 * intensity) {
          setParticles(prev => ({
            ...prev,
            pulseRings: [
              ...prev.pulseRings,
              {
                x: centerX + randomBetween(-w * 0.3, w * 0.3),
                y: h * randomBetween(0.5, 0.8),
                radius: 5,
                alpha: 0.2 * intensity // Reduced alpha for lower rings
              }
            ]
          }));
          
          setNextTriggers(prev => ({
            ...prev,
            nextPulseRing: now + randomBetween(3000, 6000) / intensity
          }));
        }
        
        // Draw and update pulse rings with fading opacity based on y-position
        const updatedRings = currentParticles.pulseRings.filter(ring => {
          ring.radius += 0.5 * dt;
          ring.alpha -= 0.003 * dt;
          
          if (ring.alpha <= 0) return false;
          
          // Position-based alpha: higher rings are more visible
          const positionFactor = 1 - (ring.y / h); // 1 at top, 0 at bottom
          const adjustedAlpha = ring.alpha * (0.5 + positionFactor * 0.5); // Boost higher rings
          
          // Draw gentle pulse ring WITH GOLDEN HUE
          ctx.globalAlpha = adjustedAlpha;
          ctx.strokeStyle = 'rgba(255, 215, 80, 0.7)'; // Golden color
          ctx.lineWidth = 2;
          
          ctx.beginPath();
          ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
          ctx.stroke();
          
          return true;
        });
        
        // Update rings
        if (updatedRings.length !== currentParticles.pulseRings.length) {
          setParticles(prev => ({ ...prev, pulseRings: updatedRings }));
        }
      }
      
      // Reset global alpha
      ctx.globalAlpha = 1;
      
      // Continue animation loop
      requestIdRef.current = requestAnimationFrame(animate);
    };

    // Schedule the next frame
    requestIdRef.current = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      console.log('[DEBUG] Cleaning up animation effect');
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
        requestIdRef.current = null;
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Empty dependency array - animation starts once and never restarts

  // Update refs when props change to ensure animations use the latest values
  useEffect(() => {
    console.log('[DEBUG] Props changed, updating refs without restarting animation');
    
    // Create a copy of the previous active sounds for comparison
    const prevActiveSet = new Set(activeVisualsRef.current);
    const newActiveSet = new Set(activeSounds);
    
    // Check for newly activated sounds
    activeSounds.forEach(sound => {
      if (!prevActiveSet.has(sound)) {
        console.log(`[DEBUG] New sound activated: ${sound}`);
        
        // For newly activated sounds, we may need to initialize their particles
        if (particlesRef.current && canvasRef.current) {
          const canvas = canvasRef.current;
          const w = canvas.width / (window.devicePixelRatio || 1);
          const h = canvas.height / (window.devicePixelRatio || 1);
          
          // This will ensure particles are initialized for the new sound
          console.log(`[DEBUG] Initializing particles for newly activated sound: ${sound}`);
        }
      }
    });
    
    // Update refs with current values
    activeVisualsRef.current = newActiveSet;
    
    // Deep copy the sound values to prevent reference issues
    Object.keys(soundValues).forEach(key => {
      lastSoundValuesRef.current[key as SoundType] = soundValues[key as SoundType];
    });
  }, [activeSounds, soundValues]);

  // Sync state to refs whenever particles change
  useEffect(() => {
    particlesRef.current = particles;
  }, [particles]);
  
  // Sync nextTriggers state to ref
  useEffect(() => {
    nextTriggersRef.current = nextTriggers;
  }, [nextTriggers]);
  
  // Sync flashAlpha state to ref
  useEffect(() => {
    flashAlphaRef.current = flashAlpha;
  }, [flashAlpha]);

  return (
    <canvas 
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10 w-full h-full"
      id="visual-effects-canvas"
    />
  );
} 
