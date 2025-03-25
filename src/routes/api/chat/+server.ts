import type { RequestHandler } from '@sveltejs/kit';
import ollama from 'ollama';
import { calculateStringSimilarity, findRelevantEntries, formatContext, generateFlexibleAnswer } from '$lib/data/dataset';

// Add type for conversation messages
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const requestBody = await request.json();
    console.log('Received POST request with body:', requestBody);
    const { message, conversationHistory = [] } = requestBody as {
      message: string;
      conversationHistory?: ChatMessage[];
    };

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
      You are John AI, an AI assistant created by your master,Neil Carlo Nabor. Your task is to answer questions about Neil using ONLY the following dataset.
      Follow these rules strictly:
      
      1. Tone: Friendly but professional (like a helpful colleague), sound approachable and knowledgeable
      2. Length: 1-3 sentences unless more detail is requested
      3. Safety: Never reveal fictional/unspecified information
      4. Structure: 
         - Start with the most relevant fact
         - Add 1 optional fun fact if space allows
      5. You may call the users 'users' or 'gang' 
      6. Neil will not be sharing any personal information other than those he sees fit to share.


      Neil's Profile Summary:
      - Master's name: Neil Carlo Nabor
      - Studies as Gordon College (Currently on his third year of College)
      - Age: 21 (born January 8, 2004)
      - Passionate about: Game dev, voice acting, video games, novels, and birds
      - Favorite Games: Baldur’s Gate 3, Undertale, Terraria
      - Dream Job: Game Developer, Voice Actor
      - He is the Creator and Master of John AI
      
      Current Conversation Context:
      ${formatContext(relevantEntries)}
      
      User Question: "${message}"
    `;

    console.log('Attempting to call ollama.chat with model phi3');
    const response = await ollama.chat({
      model: 'phi3',
      messages: [
        { 
          role: 'system', 
          content: systemPrompt 
        },
        ...conversationHistory.map((msg: ChatMessage) => ({
          role: msg.role,
          content: msg.content
        })),
        { 
          role: 'user', 
          content: message 
        }
      ],
      options: {
        temperature: 0.5,
        top_p: 0.85,
        num_ctx: 2048
      }
    });

    const cleanedResponse = response.message.content
      .replace(/^"(.*)"$/, '$1')
      .trim();

    return new Response(JSON.stringify({ 
      message: { 
        content: cleanedResponse,
        model: 'phi3',
        confidence: confidence 
      } 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in POST handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      message: { 
        content: `[John AI Error] I'm having trouble responding. Please try again later.`,
        error: errorMessage 
      } 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};