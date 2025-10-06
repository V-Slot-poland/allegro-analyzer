// Popup functionality
let currentAuctionData = null;
let currentTabUrl = null;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Allegro Analyzer popup loaded');

  // Get DOM elements
  const initialMessage = document.getElementById('initial-message');
  const auctionCard = document.getElementById('auction-card');
  const analyzeAgainBtn = document.getElementById('analyze-again-btn');
  const viewAuctionBtn = document.getElementById('view-auction-btn');

  // Check if current tab is an Allegro auction
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    currentTabUrl = currentTab.url;
    const isAllegroAuction = currentTab.url && currentTab.url.includes('allegro.pl/oferta/');

    if (isAllegroAuction) {
      console.log('Current tab is an Allegro auction:', currentTab.url);
    } else {
      console.log('Current tab is NOT an Allegro auction');
    }
  });

  // Request latest data from background script
  console.log('📤 Requesting latest data from background...');
  chrome.runtime.sendMessage({ type: 'GET_LATEST_DATA' }, (response) => {
    if (response && response.success && response.data) {
      console.log('✅ Received data from background:', response.data);
      currentAuctionData = response.data;
      displayAuctionData(response.data);
    } else {
      console.log('ℹ️ No data available yet. Click "Analizuj aukcję" button on the page.');
    }
  });

  // Listen for messages from background (live updates)
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'AUCTION_DATA_UPDATED') {
      console.log('🔄 Received updated auction data:', message.data);
      currentAuctionData = message.data;
      displayAuctionData(message.data);
    }
  });

  // Display auction data in the popup
  function displayAuctionData(data) {
    // Hide initial message, show auction card
    initialMessage.classList.add('hidden');
    auctionCard.classList.remove('hidden');

    // Update title
    document.getElementById('auction-title').textContent = data.title || 'Brak tytułu';

    // Update price
    document.getElementById('auction-price').textContent = data.price || 'Brak ceny';

    // Update thumbnail image
    const thumbnail = document.getElementById('auction-thumbnail');
    if (data.imageUrls && data.imageUrls.length > 0) {
      thumbnail.src = data.imageUrls[0];
      thumbnail.style.display = 'block';
    } else {
      thumbnail.style.display = 'none';
    }

    // Update details
    document.getElementById('auction-images').textContent = data.imageCount || 0;
    document.getElementById('auction-description').textContent =
      data.descriptionLength ? `${data.descriptionLength} znaków` : '0 znaków';
    document.getElementById('auction-seller').textContent =
      data.seller || 'Nie znaleziono';
    document.getElementById('auction-condition').textContent =
      data.condition || 'Nie określono';
  }

  // Button handlers
  analyzeAgainBtn.addEventListener('click', () => {
    console.log('Analyze again clicked');
    // Send message to content script to scrape again
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'SCRAPE_AGAIN' });
    });
  });

  viewAuctionBtn.addEventListener('click', () => {
    console.log('View auction clicked');
    if (currentAuctionData && currentAuctionData.url) {
      chrome.tabs.create({ url: currentAuctionData.url });
    }
  });
});
