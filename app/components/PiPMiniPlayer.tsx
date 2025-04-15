'use client';

import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { audioManager } from '../utils/audioManager';
import { Forest } from '../data/forests';
import { IconButton } from './IconButton';
import { TbPictureInPicture, TbDeviceMobile, TbCast } from 'react-icons/tb';

// Extend HTMLVideoElement with webkit-specific properties
declare global {
  interface HTMLVideoElement {
    webkitSupportsPresentationMode?: (mode: string) => boolean;
    webkitSetPresentationMode?: (mode: string) => void;
    webkitPresentationMode?: string;
  }
}

interface PiPMiniPlayerProps {
  forest: Forest | null;
  activeSounds: Set<string>;
  isVisible: boolean;
  onClose?: () => void;
}

// Export a type for the imperative handle
export interface PiPMiniPlayerHandle {
  cleanupAudio: () => void;
}

// Forward ref to expose imperative methods
export default forwardRef<PiPMiniPlayerHandle, PiPMiniPlayerProps>(function PiPMiniPlayer(
  { forest, activeSounds, isVisible, onClose }, 
  ref
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPiPActive, setIsPiPActive] = useState<boolean>(false);
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const frameCountRef = useRef<number>(0);
  const lastFrameTimeRef = useRef(Date.now());
  const frameRatesRef = useRef<number[]>([]);
  const debugLogIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastVisibilityStateRef = useRef<string>('visible');
  const hasPendingForegroundTransitionRef = useRef<boolean>(false);
  const prevVisibleRef = useRef<boolean>(false);

  // Initialize browser-only values after mount
  useEffect(() => {
    // Set initial values that depend on browser APIs
    startTimeRef.current = performance.now();
    if (typeof document !== 'undefined') {
      lastVisibilityStateRef.current = document.visibilityState;
    }
    // Initialize previous visibility
    prevVisibleRef.current = isVisible;
  }, []);

  // Add webkit-specific attributes using useEffect instead of inline JSX
  useEffect(() => {
    if (videoRef.current) {
      // iOS Safari requires these attributes for PiP to work properly
      videoRef.current.setAttribute("webkit-playsinline", "true");
      // Set AirPlay to always show
      videoRef.current.setAttribute("x-webkit-airplay", "allow");
      // Add webkitShowPlaybackTargetPicker to enable AirPlay button
      videoRef.current.setAttribute("webkitShowPlaybackTargetPicker", "true");
      // Add additional attributes for AirPlay/Cast
      videoRef.current.setAttribute("airplay", "allow");
      // Ensure controls list doesn't hide AirPlay button
      videoRef.current.setAttribute("controlsList", "nodownload");
      // Ensure remote playback is enabled
      videoRef.current.setAttribute("disableRemotePlayback", "false");

      // For Safari, we need to add a custom AirPlay button show function if available
      if (typeof (videoRef.current as any).showPlaybackTargetPicker === 'function') {
        console.log('[PiP Debug] Device supports showPlaybackTargetPicker API');
        // Add a click handler on the video controls to show AirPlay options
        videoRef.current.addEventListener('webkitplaybacktargetavailabilitychanged', (event: any) => {
          console.log('[PiP Debug] Playback target availability changed:', event.availability);
        });
      }
    }
  }, [videoRef.current]);

  // Setup debug logging interval
  useEffect(() => {
    if (!isVisible || typeof document === 'undefined') return;

    // Log performance metrics every 3 seconds
    debugLogIntervalRef.current = setInterval(() => {
      const isDocumentHidden = document.hidden;
      const avgFrameRate = frameRatesRef.current.length > 0 
        ? frameRatesRef.current.reduce((sum, rate) => sum + rate, 0) / frameRatesRef.current.length 
        : 0;
      
      console.log(`[PiP Debug] Stats:`, {
        isPiPActive,
        isPlaying,
        isDocumentHidden,
        frameCount: frameCountRef.current,
        avgFrameRate: avgFrameRate.toFixed(2),
        activeSoundCount: activeSounds.size,
        documentVisibilityState: document.visibilityState,
        videoState: videoRef.current ? {
          paused: videoRef.current.paused,
          currentTime: videoRef.current.currentTime,
          readyState: videoRef.current.readyState,
          networkState: videoRef.current.networkState,
        } : 'not available'
      });
      
      // Reset frame rate tracking
      frameRatesRef.current = [];
    }, 3000);
    
    return () => {
      if (debugLogIntervalRef.current) {
        clearInterval(debugLogIntervalRef.current);
      }
    };
  }, [isVisible, isPiPActive, isPlaying, activeSounds]);

  // Add visibility change listener
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      console.log(`[PiP Debug] Visibility changed: ${document.visibilityState}, previous: ${lastVisibilityStateRef.current}`);
      
      // Detect transition from hidden to visible (returning from background)
      if (document.visibilityState === 'visible' && lastVisibilityStateRef.current === 'hidden') {
        console.log('[PiP Debug] Returning from background');
        
        // Mark that we have a pending foreground transition to handle
        if (isPiPActive) {
          console.log('[PiP Debug] Setting pending foreground transition flag');
          hasPendingForegroundTransitionRef.current = true;
          
          // Set a timeout to reset the flag if it doesn't get handled
          setTimeout(() => {
            hasPendingForegroundTransitionRef.current = false;
          }, 5000);
        }
      }
      
      if (document.visibilityState === 'hidden' && videoRef.current) {
        console.log('[PiP Debug] Document hidden - checking video state');
        console.log(`[PiP Debug] Video paused: ${videoRef.current.paused}`);
      }
      
      // Update last visibility state
      lastVisibilityStateRef.current = document.visibilityState;
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPiPActive]);

  // Check for device and PiP support on mount
  useEffect(() => {
    if (typeof navigator === 'undefined' || typeof document === 'undefined') return;
    
    // Check if iOS device
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // Check PiP support
    const video = document.createElement('video');
    const hasPiPAPI = typeof video.requestPictureInPicture === 'function';
    const hasPiPEnabled = document.pictureInPictureEnabled;
    
    // iOS Safari doesn't support standard PiP API but has its own implementation
    const isIOSSafari = isIOSDevice && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const supportsPiP = isIOSSafari || (hasPiPAPI && hasPiPEnabled);
    
    setIsPiPSupported(supportsPiP);
    
    console.log('[PiP Debug] Device detection:', {
      isIOS: isIOSDevice,
      isIOSSafari,
      hasPiPAPI,
      hasPiPEnabled,
      supportsPiP
    });
  }, []);

  // Handle creating and updating the canvas with the forest image
  useEffect(() => {
    if (!canvasRef.current || !isVisible) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = 640;
    canvas.height = 360;
    
    // Load and draw the forest image
    const loadImage = () => {
      if (!forest) return;
      
      const img = new Image();
      imageRef.current = img;
      img.crossOrigin = 'anonymous';
      img.src = forest.imageUrl;
      
      img.onload = () => {
        console.log(`[PiP Debug] Forest image loaded: ${forest.name}`);
        
        // Draw image to canvas
        const drawImage = () => {
          if (!ctx || !img) return;
          
          // Calculate frame rate
          const now = Date.now();
          const elapsed = now - lastFrameTimeRef.current;
          const fps = elapsed > 0 ? 1000 / elapsed : 0;
          frameRatesRef.current.push(fps);
          lastFrameTimeRef.current = now;
          
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw image (maintaining aspect ratio)
          const imgRatio = img.width / img.height;
          const canvasRatio = canvas.width / canvas.height;
          
          let drawWidth, drawHeight, x, y;
          
          if (imgRatio > canvasRatio) {
            // Image is wider than canvas (relative to height)
            drawHeight = canvas.height;
            drawWidth = img.width * (canvas.height / img.height);
            x = (canvas.width - drawWidth) / 2;
            y = 0;
          } else {
            // Image is taller than canvas (relative to width)
            drawWidth = canvas.width;
            drawHeight = img.height * (canvas.width / img.width);
            x = 0;
            y = (canvas.height - drawHeight) / 2;
          }
          
          ctx.drawImage(img, x, y, drawWidth, drawHeight);
          
          // Add forest name as text
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
          ctx.font = '20px Arial';
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.fillText(forest.name, canvas.width / 2, canvas.height - 15);
          
          // Add a minimal visual update to keep the frame updating
          // This helps prevent audio jitter when minimized
          frameCountRef.current = (frameCountRef.current + 1) % 1000;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
          ctx.fillRect(0, 0, 1, 1);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.01)';
          ctx.fillRect(frameCountRef.current % canvas.width, 0, 1, 1);
          
          // Add timestamp to the frame for debugging
          if (frameCountRef.current % 10 === 0) {
            const timeStr = new Date().toISOString().substring(11, 23); // HH:MM:SS.mmm
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.font = '10px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`f:${frameCountRef.current} t:${timeStr}`, canvas.width - 10, 10);
          }
          
          // Continue animation loop
          animationFrameRef.current = requestAnimationFrame(drawImage);
        };
        
        // Start animation loop
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(drawImage);
        
        // Add a keepalive mechanism to ensure canvas keeps updating even when minimized
        if (keepAliveIntervalRef.current) {
          clearInterval(keepAliveIntervalRef.current);
        }
        
        keepAliveIntervalRef.current = setInterval(() => {
          // If animation frame got canceled for any reason (like when page is in background)
          // Force a minimal redraw to keep the stream active
          if (ctx && img) {
            // Draw a single pixel with a slightly different opacity each time
            // This is invisible to users but keeps the stream "fresh"
            const opacity = 0.01 + (Math.sin(Date.now() / 1000) * 0.005);
            ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
            ctx.fillRect(0, 0, 1, 1);
            
            // Add a timestamp to track keepalive in the console
            if (document.visibilityState === 'hidden') {
              console.log(`[PiP Debug] Keepalive tick at ${new Date().toISOString().substring(11, 23)}`);
            }
          }
        }, 1000 / 30); // 30fps keepalive
      };
    };
    
    loadImage();
    
    return () => {
      console.log('[PiP Debug] Cleaning up canvas animation');
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
      }
    };
  }, [forest, isVisible]);

  // Add a cleanup function for properly restoring audio when component unmounts or visibility changes
  const cleanupPiPAudio = () => {
    console.log('[PiP Debug] Custom miniplayer closed - cleaning up audio');
    
    // Ensure PiP is marked as inactive
    setIsPiPActive(false);
    
    // Thorough audio cleanup - multiple approaches to ensure audio is restored
    if (audioManager) {
      // First try proper cleanup via the dedicated method
      if (typeof audioManager.clearPiPConnections === 'function') {
        console.log('[PiP Debug] Running full clearPiPConnections for custom close');
        audioManager.clearPiPConnections();
      } else {
        // Fallback cleanup
        console.log('[PiP Debug] Running fallback audio cleanup for custom close');
        // Clear the routing function
        audioManager.connectToPiP = undefined;
        // Unmute main page
        if (audioManager.setMainPageMasterGain) {
          audioManager.setMainPageMasterGain(null);
        }
      }
      
      // Final verification steps
      if (audioManager.audioContext) {
        // Ensure audio context is running
        audioManager.audioContext.resume().catch(err => {
          console.error('[PiP Debug] Error resuming audio in cleanup:', err);
        });
      }
    }
    
    // Stop all tracks in the stream
    if (streamRef.current) {
      console.log('[PiP Debug] Stopping all tracks in custom close');
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
    }
  };

  // Expose methods to parent through ref
  useImperativeHandle(ref, () => ({
    cleanupAudio: () => {
      console.log('[PiP Debug] Parent component triggered audio cleanup');
      cleanupPiPAudio();
    }
  }));

  // Effect to handle visibility changes (when our component is hidden/shown)
  useEffect(() => {
    // When visibility changes from visible to not visible
    if (prevVisibleRef.current && !isVisible) {
      console.log('[PiP Debug] Visibility changing from visible to not visible');
      
      // If PiP is active, clean up
      if (isPiPActive) {
        console.log('[PiP Debug] PiP was active during visibility change - running cleanup');
        cleanupPiPAudio();
      } 
      // Even if PiP is not "active", check if we have audio connections that need cleanup
      else if (audioManager.connectToPiP) {
        console.log('[PiP Debug] Audio connections exist - ensuring cleanup on visibility change');
        cleanupPiPAudio();
      }
    }
    
    // Update prev ref at the end of the effect
    prevVisibleRef.current = isVisible;
    
    // Cleanup function for unmounting
    return () => {
      if (isPiPActive || audioManager.connectToPiP) {
        console.log('[PiP Debug] Component unmounting - running thorough cleanup');
        cleanupPiPAudio();
      }
    };
  }, [isVisible, isPiPActive]);

  // Handle audio/video stream creation
  useEffect(() => {
    if (!canvasRef.current || !isVisible) return;
    
    // Function to create or update stream
    const setupStream = async () => {
      try {
        console.log('[PiP Debug] Setting up media stream');
        
        // Clean up previous stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          setIsPlaying(false);
        }
        
        // Get canvas stream for video
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const canvasStream = canvas.captureStream(30); // 30 FPS
        console.log('[PiP Debug] Canvas stream created:', {
          videoTracks: canvasStream.getVideoTracks().length,
          audioTracks: canvasStream.getAudioTracks().length
        });
        
        // Make sure audio manager is initialized
        if (!audioManager.audioContext) {
          await audioManager.initialize();
          console.log('[PiP Debug] Audio context initialized');
        }
        
        // Get the audio context
        const audioContext = audioManager.audioContext;
        if (!audioContext) {
          throw new Error('Audio context not available');
        }
        
        // Create a media stream destination
        let audioDestination: MediaStreamAudioDestinationNode;
        try {
          audioDestination = audioContext.createMediaStreamDestination();
          console.log('[PiP Debug] Audio destination created');
        } catch (error) {
          console.error('[PiP Debug] Failed to create audio destination:', error);
          throw new Error('Could not create audio destination');
        }
        
        // Expose a method to connect audio nodes to this destination
        audioManager.connectToPiP = (source: AudioNode) => {
          try {
            // Verify source belongs to the same context
            if (source.context !== audioContext) {
              console.error('[PiP Debug] Cannot connect - source and destination contexts differ');
              return;
            }
            
            source.connect(audioDestination);
            console.log('[PiP Debug] Audio source connected to PiP');
          } catch (error) {
            console.error('[PiP Debug] Error connecting audio source to PiP:', error);
          }
        };
        
        // Connect all active sources to this destination
        try {
          audioManager.connectAllToPiP();
          console.log('[PiP Debug] All active audio sources connected to PiP');
        } catch (error) {
          console.error('[PiP Debug] Error connecting audio sources to PiP:', error);
          // Continue execution - we'll still try to set up the video
        }
        
        // Add at least a silent audio track if no audio tracks
        let audioTracks = audioDestination.stream.getAudioTracks();
        console.log('[PiP Debug] Initial audio tracks:', audioTracks.length);
        
        if (audioTracks.length === 0) {
          console.log('[PiP Debug] No audio tracks, creating silent audio track');
          
          try {
            // Create a silent oscillator and connect it to the destination
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0.01; // Very quiet but not silent
            oscillator.connect(gainNode);
            gainNode.connect(audioDestination);
            oscillator.start();
            
            // Wait for the track to be created
            await new Promise(resolve => setTimeout(resolve, 100));
            audioTracks = audioDestination.stream.getAudioTracks();
            console.log('[PiP Debug] After adding silent track, audio tracks:', audioTracks.length);
          } catch (error) {
            console.error('[PiP Debug] Failed to create silent audio track:', error);
            // Continue anyway - PiP might still work without audio
          }
        }
        
        // Add background audio state monitoring
        audioTracks.forEach((track, idx) => {
          console.log(`[PiP Debug] Audio track ${idx} enabled:`, track.enabled);
          // Setup a background ping to keep audio processing active
          const pingInterval = setInterval(() => {
            if (document.visibilityState === 'hidden' && isPiPActive) {
              console.log(`[PiP Debug] Audio track ${idx} status: enabled=${track.enabled}, readyState=${track.readyState}, muted=${track.muted}`);
            }
          }, 2000);
          
          // Clean up interval when track ends
          track.addEventListener('ended', () => {
            console.log(`[PiP Debug] Audio track ${idx} ended`);
            clearInterval(pingInterval);
          });
        });
        
        // Combine video and audio tracks
        let combinedStream: MediaStream;
        try {
          combinedStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            ...audioTracks
          ]);
          
          console.log('[PiP Debug] Combined stream created:', {
            videoTracks: combinedStream.getVideoTracks().length,
            audioTracks: combinedStream.getAudioTracks().length
          });
        } catch (error) {
          console.error('[PiP Debug] Failed to create combined stream:', error);
          // Fallback to just video if combined stream fails
          combinedStream = new MediaStream([...canvasStream.getVideoTracks()]);
          console.log('[PiP Debug] Fallback to video-only stream');
        }
        
        // Save reference to the stream
        streamRef.current = combinedStream;
        
        // Set the stream as the video source
        if (videoRef.current) {
          videoRef.current.srcObject = combinedStream;
          try {
            // Auto-play the video
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('[PiP Debug] Video playback started successfully');
                  setIsPlaying(true);
                  
                  // Add event listeners for debugging
                  videoRef.current?.addEventListener('pause', () => {
                    console.log('[PiP Debug] Video paused event');
                  });
                  
                  videoRef.current?.addEventListener('play', () => {
                    console.log('[PiP Debug] Video play event');
                  });
                  
                  videoRef.current?.addEventListener('stalled', () => {
                    console.log('[PiP Debug] Video stalled event');
                  });
                })
                .catch(error => {
                  console.error('[PiP Debug] Video playback failed:', error);
                  setIsPlaying(false);
                });
            }
          } catch (error) {
            console.error('[PiP Debug] Error auto-playing video:', error);
          }
        }
      } catch (error) {
        console.error('[PiP Debug] Failed to setup PiP stream:', error);
        
        // Attempt recovery by resetting PiP connections
        if (audioManager.connectToPiP) {
          console.log('[PiP Debug] Clearing failed PiP connections for recovery');
          audioManager.connectToPiP = undefined;
          if (typeof audioManager.clearPiPConnections === 'function') {
            audioManager.clearPiPConnections();
          }
        }
      }
    };
    
    setupStream();
    
    return () => {
      console.log('[PiP Debug] Cleaning up audio/video stream');
      // Clean up
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          console.log(`[PiP Debug] Stopping track: ${track.kind}`);
          track.stop();
        });
      }
      
      // If PiP was active, do a full cleanup
      if (isPiPActive) {
        console.log('[PiP Debug] Stream cleanup while PiP was active - running full cleanup');
        cleanupPiPAudio();
      } else {
        // Simple cleanup if PiP wasn't active
        console.log('[PiP Debug] Removing connectToPiP method');
        if (audioManager.connectToPiP) {
          audioManager.connectToPiP = undefined;
        }
      }
    };
  }, [isVisible, activeSounds, isPiPActive]);

  // Monitor and keep the PiP stream active
  useEffect(() => {
    if (!isPiPActive || typeof document === 'undefined' || typeof performance === 'undefined') return;
    
    console.log('[PiP Debug] Setting up PiP heartbeat monitor');
    
    // When PiP is active, set up a heartbeat for smoother playback
    const heartbeat = setInterval(() => {
      if (videoRef.current && videoRef.current.paused) {
        console.log('[PiP Debug] PiP video paused, attempting to restart');
        videoRef.current.play().catch(err => {
          console.error('[PiP Debug] Failed to restart video in PiP heartbeat:', err);
        });
      }
      
      // Force a frame update on the canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          // Draw a minimal change to trigger a frame
          ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
          ctx.fillRect(Math.random() * 5, Math.random() * 5, 1, 1);
          
          if (document.visibilityState === 'hidden') {
            console.log('[PiP Debug] PiP heartbeat tick while page hidden');
          }
        }
      }
      
      // Check audio context state
      if (audioManager.audioContext) {
        const audioState = audioManager.audioContext.state as (AudioContextState | 'interrupted');
        console.log(`[PiP Debug] Audio context state: ${audioState}`);
        
        // Use our iOS-specific recovery for interrupted audio
        if (audioState === 'suspended' || audioState === 'interrupted') {
          console.log('[PiP Debug] Audio context not running, using PiP audio recovery');
          // Check if our new recoverPiPAudio method exists
          if (typeof audioManager.recoverPiPAudio === 'function') {
            audioManager.recoverPiPAudio();
          } else {
            // Fallback to basic resume if method doesn't exist yet
            audioManager.audioContext.resume().catch(err => {
              console.error('[PiP Debug] Failed to resume audio context:', err);
            });
          }
        }
      }
      
      // Periodically report PiP status
      const stats = {
        isPiPActive,
        isPlaying,
        isDocumentHidden: document.visibilityState === 'hidden',
        frameCount: frameCountRef.current,
        avgFrameRate: (frameCountRef.current / (performance.now() - startTimeRef.current) * 1000).toFixed(2),
        activeSoundCount: activeSounds.size,
        documentVisibilityState: document.visibilityState,
        videoState: videoRef.current ? {
          paused: videoRef.current.paused,
          currentTime: videoRef.current.currentTime,
          readyState: videoRef.current.readyState,
          networkState: videoRef.current.networkState
        } : 'no video'
      };
      console.log('[PiP Debug] Stats:', stats);
    }, 1000); // Check every second
    
    return () => {
      console.log('[PiP Debug] Cleaning up PiP heartbeat');
      clearInterval(heartbeat);
    };
  }, [isPiPActive, isPlaying, activeSounds]);

  // Effect to create a silent audio source to keep iOS audio alive when browser is minimized
  useEffect(() => {
    if (!isPiPActive || !isIOS || typeof document === 'undefined') return;
    
    console.log('[PiP Debug] Setting up iOS background audio keepalive');
    
    // Create silent oscillator to keep audio context alive
    let silentOscillator: OscillatorNode | null = null;
    let silentGain: GainNode | null = null;
    
    const setupSilentAudio = async () => {
      if (!audioManager.audioContext) {
        await audioManager.initialize();
      }
      
      const ctx = audioManager.audioContext;
      if (!ctx) return;
      
      // Create a silent audio oscillator that runs constantly
      // This keeps the audio context alive in the background
      silentOscillator = ctx.createOscillator();
      silentGain = ctx.createGain();
      silentGain.gain.value = 0.001; // Nearly silent but not completely (iOS requires some sound)
      
      silentOscillator.frequency.value = 40; // Very low frequency
      silentOscillator.connect(silentGain);
      silentGain.connect(ctx.destination);
      silentOscillator.start();
      
      console.log('[PiP Debug] Silent keepalive audio started');
    };
    
    setupSilentAudio();
    
    // Create a regular ping to ensure audio stays active
    const pingInterval = setInterval(() => {
      if (document.visibilityState === 'hidden' && audioManager.audioContext) {
        // Tiny volume change to keep the audio graph active
        if (silentGain) {
          const randomVol = 0.001 + (Math.random() * 0.0005);
          silentGain.gain.value = randomVol;
          console.log(`[PiP Debug] Audio keepalive ping: ${randomVol.toFixed(5)}`);
        }
      }
    }, 2000);
    
    return () => {
      clearInterval(pingInterval);
      if (silentOscillator) {
        try {
          silentOscillator.stop();
          silentOscillator.disconnect();
          console.log('[PiP Debug] Silent keepalive audio stopped');
        } catch (e) {
          console.error('[PiP Debug] Error stopping silent audio:', e);
        }
      }
      if (silentGain) {
        silentGain.disconnect();
      }
    };
  }, [isPiPActive, isIOS]);

  // Effect to add video play event listener for PiP mode
  useEffect(() => {
    if (!videoRef.current || !isPiPActive) return;
    
    console.log('[PiP Debug] Setting up PiP play event handler');
    
    const handlePlay = () => {
      console.log('[PiP Debug] PiP video play event detected');
      
      // When video plays in PiP mode, ensure audio is active
      if (audioManager.audioContext) {
        const state = audioManager.audioContext.state as (AudioContextState | 'interrupted');
        console.log(`[PiP Debug] Audio context state on play: ${state}`);
        
        if (state !== 'running') {
          console.log('[PiP Debug] Activating audio on PiP play event');
          
          // Try to recover audio context
          if (typeof audioManager.recoverPiPAudio === 'function') {
            audioManager.recoverPiPAudio();
          } else {
            // Fallback if method doesn't exist
            audioManager.audioContext.resume().catch(err => {
              console.error('[PiP Debug] Failed to resume audio on play:', err);
            });
          }
          
          // Force reconnect all sounds 500ms after play
          setTimeout(() => {
            if (typeof audioManager.reconnectAllSounds === 'function') {
              console.log('[PiP Debug] Reconnecting sounds after play event');
              audioManager.reconnectAllSounds();
            }
          }, 500);
        }
      }
    };
    
    // Handle pause event - this can be triggered by the iOS PiP UI "Play in background" button
    const handlePause = () => {
      console.log('[PiP Debug] PiP video pause event detected');
      
      // If this was triggered by the "Play in background" button, we need to restore audio
      // The main indicator is that the video is paused but PiP is still active
      if (videoRef.current && videoRef.current.paused && isPiPActive) {
        console.log('[PiP Debug] Video paused but PiP still active - likely "Play in background" button');
        
        // Give a short delay for iOS to process state changes
        setTimeout(() => {
          // Check if we're in iOS background playback mode
          const isBackgroundPlayback = document.visibilityState === 'visible' && 
              videoRef.current?.paused && 
              isPiPActive;
          
          if (isBackgroundPlayback) {
            console.log('[PiP Debug] Detected iOS background playback mode, ensuring main page audio is active');
            
            // Ensure main page audio is activated - use full cleanup for consistent behavior
            console.log('[PiP Debug] Running full audio cleanup for background playback mode');
            cleanupPiPAudio();
            
            // Also notify parent if needed
            if (onClose) {
              console.log('[PiP Debug] Notifying parent of "Play in background" close');
              onClose();
            }
          }
        }, 300);
      }
    };
    
    videoRef.current.addEventListener('play', handlePlay);
    videoRef.current.addEventListener('pause', handlePause);
    
    return () => {
      videoRef.current?.removeEventListener('play', handlePlay);
      videoRef.current?.removeEventListener('pause', handlePause);
    };
  }, [isPiPActive]);

  // Handle audio connect/disconnect when PiP status changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (isPiPActive) {
      console.log('[PiP Debug] Setting up audio connection for PiP');
      
      const setupPiPAudio = async () => {
        try {
          // Make sure audio manager is initialized
          if (!audioManager.audioContext) {
            await audioManager.initialize();
          }
          
          // Important: Use the SAME audio context as the rest of the app
          if (!audioManager.audioContext) {
            console.error('[PiP Debug] Failed to initialize audio context');
            return;
          }
          
          // Create destination using the existing context
          const audioDestination = audioManager.audioContext.createMediaStreamDestination();
          
          // Create connection function
          audioManager.connectToPiP = (sourceNode) => {
            try {
              sourceNode.connect(audioDestination);
              console.log('[PiP Debug] Successfully connected audio source to PiP');
            } catch (error) {
              console.error('[PiP Debug] Error connecting audio to PiP:', error);
            }
          };
          
          // Set up main page master gain in audioManager (to mute main page when PiP is active)
          const mainPageMasterGain = audioManager.audioContext.createGain();
          mainPageMasterGain.gain.value = 0; // Mute main page
          mainPageMasterGain.connect(audioManager.audioContext.destination);
          audioManager.setMainPageMasterGain(mainPageMasterGain);
          
          // For video audio track
          if (streamRef.current) {
            try {
              streamRef.current.addTrack(audioDestination.stream.getAudioTracks()[0]);
              console.log('[PiP Debug] Added audio track to stream');
            } catch (error) {
              console.error('[PiP Debug] Error adding audio track to stream:', error);
            }
          }
        } catch (error) {
          console.error('[PiP Debug] Error setting up PiP audio:', error);
        }
      };
      
      setupPiPAudio();
    } else {
      // Clear PiP connection function when exiting PiP
      if (audioManager.connectToPiP) {
        console.log('[PiP Debug] Clearing audio PiP connection');
        audioManager.connectToPiP = undefined;
        
        // Check if we're handling a foreground transition 
        if (hasPendingForegroundTransitionRef.current) {
          console.log('[PiP Debug] Detected foreground transition - handling audio cleanup');
          hasPendingForegroundTransitionRef.current = false;
          
          // Give time for state transitions to settle, then stop any duplicate audio
          setTimeout(() => {
            console.log('[PiP Debug] Running dedup cleanup after foreground transition');
            audioManager.dedupAllSounds();
          }, 300);
        }
      }
      
      // Restore main page audio
      audioManager.setMainPageMasterGain(null);
    }
    
    return () => {
      if (!isPiPActive) {
        audioManager.connectToPiP = undefined;
        audioManager.setMainPageMasterGain(null);
      }
    };
  }, [isPiPActive]);

  // Handle Picture-in-Picture mode
  const enterPiPMode = async () => {
    try {
      if (!videoRef.current) return;
      
      console.log('[PiP Debug] Entering PiP mode');
      
      // Make sure video has focus
      videoRef.current.focus();
      
      // Ensure video is playing (required for PiP)
      if (!isPlaying) {
        try {
          console.log('[PiP Debug] Video not playing, attempting to play');
          await videoRef.current.play();
          setIsPlaying(true);
        } catch (e) {
          console.error('[PiP Debug] Failed to play video before PiP:', e);
          // Try to trigger play from user interaction
          alert('Please tap on the video to start playback then try again. Audio playback requires user interaction on your device.');
          return;
        }
      }
      
      // Request PiP mode - different methods for different platforms
      if (isIOS) {
        console.log('[PiP Debug] Using iOS-specific PiP API');
        // iOS uses webkitSetPresentationMode
        if (videoRef.current.webkitSupportsPresentationMode && 
            typeof videoRef.current.webkitSetPresentationMode === 'function') {
          videoRef.current.webkitSetPresentationMode('picture-in-picture');
          setIsPiPActive(true);
          
          // iOS doesn't have an event for leaving PiP, so we need to check periodically
          // Also add a check for the page visibility since iOS often sends this when closing PiP
          const checkInterval = setInterval(() => {
            if (videoRef.current) {
              // Check if PiP mode has been exited
              const isPipActive = videoRef.current.webkitPresentationMode === 'picture-in-picture';
              
              if (!isPipActive && isPiPActive) {
                console.log('[PiP Debug] iOS PiP mode exited');
                setIsPiPActive(false);
                clearInterval(checkInterval);
                
                // Use our unified cleanup function for consistent behavior
                console.log('[PiP Debug] Running unified cleanup after iOS PiP exit');
                cleanupPiPAudio();
                
                // Notify parent component if needed
                if (onClose) {
                  console.log('[PiP Debug] Notifying parent of iOS system PiP close');
                  onClose();
                }
              }
            } else {
              // Clean up if video element is gone
              clearInterval(checkInterval);
            }
          }, 500); // Check more frequently to catch exit faster
        } else {
          throw new Error('iOS PiP not supported in this browser');
        }
      } else {
        console.log('[PiP Debug] Using standard PiP API');
        // Standard PiP API
        await videoRef.current.requestPictureInPicture();
        setIsPiPActive(true);
        
        // Handle exiting PiP
        const handleLeavePiP = () => {
          console.log('[PiP Debug] Left PiP mode (standard API)');
          setIsPiPActive(false);
          
          // Use our unified cleanup function for consistent behavior
          console.log('[PiP Debug] Running unified cleanup after standard PiP exit');
          cleanupPiPAudio();
          
          // Notify parent component if needed
          if (onClose) {
            console.log('[PiP Debug] Notifying parent of standard PiP close');
            onClose();
          }
        };
        
        videoRef.current.addEventListener('leavepictureinpicture', handleLeavePiP);
      }
      
      console.log('[PiP Debug] Successfully entered PiP mode');
    } catch (error) {
      console.error('[PiP Debug] Failed to enter PiP mode:', error);
      alert('Failed to enter Picture-in-Picture mode. This may not be supported in your browser.');
    }
  };

  // Add function to show AirPlay picker
  const showAirPlayPicker = () => {
    if (!videoRef.current) return;
    
    console.log('[PiP Debug] Attempting to show AirPlay picker');
    
    try {
      // Check for Safari's showPlaybackTargetPicker
      if (typeof (videoRef.current as any).webkitShowPlaybackTargetPicker === 'function') {
        console.log('[PiP Debug] Using webkitShowPlaybackTargetPicker API');
        (videoRef.current as any).webkitShowPlaybackTargetPicker();
      } 
      // Try other methods as fallback
      else if (typeof (videoRef.current as any).showPlaybackTargetPicker === 'function') {
        console.log('[PiP Debug] Using showPlaybackTargetPicker API');
        (videoRef.current as any).showPlaybackTargetPicker();
      } else {
        console.log('[PiP Debug] AirPlay API not available directly');
        // Trigger play to show controls which usually include AirPlay button
        videoRef.current.play().catch(err => {
          console.error('[PiP Debug] Failed to play video for AirPlay:', err);
        });
      }
    } catch (error) {
      console.error('[PiP Debug] Error showing AirPlay picker:', error);
    }
  };

  // Add an event listener for media session state changes
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    
    // Create a MutationObserver to monitor changes to media playback state
    const checkMediaSessionState = () => {
      if (navigator.mediaSession.playbackState === 'paused' || 
          navigator.mediaSession.playbackState === 'none') {
        console.log('[PiP Debug] Detected media session paused state while in PiP');
        
        // If we're in PiP mode and iOS pauses, force full audio stop
        if (isPiPActive && isIOS) {
          console.log('[PiP Debug] iOS PiP - ensuring complete audio stop on pause');
          
          // Force a complete audio stop to prevent stuttering
          audioManager.stopAllSounds();
          
          // Reset video element to help clear audio pipeline
          if (videoRef.current) {
            try {
              // Try to reset the video pipeline
              videoRef.current.pause();
              
              // For iOS in PiP, this could help break audio stuttering loops
              if (streamRef.current) {
                const tracks = streamRef.current.getAudioTracks();
                tracks.forEach(track => {
                  console.log('[PiP Debug] Stopping audio track in PiP');
                  track.stop();
                });
              }
            } catch (e) {
              console.error('[PiP Debug] Error handling PiP pause:', e);
            }
          }
        }
      }
    };
    
    // Periodically check media session state for iOS in PiP mode
    const intervalId = setInterval(() => {
      if (isPiPActive && isIOS) {
        checkMediaSessionState();
      }
    }, 500);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [isPiPActive, isIOS]);

  // Don't render if not visible
  if (!isVisible) return null;

  // Add a close function to the component
  const closeMiniPlayer = () => {
    console.log('[PiP Debug] Custom close button clicked');
    // Run audio cleanup before hiding the component
    cleanupPiPAudio();
    // Notify parent component
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed top-16 right-4 z-[100]">
      <div className="bg-black rounded-lg overflow-hidden shadow-xl w-64">
        <div className="relative w-full aspect-video">
          {/* Canvas for drawing - hidden in final version */}
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full"
            style={{ display: 'none' }}
          />
          {/* Video element with controls */}
          <video 
            ref={videoRef} 
            className="w-full h-full"
            autoPlay 
            playsInline 
            controls
            loop
            muted={false}
            onClick={() => videoRef.current?.play()}
          />
          
          {/* Info overlay when not playing */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
              <p className="text-white text-center p-4">
                Tap to start playback
              </p>
            </div>
          )}
        </div>
        <div className="p-2 flex justify-center items-center bg-gray-800">
          <button 
            onClick={enterPiPMode}
            disabled={isPiPActive || !isPiPSupported}
            className="text-white text-sm flex items-center justify-center hover:text-blue-300 transition-colors duration-200"
            aria-label="Enter Picture-in-Picture mode"
          >
            Tap <TbPictureInPicture className="mx-1" size={18} /> to play in background
          </button>
        </div>
        {/* Close button */}
        <button 
          className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1"
          onClick={closeMiniPlayer}
          aria-label="Close mini player"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}); 