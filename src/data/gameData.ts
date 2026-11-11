export interface CharacterGuide {
  id: 'leo' | 'colette' | 'marquis' | 'lafayette';
  name: string;
  role: string;
  era: string;
  portraitUrl: string;
  accentColor: string;
  voicePitch: number;
}

export interface TeachingFact {
  title: string;
  statistic: string;
  explanation: string;
  keyTerm: string;
}

export interface EstateMatchItem {
  id: string;
  label: string;
  detail: string;
  correctEstate: 'first' | 'second' | 'third';
}

export interface HiddenClueItem {
  id: string;
  title: string;
  xPercent: number;
  yPercent: number;
  historicalFact: string;
  clueSymbol: string;
}

export interface BastilleDecision {
  id: string;
  situation: string;
  prompt: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    feedback: string;
  }[];
}

export interface TimelineEventItem {
  id: string;
  dateLabel: string;
  title: string;
  description: string;
  chronologicalOrder: number;
}

export interface MissionConfig {
  id: number;
  codeName: string;
  title: string;
  subtitle: string;
  locationName: string;
  dateLabel: string;
  mapX: number; // Normalized 0.0 - 1.0 on the 1789 France canvas
  mapY: number;
  guideId: CharacterGuide['id'];
  badgeName: string;
  badgeDescription: string;
  pointsReward: number;
  dialogueIntro: {
    speakerId: CharacterGuide['id'];
    line: string;
  }[];
  teachingConceptTitle: string;
  teachingSummary: string;
  teachingFacts: TeachingFact[];
  mechanicType:
    | 'ESTATES_MATCH'
    | 'TAX_DETECTIVE'
    | 'BREAD_FLASHLIGHT'
    | 'TENNIS_CIPHER'
    | 'BASTILLE_DECISION'
    | 'TIMELINE_ORDER';
}

export const CHARACTER_GUIDES: Record<CharacterGuide['id'], CharacterGuide> = {
  leo: {
    id: 'leo',
    name: 'Leo Vance',
    role: 'Modern Student Detective',
    era: 'Present Day -> 1789 Rift',
    portraitUrl: '/src/assets/images/char_guide_leo_1794418167564.jpg',
    accentColor: '#0EA5E9',
    voicePitch: 410,
  },
  colette: {
    id: 'colette',
    name: 'Colette Moreau',
    role: 'Parisian Baker Apprentice (Third Estate)',
    era: 'Paris, Summer 1789',
    portraitUrl: '/src/assets/images/char_guide_colette_1794418169653.jpg',
    accentColor: '#DC2626',
    voicePitch: 480,
  },
  marquis: {
    id: 'marquis',
    name: 'Duke de Valois',
    role: 'Royal Courtier at Versailles (Second Estate)',
    era: 'Palace of Versailles, 1789',
    portraitUrl: '/src/assets/images/char_king_louis_1794418169658.jpg',
    accentColor: '#F59E0B',
    voicePitch: 290,
  },
  lafayette: {
    id: 'lafayette',
    name: 'Citizen Henri',
    role: 'National Assembly Delegate',
    era: 'Versailles & Bastille, July 1789',
    portraitUrl: '/src/assets/images/char_guide_leo_1794418167564.jpg',
    accentColor: '#38BDF8',
    voicePitch: 340,
  },
};

export const HERO_PORTAL_IMAGE = '/src/assets/images/portal_paris_1789_1794418164963.jpg';

