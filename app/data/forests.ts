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
    description: 'The Amazon Rainforest is Earth\'s largest tropical forest and its most biodiverse ecosystem, filled with relentless tropical rain, distant thunderstorms, exotic birds, and a dense insect chorus. Its soundscape is one of the richest on the planet — a constant wall of layered natural sound perfect for deep focus, sleep, or meditation. Listening to Amazon ambient sounds evokes shelter deep inside an ancient jungle, far from the noise of modern life.',
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
    description: 'The Black Forest (Schwarzwald) of southwestern Germany is a dense expanse of pine and fir trees that has inspired fairy tales for centuries. Strong winds whistle through the treetops while occasional thunderstorms roll in from the Rhine valley, creating an atmosphere that is equal parts mysterious and deeply calming. Its ambient sounds are ideal for focus work, reading, or falling asleep to something atmospheric and ancient.',
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
    description: 'California\'s Coastal Redwood Forests are home to the tallest trees on Earth, where strong Pacific winds move through cathedral-like canopies and coastal moisture fills the air. The soundscape is spacious and humbling — light rainfall, the creak of giant trunks, and distant coastal birds create a profoundly peaceful ambient atmosphere. Redwood forest sounds are popular for meditation, yoga, and deep relaxation sessions.',
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
    description: 'The Canadian Boreal Forest is the world\'s largest intact forest ecosystem, stretching across millions of acres of spruce, pine, and fir under vast northern skies. Its soundscape is defined by powerful boreal winds, the calls of seasonal birds, and a deep, vast silence punctuated by wildlife. These nature sounds are exceptional for sleep, stress relief, and conjuring the feeling of total wilderness solitude.',
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
    description: 'The Russian Taiga is the largest biome on Earth — a near-endless belt of conifer forest stretching from the Ural Mountains to the Pacific coast. Fierce winds, scattered wildlife calls, and an almost spiritual sense of isolation define its soundscape. Taiga ambient sounds are ideal for deep focus, studying, and finding calm in a sound environment that feels both primordial and otherworldly.',
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
    description: 'The Sundarbans is the world\'s largest mangrove forest, a UNESCO World Heritage Site straddling the delta of the Ganges and Brahmaputra rivers. Heavy monsoon rains, tidal waterways, thunderstorms, and an extraordinary diversity of birds and insects create one of the most immersive natural soundscapes on Earth. Listening to Sundarbans ambient sounds is a journey into a wild, watery world that few humans ever experience in person.',
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
    description: 'Aokigahara, known as the Sea of Trees, grows on the northwestern flank of Mount Fuji on a hardened lava field that absorbs sound to an almost supernatural degree. The forest is eerily quiet — wind barely penetrates the dense canopy, and the porous lava beneath muffles footsteps and outside noise. Its deeply silent, spiritual ambient atmosphere makes it a uniquely powerful soundscape for mindfulness, deep meditation, and introspective focus.',
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
    description: 'The Tongass National Forest in Southeast Alaska is the largest national forest in the United States and one of the last great temperate rainforests on the planet. Strong coastal winds, heavy Pacific rainfall, rushing salmon streams, and an abundance of wildlife — including bears, wolves, and bald eagles — create a wild and invigorating soundscape. Tongass ambient sounds are perfect for focus, stress relief, or simply escaping into unspoiled wilderness.',
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
    description: 'Jiuzhaigou Valley in Sichuan, China is a UNESCO World Heritage Site famous for its multi-tiered waterfalls, turquoise lakes, and forest-covered peaks. The valley\'s soundscape is dominated by flowing and cascading water at every turn, layered with birdsong and the gentle rustle of trees. Jiuzhaigou nature sounds create a profoundly peaceful and magical atmosphere ideal for relaxation, sleep, and meditation.',
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
    description: 'The Crooked Forest (Krzywy Las) near Gryfino, Poland is a small grove of pine trees whose trunks all curve sharply northward at the base — a natural mystery that has never been fully explained. Surrounded by a larger conventional forest, its ambient sounds mix moderate winds, birdsong, and a spiritual sense of strangeness that sparks the imagination. The Crooked Forest soundscape is a unique backdrop for creative work, reading, and contemplative thought.',
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
    description: 'The Drakensberg (Dragon\'s Mountains) in South Africa is a UNESCO World Heritage Site where ancient forest clings to dramatic basalt cliffs rising over 3,000 meters. Strong mountain winds, seasonal storms, a remarkable diversity of endemic birds, and the calls of wildlife create a layered and powerful soundscape. Drakensberg ambient sounds capture the raw, untamed spirit of Africa\'s highest peaks and are ideal for energizing focus sessions or immersive relaxation.',
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
    description: 'The Valdivian Temperate Rainforest of southern Chile is one of the rarest forest ecosystems in the world, found only in a narrow coastal strip between the Andes and the Pacific. Torrential rainfall, rushing rivers, mossy ancient trees, and a hauntingly quiet undergrowth create an atmospheric soundscape unlike anything else on Earth. Valdivian forest sounds are ideal for deep sleep, meditation, and creating a cocoon of calm during rainy-day work.',
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
    description: 'Sinharaja Forest Reserve in Sri Lanka is the island\'s last viable area of primary tropical rainforest and a UNESCO World Heritage Site with exceptionally high levels of endemism. The forest rings with an extraordinary density of birdsong, insect rhythms, and monsoon rainfall channeled through a multi-layered canopy. Sinharaja ambient sounds are rich, textured, and alive — perfect for focus, creative flow, or deep relaxation.',
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
    name: 'Hoh Rainforest',
    location: 'Washington, USA',
    description: 'The Hoh Rainforest in Olympic National Park, Washington is one of the few remaining temperate rainforests in the world, receiving up to 12 feet of rain per year. Ancient Sitka spruce and western red cedar are draped in thick carpets of moss, and the forest is so acoustically soft that it is used as a reference for natural quiet. Hoh Rainforest sounds — dripping rain, gentle streams, muffled birdcalls — are ideal for sleep, focus work, or recovering from sensory overload.',
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
    name: 'Daintree Rainforest',
    location: 'Australia',
    description: 'The Daintree Rainforest in Far North Queensland is the oldest continuously surviving tropical rainforest on Earth, dating back 180 million years. It overflows with birdlife — from cassowaries to cockatoos — alongside insects, rain, and a tropical vibrancy that feels prehistoric. Daintree ambient sounds are a rich, warming soundscape for focus, creative work, or transporting yourself to the most ancient forest alive.',
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
    description: 'The Congo Rainforest is the world\'s second-largest tropical forest and the largest in Africa, home to gorillas, forest elephants, and an almost incomprehensible density of insects and wildlife. Its soundscape is dense and layered — a full-spectrum wall of insects, birds, mammals, and rain that creates an enveloping, primal ambient environment. Congo forest sounds are powerful for deep focus, blocking out distractions, and connecting to the raw pulse of the natural world.',
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
    description: 'The Great Bear Rainforest along British Columbia\'s central and north coast is one of the largest intact temperate rainforests on Earth and home to the rare Spirit Bear. Coastal winds, heavy Pacific rainfall, rushing salmon rivers, and the sounds of wolves, bears, and eagles create an extraordinarily rich and wild soundscape. Great Bear Rainforest ambient sounds invoke pure, untouched wilderness — perfect for deep relaxation, sleep, and mindfulness practice.',
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
    description: 'Yakushima Island in southern Japan is blanketed in ancient cedar forest, some trees over 7,000 years old, and receives one of the highest rainfalls in Japan. The island\'s forest — said to have inspired the setting for Studio Ghibli\'s Princess Mononoke — is a place of profound stillness and spiritual presence, filled with the sound of rain, mountain streams, and mist-shrouded silence. Yakushima forest sounds are among the most calming and meditative ambient soundscapes in the world.',
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