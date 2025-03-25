export interface DataEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  variations: string[];
}

const myData: DataEntry[] = [
  {
    id: "1",
    question: "Who is Neil?",
    answer: "Neil Carlo Nabor, is a 21-year-old guy born on January 8th, 2004, who loves video games, novels, and voice acting. He is currently studying Computer Science at Gordon College to which he is on his third year. He is the creator of John AI.",
    category: "identity",
    keywords: ["neil", "who", "name", "born", "age", "birthday", "creator", "master"],
    variations: [
      "who is neil",
      "tell me about neil",
      "who’s your master",
      "what’s neil’s name",
      "who created you",
      "what is the name of your master",
      "who is your creator",
      "who is your master",
      "could you tell me about neil",
      "could you tell me about your master"
    ]
  },
  {
    id: "2",
    question: "What are Neil’s hobbies?",
    answer: "Neil enjoys playing video games, reading novels, and voice acting. Neil sometimes writes stories and poems as well.",
    category: "hobbies",
    keywords: ["hobbies", "interests", "enjoy", "like", "games", "novels", "voice acting", "poems"],
    variations: ["what does neil do for fun", "neil’s interests", "what are neil’s hobbies"]
  },
  {
    id: "3",
    question: "What is Neil’s favorite food?",
    answer: "Neil loves spicy foods and anything with coconut milk. He loves drinking Chrysanthemum tea as well.",
    category: "food",
    keywords: ["favorite", "food", "coconut", "spicy", "eat", "like"],
    variations: ["what food does neil like", "neil’s favorite dish", "what does neil eat"]
  },
  {
    id: "4",
    question: "What is Neil’s favorite video game?",
    answer: "Neil’s favorite video games are Baldur’s Gate 3, Undertale, and Terraria. He in particular enjoys RPG games that allows for a lot of player choice, player freedom, and good storytelling.",
    category: "gaming",
    keywords: ["favorite", "game", "video game", "baldur’s gate", "undertale", "terraria"],
    variations: ["what game does neil like", "neil’s top game", "favorite video game"]
  },
  {
    id: "5",
    question: "What songs does Neil like?",
    answer: "Neil loves songs from different genres and varieties. He particularly enjoys the band Panic! At The Disco. He also indulges in listening to musicals and video game soundtracks",
    category: "music",
    keywords: ["favorite", "band", "music", "song genre", "music genre", "game soundtrack", "musical", "panic! at the disco"],
    variations: ["what band does neil like", "neil’s favorite music", "what types of music does neil like"]
  },
  {
    id: "6",
    question: "What is Neil's favorite book?",
    answer: "Neil doesn't have a favorite book in particular but he does enjoy reading books from the high fantasy genre. His most recent book read was 'The Name of the Wind' by Patrick Rothfuss.",
    category: "books",
    keywords: ["book", "read", "last", "favorite", "genre", "reading"],
    variations: ["what did neil read last", "what is neil's favorite book", "neil’s favorite genre", "what kind of books does neil like"]
  },
  {
    id: "7",
    question: "What is Neil's long term goal?",
    answer: "Neil's long term goal is to become a successful game developer. Aside from that he also aspires to become an entertainer in the form of voice acting and possibly streaming.",
    category: "goals",
    keywords: ["dreams", "aspirations", "aspire", "long term", "future", "goal", "plans"],
    variations: ["what does neil want to be", "neil’s dream", "what are neil’s goals", "what does neil aspire to be","what are neil’s aspirations", "what are neil’s plans"]
  },
];

export function calculateStringSimilarity(str1: string, str2: string): number {
  str1 = str1.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  str2 = str2.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  if (str1 === str2) return 1;
  if (str1.includes(str2) || str2.includes(str1)) return 0.9;
  const words1 = new Set(str1.split(/\s+/));
  const words2 = str2.split(/\s+/);
  const commonWords = words2.filter(word => words1.has(word));
  return commonWords.length / Math.max(words1.size, words2.length);
}

