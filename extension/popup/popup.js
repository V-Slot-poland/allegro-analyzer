// Popup functionality
document.addEventListener('DOMContentLoaded', () => {
  console.log('Allegro Analyzer popup loaded');

  // Check if current tab is an Allegro auction
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    const isAllegroAuction = currentTab.url && currentTab.url.includes('allegro.pl/oferta/');

    if (isAllegroAuction) {
      console.log('Current tab is an Allegro auction:', currentTab.url);
    } else {
      console.log('Current tab is NOT an Allegro auction');
    }
  });

  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'AUCTION_DATA') {
      console.log('Received auction data:', message.data);
    }
  });
});