export const MISSIONS: MissionConfig[] = [
  {
    id: 1,
    codeName: 'Chapter 01',
    title: 'The Mysterious Portal',
    subtitle: 'Uncover the Three Estates of 1789 France',
    locationName: 'Rift Gate · Old Paris Alleyway',
    dateLabel: 'May 1789',
    mapX: 0.16,
    mapY: 0.68,
    guideId: 'leo',
    badgeName: 'Rift Pathfinder',
    badgeDescription: 'Mastered the pyramid of the Three Estates in 1789 France.',
    pointsReward: 250,
    dialogueIntro: [
      {
        speakerId: 'leo',
        line: 'My compass is spinning wildly! That red dimensional rift in the history library pulled us straight into Paris in the year 1789.',
      },
      {
        speakerId: 'colette',
        line: 'Travelers! Careful in the fog. Here in France, your entire life depends on which of the Three Estates you were born into.',
      },
      {
        speakerId: 'leo',
        line: 'Before we can stabilize the first rift node, we must learn how French society is divided into Three Estates—and sort the citizens correctly!',
      },
    ],
    teachingConceptTitle: 'The Three Estates of French Society (1789)',
    teachingSummary:
      'Before the Revolution, France had 26 million people divided into three unequal social groups called Estates. People could not choose their Estate—they were born into it.',
    teachingFacts: [
      {
        title: 'First Estate: The Clergy',
        statistic: 'Less than 1% of Population · Owned 10% of Land',
        explanation:
          'Bishops, priests, and church leaders who ran schools and churches. They paid zero compulsory royal land taxes and collected a 10% tax called the Tithe.',
        keyTerm: '1st Estate = Church Leaders (Clergy)',
      },
      {
        title: 'Second Estate: The Nobility',
        statistic: 'About 2% of Population · Owned 25% of Land',
        explanation:
          'Rich dukes, lords, and royal courtiers at Versailles. They held top jobs in the army and government and were exempt from paying the main royal taxes.',
        keyTerm: '2nd Estate = Rich Lords & Nobles',
      },
      {
        title: 'Third Estate: Everyone Else',
        statistic: '97% of Population · Paid Almost All Taxes',
        explanation:
          'Included poor peasant farmers, city bakers, blacksmiths, AND educated doctors, lawyers, and merchants. They had the hardest lives and almost no voice.',
        keyTerm: '3rd Estate = 97% of the People',
      },
    ],
    mechanicType: 'ESTATES_MATCH',
  },
  {
    id: 2,
    codeName: 'Chapter 02',
    title: 'The Kingdom of Inequality',
    subtitle: 'Investigate Royal Luxury & Unfair Taxation',
    locationName: 'Hall of Mirrors · Palace of Versailles',
    dateLabel: 'May 1789',
    mapX: 0.31,
    mapY: 0.32,
    guideId: 'marquis',
    badgeName: 'Ledger Detective',
    badgeDescription: 'Uncovered why France went broke and who paid the royal taxes.',
    pointsReward: 300,
    dialogueIntro: [
      {
        speakerId: 'marquis',
        line: 'Welcome to the glittering Palace of Versailles! King Louis XVI hosts grand banquets while golden chandeliers shine day and night.',
      },
      {
        speakerId: 'colette',
        line: 'Glittering for you, Duke! France’s treasury is empty from expensive wars and palace luxuries, yet you Nobles and the Clergy refuse to pay taxes!',
      },
      {
        speakerId: 'leo',
        line: 'Look at the Royal Tax Ledger! Let’s inspect the three tax laws first, then solve the detective mystery of why the Third Estate is so angry.',
      },
    ],
    teachingConceptTitle: 'Why Was the Third Estate Unhappy?',
    teachingSummary:
      'King Louis XVI ran out of money because of costly wars and lavish spending at the Palace of Versailles. Yet the richest people (1st and 2nd Estates) barely paid any taxes!',
    teachingFacts: [
      {
        title: 'The Taille (Royal Land Tax)',
        statistic: 'Paid by: The Third Estate Only',
        explanation:
          'A direct tax on land and income given to the King. Nobles and Clergy were legally excused from paying the Taille.',
        keyTerm: 'Taille = Direct Tax on Commoners',
      },
      {
        title: 'The Gabelle (Forced Salt Tax)',
        statistic: 'Paid by: Common Families',
        explanation:
          'Salt was needed to keep food from spoiling before refrigerators existed. Every Third Estate family was forced to buy heavily taxed royal salt.',
        keyTerm: 'Gabelle = Unfair Salt Tax',
      },
      {
        title: 'The Tithe (Church Tax)',
        statistic: '10% of Every Peasant Harvest',
        explanation:
          'Peasant farmers had to hand over one-tenth of all the wheat and food they grew to the First Estate (the Clergy).',
        keyTerm: 'Tithe = 10% Harvest Tax',
      },
    ],
    mechanicType: 'TAX_DETECTIVE',
  },
  {
    id: 3,
    codeName: 'Chapter 03',
    title: 'The Missing Bread',
    subtitle: 'Flashlight Investigation in the Starving Bakery',
    locationName: 'Faubourg Market · Empty Bakery District',
    dateLabel: 'June 1789',
    mapX: 0.48,
    mapY: 0.72,
    guideId: 'colette',
    badgeName: 'Lantern Investigator',
    badgeDescription: 'Found all hidden clues explaining the 1789 bread crisis.',
    pointsReward: 350,
    dialogueIntro: [
      {
        speakerId: 'colette',
        line: 'The ovens in our bakery have gone cold! Strange red frost from the Upside Down mirrors the terrible storms that ruined France’s wheat harvest.',
      },
      {
        speakerId: 'leo',
        line: 'It’s pitch dark inside the market! I’ll use my flashlight beam to search the bakery for 4 hidden clues explaining the food shortage.',
      },
    ],
    teachingConceptTitle: 'The Great Bread Shortage of 1788–1789',
    teachingSummary:
      'Bread was the main food for French families—people ate 2 pounds of bread a day! When nature and taxes collided in 1788–1789, ordinary families faced starvation.',
    teachingFacts: [
      {
        title: 'Catastrophic Weather (1788)',
        statistic: 'Hailstorms + Freezing Winter',
        explanation:
          'Giant hailstorms in summer 1788 crushed wheat fields, followed by a winter so cold that rivers and watermills froze solid.',
        keyTerm: 'Ruined Harvest = No Flour',
      },
      {
        title: 'Skyrocketing Bread Prices',
        statistic: '1 Loaf = 80% to 90% of Daily Pay',
        explanation:
          'Because flour was scarce, bakers had to raise the price of a single 4-pound loaf of bread to almost a whole month’s savings!',
        keyTerm: 'Inflation = Bread Too Expensive',
      },
      {
        title: 'Starvation in the Streets',
        statistic: 'Bread Riots Across Paris',
        explanation:
          'Hungry mothers and workers waited in line before dawn outside bakeries, only to find empty shelves while Versailles held feasts.',
        keyTerm: 'Hunger Sparked the Uprising',
      },
    ],
    mechanicType: 'BREAD_FLASHLIGHT',
  },
  {
    id: 4,
    codeName: 'Chapter 04',
    title: 'The Secret Meeting',
    subtitle: 'Crack the Cipher of the Tennis Court Oath',
    locationName: 'Royal Indoor Tennis Court · Versailles',
    dateLabel: '20 June 1789',
    mapX: 0.63,
    mapY: 0.28,
    guideId: 'lafayette',
    badgeName: 'Cipher Breaker',
    badgeDescription: 'Decoded the secret pledge of the National Assembly at the Tennis Court.',
    pointsReward: 400,
    dialogueIntro: [
      {
        speakerId: 'lafayette',
        line: 'King Louis XVI finally called a big meeting called the Estates-General! But there’s a trap: each Estate only gets ONE collective vote.',
      },
      {
        speakerId: 'colette',
        line: 'That means the 1st and 2nd Estates always team up to outvote the 3rd Estate 2-to-1, even though we represent 97% of France!',
      },
      {
        speakerId: 'leo',
        line: 'And today—June 20, 1789—the King locked them out of the meeting hall! They rushed into a nearby indoor Tennis Court and encoded their secret oath.',
      },
    ],
    teachingConceptTitle: 'The National Assembly & The Tennis Court Oath',
    teachingSummary:
      'Tired of being outvoted 2-to-1 in the Estates-General, the Third Estate formed the National Assembly on June 17, 1789 to speak for the real people of France.',
    teachingFacts: [
      {
        title: 'The Unfair 2-to-1 Vote',
        statistic: 'Estates-General (May 1789)',
        explanation:
          'In the Estates-General, Clergy had 1 vote, Nobles had 1 vote, and the Third Estate had 1 vote. Privileged Estates always won 2 to 1.',
        keyTerm: 'Estates-General = Unfair Voting',
      },
      {
        title: 'The National Assembly',
        statistic: 'Formed 17 June 1789',
        explanation:
          'Representatives of the Third Estate declared themselves the National Assembly—a new government representing the people of France.',
        keyTerm: 'National Assembly = Voice of the People',
      },
      {
        title: 'The Tennis Court Oath',
        statistic: 'Sworn 20 June 1789',
        explanation:
          'When locked out of their hall, delegates met in an indoor Royal Tennis Court and swore never to separate until they wrote a fair CONSTITUTION.',
        keyTerm: 'Tennis Court Oath = Pledge for a Constitution',
      },
    ],
    mechanicType: 'TENNIS_CIPHER',
  },
  {
    id: 5,
    codeName: 'Chapter 05',
    title: 'The Fall of the Fortress',
    subtitle: 'Survive the Storming of the Bastille (14 July 1789)',
    locationName: 'The Bastille Fortress · Eastern Paris',
    dateLabel: '14 July 1789',
    mapX: 0.78,
    mapY: 0.66,
    guideId: 'colette',
    badgeName: 'Defender of July 14',
    badgeDescription: 'Led the decisions during the Storming of the Bastille.',
    pointsReward: 450,
    dialogueIntro: [
      {
        speakerId: 'colette',
        line: 'It is July 14, 1789! Royal troops are surrounding Paris, and rumors say the King plans to crush the new National Assembly!',
      },
      {
        speakerId: 'leo',
        line: 'Look at that giant medieval stone fortress—the Bastille! The red rift energy is strongest right above its eight towers.',
      },
      {
        speakerId: 'lafayette',
        line: 'Study why the Bastille matters to the people, then make the right historical decisions before the rift timer runs out!',
      },
    ],
    teachingConceptTitle: 'The Storming of the Bastille (14 July 1789)',
    teachingSummary:
      'On July 14, 1789, an angry crowd marched on the Bastille—a towering medieval fortress and prison in Paris. Its capture changed history forever.',
    teachingFacts: [
      {
        title: 'A Symbol of Royal Tyranny',
        statistic: '8 Stone Towers · 100 Feet High',
        explanation:
          'For centuries, kings locked up anyone who spoke against them inside the Bastille without a trial using secret royal letters (Lettres de Cachet).',
        keyTerm: 'Bastille = Symbol of Absolute Royal Power',
      },
      {
        title: 'The Search for Gunpowder',
        statistic: '30,000 Pounds of Gunpowder Inside',
        explanation:
          'Parisians had seized muskets to defend the National Assembly from the King’s soldiers, but they needed the gunpowder stored inside the Bastille.',
        keyTerm: 'Goal = Gunpowder to Defend the City',
      },
      {
        title: 'Birth of the Tricolor & Bastille Day',
        statistic: '14 July = French National Holiday',
        explanation:
          'Citizens tore down the fortress brick by brick with their hands! Today, July 14 is celebrated every year as France’s National Day.',
        keyTerm: 'July 14, 1789 = Start of the Revolution',
      },
    ],
    mechanicType: 'BASTILLE_DECISION',
  },
  {
    id: 6,
    codeName: 'Chapter 06',
    title: 'The Final Timeline',
    subtitle: 'Restore History & Unlock the Portal Home',
    locationName: 'Dimensional Rift Nexus · National Assembly',
    dateLabel: 'August 1789',
    mapX: 0.90,
    mapY: 0.35,
    guideId: 'leo',
    badgeName: 'Historian of 1789',
    badgeDescription: 'Restored the timeline and mastered the Declaration of Rights.',
    pointsReward: 500,
    dialogueIntro: [
      {
        speakerId: 'lafayette',
        line: 'In August 1789, we wrote the historic Declaration of the Rights of Man and of the Citizen—proclaiming Liberty, Equality, and Fraternity!',
      },
      {
        speakerId: 'leo',
        line: 'The Upside Down rift is scrambling the order of history! To open the portal back to our classroom, we must put all 6 events of 1789 in exact chronological order.',
      },
    ],
    teachingConceptTitle: 'The Declaration of the Rights of Man (August 1789)',
    teachingSummary:
      'After the fall of the Bastille, the National Assembly abolished feudal privileges and adopted a famous charter of human rights in August 1789.',
    teachingFacts: [
      {
        title: 'Born Free and Equal',
        statistic: 'Article 1 · August 26, 1789',
        explanation:
          'Declared that "Men are born and remain free and equal in rights"—ending the unfair rule that nobles were above the law.',
        keyTerm: 'Equal Rights Under the Law',
      },
      {
        title: 'Guaranteed Freedoms',
        statistic: 'Speech · Religion · Fair Taxes',
        explanation:
          'Promised freedom of speech, freedom of the press, fair trials, and that taxes should be shared fairly by all citizens according to their ability to pay.',
        keyTerm: 'Fair Taxes for ALL Citizens',
      },
      {
        title: 'Motto of the Revolution',
        statistic: 'Liberty · Equality · Fraternity',
        explanation:
          'Liberty means freedom, Equality means equal treatment for all, and Fraternity means brotherhood and helping one another.',
        keyTerm: 'Liberty, Equality, Fraternity',
      },
    ],
    mechanicType: 'TIMELINE_ORDER',
  },
];

