

 async function getTranscript() {

    const track = Array.from(document.querySelectorAll('track'))
      .find(t => /captions|subtitles/i.test(t.kind));
    if (!track) { console.log('No <track> found'); return; }
  
    
    const url = track.src; 
    console.log('Fetching', url);
  
    const res = await fetch(url, {
      credentials: 'include',
      referrer: location.href,
      referrerPolicy: 'strict-origin-when-cross-origin',
      headers: { 'Accept': 'text/plain, text/vtt, */*' }
    });

    if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
    const body = await res.text();
  
    const isVTT = /^WEBVTT/m.test(body);
    const lines = body.replace(/\r/g,'').split(/\n\n+/).map(block => {
      const arr = block.trim().split('\n');
      const cue = arr.find(l => /-->/ .test(l)) || '';
      const text = arr.filter(l => !/-->/ .test(l) && !/^\d+$/.test(l) && !/^WEBVTT/.test(l))
                      .join(' ').replace(/\s+/g,' ').trim();
      const m = cue.match(/(\d{2}:\d{2}:\d{2})[.,]\d+\s+-->\s+(\d{2}:\d{2}:\d{2})[.,]\d+/);
      if (!m || !text) return '';
      const [hh,mm,ss] = m[1].split(':').map(Number);
      const stamp = (hh*60 + mm) + ':' + String(ss).padStart(2,'0');
      return `[${stamp}] ${text}`;
    }).filter(Boolean);
    return lines.join('\n');
  }

