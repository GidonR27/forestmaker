'use client';

import { useState, useEffect, useRef } from 'react';
import SoundEqualizer from './components/SoundEqualizer';
import ForestMatch from './components/ForestMatch';
import PiPMiniPlayer, { PiPMiniPlayerHandle } from './components/PiPMiniPlayer';
import { findMatchingForest, SoundProfile, SoundType } from './utils/forestMatcher';
import { Forest, forests } from './data/forests';
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
  const [hasInteracted, setHasInteracted] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [previousImage, setPreviousImage] = useState<string>('/assets/images/forest1.png');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextImageLoaded, setNextImageLoaded] = useState(false);
  const [isPiPVisible, setIsPiPVisible] = useState(false);
  const pipPlayerRef = useRef<PiPMiniPlayerHandle>(null);

  // Preload forest images
  useEffect(() => {
    const preloadImages = async () => {
      const imagePromises = forests.map((forest: Forest) => {
        return new Promise((resolve, reject) => {
          const img = new window.Image();
          img.src = forest.imageUrl;
          img.onload = resolve;
          img.onerror = reject;
        });
      });

      try {
        await Promise.all(imagePromises);
        setImagesLoaded(true);
      } catch (error) {
        console.error('Failed to preload images:', error);
      }
    };

    preloadImages();
  }, []);

  // Handle next image loading
  useEffect(() => {
    if (currentForest?.imageUrl) {
      const img = new window.Image();
      img.src = currentForest.imageUrl;
      img.onload = () => {
        setNextImageLoaded(true);
        // Start transition only after image is loaded
        setIsTransitioning(true);
        setTimeout(() => {
          setIsTransitioning(false);
          // Update previous image to match current after transition
          setPreviousImage(currentForest.imageUrl);
        }, 1000);
      };
    }
  }, [currentForest?.imageUrl]);

  const handleSoundChange = (activeSounds: SoundType[]) => {
    console.log('Page Sound Change:', {
      activeSounds,
      hasInteracted,
      currentForest
    });

    // Set hasInteracted to true on first interaction
    if (!hasInteracted) {
      setHasInteracted(true);
      console.log('First interaction detected');
    }

    // Update active sounds
    setActiveSounds(new Set(activeSounds));

    // Create a sound profile from the active sounds
    const soundProfile: SoundProfile = {} as SoundProfile;
    Object.keys(soundIcons).forEach((sound) => {
      // Use 0.5 for active sounds to match the initial value when toggling
      soundProfile[sound as SoundType] = activeSounds.includes(sound as SoundType) ? 0.5 : 0;
    });

    console.log('Sound Profile:', soundProfile);

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
