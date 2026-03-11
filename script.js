const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => navLinks.classList.toggle('active'));
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => navLinks.classList.remove('active'));
  });
}

const leadInfo = { name: '', email: '', collected: false };
const conversationHistory = [];
const MAX_HISTORY_MESSAGES = 12;

function pushHistory(message) {
  conversationHistory.push(message);
  if (conversationHistory.length > MAX_HISTORY_MESSAGES) {
    conversationHistory.splice(0, conversationHistory.length - MAX_HISTORY_MESSAGES);
  }
}

const chatButton = document.getElementById('chatButton');
const chatPanel = document.getElementById('chatPanel');
const closeChat = document.getElementById('closeChat');
const chatMessages = document.getElementById('chatMessages');
const inlineMessages = document.getElementById('inlineMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendMessage');

function syncToPanels(text, sender) {
  [inlineMessages, chatMessages].forEach((panel) => {
    if (!panel) {
      return;
    }

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    messageDiv.textContent = text;
    panel.appendChild(messageDiv);
    panel.scrollTop = panel.scrollHeight;
  });
}

function openChat() {
  if (chatPanel) {
    chatPanel.classList.add('active');
  }
}

if (chatButton) {
  chatButton.addEventListener('click', openChat);
}

if (closeChat) {
  closeChat.addEventListener('click', () => {
    if (chatPanel) {
      chatPanel.classList.remove('active');
    }
  });
}

const openChatBtn = document.getElementById('open-chat-btn');
if (openChatBtn) {
  openChatBtn.addEventListener('click', () => {
    setTimeout(() => userInput?.focus(), 250);
  });
}

const calendlyUrl = 'https://calendly.com/shubzz429/new-meeting';
['book-calendly', 'book-calendly-footer'].forEach((id) => {
  const button = document.getElementById(id);
  if (!button) {
    return;
  }

  button.addEventListener('click', (event) => {
    event.preventDefault();
    window.open(calendlyUrl, '_blank', 'noopener,noreferrer');
  });
});

async function notifyNewLead(lead) {
  try {
    await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead)
    });
  } catch (error) {
    console.error('Lead capture automation error:', error);
  }
}

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

  syncToPanels(text, 'user');
  userInput.value = '';

  if (!leadInfo.collected) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const emailMatch = text.match(emailRegex);

    if (!emailMatch) {
      syncToPanels('Please share your email so I can personalize guidance. Example: alex@company.com', 'bot');
      return;
    }

    const email = emailMatch[0];
    const nameRaw = text.substring(0, emailMatch.index).replace(/[^a-zA-Z\s'-]/g, ' ').trim();
    const firstToken = nameRaw.split(/\s+/).find(Boolean) || 'there';
    const name = firstToken.charAt(0).toUpperCase() + firstToken.slice(1).toLowerCase();

    leadInfo.name = name;
    leadInfo.email = email;
    leadInfo.collected = true;

    notifyNewLead({
      name: leadInfo.name,
      email: leadInfo.email,
      source: 'website-chat',
      context: 'lead-captured',
      firstMessage: text
    });

    const greeting = `Great to meet you, ${leadInfo.name}. What workflow are you trying to automate first?`;
    syncToPanels(greeting, 'bot');
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
      body: JSON.stringify({ messages: conversationHistory, lead: leadInfo })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      syncToPanels(typeof data.error === 'string' ? data.error : 'Sorry, I hit an error. Please try again.', 'bot');
      return;
    }

    const botReply = data.reply || 'Thanks for sharing. Can you tell me your current tools and target outcome?';
    syncToPanels(botReply, 'bot');
    pushHistory({ role: 'assistant', content: botReply });
  } catch (error) {
    console.error('Network error:', error);
    syncToPanels('Network issue detected. Please try again in a moment.', 'bot');
  } finally {
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus();
  }
}
