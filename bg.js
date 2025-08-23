console.log("bg.js loaded");

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;
  const url = tab.url || "";
  console.log("Icon clicked on:", url);

  if (!/^https?:/i.test(url)) {
    console.warn("Unsupported page:", url);
    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, { type: "CS_TOGGLE_PANEL" });
    return;
  } catch (e) {
    console.log("No receiver; injecting content.js…", e.message);
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      files: ["content.js"]
    });
    await chrome.tabs.sendMessage(tab.id, { type: "CS_TOGGLE_PANEL" });
  } catch (err) {
    console.error("Injection/toggle failed:", err);
  }
});
