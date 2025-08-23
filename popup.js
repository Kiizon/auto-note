document.getElementById('open').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    if (!tab?.id) return;
    await chrome.tabs.sendMessage(tab.id, {type: "CS_TOGGLE_PANEL"});
    window.close();
  });
  