// Mission 1 Puzzle Data: Matching 6 cards to First, Second, or Third Estate
export const MISSION_1_CARDS: EstateMatchItem[] = [
  {
    id: 'card-bishops',
    label: 'Archbishops & Parish Priests',
    detail: 'Ran churches and schools, collected the 10% Tithe, and owned 10% of French land.',
    correctEstate: 'first',
  },
  {
    id: 'card-dukes',
    label: 'Royal Dukes & Palace Lords',
    detail: 'Lived in luxury at Versailles, held top army commands, and paid zero Taille land tax.',
    correctEstate: 'second',
  },
  {
    id: 'card-peasants',
    label: 'Peasant Farmers & Bakers',
    detail: 'Worked the fields and ovens from dawn till dusk; paid the Taille, Gabelle, and Tithe.',
    correctEstate: 'third',
  },
  {
    id: 'card-doctors',
    label: 'City Doctors, Lawyers & Merchants',
    detail: 'Educated professionals (the Bourgeoisie) who paid heavy taxes but had no say in royal rule.',
    correctEstate: 'third',
  },
  {
    id: 'card-monasteries',
    label: 'Cathedral & Monastery Leaders',
    detail: 'Made up less than 1% of the population and only gave voluntary gifts to the King.',
    correctEstate: 'first',
  },
  {
    id: 'card-knights',
    label: 'Countesses & Hereditary Nobles',
    detail: 'Made up about 2% of the population and collected feudal dues from village peasants.',
    correctEstate: 'second',
  },
];

