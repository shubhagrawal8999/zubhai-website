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
// --- LEAD CAPTURE LOGIC (Improved) ---
if (!leadInfo.collected) {
  // Regular expression to find an email address
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const emailMatch = text.match(emailRegex);
  
  if (emailMatch) {
    const email = emailMatch[0];
    
    // Try to extract name: look for words before the email
    const textBeforeEmail = text.substring(0, emailMatch.index).trim();
    let name = 'there'; // default if no name found
    
    if (textBeforeEmail.length > 0) {
      // Common patterns: "my name is X", "I'm X", or just the first word
      // First, check for "name is" or "i am" patterns
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
      
      // If no pattern matched, take the last word before email (often the name)
      if (name === 'there') {
        const words = textBeforeEmail.split(/\s+/);
        // Filter out common filler words
        const fillerWords = ['my', 'name', 'is', 'i', 'am', 'im', 'this', 'and', 'email'];
        const possibleNameWords = words.filter(w => !fillerWords.includes(w.toLowerCase()));
        if (possibleNameWords.length > 0) {
          name = possibleNameWords[possibleNameWords.length - 1]; // last non-filler word
        } else {
          // fallback to last word
          name = words[words.length - 1];
        }
      }
    }
    
    // Clean up name (capitalize first letter, remove punctuation)
    name = name.replace(/[^a-zA-Z]/g, ''); // remove non-letters
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
