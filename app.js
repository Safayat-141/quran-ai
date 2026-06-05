(async () => {
  const setupScreen  = document.getElementById('setup-screen');
  const chatScreen   = document.getElementById('chat-screen');
  const apiKeyInput  = document.getElementById('api-key-input');
  const saveKeyBtn   = document.getElementById('save-key-btn');
  const resetKeyBtn  = document.getElementById('reset-key-btn');
  const chatWindow   = document.getElementById('chat-window');
  const userInput    = document.getElementById('user-input');
  const sendBtn      = document.getElementById('send-btn');

  let apiKey = localStorage.getItem('gemini_api_key') || '';

  function showSetup() {
    setupScreen.classList.remove('hidden');
    chatScreen.classList.add('hidden');
  }

  function showChat() {
    setupScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');
    loadQuran();
  }

  apiKey ? showChat() : showSetup();

  saveKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (!key) return alert('Please enter your API key.');
    localStorage.setItem('gemini_api_key', key);
    apiKey = key;
    showChat();
  });

  resetKeyBtn.addEventListener('click', () => {
    localStorage.removeItem('gemini_api_key');
    apiKey = '';
    showSetup();
  });

  // auto-resize textarea
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
      const ayats = searchQuran(question);

      if (ayats.length === 0) {
        typingEl.remove();
        appendAIMessage(
          'I could not find directly relevant Ayats for this question in my current search. Please try rephrasing.',
          []
        );
        return;
      }

      const answer = await askGemini(question, ayats, apiKey);
      typingEl.remove();
      appendAIMessage(answer, ayats);

    } catch (err) {
      typingEl.remove();
      appendAIMessage(`Error: ${err.message}`, []);
    } finally {
      sendBtn.disabled = false;
    }
  }

  function appendMessage(role, text) {
    const msg = document.createElement('div');
    msg.className = `msg ${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    msg.appendChild(bubble);
    chatWindow.appendChild(msg);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return msg;
  }

  function appendAIMessage(text, ayats) {
    const msg = document.createElement('div');
    msg.className = 'msg ai';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    msg.appendChild(bubble);

    if (ayats.length > 0) {
      const sources = document.createElement('div');
      sources.className = 'sources';

      ayats.forEach(a => {
        const tag = document.createElement('button');
        tag.className = 'source-tag';
        tag.textContent = `${a.surahName} ${a.surah}:${a.ayat}`;
        tag.addEventListener('click', () => toggleTafsir(tag, a, msg));
        sources.appendChild(tag);
      });

      msg.appendChild(sources);
    }

    chatWindow.appendChild(msg);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  async function toggleTafsir(btn, ayat, msgEl) {
    const existingPanel = msgEl.querySelector('.tafsir-panel');
    if (existingPanel) {
      existingPanel.remove();
      return;
    }

    btn.textContent = 'Loading…';
    const data = await fetchTafsir(ayat.surah, ayat.ayat);
    btn.textContent = `${ayat.surahName} ${ayat.surah}:${ayat.ayat}`;

    const panel = document.createElement('div');
    panel.className = 'tafsir-panel';

    if (data) {
      panel.innerHTML = `
        <div class="ayat-arabic">${data.arabic}</div>
        <div class="ayat-english">"${ayat.text}"</div>
        <div class="tafsir-text"><strong>Tafsir (Maududi):</strong> ${data.english}</div>
      `;
    } else {
      panel.textContent = 'Tafsir not available for this Ayat.';
    }

    msgEl.appendChild(panel);
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
