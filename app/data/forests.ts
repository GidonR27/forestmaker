export interface Forest {
  id: string;
  name: string;
  location: string;
  vibe: string;
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
}

export const forests: Forest[] = [
  {
    id: 'amazon',
    name: 'Amazon Rainforest',
    location: 'South America',
    vibe: 'Lush, vibrant, and teeming with life',
    imageUrl: '/assets/images/Amazon.jpg',
    soundProfile: {
      wind: 0.2,    // Light wind due to dense canopy
      rain: 0.8,    // Heavy rainfall
      birds: 0.9,   // Many bird species
      thunder: 0.7, // Frequent thunderstorms
      water: 0.6,   // Rivers and streams
      insects: 0.9, // Abundant insects
      mammals: 0.7, // Various mammals
      fire: 0.1,    // Rare fires
      ambient: 0.8, // Rich ambient sounds
      spiritual: 0.3 // Indigenous spiritual presence
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
      wind: 0.8,    // Strong winds
      rain: 0.3,    // Light rainfall
      birds: 0.3,   // Few birds
      thunder: 0.2, // Rare thunderstorms
      water: 0.2,   // Some streams
      insects: 0.2, // Few insects
      mammals: 0.5, // Some mammals
      fire: 0.2,    // Occasional fires
      ambient: 0.4, // Quiet ambient sounds
      spiritual: 0.3 // Light spiritual presence
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
      wind: 0.5,    // Moderate winds
      rain: 0.8,    // Heavy rainfall
      birds: 0.6,   // Many birds
      thunder: 0.4, // Occasional storms
      water: 0.7,   // Many streams
      insects: 0.5, // Moderate insects
      mammals: 0.4, // Some mammals
      fire: 0.1,    // Rare fires
      ambient: 0.7, // Mysterious ambient sounds
      spiritual: 0.5 // Moderate spiritual presence
    }
  },
  {
    id: 'sinharaja',
    name: 'Sinharaja Forest',
    location: 'Sri Lanka',
    vibe: 'Lush, diverse, and ancient',
    imageUrl: '/assets/images/Sinharaja.png',
    soundProfile: {
      wind: 0.3,    // Light winds
      rain: 0.8,    // Heavy rainfall
      birds: 0.8,   // Many birds
      thunder: 0.6, // Frequent storms
      water: 0.6,   // Many streams
      insects: 0.8, // Many insects
      mammals: 0.5, // Various mammals
      fire: 0.1,    // Rare fires
      ambient: 0.7, // Rich ambient sounds
      spiritual: 0.4 // Light spiritual presence
    }
  },
  {
    id: 'bialowieza',
    name: 'Białowieża',
    location: 'Poland/Belarus',
    vibe: 'ancient, mystical, primeval, dense, wild',
    imageUrl: '/assets/images/Bialowieza.jpg',
    soundProfile: {
      wind: 0.6,
      rain: 0.7,
      birds: 0.8,
      thunder: 0.3,
      water: 0.4,
      insects: 0.7,
      mammals: 0.6,
      fire: 0.1,
      ambient: 0.5,
      spiritual: 0.4
    }
  },
  {
    id: 'hoh',
    name: 'Hoh Forest',
    location: 'Washington, USA',
    vibe: 'temperate, misty, mossy, ancient, peaceful',
    imageUrl: '/assets/images/Hoh2.png',
    soundProfile: {
      wind: 0.5,
      rain: 0.8,
      birds: 0.6,
      thunder: 0.2,
      water: 0.7,
      insects: 0.5,
      mammals: 0.4,
      fire: 0.1,
      ambient: 0.6,
      spiritual: 0.3
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
      wind: 0.2,    // Light wind
      rain: 0.8,    // Heavy rainfall
      birds: 0.8,   // Many birds
      thunder: 0.6, // Frequent storms
      water: 0.6,   // Many streams
      insects: 0.9, // Many insects
      mammals: 0.8, // Many mammals
      fire: 0.1,    // Rare fires
      ambient: 0.8, // Rich ambient sounds
      spiritual: 0.4 // Moderate spiritual presence
    }
  },
  {
    id: 'bear',
    name: 'Great Bear Rainforest',
    location: 'Canada',
    vibe: 'Wild, coastal, and pristine',
    imageUrl: '/assets/images/Bear.jpg',
    soundProfile: {
      wind: 0.7,    // Strong coastal winds
      rain: 0.8,    // Heavy rainfall
      birds: 0.6,   // Coastal birds
      thunder: 0.4, // Occasional storms
      water: 0.7,   // Coastal waters
      insects: 0.4, // Moderate insects
      mammals: 0.7, // Many mammals
      fire: 0.2,    // Rare fires
      ambient: 0.6, // Rich ambient sounds
      spiritual: 0.5 // Moderate spiritual presence
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