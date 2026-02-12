
// Mobile menu toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
  navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
});

// CHAT WIDGET UI
const chatButton = document.getElementById('chatButton');
const chatPanel = document.getElementById('chatPanel');
const closeChat = document.getElementById('closeChat');
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendMessage');

// Open chat
chatButton.addEventListener('click', () => {
  chatPanel.classList.add('active');
  userInput.disabled = false;
  userInput.focus();
});

// Close chat
closeChat.addEventListener('click', () => {
  chatPanel.classList.remove('active');
});

// Placeholder: we will add real AI chat logic in Stage 7
// For now, just a simple echo to test UI
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const msg = userInput.value.trim();
  if (!msg) return;

  // Add user message to chat
  addMessage(msg, 'user');
  userInput.value = '';

  // Simulate bot response (temporary)
  setTimeout(() => {
    addMessage("Thanks for your message! The AI assistant will be active after Stage 7.", 'bot');
  }, 500);
}

function addMessage(text, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', `${sender}-message`);
  messageDiv.textContent = text;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// "Start Chat" button in hero triggers chat open
document.getElementById('open-chat-btn').addEventListener('click', (e) => {
  e.preventDefault();
  chatPanel.classList.add('active');
  userInput.disabled = false;
  userInput.focus();
});

// Calendly booking (placeholder – replace with your Calendly link)
document.getElementById('book-calendly').addEventListener('click', (e) => {
  e.preventDefault();
  alert('Replace this with your Calendly link. Example: https://calendly.com/yourname/30min');
  // In production: window.open('YOUR_CALENDLY_URL', '_blank');
});
