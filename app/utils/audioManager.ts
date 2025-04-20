interface SoundAsset {
  id: string;
  url: string;
}

// Used for type documentation only, not directly instantiated
/* eslint-disable @typescript-eslint/no-unused-vars */
interface AudioSource {
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  isPlaying: boolean;
}
/* eslint-enable @typescript-eslint/no-unused-vars */

// Define Timer type to avoid using NodeJS namespace
type TimerRef = ReturnType<typeof setTimeout> | null;

// Define AudioContextState type locally to avoid reference errors
type LocalAudioContextState = 'suspended' | 'running' | 'closed';

// Extended AudioContext state type to include iOS-specific 'interrupted' state
type ExtendedAudioContextState = LocalAudioContextState | 'interrupted';

// Sound types that should have random delays between loops
const DELAYED_LOOP_SOUND_TYPES = ['birds', 'thunder', 'insects', 'mammals', 'spiritual', 'ambient'];
// Sound types that should have fade out before loop ends
const FADE_OUT_SOUND_TYPES = ['birds', 'thunder', 'insects', 'mammals', 'spiritual', 'ambient'];

export class AudioManager {
  private static instance: AudioManager;
  private _audioContext: AudioContext | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();
  private activeGains: Map<string, GainNode> = new Map();
  private initialized = false;
  private audioContextStateInterval: TimerRef = null;
  private lastVisibilityState: string = 'visible';
  private recoveryAttempts: number = 0;
  private isIOS: boolean = false;
  private wasContextInterrupted: boolean = false;
  private _mainPageMasterGain: GainNode | null = null;
  private loopTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private soundTypeForAsset: Map<string, string> = new Map();
  
  // PiP connection function (will be set by PiPMiniPlayer)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public connectToPiP?: (audioNode: AudioNode) => void;

