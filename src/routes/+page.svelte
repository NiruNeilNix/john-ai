<script lang="ts">
  import { onMount } from 'svelte';

  // State for user input and chat messages
  let userInput: string = '';
  let messages: Array<{
    role: string;
    content: string;
    timestamp: string;
  }> = [];
  let isSending: boolean = false;
  let isTyping: boolean = false;

  // Initialize chat with a generic greeting (backend will personalize)
  onMount(() => {
    messages = [
      {
        role: 'assistant',
        content: 'Yahoo! My name is John AI. Here to answer inquiries about my creator/master, Neil. How may I help you today, gang? My master taught me to say that.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - 24.03.25',
      },
    ];
  });

  async function sendMessage() {
    if (!userInput.trim() || isSending) return;

    isSending = true;
    isTyping = true;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - 24.03.25';

    try {
      // Add user's message to the chat
      messages = [...messages, { role: 'user', content: userInput, timestamp }];

      // Log the request
      console.log('Sending POST to /api/chat with message:', userInput);

      // Send the user's message to the backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
        }),
      });

      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
      }

      const data = await response.json();
      console.log('Received response data:', data);
      const aiMessage = data.message.content;

      // Add AI's response to the chat
      messages = [...messages, { 
        role: 'assistant', 
        content: aiMessage, 
        timestamp,
      }];
    } catch (error) {
      console.error('Error sending message:', error);
      messages = [...messages, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.', timestamp }];
    } finally {
      isSending = false;
      isTyping = false;
      userInput = '';
    }
  }
</script>

<svelte:head>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      background: linear-gradient(to bottom, #1A2634, #2A3A4A); /* Gradient background */
    }
  </style>
</svelte:head>

<div class="chat-container flex flex-col h-screen max-w-2xl mx-auto bg-gradient-to-b from-dark-teal-top to-dark-teal-bottom">
  <!-- Header -->
  <div class="header flex justify-between items-center p-4 bg-transparent border-b border-gray-600">
    <div>
      <h1 class="text-white text-lg font-semibold">John AI </h1>
      <p class="text-gray-400 text-sm">Say hi to him or something...</p>
    </div>
  </div>

  <!-- Messages Section -->
  <div class="messages flex-1 overflow-y-auto p-4">
    {#each messages as message}
      <div class="message-wrapper mb-4">
        <div
          class="message p-3 rounded-lg"
          class:user="{message.role === 'user'}"
          class:assistant="{message.role === 'assistant'}"
        >
          {message.content}
        </div>
        <div class="timestamp text-gray-400 text-xs mt-1" class:left="{message.role === 'assistant'}" class:right="{message.role === 'user'}">
          {message.timestamp}
        </div>
      </div>
    {/each}

    {#if isTyping}
      <div class="message-wrapper mb-4">
        <div class="message assistant p-3 rounded-lg max-w-[50%] text-dark-gray italic">
          Hold up a sec, John is cooking up a response..
        </div>
      </div>
    {/if}
  </div>

  <!-- Input Section -->
  <div class="input-container flex items-center gap-2 p-4 bg-transparent border-t border-gray-600">
    <input
      bind:value={userInput}
      placeholder="Ask me anything..."
      on:keydown={(e) => e.key === 'Enter' && sendMessage()}
      class="flex-1 p-2 bg-input-bg border-none rounded-md text-white placeholder-gray-400 focus:outline-none"
    />
    <button
      on:click={sendMessage}
      disabled={isSending}
      class="p-2 text-white hover:text-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
    >
      ➤
    </button>
  </div>
</div>

<style>
  /* Custom color definitions */
  .bg-gradient-to-b {
    background: linear-gradient(to bottom, #1A2634, #2A3A4A);
  }
  .from-dark-teal-top {
    background-color: #1A2634;
  }
  .to-dark-teal-bottom {
    background-color: #2A3A4A;
  }
  .bg-input-bg {
    background-color: #3E4A5B; /* Input field background */
  }
  .text-dark-gray {
    color: #333; /* Dark text for AI messages */
  }
  .text-gray-400 {
    color: #9CA3AF; /* Light gray for timestamps and secondary text */
  }
  .border-gray-600 {
    border-color: #4B5E74; /* Slightly lighter than background for borders */
  }
  .placeholder-gray-400::placeholder {
    color: #9CA3AF;
  }

  /* Message styling */
  .message-wrapper {
    display: flex;
    flex-direction: column;
  }
  .message {
    word-wrap: break-word;
    max-width: 50%; /* Shorter width for both user and assistant messages */
  }
  .user {
    background-color: #5A6775; /* Gray for user messages */
    color: white;
    margin-left: auto;
    margin-right: 10px;
    border-top-right-radius: 0; /* Sharp corner on the right */
  }
  .assistant {
    background-color: white; /* White for assistant messages */
    color: #333; /* Dark text for readability */
    margin-right: auto;
    margin-left: 10px;
    border-top-left-radius: 0; /* Sharp corner on the left */
  }
  .timestamp {
    font-size: 0.75rem;
  }
  .timestamp.left {
    text-align: left;
    margin-left: 10px;
  }
  .timestamp.right {
    text-align: right;
    margin-right: 10px;
  }
</style>