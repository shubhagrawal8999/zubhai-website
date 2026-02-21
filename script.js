// script.js – full working version with DeepSeek API

// --- Mobile Menu ---
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
    });
  });
}

// --- CHATBOT STATE ---
const leadInfo = {
  name: '',
  email: '',
  collected: false
};

const conversationHistory = []; // stores { role, content }
const MAX_HISTORY_MESSAGES = 12;

function pushHistory(message) {
  conversationHistory.push(message);
  if (conversationHistory.length > MAX_HISTORY_MESSAGES) {
    conversationHistory.splice(0, conversationHistory.length - MAX_HISTORY_MESSAGES);
  }
}

// --- DOM Elements ---
const chatButton = document.getElementById('chatButton');
const chatPanel = document.getElementById('chatPanel');
const closeChat = document.getElementById('closeChat');
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendMessage');

// --- Open / Close Functions ---
function openChat() {
  if (!chatPanel) {
    return;
  }

  chatPanel.classList.add('active');
  if (userInput) {
    userInput.disabled = false;
    userInput.focus();
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

const openChatBtn = document.getElementById('open-chat-btn');
if (openChatBtn) {
  openChatBtn.addEventListener('click', (event) => {
    event.preventDefault();
    openChat();
  });
}

const calendlyButtons = ['book-calendly', 'book-calendly-footer'];
calendlyButtons.forEach((id) => {
  const button = document.getElementById(id);
  if (!button) {
    return;
  }

  button.addEventListener('click', (event) => {
    event.preventDefault();
    window.open('https://calendly.com/yourname/30min', '_blank');
  });
});

if (sendButton) {
  sendButton.addEventListener('click', sendMessage);
}

if (userInput) {
  userInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  });
}

async function sendMessage() {
  if (!userInput || !sendButton) {
    return;
  }

  const text = userInput.value.trim();
  if (!text) {
    return;
  }

  addMessage(text, 'user');
  userInput.value = '';

  if (!leadInfo.collected) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const emailMatch = text.match(emailRegex);

    if (!emailMatch) {
      addMessage('Please provide your email address so I can help you. (e.g., "john@example.com")', 'bot');
      return;
    }

    const email = emailMatch[0];
    const textBeforeEmail = text.substring(0, emailMatch.index).trim();
    let name = 'there';

    if (textBeforeEmail.length > 0) {
      const namePatterns = [
        /(?:my name is|i am|i'm|this is)\s+([a-zA-Z]+)/i,
        /(?:call me|name'?s)\s+([a-zA-Z]+)/i
      ];

      for (const pattern of namePatterns) {
        const match = textBeforeEmail.match(pattern);
        if (match) {
          name = match[1];
          break;
        }
      }

      if (name === 'there') {
        const words = textBeforeEmail.split(/\s+/);
        const fillerWords = ['my', 'name', 'is', 'i', 'am', 'im', 'this', 'and', 'email'];
        const possibleNameWords = words.filter((word) => !fillerWords.includes(word.toLowerCase()));
        name = possibleNameWords.length > 0 ? possibleNameWords[possibleNameWords.length - 1] : words[words.length - 1];
      }
    }

    name = name.replace(/[^a-zA-Z]/g, '');
    name = name.length > 0 ? `${name.charAt(0).toUpperCase()}${name.slice(1).toLowerCase()}` : 'there';

    leadInfo.name = name;
    leadInfo.email = email;
    leadInfo.collected = true;

    const greeting = `Thanks ${leadInfo.name}! How can I assist you today?`;
    addMessage(greeting, 'bot');
    pushHistory({ role: 'user', content: `My name is ${leadInfo.name}, email ${leadInfo.email}` });
    pushHistory({ role: 'assistant', content: greeting });
    return;
  }

  userInput.disabled = true;
  sendButton.disabled = true;
  pushHistory({ role: 'user', content: text });

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: conversationHistory,
        lead: { name: leadInfo.name, email: leadInfo.email }
      })
    });

    const data = await response.json();

    if (response.ok) {
      const botReply = data.reply;
      addMessage(botReply, 'bot');
      pushHistory({ role: 'assistant', content: botReply });
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
  if (!chatMessages) {
    return;
  }

  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', `${sender}-message`);
  messageDiv.textContent = text;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