  private constructor() {
    // Check if running on iOS
    if (typeof navigator !== 'undefined') {
      this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }
    
    // Setup document visibility event listener
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
      this.lastVisibilityState = document.visibilityState;
      
      // iOS specific: add foregrounding handler
      if (this.isIOS) {
        window.addEventListener('focus', this.handleIOSForeground.bind(this));
        window.addEventListener('pageshow', this.handleIOSForeground.bind(this));
      }
    }
  }

  // Handle iOS specific foregrounding event
  private handleIOSForeground() {
    console.log('[Audio Debug] iOS app foregrounded');
    
    // Always attempt recovery when foregrounding on iOS, regardless of flag state
    if (this._audioContext && this.isIOS) {
      console.log('[Audio Debug] Attempting recovery on iOS foreground');
      
      // Reset the flag
      this.wasContextInterrupted = false;
      
      // Check if we have PiP active before blindly reconnecting sounds
      const hasPiPActive = !!this.connectToPiP;
      
      // Force a recovery attempt regardless of current state
      this.recoverFromInterruption();
      
      // Only reconnect sounds if PiP is not active to avoid duplication
      if (!hasPiPActive) {
        console.log('[Audio Debug] Reconnecting all active sounds after foreground');
        this.reconnectAllSounds();
      } else {
        console.log('[Audio Debug] PiP active - skipping sound reconnection to avoid duplication');
      }
    }
  }
  
  // New method to set up delayed loops with fade out
  private setupDelayedLoop(
    soundInstanceId: string, 
    source: AudioBufferSourceNode, 
    gainNode: GainNode, 
    buffer: AudioBuffer, 
    volume: number,
    useRandomDelay: boolean,
    useFadeOut: boolean
  ): void {
    if (!this._audioContext) return;
    
    const audioDuration = buffer.duration;
    
    // For fade out, we need to start fading a little before the end
    const fadeOutDuration = useFadeOut ? Math.min(1.5, audioDuration * 0.1) : 0;
    
    // Set up the fade out if needed
    if (useFadeOut && fadeOutDuration > 0) {
      const fadeOutStartTime = this._audioContext.currentTime + audioDuration - fadeOutDuration;
      
      // Schedule the gain reduction
      gainNode.gain.setValueAtTime(volume, fadeOutStartTime);
      gainNode.gain.linearRampToValueAtTime(0, fadeOutStartTime + fadeOutDuration);
      
      console.log(`[Audio Debug] Scheduled fade out for ${soundInstanceId} at ${fadeOutStartTime.toFixed(2)}s for ${fadeOutDuration.toFixed(2)}s`);
    }
    
    // Handle the end of the sound and potential looping
    source.onended = () => {
      console.log(`[Audio Debug] Sound ended: ${soundInstanceId}`);
      
      // Clean up the current instance
      this.activeSources.delete(soundInstanceId);
      this.activeGains.delete(soundInstanceId);
      
      // Check if we're still initialized before creating a new instance
      if (!this.initialized || !this._audioContext) {
        console.log(`[Audio Debug] AudioManager not initialized, not looping ${soundInstanceId}`);
        return;
      }
      
      // For sounds with random delay, add a delay before starting the next loop
      if (useRandomDelay) {
        // Random delay between 5-27 seconds
        const randomDelay = Math.random() * 22 + 5; // 5-27 seconds
        console.log(`[Audio Debug] Adding random delay of ${randomDelay.toFixed(2)}s before next loop of ${soundInstanceId}`);
        
        // Clean up any existing timeout for this sound
        if (this.loopTimeouts.has(soundInstanceId)) {
          clearTimeout(this.loopTimeouts.get(soundInstanceId)!);
        }
        
        // Create a new timeout for the delayed loop
        const timeout = setTimeout(() => {
          // Get the original asset ID (remove any recovery suffix)
          const baseId = soundInstanceId.split('-recovery-')[0];
          
          // Play the sound again after the delay
          this.playSound({id: baseId, url: ''}, volume).catch(err => {
            console.error(`[Audio Debug] Failed to restart sound after delay: ${err}`);
          });
          
          // Remove the timeout reference
          this.loopTimeouts.delete(soundInstanceId);
        }, randomDelay * 1000);
        
        // Store the timeout reference for potential cleanup
        this.loopTimeouts.set(soundInstanceId, timeout);
      } else {
        // For sounds without random delay but with fade out, 
        // immediately start the next loop for seamless transition
        const baseId = soundInstanceId.split('-recovery-')[0];
        this.playSound({id: baseId, url: ''}, volume).catch(err => {
          console.error(`[Audio Debug] Failed to restart sound: ${err}`);
        });
      }
    };
  }

  // New method to fully clean up a sound including any duplicates
  private cleanupSound(assetId: string): void {
    // Get all nodes with this ID or that start with this ID (could have recovery duplicates)
    const nodesToClean: string[] = [];
    
    // Find all sources that match or start with assetId (to catch recovery duplicates)
    this.activeSources.forEach((_, id) => {
      if (id === assetId || id.startsWith(`${assetId}-recovery`)) {
        nodesToClean.push(id);
      }
    });
    
    console.log(`[Audio Debug] Cleaning up sound ${assetId} and ${nodesToClean.length - 1} duplicates`);
    
    // Stop each matching source
    nodesToClean.forEach(id => {
      try {
        const source = this.activeSources.get(id);
        const gain = this.activeGains.get(id);
        
        if (source) {
          source.stop();
          this.activeSources.delete(id);
        }
        
        if (gain) {
          // Disconnect from all destinations
          gain.disconnect();
          this.activeGains.delete(id);
        }
        
        // Clear any pending loop timeouts
        if (this.loopTimeouts.has(id)) {
          clearTimeout(this.loopTimeouts.get(id)!);
          this.loopTimeouts.delete(id);
        }
      } catch (error) {
        console.error(`[Audio Debug] Error cleaning up sound ${id}:`, error);
      }
    });
  }

  stopSound(assetId: string): void {
    // Use the more thorough cleanup method
    this.cleanupSound(assetId);
  }

  // Updated method to assign unique recovery IDs to restarted sounds
  async playSound(asset: SoundAsset, volume: number = 1): Promise<void> {
    if (!this.initialized) {
      console.log(`[Audio Debug] Initializing audio context before playing ${asset.id}`);
      await this.initialize();
    }

    // Stop existing sound if playing (using thorough cleanup)
    this.cleanupSound(asset.id);

    try {
      const buffer = this.audioBuffers.get(asset.id);
      if (!buffer) {
        console.log(`[Audio Debug] Buffer not found for ${asset.id}, loading now`);
        await this.loadSound(asset);
        return this.playSound(asset, volume);
      }

      // Ensure audio context is in a good state
      const state = this.getContextState();
      if (state === 'suspended' || state === 'interrupted') {
        console.log(`[Audio Debug] Resuming audio context before playing ${asset.id}`);
        await this._audioContext!.resume();
        
        // If still not running after resume attempt (iOS may need special handling)
        if (this.getContextState() !== 'running' && this.isIOS) {
          console.log(`[Audio Debug] Audio context still not running (${this.getContextState()}), attempting recovery`);
          await this.recoverFromInterruption();
        }
      }

      // Get a unique ID for this sound instance
      const soundInstanceId = this.wasContextInterrupted ? 
        `${asset.id}-recovery-${Date.now()}` : asset.id;

      console.log(`[Audio Debug] Creating source for ${soundInstanceId}`);
      const source = this._audioContext!.createBufferSource();
      const gainNode = this._audioContext!.createGain();

      source.buffer = buffer;
      
      // Extract sound type from asset ID (e.g., 'birds-soft' -> 'birds')
      const soundType = asset.id.split('-')[0];
      this.soundTypeForAsset.set(soundInstanceId, soundType);
      
      // Determine if this sound should have special looping behavior
      const shouldHaveRandomDelay = DELAYED_LOOP_SOUND_TYPES.includes(soundType);
      const shouldHaveFadeOut = FADE_OUT_SOUND_TYPES.includes(soundType);
      
      // For non-delayed sounds, use normal looping
      if (!shouldHaveRandomDelay) {
        source.loop = true;
        
        // Log audio duration - useful for debugging with longer files
        const audioDuration = buffer.duration;
        console.log(`[Audio Debug] ${soundInstanceId} duration: ${audioDuration.toFixed(2)} seconds`);
        
        // Implement crossfade for longer files to prevent clicking at loop boundaries
        if (audioDuration >= 10) { // Only apply to longer files (10+ seconds)
          // Set loop start/end points slightly inward if buffer is long enough
          // This helps prevent potential clicks at loop points
          const loopStart = Math.min(0.02, audioDuration * 0.005); // Small offset (max 20ms)
          const loopEnd = Math.max(audioDuration - 0.02, audioDuration * 0.995);
          
          if (audioDuration > 0.5) { // Only set if file has reasonable length
            source.loopStart = loopStart;
            source.loopEnd = loopEnd;
            console.log(`[Audio Debug] Set loop points for ${soundInstanceId}: ${loopStart.toFixed(3)}s to ${loopEnd.toFixed(3)}s`);
          }
        }
      }
      
      gainNode.gain.value = volume;

      console.log(`[Audio Debug] Connecting ${soundInstanceId} to output, volume: ${volume}`);
      source.connect(gainNode);
      
      // If we have a master gain for the main page (when PiP is active), use it
      if (this._mainPageMasterGain) {
        console.log(`[Audio Debug] Routing ${soundInstanceId} through muted main page output`);
        gainNode.connect(this._mainPageMasterGain);
      } else {
        // Normal routing to main output
        gainNode.connect(this._audioContext!.destination);
      }
      
      // Connect to PiP if available
      if (this.connectToPiP) {
        console.log(`[Audio Debug] Connecting ${soundInstanceId} to PiP output`);
        this.connectToPiP(gainNode); // Send to PiP
      }
      
      // Store references for later cleanup
      this.activeSources.set(soundInstanceId, source);
      this.activeGains.set(soundInstanceId, gainNode);
      
      // For sounds with special looping logic, set up the delayed loop
      if (shouldHaveRandomDelay || shouldHaveFadeOut) {
        this.setupDelayedLoop(soundInstanceId, source, gainNode, buffer, volume, shouldHaveRandomDelay, shouldHaveFadeOut);
      }
      
      // Start the sound
      source.start();
      console.log(`[Audio Debug] Started playing ${soundInstanceId}`);
      
      // Add ended event listener for non-delayed sounds to handle iOS interruptions
      if (!shouldHaveRandomDelay && !shouldHaveFadeOut) {
        source.addEventListener('ended', () => {
          console.log(`[Audio Debug] Source ended naturally: ${soundInstanceId}`);
          // Cleanup this specific instance
          this.activeSources.delete(soundInstanceId);
          this.activeGains.delete(soundInstanceId);
          
          // For iOS, immediately recreate if source ends unexpectedly during interruption
          if (this.wasContextInterrupted && this.isIOS && soundInstanceId === asset.id) {
            console.log(`[Audio Debug] Auto-restarting ${asset.id} after iOS interruption`);
            // Restart with slight delay
            setTimeout(() => {
              this.playSound(asset, volume);
            }, 100);
          }
        });
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error(`[Audio Debug] Error playing sound ${asset.id}:`, error);
      return Promise.reject(error);
    }
  }

  // Updated reconnectAllSounds to be more careful about restarting sounds
  public reconnectAllSounds(): void {
    if (!this._audioContext) return;
    
    // Check if PiP is active - we need special handling
    const hasPiPActive = !!this.connectToPiP;
    
    // If PiP is active, be extra cautious about reconnection
    if (hasPiPActive) {
      console.log('[Audio Debug] PiP is active during reconnect - using cautious approach');
      
      // When PiP is active, only resume the context without restarting sounds
      // This is because PiP should maintain its own audio stream
      const state = this.getContextState();
      if (state === 'suspended' || state === 'interrupted') {
        console.log('[Audio Debug] Resuming audio context only due to PiP active');
        this._audioContext!.resume().catch(err => {
          console.error('[Audio Debug] Failed to resume context with PiP active:', err);
        });
      }
      
      return;
    }
    
    // Traditional sound reconnection (only when PiP is NOT active)
    // Save current playing sounds - use Set to avoid duplicates
    const activeAssetIds = new Set<string>();
    const soundVolumes = new Map<string, number>();
    
    // Get base asset IDs (without recovery suffixes)
    this.activeSources.forEach((_, id) => {
      const baseId = id.includes('-recovery-') ? id.split('-recovery-')[0] : id;
      activeAssetIds.add(baseId);
      
      // Get the volume from the first instance we find
      if (!soundVolumes.has(baseId)) {
        const gain = this.activeGains.get(id);
        if (gain) {
          soundVolumes.set(baseId, gain.gain.value);
        }
      }
    });
    
    if (activeAssetIds.size > 0) {
      console.log(`[Audio Debug] Reconnecting ${activeAssetIds.size} unique active sounds`);
      
      // Stop ALL sounds first, including recoveries
      this.stopAllSounds();
      
      // Restart each unique sound
      activeAssetIds.forEach(id => {
        const asset = { id, url: '' }; // We already have the buffer
        const volume = soundVolumes.get(id) || 1;
        console.log(`[Audio Debug] Restarting sound ${id} at volume ${volume}`);
        this.playSound(asset, volume);
      });
    }
  }

  stopAllSounds(): void {
    if (!this._audioContext) return;
    
    console.log('[Audio Debug] Stopping all sounds forcefully');
    
    // Keep track of how many sounds we're stopping
    const soundCount = this.activeSources.size;
    console.log(`[Audio Debug] Attempting to stop ${soundCount} active sounds`);
    
    // Create a copy of the keys to avoid modification during iteration
    const soundIds = Array.from(this.activeSources.keys());
    
    // Force immediate muting of all sounds first (to prevent stuttering)
    soundIds.forEach(id => {
      const gainNode = this.activeGains.get(id);
      if (gainNode) {
        try {
          // Immediately set gain to zero to prevent any audible artifacts
          gainNode.gain.value = 0;
          console.log(`[Audio Debug] Muted sound ${id} immediately`);
        } catch (e) {
          console.error(`[Audio Debug] Error muting sound ${id}:`, e);
        }
      }
    });
    
    // Now stop all sources
    soundIds.forEach(id => {
      this.cleanupSound(id);
    });
    
    // For iOS PiP issues, also try to disconnect all AudioNodes completely
    if (this.isIOS) {
      try {
        // Extra safety step: disconnect all nodes from destination
        this.activeGains.forEach((gainNode, id) => {
          try {
            gainNode.disconnect();
            console.log(`[Audio Debug] Forcefully disconnected gain node for ${id}`);
          } catch (e) {
            // Ignore disconnect errors
          }
        });
        
        // Clear out all tracking maps
        this.activeSources.clear();
        this.activeGains.clear();
        
        // If we have a PiP connection, ensure we break that too
        if (this.connectToPiP) {
          this.connectToPiP = undefined;
          console.log('[Audio Debug] Cleared PiP connection function');
        }
        
        console.log('[Audio Debug] All audio connections forcefully cleared for iOS');
      } catch (e) {
        console.error('[Audio Debug] Error during emergency iOS audio cleanup:', e);
      }
    }
    
    console.log('[Audio Debug] All sounds stopped');
  }

  // Get audio context state, including handling iOS-specific states
  private getContextState(): ExtendedAudioContextState {
    if (!this._audioContext) return 'suspended';
    return this._audioContext.state as ExtendedAudioContextState;
  }
  
  // Handle audio context interruption specifically
  private async recoverFromInterruption() {
    if (!this._audioContext) return;
    
    console.log('[Audio Debug] Recovering from audio interruption');
    
    // For iOS, we need a stronger recovery approach 
    const state = this.getContextState();
    console.log(`[Audio Debug] Current audio context state before recovery: ${state}`);
    
    try {
      // First try resume
      await this._audioContext.resume();
      console.log(`[Audio Debug] Resume attempt result: ${this.getContextState()}`);
      
      // If still not running, we need to recreate
      const newState = this.getContextState();
      if (newState !== 'running') {
        console.log('[Audio Debug] Audio context not running after resume, recreating context');
        
        // Save the current active sound IDs
        const activeSoundIds = Array.from(this.activeSources.keys());
        const activeVolumes = new Map<string, number>();
        
        // Save volumes
        this.activeGains.forEach((gain, id) => {
          activeVolumes.set(id, gain.gain.value);
        });
        
        // Stop all sounds
        this.stopAllSounds();
        
        // Close the old context
        if (this._audioContext) {
          try {
            await this._audioContext.close();
            console.log('[Audio Debug] Successfully closed old audio context');
          } catch (closeError) {
            console.error('[Audio Debug] Error closing audio context:', closeError);
          }
        }
        
        // Create a new context
        this._audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log(`[Audio Debug] Created new audio context after interruption, state: ${this.getContextState()}`);
        
        // Try to force it to run
        await this._audioContext.resume();
        console.log(`[Audio Debug] New context state after resume: ${this.getContextState()}`);
        
        // Setup monitor for new context
        this.startAudioContextMonitoring();
        
        // Restart all sounds that were playing with slight delay
        setTimeout(() => {
          console.log('[Audio Debug] Restarting sounds after context recreation');
          for (const id of activeSoundIds) {
            const asset = { id, url: '' }; // We already have the buffer
            const volume = activeVolumes.get(id) || 1;
            this.playSound(asset, volume);
          }
        }, 300);
      } else {
        // If context is running but sounds might be stalled, reconnect them
        this.reconnectAllSounds();
      }
    } catch (error) {
      console.error('[Audio Debug] Failed to recover from interruption:', error);
      
      // Last resort: force restart all audio
      console.log('[Audio Debug] Attempting last resort recovery');
      try {
        this._audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        await this._audioContext.resume();
        this.startAudioContextMonitoring();
        
        // Force reconnect sounds with delay
        setTimeout(() => this.reconnectAllSounds(), 500);
      } catch (finalError) {
        console.error('[Audio Debug] Final recovery attempt failed:', finalError);
      }
    }
  }

  // Handle visibility change events
  private handleVisibilityChange() {
    if (typeof document === 'undefined') return;
    
    const newState = document.visibilityState;
    console.log(`[Audio Debug] Document visibility changed: ${this.lastVisibilityState} -> ${newState}`);
    
    // If becoming visible after being hidden
    if (newState === 'visible' && this.lastVisibilityState === 'hidden') {
      console.log('[Audio Debug] Document became visible - checking audio context');
      
      if (this._audioContext) {
        const state = this.getContextState();
        if (state === 'suspended' || state === 'interrupted') {
          console.log(`[Audio Debug] Resuming audio context after visibility change, state: ${state}`);
          this._audioContext.resume().catch(err => {
            console.error('[Audio Debug] Failed to resume audio context:', err);
          });
          
          // Check if we have PiP active before attempting to recover
          const hasPiPActive = !!this.connectToPiP;
          
          // For iOS interruption, more aggressive recovery may be needed
          if (this.isIOS && state === 'interrupted') {
            this.recoverFromInterruption();
            
            // Only perform reconnect if PiP is not active
            if (!hasPiPActive) {
              console.log('[Audio Debug] Reconnecting sounds after iOS interruption');
              this.reconnectAllSounds();
            } else {
              console.log('[Audio Debug] PiP active - skipping sound reconnection to avoid duplication');
            }
          }
        }
      }
    }
    
    // If becoming hidden, make sure audio context is resumed
    if (newState === 'hidden' && this._audioContext) {
      console.log(`[Audio Debug] Document hidden, audio context state: ${this.getContextState()}`);
      
      if (this.getContextState() === 'suspended') {
        console.log('[Audio Debug] Resuming suspended audio context due to visibility change');
        this._audioContext.resume().catch(err => {
          console.error('[Audio Debug] Failed to resume audio context:', err);
        });
      }
    }
    
    this.lastVisibilityState = newState;
  }

  // Public getter for audio context
  public get audioContext(): AudioContext | null {
    return this._audioContext;
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      console.log('[Audio Debug] Initializing audio context');
      // Create audio context only when needed
      if (!this._audioContext) {
        this._audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log(`[Audio Debug] Created new audio context, state: ${this.getContextState()}`);
        
        // Add event listeners for state changes
        this._audioContext.addEventListener('statechange', () => {
          const state = this.getContextState();
          console.log(`[Audio Debug] Audio context state changed: ${state}`);
          
          // Set the interrupted flag for iOS
          if (state === 'interrupted') {
            this.wasContextInterrupted = true;
            this.recoveryAttempts = 0;
          }
        });
      }

      // Resume audio context if it's suspended
      if (this.getContextState() === 'suspended') {
        console.log('[Audio Debug] Resuming suspended audio context');
        await this._audioContext.resume();
        console.log(`[Audio Debug] Audio context resumed, state: ${this.getContextState()}`);
      }
      
      // Special handling for interrupted state (iOS)
      if (this.getContextState() === 'interrupted') {
        console.log('[Audio Debug] Handling interrupted audio context');
        this.wasContextInterrupted = true;
        await this.recoverFromInterruption();
      }

      // If context is running, we're good
      if (this.getContextState() === 'running') {
        this.initialized = true;
        
        // Start monitoring audio context state
        this.startAudioContextMonitoring();
        
        console.log('[Audio Debug] Audio context initialized successfully');
        return;
      }

      // If context is closed, create a new one
      if (this.getContextState() === 'closed') {
        console.log('[Audio Debug] Audio context closed, creating new one');
        this._audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Try to resume the context
      await this._audioContext.resume();
      this.initialized = true;
      console.log('[Audio Debug] Audio context successfully initialized');
      
      // Start monitoring audio context state
      this.startAudioContextMonitoring();
    } catch (error) {
      console.error('[Audio Debug] Failed to initialize audio context:', error);
      // Try to recover by creating a new context
      try {
        console.log('[Audio Debug] Attempting recovery by creating a new audio context');
        this._audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        await this._audioContext.resume();
        this.initialized = true;
        console.log('[Audio Debug] Successfully recovered audio context');
        
        // Start monitoring audio context state
        this.startAudioContextMonitoring();
      } catch (retryError) {
        console.error('[Audio Debug] Failed to recover audio context:', retryError);
      }
    }
  }
  
  // Start monitoring audio context state
  private startAudioContextMonitoring() {
    if (this.audioContextStateInterval) {
      clearInterval(this.audioContextStateInterval);
    }
    
    // For iOS, use a more frequent check
    const checkInterval = this.isIOS ? 1000 : 2000; // 1 second for iOS, 2 seconds for others
    
    this.audioContextStateInterval = setInterval(() => {
      if (!this._audioContext) return;
      
      const state = this.getContextState();
      
      // For iOS, check more frequently regardless of visibility
      if (this.isIOS) {
        // Only log every 5 checks to avoid spam
        if (this.recoveryAttempts % 5 === 0) {
          console.log(`[Audio Debug] iOS periodic check - Audio context state: ${state}`);
          console.log(`[Audio Debug] Active sound sources: ${this.activeSources.size}`);
        }
        
        // If interrupted or not running, try to recover
        if (state !== 'running') {
          console.log(`[Audio Debug] iOS audio context not running (${state}), attempting recovery`);
          
          // Limit recovery attempts to avoid infinite loops
          if (this.recoveryAttempts < 5) {
            this.recoveryAttempts++;
            this.recoverFromInterruption();
          } else if (this.recoveryAttempts === 5) {
            console.log('[Audio Debug] Max recovery attempts reached, will try again later');
            this.recoveryAttempts++;
          } else if (this.recoveryAttempts >= 10) {
            // Reset counter after a while to allow new attempts
            this.recoveryAttempts = 0;
          } else {
            this.recoveryAttempts++;
          }
        } else {
          // Reset counter when running
          this.recoveryAttempts = 0;
          
          // Check if sounds are actually playing
          if (this.activeSources.size > 0) {
            // Periodically verify all sounds are playing by reconnecting every ~30 seconds
            if (Math.random() < 0.03) { // ~3% chance each check = once per ~30 seconds on average
              console.log('[Audio Debug] Periodic iOS sound refresh');
              this.reconnectAllSounds();
            }
          }
        }
      } else {
        // For non-iOS, only check when document is hidden
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          console.log(`[Audio Debug] Periodic check - Audio context state: ${state}`);
          
          // Log active sources
          console.log(`[Audio Debug] Active sound sources: ${this.activeSources.size}`);
          
          if (state === 'suspended') {
            console.log('[Audio Debug] Auto-resuming suspended audio context');
            this._audioContext.resume().catch(err => {
              console.error('[Audio Debug] Failed to auto-resume audio context:', err);
            });
          }
        }
      }
    }, checkInterval);
  }

  async loadSound(asset: SoundAsset): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.audioBuffers.has(asset.id)) return;

    try {
      console.log(`[Audio Debug] Loading sound: ${asset.id}`);
      const response = await fetch(asset.url);
      const arrayBuffer = await response.arrayBuffer();
      
      // Make sure audio context is in good state before decoding
      const state = this.getContextState();
      if (state === 'suspended' || state === 'interrupted') {
        console.log(`[Audio Debug] Resuming audio context before decoding ${asset.id}`);
        await this._audioContext!.resume();
      }
      
      const audioBuffer = await this._audioContext!.decodeAudioData(arrayBuffer);
      
      // Log the duration of the loaded audio file - useful for monitoring the 14-second files
      console.log(`[Audio Debug] Loaded ${asset.id}: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.numberOfChannels} channels, ${audioBuffer.sampleRate}Hz`);
      
      this.audioBuffers.set(asset.id, audioBuffer);
      console.log(`[Audio Debug] Sound loaded: ${asset.id}`);
    } catch (error) {
      console.error(`[Audio Debug] Failed to load sound ${asset.id}:`, error);
    }
  }

  setVolume(assetId: string, volume: number): void {
    const gain = this.activeGains.get(assetId);
    if (gain) {
      try {
        console.log(`[Audio Debug] Setting volume for ${assetId}: ${volume}`);
        gain.gain.value = volume;
      } catch (error) {
        console.error(`[Audio Debug] Failed to set volume for sound ${assetId}:`, error);
      }
    }
  }

  // Connect all active gain nodes to the PiP destination
  connectAllToPiP(): void {
    if (!this.connectToPiP || !this._audioContext) {
      console.log('[Audio Debug] Cannot connect to PiP - no connection method or context available');
      return;
    }
    
    console.log(`[Audio Debug] Connecting all active sources to PiP, count: ${this.activeGains.size}`);
    
    try {
      // Create a main page gain control to silence main output without affecting PiP
      const mainPageGain = this._audioContext.createGain();
      mainPageGain.gain.value = 0; // Mute main page audio
      console.log('[Audio Debug] Created master page gain control (muted)');
      
      // Reconnect all audio nodes through our muted master gain
      const nodesProcessed = [];
      
      this.activeGains.forEach((gainNode, id) => {
        try {
          // Skip nodes that don't belong to this context
          if (gainNode.context !== this._audioContext) {
            console.log(`[Audio Debug] Skipping ${id} - belongs to different audio context`);
            return;
          }
          
          // Check if node is already connected to the destination
          try {
            // First safely disconnect from destination if connected
            try {
              gainNode.disconnect(this._audioContext!.destination);
            } catch (disconnectError) {
              // Ignore errors about nodes not being connected
              console.log(`[Audio Debug] Node ${id} was not connected to destination`);
            }
            
            // Connect to muted main page output
            gainNode.connect(mainPageGain);
            
            // Connect to PiP destination
            if (this.connectToPiP) {
              console.log(`[Audio Debug] Connecting ${id} to PiP`);
              this.connectToPiP(gainNode);
              nodesProcessed.push(id);
            }
          } catch (connectionError) {
            console.error(`[Audio Debug] Error connecting ${id}:`, connectionError);
          }
        } catch (e) {
          console.error(`[Audio Debug] Error reconnecting ${id}:`, e);
        }
      });
      
      // Connect master gain to audio context destination
      mainPageGain.connect(this._audioContext.destination);
      
      // Store this gain node for later restoration
      this._mainPageMasterGain = mainPageGain;
      
      console.log(`[Audio Debug] Successfully connected ${nodesProcessed.length} nodes to PiP`);
    } catch (error) {
      console.error('[Audio Debug] Failed to set up PiP audio routing:', error);
    }
    
    // For iOS, make sure to attempt reconnections after PiP starts
    if (this.isIOS) {
      // Schedule multiple recovery attempts after PiP is enabled
      // This helps ensure audio doesn't cut out during PiP transitions
      const scheduleRecovery = (delay: number) => {
        setTimeout(() => {
          if (!this._audioContext || !this.connectToPiP) return;
          
          console.log(`[Audio Debug] PiP stabilization check at ${delay}ms`);
          if (this.getContextState() !== 'running') {
            console.log('[Audio Debug] Audio needs recovery during PiP');
            this.recoverFromInterruption();
          }
          
          // Also refresh connections regardless of state
          if (this.activeSources.size > 0) {
            console.log('[Audio Debug] Refreshing PiP audio connections');
            this.activeGains.forEach((gainNode, id) => {
              // Skip nodes that don't belong to this context
              if (gainNode.context !== this._audioContext) {
                console.log(`[Audio Debug] Skipping refresh for ${id} - different context`);
                return;
              }
              
              try {
                this.connectToPiP!(gainNode);
              } catch (error) {
                console.error(`[Audio Debug] Error refreshing connection for ${id}:`, error);
              }
            });
          }
        }, delay);
      };
      
      // Try at various intervals to catch different transition points
      scheduleRecovery(500);  // Quick check
      scheduleRecovery(1500); // Middle check
      scheduleRecovery(3000); // Longer check
    }
  }

  // Dedicated method for PiP audio recovery on iOS
  recoverPiPAudio(): void {
    if (!this.isIOS) return;
    
    console.log('[Audio Debug] iOS PiP audio recovery triggered');
    
    // Always try to resume context first
    if (this._audioContext) {
      this._audioContext.resume().then(() => {
        console.log(`[Audio Debug] PiP audio context resumed: ${this.getContextState()}`);
        
        // If still not running, try full recovery
        if (this.getContextState() !== 'running') {
          this.recoverFromInterruption();
        } else {
          // Just reconnect sounds if context is running
          this.reconnectAllSounds();
        }
      }).catch(err => {
        console.error('[Audio Debug] PiP audio resume failed:', err);
        // Try full recovery
        this.recoverFromInterruption();
      });
    }
  }

  cleanup(): void {
    // Stop all sounds
    this.stopAllSounds();
    
    // Clear all loop timeouts
    this.loopTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.loopTimeouts.clear();
    
    // Clear all audio buffers
    this.audioBuffers.clear();
    this.soundTypeForAsset.clear();
    
    // Clear the PiP connection
    this.connectToPiP = undefined;
    
    // Close audio context
    if (this._audioContext) {
      if (this._audioContext.state !== 'closed') {
        this._audioContext.close();
      }
      this._audioContext = null;
    }
    
    // Clear interval
    if (this.audioContextStateInterval) {
      clearInterval(this.audioContextStateInterval);
      this.audioContextStateInterval = null;
    }
    
    // Reset flags
    this.initialized = false;
    this.recoveryAttempts = 0;
    
    console.log('[Audio Debug] Audio manager cleanup complete');
  }

  // Clean up PiP connections when exiting PiP mode
  clearPiPConnections(): void {
    console.log('[Audio Debug] Clearing PiP connections');
    
    // First disconnect any active gain nodes
    this.activeGains.forEach((gainNode, id) => {
      try {
        // Force immediate muting of all sounds first (to prevent stuttering)
        gainNode.gain.cancelScheduledValues(0);
        gainNode.gain.setValueAtTime(0, 0);
        console.log(`[Audio Debug] Muted ${id} for PiP disconnect`);
        
        // Attempt to disconnect from all potential destinations
        try {
          gainNode.disconnect();
        } catch (e) {
          console.error('[Audio Debug] Error disconnecting gain node:', e);
        }
      } catch (err) {
        console.error('[Audio Debug] Error muting gain node:', err);
      }
    });
    
    // Clear the connection function
    this.connectToPiP = undefined;
    
    // Reconnect to main audio output (if we have active sounds)
    if (this._audioContext) {
      this.activeGains.forEach((gainNode, id) => {
        try {
          gainNode.connect(this._audioContext!.destination);
          console.log(`[Audio Debug] Reconnected ${id} to main destination`);
        } catch (e) {
          console.error(`[Audio Debug] Error reconnecting ${id}:`, e);
        }
      });
    }
    
    // Clear all delayed timeouts to prevent unexpected sounds after PiP ends
    this.clearAllLoopTimeouts();
    
    console.log('[Audio Debug] PiP connections cleared');
  }
  
  // Helper method to clear all loop timeouts
  private clearAllLoopTimeouts(): void {
    console.log(`[Audio Debug] Clearing all loop timeouts (count: ${this.loopTimeouts.size})`);
    
    this.loopTimeouts.forEach((timeout, id) => {
      clearTimeout(timeout);
      console.log(`[Audio Debug] Cleared loop timeout for ${id}`);
    });
    
    this.loopTimeouts.clear();
  }
  
  // Helper method to clear loop timeouts for a specific asset
  private clearLoopTimeoutsForAsset(assetId: string): void {
    // Find all timeouts that match or start with assetId
    const timeoutsToRemove: string[] = [];
    
    this.loopTimeouts.forEach((_, id) => {
      if (id === assetId || id.startsWith(`${assetId}-recovery`)) {
        timeoutsToRemove.push(id);
      }
    });
    
    if (timeoutsToRemove.length > 0) {
      console.log(`[Audio Debug] Clearing ${timeoutsToRemove.length} loop timeouts for ${assetId}`);
      
      timeoutsToRemove.forEach(id => {
        if (this.loopTimeouts.has(id)) {
          clearTimeout(this.loopTimeouts.get(id)!);
          this.loopTimeouts.delete(id);
        }
      });
    }
  }

  // Ensure all instances of the given sound assets are completely stopped
  public ensureAllStopped(assetIds: string[]): void {
    console.log(`[Audio Debug] Ensuring all stopped: ${assetIds.join(', ')}`);
    
    if (!assetIds.length) return;
    
    // Stop each sound in the list (with multiple attempts)
    assetIds.forEach(assetId => {
      // First try to stop via normal method
      this.stopSound(assetId);
      
      // Also clear any loop timeouts for this asset
      this.clearLoopTimeoutsForAsset(assetId);
      
      // Make sure all variants (recovery instances) are also stopped
      this.activeSources.forEach((_, id) => {
        // Check for recovery variants 
        if (id.startsWith(`${assetId}-recovery`)) {
          this.stopSound(id);
        }
      });
      
      // For iOS PiP issues, also try to disconnect all AudioNodes completely
      this.activeGains.forEach((gainNode, id) => {
        if (id === assetId || id.startsWith(`${assetId}-recovery`)) {
          try {
            // Force immediate muting of all sounds first
            gainNode.gain.cancelScheduledValues(0);
            gainNode.gain.setValueAtTime(0, 0);
            console.log(`[Audio Debug] Muted sound ${id} immediately`);
            
            // Also try to disconnect
            gainNode.disconnect();
          } catch (err) {
            console.error(`[Audio Debug] Error stopping sound ${id}:`, err);
          }
        }
      });
    });
    
    // Check for any active sources that somehow escaped and force stop those too
    this.activeSources.forEach((source, id) => {
      const baseId = id.includes('-recovery-') ? id.split('-recovery-')[0] : id;
      if (assetIds.includes(baseId)) {
        try {
          console.log(`[Audio Debug] Final fallback: force stopping ${id}`);
          source.stop();
          this.activeSources.delete(id);
        } catch (err) {
          console.error(`[Audio Debug] Error in fallback stop for ${id}:`, err);
        }
      }
    });
  }

  // Set the main page master gain node (used for muting main page when PiP is active)
  public setMainPageMasterGain(gainNode: GainNode | null): void {
    console.log(`[Audio Debug] Setting main page master gain: ${gainNode ? 'enabled' : 'disabled'}`);
    
    // If we're replacing an existing gain node, disconnect it first
    if (this._mainPageMasterGain) {
      try {
        this._mainPageMasterGain.disconnect();
      } catch (error) {
        console.error('[Audio Debug] Error disconnecting previous master gain:', error);
      }
    }
    
    this._mainPageMasterGain = gainNode;
    
    // Reconnect all sounds to the new gain node setup if needed
    if (gainNode !== null && this.activeSources.size > 0) {
      console.log('[Audio Debug] Reconnecting active sounds to new gain setup');
      this.reconnectAllSounds();
    }
  }
  
  // Remove duplicate sound sources after returning from background with PiP
  public dedupAllSounds(): void {
    if (!this._audioContext) return;
    
    console.log('[Audio Debug] Running deduplication on all active sounds');
    
    // Track unique sound IDs (without recovery suffixes)
    const uniqueSoundIds = new Map<string, string[]>();
    
    // Group sound sources by their base ID
    this.activeSources.forEach((_, id) => {
      // Get base ID without recovery suffix
      const baseId = id.includes('-recovery-') ? id.split('-recovery-')[0] : id;
      
      if (!uniqueSoundIds.has(baseId)) {
        uniqueSoundIds.set(baseId, []);
      }
      
      uniqueSoundIds.get(baseId)!.push(id);
    });
    
    // Handle each group of sounds
    uniqueSoundIds.forEach((instances, baseId) => {
      // If we have duplicates, keep only the most recent instance
      if (instances.length > 1) {
        console.log(`[Audio Debug] Found ${instances.length} instances of sound ${baseId}`);
        
        // Sort instances by creation time (newest first)
        // Recovery instances have timestamp in their ID
        instances.sort((a, b) => {
          const timeA = a.includes('-recovery-') ? 
            parseInt(a.split('-recovery-')[1] || '0') : 0;
          const timeB = b.includes('-recovery-') ? 
            parseInt(b.split('-recovery-')[1] || '0') : 0;
          return timeB - timeA; // Newest first
        });
        
        // Keep the newest and stop all others
        const newest = instances[0];
        console.log(`[Audio Debug] Keeping newest instance: ${newest}`);
        
        // Stop all other instances
        for (let i = 1; i < instances.length; i++) {
          const id = instances[i];
          console.log(`[Audio Debug] Stopping duplicate: ${id}`);
          
          try {
            const source = this.activeSources.get(id);
            const gain = this.activeGains.get(id);
            
            if (source) {
              source.stop();
              this.activeSources.delete(id);
            }
            
            if (gain) {
              gain.disconnect();
              this.activeGains.delete(id);
            }
          } catch (e) {
            console.error(`[Audio Debug] Error stopping duplicate: ${id}`, e);
          }
        }
      }
    });
  }
}

// Create a singleton instance
export const audioManager = AudioManager.getInstance(); 