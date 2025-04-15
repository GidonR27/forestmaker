// Import only the type, not the actual value

interface MediaSessionHandlers {
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
}

// Track media session state to prevent redundant actions
let isPaused = false;
let isProcessingMediaAction = false;
let lastActionTime = 0;
const MIN_ACTION_INTERVAL_MS = 500; // Prevent rapid-fire actions on iOS

export function setupMediaSession(options: {
  forestName?: string;
  handlers?: MediaSessionHandlers;
}) {
  if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
    try {
      // Set metadata for media session
      navigator.mediaSession.metadata = new MediaMetadata({
        title: options.forestName || 'Forest Sound',
        artist: 'Forest Maker',
        album: 'Nature Soundscapes',
        artwork: [
          { src: '/icon-360x360.png', sizes: '360x360', type: 'image/png' },
          { src: '/icon-180x180.png', sizes: '180x180', type: 'image/png' },
          { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-1024x1024.png', sizes: '1024x1024', type: 'image/png' }
        ]
      });

      // Detect iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      // Reset state
      isPaused = false;
      isProcessingMediaAction = false;
      lastActionTime = 0;

      // Setup play handler with debounce and state checks
      navigator.mediaSession.setActionHandler('play', () => {
        console.log('[Media Session] Play action triggered');
        
        // Skip if already processing or already playing
        if (isProcessingMediaAction || !isPaused) {
          console.log('[Media Session] Skipping play action - already playing or busy');
          return;
        }
        
        // Debounce for iOS
        const now = Date.now();
        if (now - lastActionTime < MIN_ACTION_INTERVAL_MS) {
          console.log('[Media Session] Throttling play action');
          return;
        }
        
        // Mark that we're processing an action and update timestamp
        isProcessingMediaAction = true;
        lastActionTime = now;
        
        // Execute callback
        if (options.handlers?.onPlay) {
          options.handlers.onPlay();
          isPaused = false;
        }
        
        // Release the lock after a short delay
        setTimeout(() => {
          isProcessingMediaAction = false;
        }, 300);
      });

      // Setup pause handler with iOS-specific behavior
      navigator.mediaSession.setActionHandler('pause', () => {
        console.log('[Media Session] Pause action triggered');
        
        // Skip if already processing or already paused
        if (isProcessingMediaAction || isPaused) {
          console.log('[Media Session] Skipping pause action - already paused or busy');
          return;
        }
        
        // Debounce for iOS
        const now = Date.now();
        if (now - lastActionTime < MIN_ACTION_INTERVAL_MS) {
          console.log('[Media Session] Throttling pause action');
          return;
        }
        
        // Mark that we're processing an action and update timestamp
        isProcessingMediaAction = true;
        lastActionTime = now;
        
        // Add delay for iOS with PiP to prevent stuttering
        if (isIOS) {
          console.log('[Media Session] Adding iOS stabilization delay for pause');
          setTimeout(() => {
            if (options.handlers?.onPause) {
              options.handlers.onPause();
              isPaused = true;
            }
            
            // Delay releasing the lock to prevent immediate action
            setTimeout(() => {
              isProcessingMediaAction = false;
            }, 400);
          }, 150);
        } else {
          // Execute immediately for non-iOS
          if (options.handlers?.onPause) {
            options.handlers.onPause();
            isPaused = true;
          }
          
          // Release the lock after a short delay
          setTimeout(() => {
            isProcessingMediaAction = false;
          }, 300);
        }
      });

      // Setup stop handler with same iOS-specific behavior as pause
      navigator.mediaSession.setActionHandler('stop', () => {
        console.log('[Media Session] Stop action triggered');
        
        // Skip if already processing or already stopped
        if (isProcessingMediaAction || isPaused) {
          console.log('[Media Session] Skipping stop action - already stopped or busy');
          return;
        }
        
        // Debounce for iOS
        const now = Date.now();
        if (now - lastActionTime < MIN_ACTION_INTERVAL_MS) {
          console.log('[Media Session] Throttling stop action');
          return;
        }
        
        // Mark that we're processing an action and update timestamp
        isProcessingMediaAction = true;
        lastActionTime = now;
        
        // Add delay for iOS with PiP to prevent stuttering
        if (isIOS) {
          console.log('[Media Session] Adding iOS stabilization delay for stop');
          setTimeout(() => {
            if (options.handlers?.onStop) {
              options.handlers.onStop();
              isPaused = true;
            }
            
            // Delay releasing the lock to prevent immediate action
            setTimeout(() => {
              isProcessingMediaAction = false;
            }, 400);
          }, 150);
        } else {
          // Execute immediately for non-iOS
          if (options.handlers?.onStop) {
            options.handlers.onStop();
            isPaused = true;
          }
          
          // Release the lock after a short delay
          setTimeout(() => {
            isProcessingMediaAction = false;
          }, 300);
        }
      });

      // Set playback state
      navigator.mediaSession.playbackState = 'playing';
      
      console.log('[Media Session] Media session configured successfully');
    } catch (error) {
      console.error('[Media Session] Error setting up media session:', error);
    }
  } else {
    console.log('[Media Session] Media Session API not available in this browser');
  }
}

export function updateMediaSessionMetadata(forestName: string) {
  if (typeof window !== 'undefined' && 'mediaSession' in navigator && navigator.mediaSession.metadata) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${forestName} Soundscape`,
      artist: 'Forest Maker',
      album: 'Nature Soundscapes',
      artwork: [
        { src: '/icon-360x360.png', sizes: '360x360', type: 'image/png' },
        { src: '/icon-180x180.png', sizes: '180x180', type: 'image/png' },
        { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-1024x1024.png', sizes: '1024x1024', type: 'image/png' }
      ]
    });
  }
}

export function setMediaSessionPlaybackState(state: 'playing' | 'paused' | 'none') {
  if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
    // Update our internal state tracking to match
    isPaused = (state === 'paused' || state === 'none');
    
    // Update media session state
    navigator.mediaSession.playbackState = state;
  }
} 