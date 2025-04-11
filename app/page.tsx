'use client';

import { useState, useEffect, useRef } from 'react';
import SoundEqualizer from './components/SoundEqualizer';
import ForestMatch from './components/ForestMatch';
import PiPMiniPlayer, { PiPMiniPlayerHandle } from './components/PiPMiniPlayer';
import VisualEffects from './components/VisualEffects';
import { findMatchingForest, SoundProfile, SoundType } from './utils/forestMatcher';
import { Forest, forests } from './data/forests';
import { setupMediaSession, updateMediaSessionMetadata, setMediaSessionPlaybackState } from './utils/mediaSession';
import { audioManager } from './utils/audioManager';
import Image from 'next/image';
import { TbWind, TbDroplet, TbFeather, TbCloudStorm, TbDropletFilled, TbBug, TbDeer, TbFlame, TbMoodSmile, TbPray, TbPictureInPicture, TbPictureInPictureOff } from 'react-icons/tb';

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

export default function Home() {
  const [currentForest, setCurrentForest] = useState<Forest | null>(null);
  const [activeSounds, setActiveSounds] = useState<Set<SoundType>>(new Set());
  const [soundValues, setSoundValues] = useState<Record<SoundType, number>>({
    wind: 0,
    rain: 0,
    birds: 0,
    thunder: 0,
    water: 0,
    insects: 0,
    mammals: 0,
    fire: 0,
    ambient: 0,
    spiritual: 0
  });
  const [hasInteracted, setHasInteracted] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [previousImage, setPreviousImage] = useState<string>('/assets/images/forest1.png');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextImageLoaded, setNextImageLoaded] = useState(false);
  const [isPiPVisible, setIsPiPVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const pipPlayerRef = useRef<PiPMiniPlayerHandle>(null);
  const lastSoundValuesRef = useRef<Record<SoundType, number>>(soundValues);

  // Setup Media Session API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setupMediaSession({
        forestName: currentForest?.name || 'Forest Sound',
        handlers: {
          onPlay: () => {
            // Resume playback if paused
            if (isPaused) {
              // Restore the last sound values
              const soundsToResume = Object.entries(lastSoundValuesRef.current)
                .filter(([_, value]) => value > 0)
                .map(([sound]) => sound as SoundType);
              
              handleSoundChange(Array.from(soundsToResume), lastSoundValuesRef.current);
              setIsPaused(false);
              setMediaSessionPlaybackState('playing');
            }
          },
          onPause: () => {
            // Store current sound values before pausing
            lastSoundValuesRef.current = {...soundValues};
            
            // Pause all sounds
            audioManager.stopAllSounds();
            setIsPaused(true);
            setMediaSessionPlaybackState('paused');
          },
          onStop: () => {
            // Stop all sounds
            audioManager.stopAllSounds();
            setIsPaused(true);
            setMediaSessionPlaybackState('none');
          }
        }
      });
    }
  }, []);

  // Update Media Session metadata when forest changes
  useEffect(() => {
    if (currentForest && typeof window !== 'undefined') {
      updateMediaSessionMetadata(currentForest.name);
    }
  }, [currentForest]);

  // Preload forest images
  useEffect(() => {
    const preloadImages = async () => {
      console.log('[DEBUG] Starting to preload forest images');
      const imagePromises = forests.map((forest: Forest) => {
        return new Promise((resolve, reject) => {
          console.log(`[DEBUG] Loading image: ${forest.name} - ${forest.imageUrl}`);
          const img = new window.Image();
          
          // Set a timeout to catch hanging image loads
          const timeout = setTimeout(() => {
            console.error(`[ERROR] Timeout loading image: ${forest.imageUrl}`);
            reject(new Error(`Timeout loading image: ${forest.imageUrl}`));
          }, 10000);
          
          img.onload = () => {
            clearTimeout(timeout);
            console.log(`[DEBUG] Successfully loaded image: ${forest.imageUrl}`);
            resolve(null);
          };
          
          img.onerror = (error) => {
            clearTimeout(timeout);
            console.error(`[ERROR] Failed to load image: ${forest.imageUrl}`, error);
            // Try to detect if the image path is wrong
            fetch(forest.imageUrl)
              .then(response => {
                if (!response.ok) {
                  console.error(`[ERROR] Image fetch failed with status: ${response.status} for ${forest.imageUrl}`);
                }
              })
              .catch(fetchError => {
                console.error(`[ERROR] Image fetch failed completely: ${fetchError}`);
              });
            reject(error);
          };
          
          img.src = forest.imageUrl;
        });
      });

      try {
        await Promise.all(imagePromises);
        console.log('[DEBUG] All forest images preloaded successfully');
        setImagesLoaded(true);
      } catch (error) {
        console.error('[ERROR] Failed to preload images:', error);
        // Continue anyway to allow the app to function
        setImagesLoaded(true);
      }
    };

    preloadImages();
  }, []);

  // Handle next image loading
  useEffect(() => {
    if (currentForest?.imageUrl) {
      console.log(`[DEBUG] Loading current forest image: ${currentForest.imageUrl}`);
      const img = new window.Image();
      
      img.onload = () => {
        console.log(`[DEBUG] Current forest image loaded successfully: ${currentForest.imageUrl}`);
        setNextImageLoaded(true);
        // Start transition only after image is loaded
        setIsTransitioning(true);
        setTimeout(() => {
          setIsTransitioning(false);
          // Update previous image to match current after transition
          setPreviousImage(currentForest.imageUrl);
        }, 1000);
      };
      
      img.onerror = (error) => {
        console.error(`[ERROR] Failed to load current forest image: ${currentForest.imageUrl}`, error);
        // Try to continue anyway with a fallback
        setNextImageLoaded(true);
        setIsTransitioning(true);
        setTimeout(() => {
          setIsTransitioning(false);
          // Use the last successful image as fallback
          setPreviousImage(previousImage);
        }, 1000);
      };
      
      img.src = currentForest.imageUrl;
    }
  }, [currentForest?.imageUrl, previousImage]);

  const handleSoundChange = (activeSounds: SoundType[], sliderValues?: Record<SoundType, number>) => {
    console.log('Page Sound Change:', {
      activeSounds,
      hasInteracted,
      currentForest
    });
    
    // Debug log for fire sound specifically
    if (activeSounds.includes('fire')) {
      console.log('[DEBUG] Fire sound is included in activeSounds array');
    } else {
      console.log('[DEBUG] Fire sound is NOT included in activeSounds array');
      // List all active sounds for debugging
      console.log('[DEBUG] Active sounds:', activeSounds);
    }

    // Set hasInteracted to true on first interaction
    if (!hasInteracted) {
      setHasInteracted(true);
      console.log('First interaction detected');
    }

    // Update active sounds
    setActiveSounds(new Set(activeSounds));
    
    // Debug log after setting active sounds
    console.log('[DEBUG] After setting activeSounds, size:', activeSounds.length);

    // Create a sound profile from the active sounds or use provided values
    const soundProfile: SoundProfile = {} as SoundProfile;
    const newSoundValues: Record<SoundType, number> = { ...soundValues };
    
    if (sliderValues) {
      // If we have explicit slider values from the SoundEqualizer, use those
      Object.keys(soundIcons).forEach((sound) => {
        const soundType = sound as SoundType;
        const value = sliderValues[soundType] || 0;
        soundProfile[soundType] = value;
        newSoundValues[soundType] = value;
      });
      
      // Update sound values for visual effects
      setSoundValues(newSoundValues);
    } else {
      // Otherwise use default values based on active sounds
      Object.keys(soundIcons).forEach((sound) => {
        // Use 0.5 for active sounds to match the initial value when toggling
        const isActive = activeSounds.includes(sound as SoundType);
        soundProfile[sound as SoundType] = isActive ? 0.5 : 0;
        newSoundValues[sound as SoundType] = isActive ? 0.5 : 0;
      });
      
      // Update sound values for visual effects
      setSoundValues(newSoundValues);
    }

    console.log('Sound Profile:', soundProfile);

    // Update media session state
    if (activeSounds.length > 0) {
      setMediaSessionPlaybackState('playing');
      setIsPaused(false);
    } else {
      setMediaSessionPlaybackState('none');
    }

    // Only find matching forest if there are active sounds
    if (activeSounds.length > 0) {
      const matchingForest = findMatchingForest(soundProfile, new Set(activeSounds));
      console.log('Matching Forest:', matchingForest);
      
      if (matchingForest && (!currentForest || currentForest.id !== matchingForest.id)) {
        // Store current image as previous
        setPreviousImage(currentForest?.imageUrl || '/assets/images/forest1.png');
        // Reset transition state
        setNextImageLoaded(false);
        setIsTransitioning(false);
        // Update forest (this will trigger the image loading effect)
        setCurrentForest(matchingForest);
        
        // Update media session metadata with new forest
        if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
          updateMediaSessionMetadata(matchingForest.name);
        }
      }
    } else {
      console.log('No active sounds, clearing forest');
      // Store current image as previous
      setPreviousImage(currentForest?.imageUrl || '/assets/images/forest1.png');
      // Reset transition state
      setNextImageLoaded(false);
      setIsTransitioning(false);
      // Clear forest (this will trigger the image loading effect)
      setCurrentForest(null);
    }
  };

  // Toggle PiP visibility
  const togglePiP = () => {
    // If currently visible and about to be hidden, need to ensure audio cleanup
    if (isPiPVisible) {
      console.log('Hiding PiP via toggle button - ensuring audio cleanup');
      
      // First try to use the direct ref method (most reliable)
      if (pipPlayerRef.current) {
        console.log('Calling direct cleanup method via ref');
        pipPlayerRef.current.cleanupAudio();
      }
      
      // Then set state to hide component
      setIsPiPVisible(false);
      
      // Finally, as a fallback, import audioManager for direct access
      // (this will handle cleanup even if component is already unmounted)
      import('./utils/audioManager').then(({ audioManager }) => {
        // Make sure we clean up audio connections when toggling off
        if (audioManager) {
          console.log('Toggle button: Restoring main page audio via fallback');
          // Reset PiP connections
          audioManager.connectToPiP = undefined;
          // Unmute main page
          if (typeof audioManager.setMainPageMasterGain === 'function') {
            audioManager.setMainPageMasterGain(null);
          }
          // Full cleanup
          if (typeof audioManager.clearPiPConnections === 'function') {
            audioManager.clearPiPConnections();
          }
        }
      });
    } else {
      // Just show the miniplayer if currently hidden
      setIsPiPVisible(true);
    }
  };

  // Handle PiP mini player being closed
  const handlePiPClose = () => {
    console.log('PiP mini player closed by user');
    setIsPiPVisible(false);
  };

  return (
    <main className="fixed inset-0 overflow-hidden">
      {/* Background image with transition */}
      <div className="fixed inset-0 z-0">
        {/* Previous image */}
        <div 
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <Image
            src={previousImage}
            alt="Previous Forest"
            fill
            priority
            className="object-cover"
            sizes="100vw"
            quality={90}
          />
        </div>
        {/* Current image */}
        <div 
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            isTransitioning && nextImageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={currentForest?.imageUrl || '/assets/images/forest1.png'}
            alt={currentForest?.name || 'Default Forest'}
            fill
            priority
            className="object-cover"
            sizes="100vw"
            quality={90}
          />
        </div>
      </div>

      {/* Visual Effects Canvas */}
      {hasInteracted && (
        <VisualEffects 
          activeSounds={activeSounds} 
          soundValues={soundValues} 
        />
      )}

      {/* Content */}
      <div className="relative h-full flex flex-col">
        {/* PiP Toggle Button - Hidden on desktop, visible on mobile */}
        <div className="fixed top-4 right-4 z-50 flex flex-row items-center md:hidden">
          <span className="text-white text-xs bg-black/10 px-3 py-1.5 rounded-l-md whitespace-nowrap">
            Play in background
          </span>
          <button
            onClick={togglePiP}
            className="bg-black/10 hover:bg-black/20 text-white p-2 rounded-r-md"
            aria-label={isPiPVisible ? "Hide Picture-in-Picture" : "Show Picture-in-Picture"}
            title={isPiPVisible ? "Hide Picture-in-Picture" : "Show Picture-in-Picture"}
          >
            {isPiPVisible ? <TbPictureInPictureOff size={20} /> : <TbPictureInPicture size={20} />}
          </button>
        </div>

        {/* Forest Match - Positioned below the PiP button */}
        <div className="flex-none pt-16 md:pt-20 px-4">
          <ForestMatch forest={currentForest} />
        </div>

        {/* Sound Equalizer - Fixed at bottom */}
        <div className="flex-none">
          <div className="w-full py-6">
            <SoundEqualizer onSoundChange={handleSoundChange} />
          </div>
        </div>
        
        {/* PiP Mini Player */}
        <PiPMiniPlayer 
          ref={pipPlayerRef}
          forest={currentForest} 
          activeSounds={activeSounds} 
          isVisible={isPiPVisible}
          onClose={handlePiPClose}
        />
      </div>
    </main>
  );
}
