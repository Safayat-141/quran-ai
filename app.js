(async () => {
  const setupScreen  = document.getElementById('setup-screen');
  const chatScreen   = document.getElementById('chat-screen');
  const apiKeyInput  = document.getElementById('api-key-input');
  const saveKeyBtn   = document.getElementById('save-key-btn');
  const resetKeyBtn  = document.getElementById('reset-key-btn');
  const chatWindow   = document.getElementById('chat-window');
  const userInput    = document.getElementById('user-input');
  const sendBtn      = document.getElementById('send-btn');

  let apiKey = '';

  function showSetup() {
    setupScreen.classList.remove('hidden');
    chatScreen.classList.add('hidden');
  }

  function showChat() {
    setupScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');
    loadQuran();
  }

  showChat();

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
  // continue — let AI answer from its own knowledge
}

      const answer = await askGemini(question);
      typingEl.remove();
      appendAIMessage(answer, ayats);

} catch (err) {
  typingEl.remove();
  try {
    const fallback = await askGemini(question, [], apiKey);
    appendAIMessage(fallback, []);
  } catch {
    appendAIMessage('Something went wrong. Please try again.', []);
  }
    } finally {
      sendBtn.disabled = false;
    }
  }

  function appendMessage(role, text) {
    const msg = document.createElement('div');
    msg.className = `msg ${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = text
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.+?)\*/g, '<em>$1</em>')
  .replace(/\n/g, '<br>');
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
    bubble.innerHTML = text
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.+?)\*/g, '<em>$1</em>')
  .replace(/\n/g, '<br>');
    msg.appendChild(bubble);

    if (ayats.length > 0) {
  const ayatList = document.createElement('div');
  ayatList.style.cssText = 'margin-top:1rem; display:flex; flex-direction:column; gap:0.75rem;';

  ayats.forEach(a => {
    const ayatCard = document.createElement('div');
    ayatCard.style.cssText = 'border-left: 3px solid #c9a84c; padding: 0.5rem 0.75rem; font-size:0.85rem; color:#c9a84c; cursor:pointer;';
    ayatCard.innerHTML = `<span style="font-weight:bold">${a.surahName} ${a.surah}:${a.ayat}</span><br><span style="color:#e6edf3; font-style:italic;">"${a.text}"</span>`;
    ayatCard.addEventListener('click', () => toggleTafsir(ayatCard, a, msg));
    ayatList.appendChild(ayatCard);
  });

  msg.appendChild(ayatList);
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
