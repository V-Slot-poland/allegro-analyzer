// Allegro Analyzer - Content Script
console.log('🔍 Allegro Analyzer: Content script loaded');

// Check if we're on an Allegro auction page
const isAllegroAuction = () => {
  return window.location.href.includes('allegro.pl/oferta/');
};

// Extract auction ID from URL
const getAuctionId = () => {
  const match = window.location.href.match(/\/oferta\/([^?#]+)/);
  return match ? match[1] : null;
};

// Scrape basic auction information
const scrapeAuctionData = () => {
  const data = {
    url: window.location.href,
    auctionId: getAuctionId(),
    title: document.querySelector('h1')?.textContent?.trim() || 'Brak tytułu',
    price: document.querySelector('[data-price]')?.textContent?.trim() || 'Brak ceny',
    timestamp: new Date().toISOString()
  };

  console.log('📊 Scraped auction data:', data);
  return data;
};

// Create floating analyze button
const createAnalyzeButton = () => {
  // Check if button already exists
  if (document.getElementById('allegro-analyzer-button')) {
    return;
  }

  const button = document.createElement('button');
  button.id = 'allegro-analyzer-button';
  button.innerHTML = '🔍 Analizuj aukcję';
  button.className = 'allegro-analyzer-floating-btn';

  button.addEventListener('click', async () => {
    console.log('🚀 Analyze button clicked!');
    button.innerHTML = '⏳ Analizowanie...';
    button.disabled = true;

    try {
      const auctionData = scrapeAuctionData();

      // Send message to popup/background
      chrome.runtime.sendMessage({
        type: 'AUCTION_DATA',
        data: auctionData
      });

      // Show success state
      setTimeout(() => {
        button.innerHTML = '✅ Przeanalizowano!';
        setTimeout(() => {
          button.innerHTML = '🔍 Analizuj aukcję';
          button.disabled = false;
        }, 2000);
      }, 1500);

    } catch (error) {
      console.error('Error analyzing auction:', error);
      button.innerHTML = '❌ Błąd';
      setTimeout(() => {
        button.innerHTML = '🔍 Analizuj aukcję';
        button.disabled = false;
      }, 2000);
    }
  });

  document.body.appendChild(button);
  console.log('✅ Analyze button created and added to page');
};

// Initialize extension when page loads
const initialize = () => {
  if (isAllegroAuction()) {
    console.log('✅ Allegro auction detected!');
    console.log('📍 Auction ID:', getAuctionId());

    // Create the analyze button
    createAnalyzeButton();

    // Log basic auction info
    scrapeAuctionData();
  } else {
    console.log('❌ Not an Allegro auction page');
  }
};

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Handle single-page app navigation (Allegro uses React)
let lastUrl = location.href;
new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    console.log('🔄 URL changed, re-initializing...');
    initialize();
  }
}).observe(document, { subtree: true, childList: true });
