'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { audioAssets } from '../data/audioAssets';
import { audioManager } from '../utils/audioManager';
import { TbWind, TbDroplet, TbFeather, TbCloudStorm, TbDropletFilled, TbBug, TbDeer, TbFlame, TbMoodSmile, TbPray } from 'react-icons/tb';
import { SoundType } from '../utils/forestMatcher';

interface SoundEqualizerProps {
  onSoundChange: (sounds: SoundType[], soundValues?: Record<SoundType, number>) => void;
}

const soundIcons = {
  wind: TbWind,
  rain: TbDroplet,
  birds: TbFeather,
  thunder: TbCloudStorm,
  water: TbDropletFilled,
  insects: TbBug,
  mammals: TbDeer,
  fire: TbFlame,
  ambient: TbMoodSmile,
  spiritual: TbPray
} as const;

const soundLabels: Record<SoundType, string> = {
  wind: 'Wind',
  rain: 'Rain',
  birds: 'Birds',
  thunder: 'Thunder',
  water: 'Water',
  insects: 'Insects',
  mammals: 'Mammals',
  fire: 'Fire',
  ambient: 'Ambient',
  spiritual: 'Spiritual'
};

interface SoundState {
  value: number;
  isActive: boolean;
  showSlider?: boolean;
  targetValue?: number;
}

type SoundProfile = {
  [K in SoundType]: SoundState;
};

