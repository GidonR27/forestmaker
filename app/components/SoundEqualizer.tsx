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

  // Smooth value updates
  useEffect(() => {
    const updateValues = () => {
      let needsUpdate = false;
      const newSounds = { ...sounds };

      Object.entries(sounds).forEach(([sound, state]) => {
        if (state.targetValue !== undefined && state.value !== state.targetValue) {
          // Smooth transition to target value
          const diff = state.targetValue - state.value;
          const step = diff * 0.1; // Adjust this value to control smoothing speed
          
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
        
        // Only proceed if the sound is still active
        if (sounds[sound].isActive && value > 0) {
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
    
    // Throttle the actual audio playback
    sliderThrottleTimeRef.current[sound] = setTimeout(() => {
      playSoundWithThrottle(sound, value);
    }, 50); // Small delay to avoid too many rapid changes
    
  }, [sounds, playSoundWithThrottle]);

  // Memoize the icon click handler
  const handleIconClick = useCallback(async (sound: SoundType) => {
    console.log('Icon Click:', {
      sound,
      currentState: sounds[sound],
      hasAudio: hasAudioAsset(sound)
    });

    const newValue = sounds[sound].isActive ? 0 : 0.5;
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
            }, 0.3);
            
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
    <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 z-50">
      <div className="grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-4">
        {Object.entries(sounds).map(([sound, state]) => {
            const Icon = soundIcons[sound as keyof typeof soundIcons];
          const isActive = state.isActive;
            const hasAudio = hasAudioAsset(sound);
            return (
              <div key={sound} className="flex flex-col items-center gap-2">
              {/* Slider container - hidden on mobile until interaction */}
              <div className={`relative h-32 md:h-36 w-12 flex items-center justify-center transition-all duration-300 ${
                state.showSlider ? 'opacity-100' : 'opacity-0 md:opacity-100'
              }`}>
                  {/* Slider track background */}
                  <div className="absolute inset-0 w-2 mx-auto rounded-full bg-gray-700/30" />
                  
                  {/* Active track */}
                  <div 
                    className={`absolute bottom-0 w-2 mx-auto rounded-full transition-all ${
                      isActive 
                        ? hasAudio 
                          ? 'bg-blue-500/50' 
                          : 'bg-purple-500/50'
                        : 'bg-gray-500/30'
                    }`}
                  style={{ height: `${state.value * 100}%` }}
                  />
                  
                {/* Slider input with increased touch area */}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                  value={state.value}
                    onChange={(e) => handleSliderChange(sound as SoundType, parseFloat(e.target.value))}
                  className="absolute h-full w-8 md:w-2 appearance-none bg-transparent cursor-pointer touch-manipulation"
                    style={{
                      WebkitAppearance: 'slider-vertical',
                    }}
                  />
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