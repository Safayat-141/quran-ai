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
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent?.isComposing && e.keyCode !== 229) {
      e.preventDefault();
      handleSend();
    }
  });

  sendBtn.addEventListener('click', handleSend);
  document.querySelectorAll('.prompt-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      userInput.value = chip.dataset.prompt;
      userInput.dispatchEvent(new Event('input'));
      userInput.focus();
    });
  });
  document.getElementById('clear-btn').addEventListener('click', () => {
    chatWindow.innerHTML = `<div class="welcome-msg"><span class="eyebrow">Conversation cleared</span><p class="welcome-title">What would you like to reflect on?</p><p>Choose a prompt below or ask your own question.</p><div class="prompt-grid" aria-label="Suggested questions"><button class="prompt-chip" type="button" data-prompt="What does the Quran say about patience?">Finding patience</button><button class="prompt-chip" type="button" data-prompt="How can I find peace according to the Quran?">Finding peace</button></div></div>`;
    chatWindow.querySelectorAll('.prompt-chip').forEach(chip => chip.addEventListener('click', () => {
      userInput.value = chip.dataset.prompt;
      userInput.dispatchEvent(new Event('input'));
      userInput.focus();
    }));
  });

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
      } catch (finalErr) {
        console.error('[v0] Chat request failed:', finalErr);
        appendAIMessage(finalErr.message || 'The chat service is temporarily unavailable. Please try again.');
      }
    } finally {
      sendBtn.disabled = false;
    }
  }

function formatText(text) {
  // bold and italic
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // highlight Ayat with quotes: (Surah, X:Y) "text"
  text = text.replace(
    /\(([^)]*\d+:\d+[^)]*)\)\s*["""''"]([^"""''"]{5,})["""''"]/g,
    '<span class="ayat-quote">($1) &ldquo;$2&rdquo;</span>'
  );

  // highlight standalone references without quotes: (Surah, X:Y)
  text = text.replace(
    /\(([^)]*\d+:\d+[^)]*)\)/g,
    '<strong style="color:var(--accent)">($1)</strong>'
  );

  // paragraphs
  text = text.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  return text;
}

  function appendMessage(role, text) {
    const msg = document.createElement('div');
    msg.className = `msg ${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = formatText(text);
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
    bubble.innerHTML = formatText(text);
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
