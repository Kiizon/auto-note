chrome.action.onClicked.addListener(async (tab) => {
    if (!tab?.id) return;
    // Tell the content script in the active tab to toggle the panel
    try {
      await chrome.tabs.sendMessage(tab.id, { type: "CS_TOGGLE_PANEL" });
    } catch (e) {
      // Content script not injected? Try injecting on demand (rarely needed if you use content_scripts)
      console.warn("Toggle failed:", e);
    }
  });
  