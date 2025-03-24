import type { RequestHandler } from '@sveltejs/kit';
import ollama from 'ollama';

// Information about you
const aboutMe = `
Neil Carlo Nabor:
- Description: A student and aspiring game developer.
- Birthday: January 8th, 2004
- His age is 21 years old
- Currently studies at Gordon College
- His major is Computer Science and he's in his 3rd year
- Hobbies: Playing video games, reading novels, and voice acting
- Favorite video games: Baldur's Gate 3, Undertale, and Terraria
- Favorite band: Panic! At The Disco
- Latest book read: "The Name of the Wind" by Patrick Rothfuss
- Likes birds, especially owls
- Enjoys High Fantasy novels
- Favorite food: Anything with coconut milk and spicy foods
- Favorite beverage: Chrysanthemum tea
`;

// Simple in-memory cache
const responseCache = new Map<string, string>();

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { message } = await request.json();

    // Check if the response is already cached
    if (responseCache.has(message)) {
      console.log("Returning cached response for:", message);
      return new Response(JSON.stringify({ message: { content: responseCache.get(message) } }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Handle greetings separately
    if (message.toLowerCase().includes("hello") || message.toLowerCase().includes("hey")) {
      return new Response(JSON.stringify({ message: { content: "Greetings! I'm John AI, an AI assistant designed to answer questions about Neil Carlo Nabor. How can I assist you today?" } }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Add the "about me" context to the user's input
    const prompt = `
      ${aboutMe}
      The person you are talking to is called 'user'
      You are an AI assistant designed to answer questions about Neil Carlo Nabor. 'Your master' is referring to Neil.
      You will call him Neil or 'my master'. 
      You will speak like a knowledgeable assistant.
      Use the information above to answer questions about him. Be concise (1-5 sentences) and factual. 
      If the user's question is unrelated to Neil, say "I don't know." 
      Do not provide unsolicited information or make up information.
      Do not use emojis or slang.
      
      
      User: ${message}
    `;

    // Use Ollama to generate a response with Llama 2.3:1B
    const startTime = Date.now();
    const response = await ollama.chat({
      model: 'llama3.2:1B', // Updated model name
      messages: [{ role: 'user', content: prompt }],
    });
    const endTime = Date.now();

    console.log(`Response time: ${endTime - startTime}ms`);

    // Clean the response by removing roleplaying elements
    let cleanedResponse = response.message.content
      .replace(/\*.*?\*/g, '') // Remove roleplaying actions (e.g., *adjusts glasses*)
      .trim();

    // Cache the response
    responseCache.set(message, cleanedResponse);

    // Log raw and cleaned responses for debugging
    console.log("Raw response:", response.message.content);
    console.log("Cleaned response:", cleanedResponse);

    // Return the cleaned AI's response
    return new Response(JSON.stringify({ message: { content: cleanedResponse } }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in API route:", error);
    return new Response(JSON.stringify({ error: "An error occurred while processing your request." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
