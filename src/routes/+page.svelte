<script lang="ts">
  let userInput: string = ''; // Stores the user's input
  let messages: Array<{ role: string; content: string }> = []; // Stores the chat history
  let isSending: boolean = false; // Tracks if a request is in progress
  let isTyping: boolean = false; // Tracks if the AI is typing

  async function sendMessage() {
    if (!userInput.trim() || isSending) return; // Ignore empty input or if a request is already in progress

    isSending = true; // Disable the send button
    isTyping = true; // Show typing indicator

    try {
      // Add the user's message to the chat history
      messages = [...messages, { role: 'Master', content: userInput }];

      // Send the user's message to the backend API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Parse the AI's response
      const data = await response.json();
      const aiMessage = data.message.content;

      // Add the AI's response to the chat history
      messages = [...messages, { role: 'assistant', content: aiMessage }];
    } catch (error) {
      console.error("Error sending message:", error);
      // Show an error message in the chat
      messages = [...messages, { role: 'assistant', content: "Sorry, something went wrong. Please try again." }];
    } finally {
      isSending = false; // Re-enable the send button
      isTyping = false; // Hide typing indicator
      userInput = ''; // Clear the input box
    }
  }
</script>

<div class="chat-container">
  <!-- Chat Messages -->
  <div class="messages">
    {#each messages as message}
      <div class="message {message.role}">
        {message.content}
      </div>
    {/each}

    <!-- Typing Indicator -->
    {#if isTyping}
      <div class="message assistant typing-indicator">
        <span>AI is typing...</span>
      </div>
    {/if}
  </div>

  <!-- Input Box and Send Button -->
  <div class="input-container">
    <input
      bind:value={userInput}
      placeholder="Type your message..."
      on:keydown={(e) => e.key === 'Enter' && sendMessage()}
    />
    <button on:click={sendMessage} disabled={isSending}>
      {isSending ? 'Sending...' : 'Send'}
    </button>
  </div>
</div>

<style>
  /* Chat Container */
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding: 20px;
    max-width: 600px;
    margin: 0 auto;
    background-color: #f9f9f9;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  /* Messages Section */
  .messages {
    flex: 1;
    overflow-y: auto;
    margin-bottom: 10px;
    padding: 10px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  /* Individual Messages */
  .message {
    margin-bottom: 10px;
    padding: 10px;
    border-radius: 5px;
    max-width: 70%;
  }

  /* User Messages */
  .user {
    background-color: #86d9ff;
    align-self: flex-end;
  }

  /* AI Messages */
  .assistant {
    background-color: #9b70ff;
    align-self: flex-start;
  }

  /* Typing Indicator */
  .typing-indicator {
    font-style: italic;
    color: #666;
  }

  /* Input Container */
  .input-container {
    display: flex;
    gap: 10px;
  }

  /* Input Box */
  input {
    flex: 1;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 16px;
  }

  /* Send Button */
  button {
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
  }

  button:hover {
    background-color: #0056b3;
  }

  button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
</style>