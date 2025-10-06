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

// Enhanced scraping function with multiple selector fallbacks
const scrapeCurrentListing = () => {
  console.log('🔍 Starting detailed scraping...');

  // Helper function to try multiple selectors
  const trySelectors = (selectors, attribute = 'textContent') => {
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          const value = attribute === 'textContent'
            ? element.textContent?.trim()
            : element.getAttribute(attribute);
          if (value) {
            console.log(`✅ Found with selector: ${selector} = ${value.substring(0, 50)}...`);
            return value;
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    return null;
  };

  // Get auction title (multiple fallbacks)
  const title = trySelectors([
    'h1[itemprop="name"]',
    'h1.msts_pt',
    'h1._9a071_3ls6I',
    'h1[data-role="title"]',
    'h1',
    '[data-box-name="Title"] h1',
    'div[data-box-name="listing title"] h1'
  ]);

  // Get price (multiple fallbacks)
  const price = trySelectors([
    '[data-box-name="Price"] [data-price]',
    'div[data-price]',
    '[data-testid="price-container"] span',
    'div._9a071_2gZHe span',
    'span[itemprop="price"]',
    'meta[itemprop="price"]',
    'div.msts_pt_price',
    '[data-role="price"]'
  ]);

  // Get price from meta tag if available
  const priceAmount = trySelectors([
    'meta[itemprop="price"]'
  ], 'content');

  // Get currency
  const currency = trySelectors([
    'meta[itemprop="priceCurrency"]'
  ], 'content') || 'PLN';

  // Count images (gallery thumbnails)
  let imageCount = 0;
  const imageSelectors = [
    'div[data-box-name="gallery"] img',
    'div[data-box-name="Gallery"] img',
    'div.mpof_ki_gallery img',
    'div._9a071_1TeXP img',
    '[data-role="gallery-image"]',
    'div.gallery img',
    'img[alt*="Zdjęcie"]',
    'picture img',
    'figure img',
    '[data-testid="gallery"] img'
  ];

  for (const selector of imageSelectors) {
    const images = document.querySelectorAll(selector);
    if (images.length > 0) {
      imageCount = images.length;
      console.log(`✅ Found ${imageCount} images with selector: ${selector}`);
      break;
    }
  }

  // Get all image URLs
  const imageUrls = [];
  const galleryImages = document.querySelectorAll('div[data-box-name="gallery"] img, div.mpof_ki_gallery img, img[data-role="gallery-image"]');
  galleryImages.forEach(img => {
    const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
    if (src && !imageUrls.includes(src)) {
      imageUrls.push(src);
    }
  });

  // Get description length
  const descriptionSelectors = [
    'div[data-box-name="Description"]',
    'div.mpof_or',
    'div._9a071_3Sn8X',
    '[data-role="description"]',
    'div.offer-description'
  ];

  let descriptionLength = 0;
  for (const selector of descriptionSelectors) {
    const desc = document.querySelector(selector);
    if (desc) {
      descriptionLength = desc.textContent?.trim().length || 0;
      console.log(`✅ Found description (${descriptionLength} chars) with selector: ${selector}`);
      break;
    }
  }

  // Get seller info
  const seller = trySelectors([
    '[data-box-name="Seller"] a',
    'div.mpof_ki_seller a',
    'a[data-role="seller-link"]',
    'div.seller-info a',
    'a[href*="/uzytkownik/"]',
    'div[data-box-name="seller info"] a',
    'section[aria-label*="Sprzedawca"] a',
    'div:has(> a[href*="/uzytkownik/"]) a'
  ]);

  // Get condition (nowy/używany)
  const condition = trySelectors([
    '[data-box-name="Parameters"] [data-role="condition"]',
    'div.mpof_or_parameters dd',
    '[itemprop="itemCondition"]',
    'dd:has-text("Nowy")',
    'dd:has-text("Używany")',
    'div:contains("Stan:") + div',
    'span:contains("Nowy")',
    'span:contains("Używany")'
  ]);

  // Compile all data
  const scrapedData = {
    // Basic info
    url: window.location.href,
    auctionId: getAuctionId(),
    title: title || 'Nie znaleziono tytułu',

    // Price info
    price: price || priceAmount || 'Nie znaleziono ceny',
    priceAmount: priceAmount ? parseFloat(priceAmount) : null,
    currency: currency,

    // Images
    imageCount: imageCount,
    imageUrls: imageUrls.slice(0, 5), // First 5 images only

    // Description
    descriptionLength: descriptionLength,
    hasDescription: descriptionLength > 0,

    // Seller
    seller: seller || 'Nie znaleziono sprzedawcy',

    // Condition
    condition: condition || 'Nie określono',

    // Metadata
    timestamp: new Date().toISOString(),
    scrapedAt: new Date().toLocaleString('pl-PL')
  };

  return scrapedData;
};

// Legacy function for backward compatibility
const scrapeAuctionData = () => {
  return scrapeCurrentListing();
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
      const auctionData = scrapeCurrentListing();

      // Display scraped data in console as formatted JSON
      console.log('\n' + '='.repeat(80));
      console.log('📊 ALLEGRO ANALYZER - SCRAPED DATA');
      console.log('='.repeat(80));
      console.log(JSON.stringify(auctionData, null, 2));
      console.log('='.repeat(80) + '\n');

      // Also log as table for better readability
      console.table({
        'Tytuł': auctionData.title?.substring(0, 50) + '...',
        'Cena': auctionData.price,
        'Liczba zdjęć': auctionData.imageCount,
        'Długość opisu': auctionData.descriptionLength,
        'Sprzedawca': auctionData.seller,
        'Stan': auctionData.condition,
        'URL': auctionData.url
      });

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
      console.error('❌ Error analyzing auction:', error);
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

    // Auto-scrape on page load (delayed to let page fully load)
    setTimeout(() => {
      console.log('\n🤖 Auto-scraping auction data on page load...');
      const initialData = scrapeCurrentListing();

      // Display initial scraped data
      console.log('\n' + '='.repeat(80));
      console.log('📊 INITIAL SCRAPE - AUCTION DATA');
      console.log('='.repeat(80));
      console.log(JSON.stringify(initialData, null, 2));
      console.log('='.repeat(80) + '\n');

      console.log('💡 Tip: Click the "🔍 Analizuj aukcję" button for fresh data!');
    }, 2000);
  } else {
    console.log('❌ Not an Allegro auction page');
  }
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCRAPE_AGAIN') {
    console.log('📨 Received SCRAPE_AGAIN message from popup');

    // Scrape and send data
    const auctionData = scrapeCurrentListing();

    console.log('📊 Scraped data:', auctionData);

    chrome.runtime.sendMessage({
      type: 'AUCTION_DATA',
      data: auctionData
    });

    sendResponse({ success: true });
  }
});

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
