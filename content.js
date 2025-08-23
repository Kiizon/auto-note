

(async () => {


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
  
    console.log(lines.join('\n'));
  })();

  
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
          background: #11131a; color: var(--text);
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
          display: grid; place-items: center; background:#12141c; border:1px solid var(--border);
        }
  
        .body {
          overflow: auto; padding: 12px;
          scrollbar-width: thin; scrollbar-color: #2d3342 transparent;
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
        }
        .fab strong { background: #1f2534; padding: 0 6px; border-radius: 6px; margin-left: 6px; color: #cbd5ff; }
  
        /* Slide-in toast (status) */
        .toast {
          position: fixed; right: calc(var(--panel-w) + 12px); bottom: 16px;
          background: #0e1118; color: var(--text); border:1px solid var(--border);
          padding: 10px 12px; border-radius: 10px; box-shadow: var(--shadow);
          transform: translateY(8px); opacity: 0; transition: .2s ease;
        }
        .toast.show { transform: translateY(0); opacity: 1; }
  
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
      </style>
  
      <button part="fab" class="fab" id="fab" title="Open summarizer (Alt+S)">Summarize <strong>Alt+S</strong></button>
  
      <div class="wrap" id="wrap" aria-hidden="true">
        <div class="panel" role="dialog" aria-label="Caption Summarizer" aria-modal="false">
          <div class="resizer" id="resizer" aria-hidden="true"></div>
          <div class="header">
            <div class="title">Caption Summarizer</div>
            <div class="spacer"></div>
            <button class="btn" id="btnSummarize">Summarize</button>
            <button class="close" id="btnClose" aria-label="Close">✕</button>
          </div>
          <div class="body" id="body">
            <div class="empty" id="empty">
              Click <b>Summarize</b> to generate notes for the current video.<br/>
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
    const wrap = $('#wrap'), fab = $('#fab');
    const btnSummarize = $('#btnSummarize'), btnClose = $('#btnClose');
    const empty = $('#empty'), result = $('#result'), loading = $('#loading'), error = $('#error'), errText = $('#errText');
    const tldr = $('#tldr'), bullets = $('#bullets'), quiz = $('#quiz');
    const btnCopy = $('#btnCopy'), btnClear = $('#btnClear'), toast = $('#toast');
  
    fab.addEventListener('click', togglePanel);
    btnClose.addEventListener('click', togglePanel);
    btnSummarize.addEventListener('click', () => {
      setLoading(true);

      window.dispatchEvent(new CustomEvent('CS_SUMMARIZE_CLICK'));
      showToast('Summarizing…');
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
    }
    function onStop() {
      resizing = false; document.removeEventListener('mousemove', onDrag); document.removeEventListener('mouseup', onStop);
    }
  
    function togglePanel() {
      const opened = wrap.classList.toggle('open');
      wrap.setAttribute('aria-hidden', opened ? 'false' : 'true');
      host.style.pointerEvents = opened ? 'auto' : 'none';
      // Initialize default width
      if (!host.style.width) { host.style.width = getComputedStyle(shadow.host).getPropertyValue('--panel-w') || '380px'; }
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
      tldr.textContent = data.tldr || '';
      bullets.innerHTML = (data.bullets || []).map(b => {
        const m = b.match(/^\[(\d+):(\d{2})]\s*(.*)$/);
        const seek = m ? (parseInt(m[1],10)*60 + parseInt(m[2],10)) : null;
        const content = m ? `[${m[1]}:${m[2]}] ${m[3]}` : b;
        return `<li ${seek !== null ? `data-seek="${seek}" style="cursor:pointer"` : ''}>${escapeHtml(content)}</li>`;
      }).join('');
      quiz.innerHTML = (data.quiz || []).map(q => `<li>${escapeHtml(q)}</li>`).join('');
  
      bullets.addEventListener('click', (e) => {
        const li = e.target.closest('li[data-seek]');
        if (!li) return;
        const seconds = Number(li.getAttribute('data-seek'));
        window.postMessage({ type: 'CS_SEEK', seconds }, '*');
      });
  
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
  

  console.log("[summarizer] content script loaded"); // sanity log


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
  

