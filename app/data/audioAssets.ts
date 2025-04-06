export interface AudioAsset {
  id: string;
  url: string;
  intensity: 'soft' | 'moderate' | 'strong';
}

export const audioAssets: Record<string, AudioAsset[]> = {
  wind: [
    { id: 'wind-soft', url: '/assets/audio/wind/Light_wind.mp3', intensity: 'soft' },
    { id: 'wind-moderate', url: '/assets/audio/wind/Moderate_wind.mp3', intensity: 'moderate' },
    { id: 'wind-strong', url: '/assets/audio/wind/Strong_wind.mp3', intensity: 'strong' }
  ],
  rain: [
    { id: 'rain-soft', url: '/assets/audio/rain/Light_rain.mp3', intensity: 'soft' },
    { id: 'rain-moderate', url: '/assets/audio/rain/Moderate_rain.mp3', intensity: 'moderate' },
    { id: 'rain-strong', url: '/assets/audio/rain/Strong_rain.mp3', intensity: 'strong' }
  ],
  birds: [
    { id: 'birds-soft', url: '/assets/audio/birds/Light_birds.mp3', intensity: 'soft' },
    { id: 'birds-moderate', url: '/assets/audio/birds/Moderate_birds.mp3', intensity: 'moderate' },
    { id: 'birds-strong', url: '/assets/audio/birds/Strong_birds.mp3', intensity: 'strong' }
  ],
  thunder: [
    { id: 'thunder-soft', url: '/assets/audio/thunder/Light_thunder.mp3', intensity: 'soft' },
    { id: 'thunder-moderate', url: '/assets/audio/thunder/Moderate_thunder.mp3', intensity: 'moderate' },
    { id: 'thunder-strong', url: '/assets/audio/thunder/Strong_thunder.mp3', intensity: 'strong' }
  ],
  water: [
    { id: 'water-soft', url: '/assets/audio/water/Light_water.mp3', intensity: 'soft' },
    { id: 'water-moderate', url: '/assets/audio/water/Moderate_water.mp3', intensity: 'moderate' },
    { id: 'water-strong', url: '/assets/audio/water/Strong_water.mp3', intensity: 'strong' }
  ],
  insects: [
    { id: 'insects-soft', url: '/assets/audio/insect/Light_insect.mp3', intensity: 'soft' },
    { id: 'insects-moderate', url: '/assets/audio/insect/Moderate_insect.mp3', intensity: 'moderate' },
    { id: 'insects-strong', url: '/assets/audio/insect/Strong_insect.mp3', intensity: 'strong' }
  ],
  mammals: [
    { id: 'mammals-soft', url: '/assets/audio/mammals/Light_mammals.mp3', intensity: 'soft' },
    { id: 'mammals-moderate', url: '/assets/audio/mammals/Moderate_mammals.mp3', intensity: 'moderate' },
    { id: 'mammals-strong', url: '/assets/audio/mammals/Strong_mammals.mp3', intensity: 'strong' }
  ],
  fire: [
    { id: 'fire-soft', url: '/assets/audio/fire/Light_fire.mp3', intensity: 'soft' },
    { id: 'fire-moderate', url: '/assets/audio/fire/Moderate_fire.mp3', intensity: 'moderate' },
    { id: 'fire-strong', url: '/assets/audio/fire/Strong_fire.mp3', intensity: 'strong' }
  ],
  // Note: Ambient audio files are now 14 seconds in duration (previously shorter)
  ambient: [
    { id: 'ambient-soft', url: '/assets/audio/ambient/Light_ambient.mp3', intensity: 'soft' },
    { id: 'ambient-moderate', url: '/assets/audio/ambient/Moderate_ambiant.mp3', intensity: 'moderate' },
    { id: 'ambient-strong', url: '/assets/audio/ambient/Strong_ambiant.mp3', intensity: 'strong' }
  ],
  spiritual: [
    { id: 'spiritual-soft', url: '/assets/audio/ancient/Light_ancient.mp3', intensity: 'soft' },
    { id: 'spiritual-moderate', url: '/assets/audio/ancient/Moderate_ancient.mp3', intensity: 'moderate' },
    { id: 'spiritual-strong', url: '/assets/audio/ancient/Strong_ancient.mp3', intensity: 'strong' }
  ]
}; 