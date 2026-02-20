// script.js – Full working version with DeepSeek API

// --- Mobile Menu ---
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
  });
}

// --- CHATBOT STATE ---
let leadInfo = {
  name: '',
  email: '',
  collected: false
};
let conversationHistory = []; // stores { role, content }

// --- DOM Elements ---
const chatButton = document.getElementById('chatButton');
const chatPanel = document.getElementById('chatPanel');
const closeChat = document.getElementById('closeChat');
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendMessage');

// --- Open / Close Functions ---
function openChat() {
  if (chatPanel) {
    chatPanel.classList.add('active');
    if (userInput) {
      userInput.disabled = false;
      userInput.focus();
    }
  }
}

function closeChatHandler() {
  if (chatPanel) {
    chatPanel.classList.remove('active');
  }
}

// --- Event Listeners ---
if (chatButton) {
  chatButton.addEventListener('click', openChat);
}

if (closeChat) {
  closeChat.addEventListener('click', closeChatHandler);
}

// "Start Chat" button in hero
const openChatBtn = document.getElementById('open-chat-btn');
if (openChatBtn) {
  openChatBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openChat();
  });
}

// Calendly booking (replace with your actual link)
const bookBtn = document.getElementById('book-calendly');
if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.open('https://calendly.com/yourname/30min', '_blank'); // <-- UPDATE THIS
  });
}

// --- Send Message ---
if (sendButton) {
  sendButton.addEventListener('click', sendMessage);
}
if (userInput) {
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

async function sendMessage() {
  if (!userInput) return;
  const text = userInput.value.trim();
  if (!text) return;

  // Display user message
  addMessage(text, 'user');
  userInput.value = '';

  // --- LEAD CAPTURE LOGIC (Improved) ---
  if (!leadInfo.collected) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const emailMatch = text.match(emailRegex);

    if (emailMatch) {
      const email = emailMatch[0];
      const textBeforeEmail = text.substring(0, emailMatch.index).trim();
      let name = 'there';

      if (textBeforeEmail.length > 0) {
        const namePatterns = [
          /(?:my name is|i am|i'm|this is)\s+([a-zA-Z]+)/i,
          /(?:call me|name'?s)\s+([a-zA-Z]+)/i
        ];
        for (let pattern of namePatterns) {
          const match = textBeforeEmail.match(pattern);
          if (match) {
            name = match[1];
            break;
          }
        }
        if (name === 'there') {
          const words = textBeforeEmail.split(/\s+/);
          const fillerWords = ['my', 'name', 'is', 'i', 'am', 'im', 'this', 'and', 'email'];
          const possibleNameWords = words.filter(w => !fillerWords.includes(w.toLowerCase()));
          if (possibleNameWords.length > 0) {
            name = possibleNameWords[possibleNameWords.length - 1];
          } else {
            name = words[words.length - 1];
          }
        }
      }

      name = name.replace(/[^a-zA-Z]/g, '');
      if (name.length > 0) {
        name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      } else {
        name = 'there';
      }

      leadInfo.name = name;
      leadInfo.email = email;
      leadInfo.collected = true;

      addMessage(`Thanks ${leadInfo.name}! How can I assist you today?`, 'bot');
      conversationHistory.push({ role: 'user', content: `My name is ${leadInfo.name}, email ${leadInfo.email}` });
      conversationHistory.push({ role: 'assistant', content: `Thanks ${leadInfo.name}! How can I assist you today?` });
      return;
    } else {
      addMessage('Please provide your email address so I can help you. (e.g., "john@example.com")', 'bot');
      return;
    }
  }

  // --- AFTER LEAD COLLECTED: use DeepSeek API ---
  userInput.disabled = true;
  sendButton.disabled = true;

  conversationHistory.push({ role: 'user', content: text });

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversationHistory })
    });

    const data = await response.json();

    if (response.ok) {
      const botReply = data.reply;
      addMessage(botReply, 'bot');
      conversationHistory.push({ role: 'assistant', content: botReply });
    } else {
      addMessage('Sorry, I encountered an error. Please try again later.', 'bot');
      console.error('API error:', data);
    }
  } catch (error) {
    console.error('Network error:', error);
    addMessage('Network error. Please check your connection.', 'bot');
  } finally {
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus();
  }
}

function addMessage(text, sender) {
  if (!chatMessages) return;
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', `${sender}-message`);
  messageDiv.textContent = text;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
