// src/routes/api/chat/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import ollama from 'ollama';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Parse the request body
    const { message } = await request.json();

    // Log the incoming message for debugging
    console.log("Received message:", message);

    // Use Ollama to generate a response
    const response = await ollama.chat({
      model: 'deepseek-r1', // Use the desired model
      messages: [{ role: 'user', content: message }],
    });

    // Log the response time for debugging
    console.log("Response generated:", response.message.content);

    // Return the AI's response
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Log any errors
    console.error("Error in API route:", error);

    // Return an error response
    return new Response(JSON.stringify({ error: "An error occurred while processing your request." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};