// script.js – Full version with OpenAI chatbot

// --- Mobile Menu ---
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
  navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
});

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

// --- Open / Close ---
chatButton.addEventListener('click', openChat);
closeChat.addEventListener('click', closeChatHandler);
document.getElementById('open-chat-btn').addEventListener('click', (e) => {
  e.preventDefault();
  openChat();
});

function openChat() {
  chatPanel.classList.add('active');
  userInput.disabled = false;
  userInput.focus();
}

function closeChatHandler() {
  chatPanel.classList.remove('active');
}

// --- Send Message ---
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  // Display user message
  addMessage(text, 'user');
  userInput.value = '';

  // --- LEAD CAPTURE LOGIC ---
if (!leadInfo.collected) {
  const parts = text.split(' ');
  const possibleEmail = parts.find(p => p.includes('@') && p.includes('.'));
  
  if (possibleEmail) {
    // Assume first part before email is name, or use "there" if no name given
    const emailIndex = parts.indexOf(possibleEmail);
    let name = 'there';
    if (emailIndex > 0) {
      name = parts.slice(0, emailIndex).join(' ');
    } else if (parts.length > 1 && emailIndex === 0 && parts.length > 1) {
      // email first, then maybe name after?
      name = parts.slice(1).join(' ') || 'there';
    }
    leadInfo.name = name.trim();
    leadInfo.email = possibleEmail;
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

  // --- AFTER LEAD COLLECTED: use OpenAI ---
  // Show typing indicator (optional)
  userInput.disabled = true;
  sendButton.disabled = true;

  // Add user message to conversation history
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
    }
  } catch (error) {
    console.error(error);
    addMessage('Network error. Please check your connection.', 'bot');
  } finally {
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus();
  }
}

function addMessage(text, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', `${sender}-message`);
  messageDiv.textContent = text;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- Calendly booking (edit with your own link) ---
document.getElementById('book-calendly').addEventListener('click', (e) => {
  e.preventDefault();
  // Replace with your actual Calendly URL
  window.open('https://calendly.com/yourname/30min', '_blank');
});
