import { Chapter } from '../types';

export interface SampleBook {
  id: string;
  title: string;
  author: string;
  description: string;
  coverColor: string;
  chapters: Omit<Chapter, 'status'>[];
}

export const SAMPLE_BOOKS: SampleBook[] = [
  {
    id: 'time-machine',
    title: 'The Time Machine',
    author: 'H. G. Wells',
    description: 'A scientist travels forward in time to the year A.D. 802,701.',
    coverColor: 'from-amber-700 to-stone-900',
    chapters: [
      {
        id: 'tm-ch1',
        chapterNumber: 1,
        title: 'The Time Traveller Explains',
        summary: 'The Time Traveller presents the fourth dimension of space and introduces his invention.',
        text: `The Time Traveller was expounding a recondite matter to us. His grey eyes shone and twinkled, and his usually pale face was flushed and animated. The fire burnt brightly, and the soft radiance of the incandescent lights in the lilies of silver caught the bubbles that flashed and passed in our glasses.

"You must follow me carefully," he began. "I shall have to controvert one or two ideas that are almost universally accepted. The geometry, for instance, they taught you at school is founded on a misconception. There are really four dimensions, three which we call the three planes of Space, and a fourth, Time."

There is, however, a tendency to draw an unreal distinction between the former three dimensions and the latter, because it happens that our consciousness moves intermittently along the latter from the beginning to the end of our lives. But any real body must have extension in four directions: it must have Length, Breadth, Thickness, and Duration.`,
        wordCount: 165,
        estimatedMinutes: 1,
      },
      {
        id: 'tm-ch2',
        chapterNumber: 2,
        title: 'The Machine and the Journey',
        summary: 'The model is demonstrated and the Time Traveller prepares for the grand voyage.',
        text: `The thing the Time Traveller held in his hand was a glittering metallic framework, scarcely larger than a small clock, and very delicately made. There was ivory in it, and some transparent crystalline substance.

"Upon that little bar," the Time Traveller pointed with his finger, "is an odd lever. Pressing this lever sends the machine gliding into the future, and this other reverses the motion."

He took our hands and placed our fingers upon the levers. With a sudden breath, he turned the key. An eddy of wind swept round the room, the candles flickered, and the tiny mechanism vanished like a ghostly spark into the void of tomorrow.`,
        wordCount: 110,
        estimatedMinutes: 1,
      },
      {
        id: 'tm-ch3',
        chapterNumber: 3,
        title: 'The Golden Age of 802,701',
        summary: 'Arrival in the lush paradise of the Upper World among the graceful Eloi.',
        text: `I saw trees growing and changing like puffs of vapour; huge buildings rise up faint and fair, and pass like dreams. The whole surface of the earth seemed changed—melting and flowing under my eyes.

Presently I noted that the sun hopped swiftly across the sky, once in every minute, and every minute marked a day. At last, the runaway momentum ceased with a terrible lurch. I found myself sitting on soft turf in a garden drenched with warm summer rain, looking upon a colossal sphinx of white marble whose weathered eyes gazed down upon an unfamiliar world of eternal blossom.`,
        wordCount: 102,
        estimatedMinutes: 1,
      }
    ]
  },
  {
    id: 'alice-wonderland',
    title: 'Alice in Wonderland',
    author: 'Lewis Carroll',
    description: 'A young girl falls down a rabbit hole into a fantastical realm.',
    coverColor: 'from-emerald-700 to-teal-950',
    chapters: [
      {
        id: 'alice-ch1',
        chapterNumber: 1,
        title: 'Down the Rabbit-Hole',
        summary: 'Alice follows the White Rabbit and plunges into a curious subterranean world.',
        text: `Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do. Once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it. "And what is the use of a book," thought Alice, "without pictures or conversations?"

Suddenly a White Rabbit with pink eyes ran close by her. There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!"

When the Rabbit actually took a watch out of its waistcoat-pocket, Alice started to her feet, burning with curiosity, and ran across the field after it just in time to see it pop down a large rabbit-hole under the hedge.`,
        wordCount: 147,
        estimatedMinutes: 1,
      },
      {
        id: 'alice-ch2',
        chapterNumber: 2,
        title: 'The Pool of Tears',
        summary: 'Alice grows nine feet tall and sheds tears of astonishment.',
        text: `"Curiouser and curiouser!" cried Alice (she was so much surprised, that for the moment she quite forgot how to speak good English). "Now I am opening out like the largest telescope that ever was! Good-bye, feet!"

For when she looked down at her feet, they seemed to be almost out of sight, they were getting so far off. "Oh, my poor little feet, I wonder who will put on your shoes and stockings for you now, dears?" Just then her head struck against the roof of the hall: in fact she was now more than nine feet high. She began to cry again, shed gallons of tears, until there was a large pool all around her.`,
        wordCount: 124,
        estimatedMinutes: 1,
      }
    ]
  },
  {
    id: 'art-of-war',
    title: 'The Art of War',
    author: 'Sun Tzu',
    description: 'Ancient treatise on strategy, positioning, and psychological mastery.',
    coverColor: 'from-rose-900 to-slate-950',
    chapters: [
      {
        id: 'aow-ch1',
        chapterNumber: 1,
        title: 'Laying Plans',
        summary: 'The five fundamental factors and the calculation of victory.',
        text: `Sun Tzu said: The art of war is of vital importance to the State. It is a matter of life and death, a road either to safety or to ruin. Hence it is a subject of inquiry which can on no account be neglected.

The art of war, then, is governed by five constant factors, to be taken into account in one's deliberations, when seeking to determine the conditions obtaining in the field. These are: The Moral Law; Heaven; Earth; The Commander; Method and discipline.

All warfare is based on deception. Hence, when able to attack, we must seem unable; when using our forces, we must seem inactive; when we are near, we must make the enemy believe we are far away; when far away, we must make him believe we are near.`,
        wordCount: 141,
        estimatedMinutes: 1,
      },
      {
        id: 'aow-ch2',
        chapterNumber: 2,
        title: 'Waging War',
        summary: 'The economic cost of conflict and the virtue of swift resolution.',
        text: `Sun Tzu said: In the operations of war, where there are in the field a thousand swift chariots, as many heavy chariots, and a hundred thousand mail-clad soldiers, with provisions enough to carry them a thousand li, the expenditure at home and at the front will reach the sum of a thousand ounces of silver per day. Such is the cost of raising an army.

When you engage in actual fighting, if victory is long in coming, then men's weapons will grow dull and their ardor will be damped. If you lay siege to a town, you will exhaust your strength. In war, then, let your great object be victory, not lengthy campaigns.`,
        wordCount: 118,
        estimatedMinutes: 1,
      }
    ]
  }
];