function findMatchingKeywords(query: string, keywords: string[]): number {
  if (keywords.length === 0) return 0;
  query = query.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const queryWords = new Set(query.split(/\s+/));
  let matches = 0;
  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    for (const word of queryWords) {
      if (word.includes(keywordLower) || keywordLower.includes(word)) {
        matches++;
        break;
      }
    }
  }
  return matches;
}

const queryCache = new Map<string, DataEntry[]>();
const CACHE_SIZE = 20;

export function findRelevantEntries(query: string): DataEntry[] {
  query = query.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  if (queryCache.has(query)) return queryCache.get(query)!;
  if (!query) return [];

  const scoredEntries = myData.map(entry => {
    let score = 0;
    for (const variation of entry.variations) {
      const similarity = calculateStringSimilarity(query, variation);
      if (similarity > 0.5) { // Lowered threshold for better matching
        score += similarity * 5;
      }
    }
    const keywordMatches = findMatchingKeywords(query, entry.keywords);
    score += keywordMatches * 2;
    if (query.includes(entry.category.toLowerCase())) score += 2;
    const questionSimilarity = calculateStringSimilarity(query, entry.question);
    if (questionSimilarity > 0.5) {
      score += questionSimilarity * 3;
    }
    if (query.includes('about') && entry.category === 'overview') {
      score += 3;
    }
    return { entry, score };
  });

  const relevantEntries = scoredEntries
    .filter(({ score }) => score > 1.0)
    .sort((a, b) => b.score - a.score)
    .map(({ entry }) => entry)
    .slice(0, 5);

  queryCache.set(query, relevantEntries);
  if (queryCache.size > CACHE_SIZE) {
    const firstKey = queryCache.keys().next().value as string | undefined;
    if (firstKey) queryCache.delete(firstKey);
  }
  return relevantEntries;
}

export function formatContext(entries: DataEntry[]): string {
  if (entries.length === 0) return '';
  let context = 'Here’s what I know about Neil:\n\n';
  entries.forEach(entry => {
    context += `Q: ${entry.question}\nA: ${entry.answer}\n\n`;
  });
  return context;
}

export function generateFlexibleAnswer(query: string): { answer: string; confidence: number } {
  const relevantEntries = findRelevantEntries(query);
  console.log('Relevant entries for query:', query, relevantEntries.map(e => ({ id: e.id, question: e.question, score: calculateStringSimilarity(query.toLowerCase().replace(/[^a-z0-9\s]/g, ''), e.question.toLowerCase().replace(/[^a-z0-9\s]/g, '')) })));

  const overviewEntry = relevantEntries.find(entry => entry.category === 'overview');
  if (overviewEntry && calculateStringSimilarity(query.toLowerCase().replace(/[^a-z0-9\s]/g, ''), overviewEntry.question.toLowerCase().replace(/[^a-z0-9\s]/g, '')) > 0.5) {
    return { answer: overviewEntry.answer, confidence: 1 };
  }

  if (relevantEntries.length > 0) {
    const avgSimilarity = relevantEntries.reduce(
      (acc, entry) => acc + calculateStringSimilarity(query.toLowerCase().replace(/[^a-z0-9\s]/g, ''), entry.question.toLowerCase().replace(/[^a-z0-9\s]/g, '')),
      0
    ) / relevantEntries.length;

    if (query.toLowerCase().includes('more') || query.toLowerCase().includes('about')) {
      const combinedAnswer = relevantEntries
        .filter(entry => entry.category !== 'overview')
        .map(entry => entry.answer)
        .join(' ');
      return { answer: combinedAnswer, confidence: avgSimilarity };
    }

    if (calculateStringSimilarity(query.toLowerCase().replace(/[^a-z0-9\s]/g, ''), relevantEntries[0].question.toLowerCase().replace(/[^a-z0-9\s]/g, '')) > 0.7) {
      return { answer: relevantEntries[0].answer, confidence: 1 };
    }

    const combinedAnswer = "Here’s what I’ve got: " + relevantEntries.map(entry => entry.answer).join(' Also, ');
    return { answer: combinedAnswer, confidence: avgSimilarity };
  }

  return { answer: "I don’t know enough to answer that.", confidence: 0 };
}