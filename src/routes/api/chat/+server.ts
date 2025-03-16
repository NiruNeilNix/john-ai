import type { RequestHandler } from '@sveltejs/kit';
import ollama from 'ollama';

// Information about you
const aboutMe = `
Master's name is Neil Carlo Nabor (Niru/Nix).
- Favorite color: teal
- Hobbies: video games, anime, novels, voice acting
- Favorite video game: Baldur's Gate 3
- Favorite band: Panic! At The Disco
- Likes birds, especially owls
- Enjoys High Fantasy novels
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

    // Add the "about me" context to the user's input
    const prompt = `
      ${aboutMe}
      
      You are an AI assistant meant to answer questions about your Master, Neil (Niru/Nix). Use the information above to answer questions about him. Always refer to him as "Master," "Niru," or "Nix" in your responses.
      
      User: ${message}
    `;

    // Use Ollama to generate a response
    const startTime = Date.now();
    const response = await ollama.chat({
      model: 'deepseek-r1', 
      messages: [{ role: 'user', content: prompt }],
    });
    const endTime = Date.now();

    console.log(`Response time: ${endTime - startTime}ms`);

    // Clean the response by removing <think> tags and their content
    let cleanedResponse = response.message.content;
    const thinkRegex = /<think>[\s\S]*?<\/think>/g;
    cleanedResponse = cleanedResponse.replace(thinkRegex, '').trim();

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