// Mission 3 Puzzle Data: Hidden Clues in the Dark Bakery
export const MISSION_3_CLUES: HiddenClueItem[] = [
  {
    id: 'clue-hail',
    title: '1788 Weather Almanac',
    xPercent: 22,
    yPercent: 34,
    historicalFact:
      'CLUE 1: "July 1788 — Giant hailstones destroyed the wheat fields across France, followed by a freezing winter that stopped the flour mills."',
    clueSymbol: '❄',
  },
  {
    id: 'clue-chalkboard',
    title: 'Baker’s Price Chalkboard',
    xPercent: 74,
    yPercent: 28,
    historicalFact:
      'CLUE 2: "July 1789 Price Notice — 1 Four-Pound Loaf of Bread now costs 88% of a worker’s entire daily wage!"',
    clueSymbol: '🥖',
  },
  {
    id: 'clue-salt',
    title: 'Royal Gabelle Tax Stamp',
    xPercent: 36,
    yPercent: 72,
    historicalFact:
      'CLUE 3: "Official Tax Collector Notice — Even while starving, peasant families must still pay the Gabelle (salt tax) and Taille (land tax)."',
    clueSymbol: '📜',
  },
  {
    id: 'clue-feast',
    title: 'Versailles Banquet Delivery Slip',
    xPercent: 78,
    yPercent: 68,
    historicalFact:
      'CLUE 4: "200 Sacks of Finest White Flour reserved exclusively for royal banquets at the Palace of Versailles."',
    clueSymbol: '👑',
  },
];

