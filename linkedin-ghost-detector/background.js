chrome.runtime.onMessage.addListener(function(msg, sender) {
  if (msg.type === "GHOST_JOBS_FOUND" && sender.tab) {
    chrome.action.setBadgeText({ text: String(msg.count), tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: "#dc2626", tabId: sender.tab.id });
  }
});