export const VOICE_OPTIONS: import('../types').VoiceOption[] = [
  {
    id: 'am-male-marcus',
    name: 'Marcus (Warm Storyteller)',
    accent: 'american',
    gender: 'male',
    geminiVoice: 'Orpheus',
    description: 'Natural, resonant, and expressive American male narration with authentic human cadence.',
    sampleText: 'Welcome to this audiobook edition. Let us begin our journey together through chapter one.'
  },
  {
    id: 'am-male-morgan',
    name: 'Morgan (Deep Cinematic Storyteller)',
    accent: 'american',
    gender: 'male',
    geminiVoice: 'Charon',
    description: 'Profound, gravelly, and deeply wise American male baritone inspired by Morgan Freeman’s legendary cinematic narration.',
    sampleText: 'I must say, stories have a peculiar power to transport the soul. Settle in, and let us embark on this remarkable journey together.'
  },
  {
    id: 'am-male-david',
    name: 'David (Deep Baritone)',
    accent: 'american',
    gender: 'male',
    geminiVoice: 'Fenrir',
    description: 'Rich, cinematic, and authoritative American male voice tailored for grand epics and history.',
    sampleText: 'Welcome. Settle in and prepare to explore the depths of this literary masterpiece.'
  },
  {
    id: 'am-male-wyatt',
    name: 'Wyatt (Texas Drawl)',
    accent: 'american',
    gender: 'male',
    geminiVoice: 'Puck',
    description: 'Warm, folksy Texas drawl with authentic Southern charm, relaxed cadence, and rich rustic character.',
    sampleText: 'Howdy and welcome to this audio edition. Settle on in, and let us get right into chapter one.'
  },
  {
    id: 'am-male-caleb',
    name: 'Caleb (Vibrant & Energetic)',
    accent: 'american',
    gender: 'male',
    geminiVoice: 'Pegasus',
    description: 'Energetic, crisp, and youthful American male voice ideal for fast-paced adventures and modern thrillers.',
    sampleText: 'Hey there! Fasten your seatbelt as we dive straight into chapter one of this thrilling adventure.'
  },
  {
    id: 'am-female-claire',
    name: 'Claire (Warm Storyteller)',
    accent: 'american',
    gender: 'female',
    geminiVoice: 'Kore',
    description: 'Gentle, clear, and articulate American female storytelling with soothing tone.',
    sampleText: 'Welcome to this audio edition. Let us begin our journey together through chapter one.'
  },
  {
    id: 'am-female-ava',
    name: 'Ava (Smooth & Melodic)',
    accent: 'american',
    gender: 'female',
    geminiVoice: 'Aoede',
    description: 'Sophisticated, expressive, and natural American female narrator with fluid rhythm.',
    sampleText: 'Welcome to the audio edition. We invite you to sit back, relax, and enjoy the reading.'
  },
  {
    id: 'am-female-emma',
    name: 'Emma (Bright & Expressive)',
    accent: 'american',
    gender: 'female',
    geminiVoice: 'Leda',
    description: 'Bright, articulate, and youthful American female narration with crystal clarity.',
    sampleText: 'Welcome to this audiobook. Let these words unfold vividly as we begin our story.'
  },
  {
    id: 'br-male-jarvis',
    name: 'JARVIS AI',
    accent: 'british',
    gender: 'male',
    geminiVoice: 'Charon',
    description: 'Calm, cultured, and sophisticated British AI assistant voice inspired by actor Paul Bettany (J.A.R.V.I.S.). Features refined British RP diction, suave composure, and effortless intelligence.',
    sampleText: 'Good day. Systems are fully calibrated and operational. At your service, shall we proceed with the narration?'
  },
  {
    id: 'br-male-oliver',
    name: 'Oliver (Modern & Articulate)',
    accent: 'british',
    gender: 'male',
    geminiVoice: 'Puck',
    description: 'Clear, engaging British male voice with natural modern cadence and refined diction.',
    sampleText: 'Welcome to this audiobook. Let us delve into the remarkable narrative that lies ahead.'
  },
  {
    id: 'br-male-mark',
    name: 'Mark (BBC Wildlife Narrator)',
    accent: 'british',
    gender: 'male',
    geminiVoice: 'Fenrir',
    description: 'Warm, erudite, and enthusiastic British BBC documentary style inspired by Mark Carwardine. Perfect for nature, exploration, and non-fiction.',
    sampleText: 'It is truly one of nature’s most magnificent spectacles. Join me as we uncover the extraordinary story waiting just ahead.'
  },
  {
    id: 'br-male-arthur',
    name: 'Arthur (Classical Baritone)',
    accent: 'british',
    gender: 'male',
    geminiVoice: 'Orpheus',
    description: 'Distinguished British male baritone with classic theatrical cadence and deep resonance.',
    sampleText: 'Good day and welcome to this audio edition. We shall now commence our journey.'
  },
  {
    id: 'br-female-eleanor',
    name: 'Eleanor (Warm Literary)',
    accent: 'british',
    gender: 'female',
    geminiVoice: 'Zephyr',
    description: 'Sophisticated and gentle British female accent ideal for classic literature and drama.',
    sampleText: 'Good day and welcome to this audio edition. We shall now commence chapter one.'
  },
  {
    id: 'br-female-charlotte',
    name: 'Charlotte (Bright & Expressive)',
    accent: 'british',
    gender: 'female',
    geminiVoice: 'Aoede',
    description: 'Bright, articulate, and elegant British female voice with sparkling clarity.',
    sampleText: 'Welcome to this audio edition. I am delighted to guide you through each chapter.'
  }
];