export default function SoundEqualizer({ onSoundChange }: SoundEqualizerProps) {
  const [sounds, setSounds] = useState<SoundProfile>(() => {
    const initial: SoundProfile = {} as SoundProfile;
    Object.keys(soundIcons).forEach((sound) => {
      initial[sound as SoundType] = { value: 0, isActive: false, showSlider: false, targetValue: 0 };
    });
    return initial;
  });

  const [activeSounds, setActiveSounds] = useState<SoundType[]>([]);
  const [hasInteracted, setHasInteracted] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const animationFrameRef = useRef<number>();
  const lastSliderUpdateRef = useRef<Record<SoundType, { time: number, intensity?: string }>>({} as Record<SoundType, { time: number, intensity?: string }>);
  const sliderThrottleTimeRef = useRef<Record<SoundType, NodeJS.Timeout>>({} as Record<SoundType, NodeJS.Timeout>);
  const isMouseDownRef = useRef<Record<SoundType, boolean>>({} as Record<SoundType, boolean>);
  const currentSoundRef = useRef<SoundType | null>(null);

  // Initialize mouse down ref
  useEffect(() => {
    Object.keys(soundIcons).forEach((sound) => {
      isMouseDownRef.current[sound as SoundType] = false;
    });
  }, []);

  const hasAudioAsset = (soundType: string): boolean => {
    return soundType in audioAssets;
  };

  // Get sound intensity based on value
  const getSoundIntensity = (value: number): 'soft' | 'moderate' | 'strong' => {
    if (value <= 0.33) return 'soft';
    if (value <= 0.66) return 'moderate';
    return 'strong';
  };

  // Track currently playing sounds and their intensities
  const currentlyPlayingRef = useRef<Record<SoundType, string>>({} as Record<SoundType, string>);

  // Handle audio playback with appropriate throttling
  const playSoundWithThrottle = useCallback(async (sound: SoundType, value: number) => {
    if (!hasAudioAsset(sound)) return;
    
    try {
      const now = Date.now();
      const lastUpdate = lastSliderUpdateRef.current[sound] || { time: 0 };
      const currentIntensity = getSoundIntensity(value);
      
      // If value is 0, just ensure sound is stopped and exit
      if (value === 0) {
        // Double-check that all instances are stopped
        const assetIds = Object.values(audioAssets[sound]).map(asset => asset.id);
        audioManager.ensureAllStopped(assetIds);
        // Clear currently playing reference
        currentlyPlayingRef.current[sound] = '';
        return;
      }
      
      // Skip if the last update was too recent and intensity hasn't changed
      if (now - lastUpdate.time < 150 && lastUpdate.intensity === currentIntensity) {
        return;
      }
      
      // Get asset for this intensity
      const asset = audioAssets[sound]?.find(a => a.intensity === currentIntensity);
      if (!asset) return;
      
      // Check if the same sound with the same intensity is already playing
      if (currentlyPlayingRef.current[sound] === asset.id) {
        // Same sound already playing, just update volume if needed
        console.log(`[Audio Debug] ${sound} already playing at ${currentIntensity} intensity, adjusting volume only`);
        const normalizedVolume = 0.3 + (value * 0.7);
        audioManager.setVolume(asset.id, normalizedVolume);
      } else {
        // Different intensity or not playing - stop the current one and start the new one
        console.log(`[Audio Debug] Changing ${sound} from ${currentlyPlayingRef.current[sound]} to ${asset.id}`);
        // Stop all instances of this sound type
        Object.values(audioAssets[sound]).forEach(a => {
          audioManager.stopSound(a.id);
        });
        
        // Update the last update time and intensity
        lastSliderUpdateRef.current[sound] = { 
          time: now,
          intensity: currentIntensity
        };
        
        // Only proceed if the value is greater than 0 (don't check state)
        if (value > 0) {
          const normalizedVolume = 0.3 + (value * 0.7);
          
          // Play the new sound
          await audioManager.playSound({
            id: asset.id,
            url: asset.url
          }, normalizedVolume);
          
          // Update currently playing reference
          currentlyPlayingRef.current[sound] = asset.id;
        }
      }
    } catch (error) {
      console.error(`Failed to handle audio for ${sound}:`, error);
      
      // Emergency cleanup on error
      if (hasAudioAsset(sound)) {
        Object.values(audioAssets[sound]).forEach(asset => {
          audioManager.stopSound(asset.id);
        });
        // Clear currently playing reference
        currentlyPlayingRef.current[sound] = '';
      }
    }
  }, [hasAudioAsset, sounds]);

  // Mouse move handler (defined at component level)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!currentSoundRef.current || !isMouseDownRef.current[currentSoundRef.current]) return;
    
    const sound = currentSoundRef.current;
    
    // Find the slider element
    const sliderElement = document.querySelector(`[data-sound="${sound}"]`);
    if (!sliderElement) return;
    
    const rect = sliderElement.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const height = rect.height;
    const value = Math.max(0, Math.min(1, 1 - (mouseY / height)));
    
    // Set state directly for immediate feedback
    setSounds(prev => ({
      ...prev,
      [sound]: {
        ...prev[sound],
        targetValue: value,
        value: value,
        isActive: value > 0,
        showSlider: true
      }
    }));
    
    // Process audio
    if (sliderThrottleTimeRef.current[sound]) {
      clearTimeout(sliderThrottleTimeRef.current[sound]);
    }
    sliderThrottleTimeRef.current[sound] = setTimeout(() => {
      playSoundWithThrottle(sound, value);
    }, 5);
    
    e.preventDefault();
  }, [setSounds, playSoundWithThrottle]);
  
  // Mouse up handler (defined at component level)
  const handleMouseUp = useCallback(() => {
    if (currentSoundRef.current) {
      isMouseDownRef.current[currentSoundRef.current] = false;
    }
    currentSoundRef.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // Smooth value updates - make it almost immediate for better responsiveness
  useEffect(() => {
    const updateValues = () => {
      let needsUpdate = false;
      const newSounds = { ...sounds };

      Object.entries(sounds).forEach(([sound, state]) => {
        if (state.targetValue !== undefined && state.value !== state.targetValue) {
          // Faster transition to target value (0.5 = very responsive)
          const diff = state.targetValue - state.value;
          const step = diff * 0.5; 
          
          if (Math.abs(diff) > 0.001) {
            newSounds[sound as SoundType] = {
              ...state,
              value: state.value + step
            };
            needsUpdate = true;
          } else {
            newSounds[sound as SoundType] = {
              ...state,
              value: state.targetValue
            };
            needsUpdate = true;
          }
        }
      });

      if (needsUpdate) {
        setSounds(newSounds);
      }

      animationFrameRef.current = requestAnimationFrame(updateValues);
    };

    animationFrameRef.current = requestAnimationFrame(updateValues);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [sounds]);

  // Debounced forest update - with increased delay
  useEffect(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      // Create a map of active sounds with their current values
      const activeSoundsWithValues = Object.entries(sounds)
        .filter(([_, sound]) => sound.isActive && sound.value > 0)
        .map(([name, sound]) => ({
          name: name as SoundType,
          value: sound.value
        }));
        
      // Debug log all active sounds before filtering
      console.log('[DEBUG] All active sounds before filtering:', 
        activeSoundsWithValues.map(s => `${s.name}:${s.value.toFixed(2)}`));

      // Sort by value to prioritize stronger sounds
      activeSoundsWithValues.sort((a, b) => b.value - a.value);
      
      // Debug log sorted sounds
      console.log('[DEBUG] Sorted active sounds by value:',
        activeSoundsWithValues.map(s => `${s.name}:${s.value.toFixed(2)}`));

      // ISSUE: This limits to top 3 sounds, removing any after the top 3
      // Take only the top 3 sounds to avoid overwhelming the forest matching
      // const topSounds = activeSoundsWithValues.slice(0, 3).map(s => s.name);
      
      // FIXED: Use all active sounds instead of limiting to top 3
      const topSounds = activeSoundsWithValues.map(s => s.name);
      
      // Debug log selected sounds
      console.log('[DEBUG] Selected sounds for visuals:', topSounds);
      
      // Create a values map for all sounds
      const soundValues: Record<SoundType, number> = {} as Record<SoundType, number>;
      Object.entries(sounds).forEach(([name, sound]) => {
        soundValues[name as SoundType] = sound.isActive ? sound.value : 0;
      });
      
      if (JSON.stringify(topSounds) !== JSON.stringify(activeSounds)) {
        console.log('Updating active sounds:', {
          topSounds,
          currentActiveSounds: activeSounds,
          allSounds: sounds
        });
        setActiveSounds(topSounds);
        onSoundChange(topSounds, soundValues);
      }
    }, 350); // Increased debounce delay from 100ms to 350ms
  }, [sounds, activeSounds, onSoundChange]);

  // Load audio assets on mount
  useEffect(() => {
    const loadAudioAssets = async () => {
      try {
        await audioManager.initialize();
        // Load all audio assets
        Object.values(audioAssets).forEach(assets => {
          assets.forEach(asset => {
              audioManager.loadSound({
                id: asset.id,
                url: asset.url
            });
          });
        });
      } catch (error) {
        console.error('Failed to load audio assets:', error);
      }
    };

    loadAudioAssets();
    return () => {
      audioManager.cleanup();
    };
  }, []);

  // Memoize the slider change handler with throttling
  const handleSliderChange = useCallback((sound: SoundType, value: number) => {
    // Clear existing timeout for this sound
    if (sliderThrottleTimeRef.current[sound]) {
      clearTimeout(sliderThrottleTimeRef.current[sound]);
    }
    
    // Update the sound state (visual feedback immediately)
    setSounds(prev => ({
      ...prev,
      [sound]: {
        ...prev[sound],
        targetValue: value,
        isActive: value > 0,
        showSlider: true
      }
    }));
    
    // Throttle the actual audio playback - use minimal delay
    sliderThrottleTimeRef.current[sound] = setTimeout(() => {
      playSoundWithThrottle(sound, value);
    }, 10); // Reduced to minimum (10ms) for maximum responsiveness
    
  }, [sounds, playSoundWithThrottle]);

  // Memoize the icon click handler
  const handleIconClick = useCallback(async (sound: SoundType) => {
    console.log('Icon Click:', {
      sound,
      currentState: sounds[sound],
      hasAudio: hasAudioAsset(sound)
    });

    const newValue = sounds[sound].isActive ? 0 : 0.25;
    const newIsActive = !sounds[sound].isActive;
    
    // Update the sound state
    setSounds(prev => ({
      ...prev,
      [sound]: {
        ...prev[sound],
        targetValue: newValue,
        isActive: newIsActive,
        showSlider: true
      }
    }));

    if (hasAudioAsset(sound)) {
      try {
        // If deactivating, stop the sound
        if (!newIsActive) {
          const assetIds = Object.values(audioAssets[sound]).map(asset => asset.id);
          audioManager.ensureAllStopped(assetIds);
          // Clear currently playing reference
          currentlyPlayingRef.current[sound] = '';
          return;
        }
        
        // If activating, play the sound unless it's already playing
        const currentIntensity = 'soft'; // Always start with soft when activating via icon
        const asset = audioAssets[sound]?.find(a => a.intensity === currentIntensity);
        
        if (asset) {
          // Check if this exact sound is already playing
          if (currentlyPlayingRef.current[sound] !== asset.id) {
            // Stop any other sounds of this type first
            const assetIds = Object.values(audioAssets[sound]).map(a => a.id);
            audioManager.ensureAllStopped(assetIds);
            
            // Play the new sound
            await audioManager.playSound({
              id: asset.id,
              url: asset.url
            }, 0.25);
            
            // Update currently playing reference
            currentlyPlayingRef.current[sound] = asset.id;
          } else {
            console.log(`[Audio Debug] ${sound} already playing at soft intensity, not restarting`);
          }
        }
      } catch (error) {
        console.error(`Failed to handle audio for ${sound}:`, error);
        
        // Emergency cleanup on error
        if (hasAudioAsset(sound)) {
          Object.values(audioAssets[sound]).forEach(asset => {
            audioManager.stopSound(asset.id);
          });
          // Clear currently playing reference
          currentlyPlayingRef.current[sound] = '';
        }
      }
    }
  }, [sounds, hasAudioAsset]);

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 p-4 md:p-6 z-50"
      onTouchMove={(e) => {
        // Prevent scrolling on mobile devices
        e.preventDefault();
      }}
    >
      <div className="grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-4">
        {Object.entries(sounds).map(([sound, state]) => {
            const Icon = soundIcons[sound as keyof typeof soundIcons];
          const isActive = state.isActive;
            const hasAudio = hasAudioAsset(sound);
            return (
              <div key={sound} className="flex flex-col items-center gap-4 md:gap-6">
              {/* Slider container - hidden on mobile until interaction */}
              <div 
                className={`relative h-32 md:h-36 w-16 flex items-center justify-center transition-all duration-300 ${
                state.showSlider ? 'opacity-100' : 'opacity-0 md:opacity-100'
                } hover:scale-105`}
                data-sound={sound}
                style={{ cursor: 'pointer' }}
                // Touch handlers for mobile/iOS
                onTouchStart={(e) => {
                  // Immediately calculate the value based on touch position
                  const rect = e.currentTarget.getBoundingClientRect();
                  const touchY = e.touches[0].clientY - rect.top;
                  const height = rect.height;
                  const value = Math.max(0, Math.min(1, 1 - (touchY / height)));
                  
                  // Set state directly for immediate feedback
                  setSounds(prev => ({
                    ...prev,
                    [sound as SoundType]: {
                      ...prev[sound as SoundType],
                      targetValue: value,
                      value: value, // Direct update for immediate response
                      isActive: value > 0,
                      showSlider: true
                    }
                  }));
                  
                  // Process audio with minimal delay
                  if (sliderThrottleTimeRef.current[sound as SoundType]) {
                    clearTimeout(sliderThrottleTimeRef.current[sound as SoundType]);
                  }
                  sliderThrottleTimeRef.current[sound as SoundType] = setTimeout(() => {
                    playSoundWithThrottle(sound as SoundType, value);
                  }, 5);
                  
                  e.stopPropagation();
                }}
                onTouchMove={(e) => {
                  // Immediately calculate the value based on touch position
                  const rect = e.currentTarget.getBoundingClientRect();
                  const touchY = e.touches[0].clientY - rect.top;
                  const height = rect.height;
                  const value = Math.max(0, Math.min(1, 1 - (touchY / height)));
                  
                  // Set state directly for immediate feedback  
                  setSounds(prev => ({
                    ...prev,
                    [sound as SoundType]: {
                      ...prev[sound as SoundType],
                      targetValue: value,
                      value: value, // Direct update for immediate response
                      isActive: value > 0,
                      showSlider: true
                    }
                  }));
                  
                  // Process audio with minimal delay
                  if (sliderThrottleTimeRef.current[sound as SoundType]) {
                    clearTimeout(sliderThrottleTimeRef.current[sound as SoundType]);
                  }
                  sliderThrottleTimeRef.current[sound as SoundType] = setTimeout(() => {
                    playSoundWithThrottle(sound as SoundType, value);
                  }, 5);
                  
                  e.preventDefault(); // Prevent scrolling while dragging
                  e.stopPropagation();
                }}
                // Mouse handlers for desktop browsers
                onMouseDown={(e) => {
                  // Set the current sound and mouse down flag
                  currentSoundRef.current = sound as SoundType;
                  isMouseDownRef.current[sound as SoundType] = true;
                  
                  // Calculate value based on mouse position
                  const rect = e.currentTarget.getBoundingClientRect();
                  const mouseY = e.clientY - rect.top;
                  const height = rect.height;
                  const value = Math.max(0, Math.min(1, 1 - (mouseY / height)));
                  
                  // Set state directly for immediate feedback
                  setSounds(prev => ({
                    ...prev,
                    [sound as SoundType]: {
                      ...prev[sound as SoundType],
                      targetValue: value,
                      value: value,
                      isActive: value > 0,
                      showSlider: true
                    }
                  }));
                  
                  // Process audio
                  if (sliderThrottleTimeRef.current[sound as SoundType]) {
                    clearTimeout(sliderThrottleTimeRef.current[sound as SoundType]);
                  }
                  sliderThrottleTimeRef.current[sound as SoundType] = setTimeout(() => {
                    playSoundWithThrottle(sound as SoundType, value);
                  }, 5);
                  
                  // Add window-level event listeners for mouse move and mouse up
                  window.addEventListener('mousemove', handleMouseMove);
                  window.addEventListener('mouseup', handleMouseUp);
                  
                  // Prevent default to avoid text selection
                  e.preventDefault();
                }}
              >
                  {/* Slider track background - with extended hitbox */}
                  <div className="absolute inset-0 w-6 md:w-8 mx-auto rounded-full bg-gray-700/30 cursor-pointer before:content-[''] before:absolute before:inset-0 before:w-12 before:md:w-16 before:mx-auto" />
                  
                  {/* Active track */}
                  <div 
                    className={`absolute bottom-0 w-6 md:w-8 mx-auto rounded-full transition-all ${
                      isActive 
                        ? hasAudio 
                          ? 'bg-blue-500/30' 
                          : 'bg-purple-500/50'
                        : 'bg-gray-500/30'
                    }`}
                  style={{ height: `${state.value * 100}%` }}
                  />
                  
                  {/* Tick marks for the scale - positioned on both sides */}
                  <div className="absolute inset-y-0 w-full flex flex-col justify-between py-4 pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="w-full flex justify-between items-center px-3">
                        <div className="w-2 h-0.5 bg-gray-400/40"></div>
                        <div className="w-2 h-0.5 bg-gray-400/40"></div>
                      </div>
                    ))}
                  </div>

                  {/* Slider tip/handle */}
                  <div 
                    className="absolute transition-all bg-gray-500/95 pointer-events-none hover:scale-110"
                    style={{
                      width: '32px',
                      height: '18px',
                      bottom: `calc(${Math.max(0.05, state.value) * 100}%)`,
                      transform: 'translateY(50%)',
                      left: 'calc(50% - 16px)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    {/* Central black vertical line - positioned exactly in center */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-2 -translate-x-1/2 bg-black/80"></div>
                    
                    {/* Horizontal lines inside the handle */}
                    <div className="absolute inset-0 flex flex-col justify-center items-center">
                      <div className="w-full flex items-center justify-center my-0.5">
                        <div className="w-full h-0.5 bg-gray-700/80 mx-2"></div>
                      </div>
                      <div className="w-full flex items-center justify-center my-0.5">
                        <div className="w-full h-0.5 bg-gray-700/80 mx-2"></div>
                      </div>
                      <div className="w-full flex items-center justify-center my-0.5">
                        <div className="w-full h-0.5 bg-gray-700/80 mx-2"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Icon and label with blurred background */}
              <div className="flex flex-col items-center gap-1 bg-black/10 backdrop-blur-md rounded-lg px-3 py-2">
                  <button
                    onClick={() => handleIconClick(sound as SoundType)}
                  className={`p-2 md:p-2 rounded-full transition-all transform hover:scale-110 touch-manipulation ${
                      isActive 
                        ? hasAudio
                          ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                          : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                        : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                    }`}
                    aria-label={`Toggle ${soundLabels[sound as keyof typeof soundLabels]}`}
                  >
                  <Icon className="w-6 h-6 md:w-6 md:h-6" />
                  </button>
                  <span className={`text-[10px] md:text-xs font-medium ${
                    isActive 
                      ? hasAudio 
                        ? 'text-white' 
                        : 'text-white'
                      : 'text-white/60'
                  }`}>
                    {soundLabels[sound as keyof typeof soundLabels]}
                  </span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
} 