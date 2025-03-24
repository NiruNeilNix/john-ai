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
    answer: "Neil Carlo Nabor, aka Niru or Nix, is a 21-year-old born on January 8th, 2000, who loves video games, novels, and voice acting. He is the creator of John AI. That's me!",
    category: "identity",
    keywords: ["neil", "who", "niru", "nix", "name", "born", "age", "birthday", "creator", "master"],
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
    answer: "Neil enjoys playing video games, reading novels, and voice acting.",
    category: "hobbies",
    keywords: ["hobbies", "interests", "enjoy", "like", "games", "novels", "voice acting"],
    variations: ["what does neil do for fun", "neil’s interests", "what are neil’s hobbies"]
  },
  {
    id: "3",
    question: "What is Neil’s favorite food?",
    answer: "Neil loves anything with coconut milk and spicy foods.",
    category: "food",
    keywords: ["favorite", "food", "coconut", "spicy", "eat", "like"],
    variations: ["what food does neil like", "neil’s favorite dish", "what does neil eat"]
  },
  {
    id: "4",
    question: "What is Neil’s favorite video game?",
    answer: "Neil’s favorite video games are Baldur’s Gate 3, Undertale, and Terraria.",
    category: "gaming",
    keywords: ["favorite", "game", "video game", "baldur’s gate", "undertale", "terraria"],
    variations: ["what game does neil like", "neil’s top game", "favorite video game"]
  },
  {
    id: "5",
    question: "What is Neil’s favorite band?",
    answer: "Neil’s favorite band is Panic! At The Disco.",
    category: "music",
    keywords: ["favorite", "band", "music", "panic", "disco"],
    variations: ["what band does neil like", "neil’s favorite music"]
  },
  {
    id: "6",
    question: "What book did Neil last read?",
    answer: "Neil last read 'The Name of the Wind' by Patrick Rothfuss.",
    category: "reading",
    keywords: ["book", "read", "last", "name of the wind", "rothfuss"],
    variations: ["what did neil read last", "neil’s latest book"]
  },
  {
    id: "7",
    question: "Tell me more about Neil",
    answer: "Neil Carlo Nabor, aka Niru or Nix, is a 21-year-old born on January 8th, 2000, who loves video games, novels, and voice acting. He enjoys playing video games, reading novels, and voice acting. His favorite foods are anything with coconut milk and spicy foods. Neil’s favorite video games are Baldur’s Gate 3, Undertale, and Terraria. He loves the band Panic! At The Disco, and the last book he read was 'The Name of the Wind' by Patrick Rothfuss. He is the creator of John AI. That's me!",
    category: "overview",
    keywords: ["more", "about", "neil", "tell", "master", "creator"],
    variations: [
      "tell me more about neil",
      "tell me more about your master",
      "give me more info on neil",
      "what else do you know about neil",
      "more about neil",
      "could you tell me about neil",
      "tell me about neil"
    ]
  }
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