if (window.top === window) {
    createSummarizerPanel();
    bindGlobalHotkeys();
  }
  
  /** shadow dom panel */
  function createSummarizerPanel() {
    if (document.getElementById('cs-root-host')) return;
  
    const host = document.createElement('div');
    host.id = 'cs-root-host';
    host.style.all = 'initial';
    host.style.position = 'fixed';
    host.style.top = '0';
    host.style.right = '0';
    host.style.height = '100vh';
    host.style.zIndex = '2147483647';   // max on purpose
    host.style.pointerEvents = 'none';  // panel controls enable internally
    document.documentElement.appendChild(host);
  
    const shadow = host.attachShadow({ mode: 'open' });
  
    // Panel HTML structure
    shadow.innerHTML = `
      <style>
        :host { all: initial; }
  
        /* Design tokens */
        :root {
          --panel-w: 380px;
          --bg: rgba(16, 18, 22, 0.92);
          --bg-2: rgba(22, 24, 28, 0.92);
          --text: #e7e9ee;
          --muted: #9aa3b2;
          --border: #1f2430;
          --accent: #4f46e5; /* indigo-600 */
          --accent-2: #7c3aed; /* violet-600 */
          --shadow: 0 8px 24px rgba(0,0,0,.35);
          --radius: 14px;
        }
  
        .wrap {
          position: fixed;
          top: 0; right: 0; height: 100vh;
          width: var(--panel-w);
          transform: translateX(100%);
          transition: transform .28s cubic-bezier(.2,.8,.2,1);
          pointer-events: auto;
        }
        .wrap.open { transform: translateX(0); }
  
        .panel {
          height: 100%;
          display: grid;
          grid-template-rows: auto 1fr auto;
          background: var(--bg);
          color: var(--text);
          border-left: 1px solid var(--border);
          box-shadow: var(--shadow);
          font: 14px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
          backdrop-filter: blur(8px);
        }
  
        .header {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 12px; border-bottom: 1px solid var(--border);
          background: linear-gradient(180deg, var(--bg-2), transparent);
        }
        .title {
          font-weight: 600; letter-spacing: .2px;
        }
        .spacer { flex: 1; }
  
        .btn {
          appearance: none; border: 1px solid var(--border);
          background: #ffffff; color: var(--text);
          padding: 8px 12px; border-radius: 10px; cursor: pointer;
          transition: transform .06s ease, border-color .2s ease;
        }
        .btn:hover { border-color: #2d3342; }
        .btn:active { transform: translateY(1px); }
        .btn.primary {
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          border: none; color: white; font-weight: 600;
        }
  
        .close {
          width: 28px; height: 28px; border-radius: 8px;
          display: grid; place-items: center; background:#ffffff; border:2px solid var(--border);
        }
  
        .body {
          overflow: auto; padding: 12px;
          scrollbar-width: thin; scrollbar-color: #2d3342 transparent;
          max-width: 100%;
          box-sizing: border-box;
        }
  
        .empty {
          color: var(--muted); text-align: center;
          padding: 24px 12px; line-height: 1.6;
        }
  
        .card {
          background: #0e1118; border: 1px solid var(--border);
          border-radius: var(--radius); padding: 12px; margin-bottom: 12px;
        }
        .card h4 { margin: 0 0 8px; font-size: 13px; color: #cfd6e6; letter-spacing: .2px; }
        .list { padding-left: 18px; margin: 0; }
        .list li { margin: 6px 0; line-height: 1.55; }
  
        .footer {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 12px; border-top: 1px solid var(--border);
          background: linear-gradient(0deg, var(--bg-2), transparent);
        }
  
        /* Floating open button (FAB) */
        .fab {
          position: fixed; right: 16px; bottom: 16px;
          background: #10131b; color: var(--text);
          border: 1px solid var(--border);
          padding: 10px 14px; border-radius: 12px; cursor: pointer;
          box-shadow: var(--shadow);
          color: #cbd5ff;
        }
        .fab strong { background: #1f2534; padding: 0 6px; border-radius: 6px; margin-left: 6px; color: #cbd5ff; }
  
        /* Slide-in toast (status) */
        .toast {
          position: fixed; right: calc(var(--panel-w) + 12px); bottom: 16px;
          background: #0e1118; color: var(--text); border:1px solid var(--border);
          padding: 10px 12px; border-radius: 10px; box-shadow: var(--shadow);
          transform: translateY(8px); opacity: 0; transition: .2s ease;
        }
        .toast.show { transform: translateY(0); opacity: 1; background: #cbd5ff ; }
  
        /* Skeleton loader */
        .skeleton { display: grid; gap: 10px; }
        .sk {
          height: 12px; border-radius: 8px;
          background: linear-gradient(90deg, #1a1f2b 0%, #222837 50%, #1a1f2b 100%);
          background-size: 200% 100%; animation: shimmer 1.2s infinite;
        }
        @keyframes shimmer { 0%{background-position: 200% 0} 100%{background-position: -200% 0} }
  
        /* Draggable resize handle */
        .resizer {
          position: absolute; left: -6px; top: 0; width: 6px; height: 100%;
          cursor: ew-resize; background: transparent;
        }
        .resizer:hover { background: rgba(79,70,229,.08); }
.api-key-input {
  background: #ffffff;  /* Match button background */
  border: 1px solid var(--border);
  color: var(--text);  /* This should be dark text on white background */
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease, transform 0.06s ease;
  width: 200px;
  margin-right: 8px;
}

.api-key-input:focus {
  border-color: var(--accent);
}

.api-key-input:hover {
  border-color: #2d3342; /* Match button hover effect */
}

.api-key-input:active {
  transform: translateY(1px); /* Match button active effect */
}

.api-key-input::placeholder {
  color: var(--muted);
}
      </style>
  
      <button part="fab" class="fab" id="fab" title="Open summarizer (Shift+S)"> Summarize <strong >Shift+S</strong></button>
  
      <div class="wrap" id="wrap" aria-hidden="true">
        <div class="panel" role="dialog" aria-label="Caption Summarizer" aria-modal="false">
          <div class="resizer" id="resizer" aria-hidden="true"></div>
          <div class="header">
            <div class="title">TMU Lecture Summarizer</div>
            <div class="spacer"></div>
            <input 
            type="text"
            id="apiKeyInput"
            placeholder="Enter OpenAI API Key"
            class="api-key-input"
            style="width: 200px; margin-right: 8px; -webkit-text-security: disc;"
            />

            <button class="btn" id="btnSaveKey" style="margin-right: 8px;">Save Key</button>

            <button class="btn" id="btnSummarize">Summarize</button>
            <button class="close" id="btnClose" aria-label="Close">✕</button>
          </div>
          <div class="body" id="body">
            <div class="empty" id="empty">
              Enter your <b> api key </b> and click <b>Summarize</b> to generate notes for the current video.<br/>
              Tip: ensure captions (CC) are enabled on the player.
            </div>
  
            <div id="result" style="display:none">
              <div class="card">
                <h4>TL;DR</h4>
                <div id="tldr"></div>
              </div>
              <div class="card">
                <h4>Key Takeaways</h4>
                <ol class="list" id="bullets"></ol>
              </div>
              <div class="card">
                <h4>Practice</h4>
                <ol class="list" id="quiz"></ol>
              </div>
            </div>
  
            <div id="loading" style="display:none">
              <div class="card skeleton">
                <div class="sk" style="width:70%"></div>
                <div class="sk" style="width:90%"></div>
                <div class="sk" style="width:60%"></div>
              </div>
              <div class="card skeleton">
                ${Array.from({length:8}).map(()=>'<div class="sk"></div>').join('')}
              </div>
            </div>
  
            <div id="error" class="card" style="display:none; color:#ffb4b4; border-color:#3a1f22; background:#160f10">
              <div id="errText">Something went wrong.</div>
            </div>
          </div>
          <div class="footer">
            <button class="btn" id="btnCopy">Copy Markdown</button>
            <button class="btn" id="btnClear">Clear</button>
            <div class="spacer"></div>
            <span style="color:var(--muted);">v0.1</span>
          </div>
        </div>
      </div>
  
      <div class="toast" id="toast"></div>
    `;
    const $ = (sel) => shadow.querySelector(sel);
    const btnSaveKey = $('#btnSaveKey');
    btnSaveKey.addEventListener('click', () => {
      localStorage.setItem('openai_api_key', $('#apiKeyInput').value);
      showToast('Key saved');
      console.log('Key saved');
    });
    window.addEventListener('load', () => {
      const savedKey = localStorage.getItem('openai_api_key');
      if (savedKey) {
        $('#apiKeyInput').value = savedKey;
      }
    });

    async function validateApiKey() {
      const apiKey = $('#apiKeyInput').value;
      if (!apiKey) {
        showToast('Please enter your OpenAI API key');
        return false;
      }
      if (!apiKey.startsWith('sk-')) {
        showToast('Invalid API key format');
        return false;
      }
      return true;
    }
  
    
    const wrap = $('#wrap'), fab = $('#fab');
    const btnSummarize = $('#btnSummarize'), btnClose = $('#btnClose');
    const empty = $('#empty'), result = $('#result'), loading = $('#loading'), error = $('#error'), errText = $('#errText');
    const tldr = $('#tldr'), bullets = $('#bullets'), quiz = $('#quiz');
    const btnCopy = $('#btnCopy'), btnClear = $('#btnClear'), toast = $('#toast');
  
    fab.addEventListener('click', togglePanel);
    btnClose.addEventListener('click', togglePanel);

    btnSummarize.addEventListener('click', async () => {
      if (!validateApiKey()) return;
      setLoading(true);
      try {
        const apiKey = $('#apiKeyInput').value;
        const lectureTranscript = await getTranscript();
    
        const prompt = `Summarize the following lecture captions and provide: 
        A high-level summary of the lecture’s purpose and main themes (2–3 sentences).
        A breakdown of the main topics discussed, with brief explanations and any key terms or examples.

        Any practical applications, questions raised, or further reading suggestions (if mentioned).
        The summary should be in a concise and easy-to-understand format.
        Captions:
        ${lectureTranscript}`;
    
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}` 
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              { role: 'system', content: 'You are a helpful assistant.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7
          })
        });
    
        const data = await response.json();
        console.log(data);
    
        const reply = data.choices[0].message.content;
        console.log('GPT Reply:', reply);
    
      } catch (error) {
        console.error('Error calling OpenAI:', error);
        showToast('Error summarizing.');
      } finally {
        setLoading(false);
      }
    });
    


    btnClear.addEventListener('click', clearUI);
    btnCopy.addEventListener('click', () => {
      const md = toMarkdown();
      navigator.clipboard.writeText(md);
      showToast('Copied notes as Markdown');
    });
  
    const resizer = $('#resizer');
    let resizing = false, startX = 0, startW = 0;
    resizer.addEventListener('mousedown', (e) => {
      resizing = true; startX = e.clientX; startW = host.getBoundingClientRect().width || parseInt(getComputedStyle(host).width, 10) || 380;
      document.addEventListener('mousemove', onDrag); document.addEventListener('mouseup', onStop);
      e.preventDefault();
    });
    function onDrag(e) {
      if (!resizing) return;
      const dx = startX - e.clientX; 
      const newW = Math.min(700, Math.max(300, startW + dx));
      host.style.width = newW + 'px';
      wrap.style.width = newW + 'px';

      shadow.host.style.setProperty('--panel-w', newW + 'px');
    }
    function onStop() {
      resizing = false; document.removeEventListener('mousemove', onDrag); document.removeEventListener('mouseup', onStop);
    }
  
    function togglePanel() {
      const opened = wrap.classList.toggle('open');
      wrap.setAttribute('aria-hidden', opened ? 'false' : 'true');
      host.style.pointerEvents = opened ? 'auto' : 'none';
      // Initialize default width
      //if (!host.style.width) { host.style.width = getComputedStyle(shadow.host).getPropertyValue('--panel-w') || '380px'; }
    }
  
    function setLoading(is) {
      loading.style.display = is ? 'block' : 'none';
      empty.style.display   = is ? 'none' : 'none';
      result.style.display  = is ? 'none' : result.style.display;
      error.style.display   = 'none';
    }
  
    function setError(message) {
      errText.textContent = message || 'Unexpected error.';
      error.style.display = 'block';
      loading.style.display = 'none';
      result.style.display = 'none';
    }
  
    function renderSummary(data) {
      console.log("rendering summary");
  
      loading.style.display = 'none';
      error.style.display = 'none';
      empty.style.display = 'none';
      result.style.display = 'block';
    }
  
    function clearUI() {
      tldr.textContent = '';
      bullets.innerHTML = '';
      quiz.innerHTML = '';
      empty.style.display = 'block';
      result.style.display = 'none';
      loading.style.display = 'none';
      error.style.display = 'none';
    }
  
    function showToast(msg) {
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 1400);
    }
  
  
    function escapeHtml(s) {
      return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
  
    window.addEventListener('message', (e) => {
      const d = e?.data;
      if (!d) return;
      if (d.type === 'CS_SUMMARY') {
        setLoading(false);
        if (d.error) setError(d.error);
        else renderSummary(d.payload || {});
        showToast('Summary ready');
        if (!wrap.classList.contains('open')) togglePanel();
      }
    });
  }
  
  /* shift + s to open/close panel */
  function bindGlobalHotkeys() {
    document.addEventListener('keydown', (e) => {
      if (e.shiftKey && (e.key.toLowerCase() === 's')) {
        const host = document.getElementById('cs-root-host');
        const wrap = host?.shadowRoot?.querySelector('#wrap');
        if (wrap) {
          host.shadowRoot.querySelector('#fab').click();
          e.preventDefault();
        }
      }
    }, true);
  }


function ensurePanel() {
    if (window.top !== window) return;
    if (!document.getElementById('cs-root-host')) {
      createSummarizerPanel();
    }
  }
  
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type !== "CS_TOGGLE_PANEL") return;
    if (window.top !== window) return;
    if (!document.getElementById('cs-root-host')) createSummarizerPanel();
    const host = document.getElementById('cs-root-host');
    host?.shadowRoot?.querySelector('#fab')?.click();
  });  
  

