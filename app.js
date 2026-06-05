(async () => {
  const chatWindow = document.getElementById('chat-window');
  const userInput  = document.getElementById('user-input');
  const sendBtn    = document.getElementById('send-btn');

  loadQuran();

  userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = userInput.scrollHeight + 'px';
  });

  userInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  sendBtn.addEventListener('click', handleSend);

  async function handleSend() {
    const question = userInput.value.trim();
    if (!question || sendBtn.disabled) return;

    appendMessage('user', question);
    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.disabled = true;

    const typingEl = appendTyping();

    try {
      const answer = await askGemini(question);
      typingEl.remove();
      appendAIMessage(answer);
    } catch (err) {
      typingEl.remove();
      try {
        const fallback = await askGemini(question);
        appendAIMessage(fallback);
      } catch {
        appendAIMessage('Something went wrong. Please try again.');
      }
    } finally {
      sendBtn.disabled = false;
    }
  }

  function renderText(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  function appendMessage(role, text) {
    const msg = document.createElement('div');
    msg.className = `msg ${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = renderText(text);
    msg.appendChild(bubble);
    chatWindow.appendChild(msg);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return msg;
  }

  function appendAIMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'msg ai';
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = renderText(text);
    msg.appendChild(bubble);
    chatWindow.appendChild(msg);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function appendTyping() {
    const msg = document.createElement('div');
    msg.className = 'msg ai';
    const bubble = document.createElement('div');
    bubble.className = 'bubble typing';
    bubble.innerHTML = '<span></span><span></span><span></span>';
    msg.appendChild(bubble);
    chatWindow.appendChild(msg);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return msg;
  }
})();
