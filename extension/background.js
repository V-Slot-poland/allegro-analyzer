// Background Service Worker
console.log('🔧 Allegro Analyzer: Background service worker loaded');

// Store the latest auction data
let latestAuctionData = null;

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Background received message:', message.type);

  if (message.type === 'AUCTION_DATA') {
    // Store the data
    latestAuctionData = {
      ...message.data,
      tabId: sender.tab?.id,
      timestamp: Date.now()
    };

    console.log('💾 Stored auction data:', latestAuctionData);

    // Notify popup if it's open
    chrome.runtime.sendMessage({
      type: 'AUCTION_DATA_UPDATED',
      data: latestAuctionData
    }).catch(() => {
      // Popup not open, that's okay
      console.log('ℹ️ Popup not open, data stored for later');
    });

    sendResponse({ success: true });
  }

  if (message.type === 'GET_LATEST_DATA') {
    // Popup is requesting the latest data
    console.log('📤 Sending latest data to popup');
    sendResponse({ success: true, data: latestAuctionData });
  }

  return true; // Keep message channel open for async response
});

// Clear data when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (latestAuctionData && latestAuctionData.tabId === tabId) {
    console.log('🗑️ Clearing data for closed tab:', tabId);
    latestAuctionData = null;
  }
});
