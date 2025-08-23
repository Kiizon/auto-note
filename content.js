(async () => {
    // Run this in the SAME iframe as the player
    const track = Array.from(document.querySelectorAll('track'))
      .find(t => /captions|subtitles/i.test(t.kind));
    if (!track) { console.log('No <track> found'); return; }
  
    // Use the browser-resolved absolute URL
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