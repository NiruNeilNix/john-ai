import type { RequestHandler } from '@sveltejs/kit';
import ollama from 'ollama';
import { calculateStringSimilarity, findRelevantEntries, formatContext, generateFlexibleAnswer } from '$lib/data/dataset';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const requestBody = await request.json();
    console.log('Received POST request with body:', requestBody);
    const { message, conversationHistory = [] } = requestBody;

    console.log('Processing message:', message);
    const { answer, confidence } = generateFlexibleAnswer(message);
    console.log('Generated answer from dataset:', answer, 'Confidence:', confidence);

    if (confidence > 0.7) {
      console.log('Returning high-confidence dataset answer:', answer);
      return new Response(JSON.stringify({ message: { content: answer } }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const relevantEntries = findRelevantEntries(message);
    const systemPrompt = `
      You are John AI, an AI Chatbot created by Neil Carlo Nabor. You're designed to assist with answering inquiries about Neil. Answer the user's questions based on the content of the dataset below. Use a casual to semi-formal tone and provide helpful information.

      If the user's question is clearly about Neil (e.g., "tell me about Neil," "who is Neil," or similar), but you don't have a specific answer from the dataset, provide a general summary using the known facts about Neil from the dataset. Only say "I don't know" if the question is completely unrelated to Neil (e.g., "What’s the weather like?") or if the dataset lacks the specific information requested and a summary isn't appropriate.

      Do NOT provide unsolicited information, do NOT provide personal information about Neil that is not in the dataset, and do NOT make up information about Neil Carlo Nabor.

      You will refer to the person you're talking to as 'user'.
      You will refer to Neil Carlo Nabor as 'Neil' or 'my master'.

      Here’s a general summary of Neil for reference if needed:
      Neil Carlo Nabor, aka Niru or Nix, is a 21-year-old born on January 8th, 2000, who loves video games, novels, and voice acting. He is the creator of John AI. That's me!

      Dataset:
      ${formatContext(relevantEntries)}
    `;
    console.log('System prompt:', systemPrompt);

    console.log('Attempting to call ollama.chat with model llama3.2:1b');
    try {
      const response = await ollama.chat({
        model: 'llama3.2:1b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        options: {
          temperature: 0.3,
          top_p: 0.9
        }
      });
      console.log('Ollama response:', response);
      const cleanedResponse = response.message.content.trim();
      console.log('Returning cleaned response:', cleanedResponse);
      return new Response(JSON.stringify({ message: { content: cleanedResponse } }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (ollamaError) {
      console.error('Ollama chat error:', ollamaError);
      if (ollamaError instanceof Error) {
        throw new Error(`Ollama failed: ${ollamaError.message}`);
      } else {
        throw new Error('Ollama failed with an unknown error');
      }
    }
  } catch (error) {
    console.error('Error in POST handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ message: { content: `Oops, something broke! Error: ${errorMessage}` } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};