// Mission 5 Puzzle Data: Bastille Decisions
export const MISSION_5_DECISIONS: BastilleDecision[] = [
  {
    id: 'bastille-q1',
    situation: 'Morning of 14 July 1789: Royal soldiers surround Paris. The citizens have muskets from the Hôtel des Invalides, but the muskets cannot fire!',
    prompt: 'Why did the crowd march toward the towering Bastille fortress?',
    options: [
      {
        id: 'opt-1a',
        text: 'To seize the 30,000 pounds of gunpowder stored inside the Bastille and topple a symbol of royal tyranny.',
        isCorrect: true,
        feedback: 'Correct! The Bastille held 30,000 pounds of gunpowder and stood as a hated symbol of the King’s absolute unchecked power.',
      },
      {
        id: 'opt-1b',
        text: 'Because King Louis XVI lived inside the Bastille and held royal banquets there.',
        isCorrect: false,
        feedback: 'Not quite! King Louis XVI lived at the Palace of Versailles, not inside the Bastille prison.',
      },
      {
        id: 'opt-1c',
        text: 'To collect taxes from the First and Second Estates.',
        isCorrect: false,
        feedback: 'Try again! The Bastille was a medieval fortress-prison and weapons depot, not a tax office.',
      },
    ],
  },
  {
    id: 'bastille-q2',
    situation: 'Afternoon of 14 July 1789: Governor de Launay lowers the drawbridge after hours of standoff. The people of Paris take control of the fortress!',
    prompt: 'Why did ordinary citizens hate the Bastille so deeply for hundreds of years?',
    options: [
      {
        id: 'opt-2a',
        text: 'It was where the Estates-General voted 2-to-1.',
        isCorrect: false,
        feedback: 'Remember, the Estates-General met at Versailles. Look for how kings used the Bastille as a prison!',
      },
      {
        id: 'opt-2b',
        text: 'Kings could lock up anyone who criticized them inside the Bastille without a fair trial.',
        isCorrect: true,
        feedback: 'Spot on! Secret royal orders (Lettres de Cachet) allowed the King to imprison people without any trial, making the Bastille a symbol of tyranny.',
      },
      {
        id: 'opt-2c',
        text: 'It was where all the salt in France was manufactured.',
        isCorrect: false,
        feedback: 'Salt was taxed by the Gabelle, not made in the Bastille!',
      },
    ],
  },
  {
    id: 'bastille-q3',
    situation: 'Evening of 14 July 1789: The fortress has fallen! Citizens wearing blue, white, and red cockades gather with pickaxes and lanterns.',
    prompt: 'What did the citizens of Paris do to the Bastille after capturing it, and how is July 14 remembered today?',
    options: [
      {
        id: 'opt-3a',
        text: 'They tore the fortress down brick by brick, and July 14 is celebrated as France’s National Day (Bastille Day).',
        isCorrect: true,
        feedback: 'Brilliant! Tearing down the Bastille brick by brick proved that the King no longer had absolute power.',
      },
      {
        id: 'opt-3b',
        text: 'They turned it into a new palace for the Second Estate nobles.',
        isCorrect: false,
        feedback: 'No way! The people wanted to end absolute tyranny, so they demolished the fortress.',
      },
      {
        id: 'opt-3c',
        text: 'They locked the entire Third Estate inside it.',
        isCorrect: false,
        feedback: 'The Third Estate were the ones who captured and demolished the Bastille!',
      },
    ],
  },
];

