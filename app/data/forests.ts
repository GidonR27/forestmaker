export interface Forest {
  id: string;
  name: string;
  shortName?: string; // Optional short name for display purposes
  location: string;
  description?: string;
  vibe?: string;
  imageUrl: string;
  soundProfile: {
    wind: number;
    rain: number;
    birds: number;
    thunder: number;
    water: number;
    insects: number;
    mammals: number;
    fire: number;
    ambient: number;
    spiritual: number;
  };
  tags?: string[]; // Optional tags for categorization
}

export const forests: Forest[] = [
  {
    id: 'amazon',
    name: 'Amazon Rainforest',
    location: 'South America',
    vibe: 'Lush, vibrant, and teeming with life',
    imageUrl: '/assets/images/Amazon.jpg',
    soundProfile: {
      wind: 0.1,    // Very light wind due to dense canopy - reduced from 0.2
      rain: 0.9,    // Very heavy rainfall - increased from 0.8
      birds: 1.0,   // Extremely high bird diversity - increased from 0.9
      thunder: 0.8, // More frequent thunderstorms - increased from 0.7
      water: 0.7,   // More rivers and streams - increased from 0.6
      insects: 0.9, // Same abundant insects
      mammals: 0.6, // Fewer mammals - reduced from 0.7
      fire: 0.0,    // Almost no fires - reduced from 0.1
      ambient: 0.9, // Richer ambient sounds - increased from 0.8
      spiritual: 0.4 // Slightly more spiritual - increased from 0.3
    }
  },
  {
    id: 'black-forest',
    name: 'Black Forest',
    location: 'Germany',
    vibe: 'Mysterious, ancient, and enchanting',
    imageUrl: '/assets/images/Black.png',
    soundProfile: {
      wind: 0.7,    // Strong winds through pines
      rain: 0.6,    // Moderate rainfall
      birds: 0.5,   // Moderate bird activity
      thunder: 0.4, // Occasional storms
      water: 0.3,   // Some streams
      insects: 0.4, // Moderate insects
      mammals: 0.6, // Deer and other mammals
      fire: 0.2,    // Rare fires
      ambient: 0.7, // Mysterious ambient sounds
      spiritual: 0.8 // Strong spiritual presence
    }
  },
  {
    id: 'redwood',
    name: 'Redwood Forest',
    location: 'California',
    vibe: 'Majestic, peaceful, and awe-inspiring',
    imageUrl: '/assets/images/Redwood.png',
    soundProfile: {
      wind: 0.8,    // Strong coastal winds
      rain: 0.5,    // Moderate rainfall
      birds: 0.6,   // Coastal birds
      thunder: 0.3, // Rare thunderstorms
      water: 0.4,   // Coastal moisture
      insects: 0.3, // Few insects
      mammals: 0.5, // Some mammals
      fire: 0.1,    // Rare fires
      ambient: 0.6, // Peaceful ambient sounds
      spiritual: 0.5 // Moderate spiritual presence
    }
  },
  {
    id: 'boreal',
    name: 'Boreal Forest',
    location: 'Canada',
    vibe: 'Serene, vast, and pristine',
    imageUrl: '/assets/images/Boreal.png',
    soundProfile: {
      wind: 0.9,    // Strong northern winds
      rain: 0.4,    // Light rainfall
      birds: 0.4,   // Seasonal birds
      thunder: 0.2, // Rare thunderstorms
      water: 0.3,   // Some lakes
      insects: 0.2, // Few insects
      mammals: 0.4, // Some mammals
      fire: 0.3,    // Occasional fires
      ambient: 0.5, // Quiet ambient sounds
      spiritual: 0.4 // Light spiritual presence
    }
  },
  {
    id: 'taiga',
    name: 'Taiga Forest',
    location: 'Russia',
    vibe: 'Cold, vast, and resilient',
    imageUrl: '/assets/images/Taiga.png',
    soundProfile: {
      wind: 0.9,    // Very strong winds - increased from 0.8
      rain: 0.2,    // Less rainfall - reduced from 0.3
      birds: 0.4,   // More birds - increased from 0.3
      thunder: 0.2, // Same thunderstorms
      water: 0.3,   // More streams - increased from 0.2
      insects: 0.1, // Fewer insects - reduced from 0.2
      mammals: 0.6, // More mammals - increased from 0.5 
      fire: 0.3,    // More fires - increased from 0.2
      ambient: 0.3, // Less ambient - reduced from 0.4
      spiritual: 0.5 // More spiritual - increased from 0.3
    }
  },
  {
    id: 'sundarbans',
    name: 'Sundarbans',
    location: 'Bangladesh/India',
    vibe: 'Mysterious, wet, and wild',
    imageUrl: '/assets/images/Sundarbans.png',
    soundProfile: {
      wind: 0.4,    // Moderate winds
      rain: 0.8,    // Heavy rainfall
      birds: 0.7,   // Many birds
      thunder: 0.6, // Frequent storms
      water: 0.9,   // Extensive waterways
      insects: 0.8, // Many insects
      mammals: 0.6, // Various mammals
      fire: 0.1,    // Rare fires
      ambient: 0.7, // Rich ambient sounds
      spiritual: 0.5 // Moderate spiritual presence
    }
  },
  {
    id: 'aokigahara',
    name: 'Aokigahara',
    location: 'Japan',
    vibe: 'Silent, mysterious, and haunting',
    imageUrl: '/assets/images/Aokigahara.png',
    soundProfile: {
      wind: 0.3,    // Light winds
      rain: 0.5,    // Moderate rainfall
      birds: 0.2,   // Few birds
      thunder: 0.3, // Occasional storms
      water: 0.2,   // Some streams
      insects: 0.3, // Few insects
      mammals: 0.2, // Few mammals
      fire: 0.1,    // Rare fires
      ambient: 0.9, // Very quiet ambient sounds
      spiritual: 0.9 // Strong spiritual presence
    }
  },
  {
    id: 'tongass',
    name: 'Tongass Forest',
    location: 'Alaska',
    vibe: 'Ancient, wet, and wild',
    imageUrl: '/assets/images/Tongass.png',
    soundProfile: {
      wind: 0.7,    // Strong coastal winds
      rain: 0.8,    // Heavy rainfall
      birds: 0.6,   // Coastal birds
      thunder: 0.4, // Occasional storms
      water: 0.7,   // Many streams
      insects: 0.4, // Moderate insects
      mammals: 0.7, // Many mammals
      fire: 0.2,    // Rare fires
      ambient: 0.6, // Rich ambient sounds
      spiritual: 0.5 // Moderate spiritual presence
    }
  },
  {
    id: 'jiuzhaigou',
    name: 'Jiuzhaigou Valley',
    location: 'China',
    vibe: 'Colorful, peaceful, and magical',
    imageUrl: '/assets/images/Jiuzhaigou.png',
    soundProfile: {
      wind: 0.4,    // Light winds
      rain: 0.5,    // Moderate rainfall
      birds: 0.6,   // Many birds
      thunder: 0.3, // Occasional storms
      water: 0.8,   // Many waterfalls
      insects: 0.5, // Moderate insects
      mammals: 0.4, // Some mammals
      fire: 0.1,    // Rare fires
      ambient: 0.7, // Peaceful ambient sounds
      spiritual: 0.6 // Moderate spiritual presence
    }
  },
  {
    id: 'crooked',
    name: 'Crooked Forest',
    location: 'Poland',
    vibe: 'Mysterious, unique, and enchanting',
    imageUrl: '/assets/images/Crooked.png',
    soundProfile: {
      wind: 0.6,    // Moderate winds
      rain: 0.4,    // Light rainfall
      birds: 0.5,   // Moderate birds
      thunder: 0.3, // Occasional storms
      water: 0.2,   // Some streams
      insects: 0.4, // Moderate insects
      mammals: 0.3, // Few mammals
      fire: 0.2,    // Rare fires
      ambient: 0.6, // Mysterious ambient sounds
      spiritual: 0.7 // Strong spiritual presence
    }
  },
  {
    id: 'drakensberg',
    name: 'Drakensberg Forest',
    location: 'South Africa',
    vibe: 'Dramatic, ancient, and diverse',
    imageUrl: '/assets/images/Drakensberg.png',
    soundProfile: {
      wind: 0.7,    // Strong mountain winds
      rain: 0.6,    // Moderate rainfall
      birds: 0.7,   // Many birds
      thunder: 0.5, // Occasional storms
      water: 0.5,   // Some streams
      insects: 0.6, // Many insects
      mammals: 0.5, // Various mammals
      fire: 0.3,    // Occasional fires
      ambient: 0.6, // Rich ambient sounds
      spiritual: 0.6 // Moderate spiritual presence
    }
  },
  {
    id: 'valdivian',
    name: 'Valdivian Forest',
    location: 'Chile',
    vibe: 'Ancient, wet, and mysterious',
    imageUrl: '/assets/images/Valdivian.png',
    soundProfile: {
      wind: 0.6,    // More winds - increased from 0.5
      rain: 0.9,    // Very heavy rainfall - increased from 0.8
      birds: 0.4,   // Fewer birds - reduced from 0.6
      thunder: 0.3, // Less storms - reduced from 0.4
      water: 0.8,   // More streams - increased from 0.7
      insects: 0.3, // Fewer insects - reduced from 0.5
      mammals: 0.6, // More mammals - increased from 0.4
      fire: 0.0,    // Almost no fires - reduced from 0.1
      ambient: 0.8, // More mysterious ambient - increased from 0.7
      spiritual: 0.4 // Less spiritual - reduced from 0.5
    }
  },
  {
    id: 'sinharaja',
    name: 'Sinharaja Forest',
    location: 'Sri Lanka',
    vibe: 'Lush, diverse, and ancient',
    imageUrl: '/assets/images/Sinharaja.png',
    soundProfile: {
      wind: 0.2,    // Less wind - reduced from 0.3
      rain: 0.7,    // Less rainfall - reduced from 0.8
      birds: 0.9,   // More birds - increased from 0.8
      thunder: 0.7, // More storms - increased from 0.6
      water: 0.5,   // Less water - reduced from 0.6
      insects: 0.9, // More insects - increased from 0.8
      mammals: 0.4, // Less mammals - reduced from 0.5
      fire: 0.1,    // Same rare fires
      ambient: 0.6, // Less ambient - reduced from 0.7
      spiritual: 0.6 // More spiritual - increased from 0.4
    }
  },
  {
    id: 'bialowieza',
    name: 'Białowieża Forest',
    shortName: 'Białowieża',
    location: 'Poland/Belarus',
    description: 'One of the last and largest remaining parts of the immense primeval forest that once stretched across the European Plain. Home to the European bison.',
    vibe: 'ancient, mystical, primeval, dense, wild',
    imageUrl: '/assets/images/bialowieza_new.jpg',
    soundProfile: {
      wind: 0.4,
      rain: 0.3,
      birds: 0.6,
      thunder: 0.2,
      water: 0.3,
      insects: 0.4,
      mammals: 0.8,  // High due to European bison and other wildlife
      fire: 0,
      ambient: 0.5,
      spiritual: 0.3
    },
    tags: ['temperate', 'primeval', 'european', 'wildlife']
  },
  {
    id: 'hoh',
    name: 'Hoh Forest',
    location: 'Washington, USA',
    vibe: 'temperate, misty, mossy, ancient, peaceful',
    imageUrl: '/assets/images/Hoh2.png',
    soundProfile: {
      wind: 0.4,    // Less wind - reduced from 0.5
      rain: 0.9,    // More rainfall (one of the wettest temperate rainforests) - increased from 0.8
      birds: 0.5,   // Fewer birds - reduced from 0.6
      thunder: 0.3, // Slightly more thunder - increased from 0.2
      water: 0.8,   // More water sounds - increased from 0.7
      insects: 0.4, // Fewer insects - reduced from 0.5
      mammals: 0.5, // More mammals - increased from 0.4
      fire: 0.0,    // Almost no fires - reduced from 0.1
      ambient: 0.7, // More ambient sounds - increased from 0.6
      spiritual: 0.4 // More spiritual - increased from 0.3
    }
  },
  {
    id: 'daintree',
    name: 'Daintree Forest',
    location: 'Australia',
    vibe: 'Ancient, diverse, and vibrant',
    imageUrl: '/assets/images/Daintree.jpg',
    soundProfile: {
      wind: 0.4,    // Light winds
      rain: 0.7,    // Heavy rainfall
      birds: 0.8,   // Many birds
      thunder: 0.5, // Occasional storms
      water: 0.5,   // Some streams
      insects: 0.8, // Many insects
      mammals: 0.5, // Various mammals
      fire: 0.2,    // Occasional fires
      ambient: 0.7, // Rich ambient sounds
      spiritual: 0.4 // Light spiritual presence
    }
  },
  {
    id: 'congo',
    name: 'Congo Rainforest',
    location: 'Central Africa',
    vibe: 'Dense, mysterious, and alive',
    imageUrl: '/assets/images/Congo.png',
    soundProfile: {
      wind: 0.3,    // More wind - increased from 0.2
      rain: 0.7,    // Less rainfall - reduced from 0.8
      birds: 0.7,   // Fewer birds - reduced from 0.8
      thunder: 0.5, // Less thunder - reduced from 0.6
      water: 0.5,   // Fewer streams - reduced from 0.6
      insects: 1.0, // Maximum insects - increased from 0.9
      mammals: 0.9, // More mammals (gorillas, elephants) - increased from 0.8
      fire: 0.2,    // More fires - increased from 0.1
      ambient: 0.7, // Less ambient - reduced from 0.8
      spiritual: 0.6 // Stronger spiritual - increased from 0.4
    }
  },
  {
    id: 'bear',
    name: 'Great Bear Rainforest',
    location: 'Canada',
    vibe: 'Wild, coastal, and pristine',
    imageUrl: '/assets/images/Bear.jpg',
    soundProfile: {
      wind: 0.5,    // Moderate coastal winds - reduced from 0.7
      rain: 0.7,    // Substantial rainfall - reduced from 0.8
      birds: 0.7,   // More bird activity - increased from 0.6
      thunder: 0.3, // Less thunderstorms - reduced from 0.4
      water: 0.8,   // More water sounds (streams, waterfalls) - increased from 0.7
      insects: 0.3, // Fewer insects - reduced from 0.4
      mammals: 0.9, // Significantly more mammals (bears, wolves, etc.) - increased from 0.7
      fire: 0.1,    // Very rare fires - reduced from 0.2
      ambient: 0.5, // Slightly quieter ambient - reduced from 0.6
      spiritual: 0.7 // More spiritual presence - increased from 0.5
    }
  },
  {
    id: 'yakushima',
    name: 'Yakushima Forest',
    location: 'Japan',
    vibe: 'Ancient, mystical, and serene',
    imageUrl: '/assets/images/Yakushima.jpg',
    soundProfile: {
      wind: 0.5,    // Moderate winds
      rain: 0.8,    // Heavy rainfall
      birds: 0.5,   // Moderate birds
      thunder: 0.4, // Occasional storms
      water: 0.6,   // Many streams
      insects: 0.4, // Moderate insects
      mammals: 0.3, // Few mammals
      fire: 0.1,    // Rare fires
      ambient: 0.7, // Peaceful ambient sounds
      spiritual: 0.8 // Strong spiritual presence
    }
  }
]; 