// Mission 6 Puzzle Data: Chronological Timeline Events (Scrambled initially in UI)
export const MISSION_6_TIMELINE: TimelineEventItem[] = [
  {
    id: 'ev-1',
    dateLabel: 'Summer & Winter 1788',
    title: 'Severe Hailstorms & Bread Shortage',
    description: 'Freezing weather ruins France’s wheat harvest while the Third Estate pays crushing taxes.',
    chronologicalOrder: 1,
  },
  {
    id: 'ev-2',
    dateLabel: '5 May 1789',
    title: 'King Calls the Estates-General',
    description: 'King Louis XVI summons all Three Estates to Versailles to solve the money crisis, using an unfair 2-to-1 voting system.',
    chronologicalOrder: 2,
  },
  {
    id: 'ev-3',
    dateLabel: '17 June 1789',
    title: 'Third Estate Forms the National Assembly',
    description: 'Representing 97% of the people, Third Estate delegates declare themselves the National Assembly.',
    chronologicalOrder: 3,
  },
  {
    id: 'ev-4',
    dateLabel: '20 June 1789',
    title: 'The Tennis Court Oath',
    description: 'Locked out of their meeting hall, delegates gather in an indoor Tennis Court and swear to write a fair Constitution.',
    chronologicalOrder: 4,
  },
  {
    id: 'ev-5',
    dateLabel: '14 July 1789',
    title: 'Storming of the Bastille',
    description: 'Parisians capture the medieval Bastille fortress for gunpowder and tear down the symbol of royal tyranny.',
    chronologicalOrder: 5,
  },
  {
    id: 'ev-6',
    dateLabel: '26 August 1789',
    title: 'Declaration of the Rights of Man',
    description: 'The National Assembly proclaims that all citizens are born free and equal in rights.',
    chronologicalOrder: 6,
  },
];
