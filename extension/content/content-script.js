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

  // Count images (gallery thumbnails) - more precise
  let imageCount = 0;
  const imageUrls = [];

  // PRIORITY: Get main/active image first (the big one currently displayed)
  const mainImageSelectors = [
    'div[data-box-name="gallery"] img[aria-hidden="false"]', // Active slide
    'div[data-box-name="gallery"] div[aria-label*="Slajd 1"] img', // First slide
    'div[data-box-name="gallery"] li[aria-label*="Slajd 1"] img',
    'img[data-role="photo-main"]',
    'div.gallery-preview img:first-of-type'
  ];

  let mainImage = null;
  for (const selector of mainImageSelectors) {
    mainImage = document.querySelector(selector);
    if (mainImage && mainImage.src && mainImage.src.includes('allegroimg.com')) {
      const src = mainImage.src;
      const alt = mainImage.alt || '';

      // Validate it's a product image (not logo)
      if (alt.length > 10 && !src.includes('logo')) {
        imageUrls.push(src);
        console.log(`✅ Found MAIN image with selector: ${selector}`);
        console.log(`   URL: ${src.substring(0, 80)}...`);
        console.log(`   Alt: ${alt.substring(0, 60)}...`);
        break;
      }
    }
  }

  // Try to find gallery container for counting
  const galleryContainerSelectors = [
    'div[data-box-name="gallery"]',
    'div[data-box-name="Gallery"]',
    'div[aria-label*="galeria"]',
    'section[data-testid="gallery"]',
    '[data-role="gallery-container"]'
  ];

  let galleryContainer = null;
  for (const selector of galleryContainerSelectors) {
    galleryContainer = document.querySelector(selector);
    if (galleryContainer) {
      console.log(`✅ Found gallery container with selector: ${selector}`);
      break;
    }
  }

  if (galleryContainer) {
    // Count only images within gallery container
    const images = galleryContainer.querySelectorAll('img');

    // Filter out duplicates and tiny images (thumbnails vs full size)
    const uniqueUrls = new Set();
    const validImages = [];

    images.forEach(img => {
      let src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('srcset');

      // Clean srcset (take first URL)
      if (src && src.includes(' ')) {
        src = src.split(' ')[0].split(',')[0];
      }

      // Skip if no src
      if (!src) return;

      // Only accept images from allegroimg.com/original (main product photos)
      // EXCLUDE allegrostatic (logos, UI, related products)
      if (!src.includes('allegroimg.com')) {
        return; // Skip non-product images
      }

      // EXCLUDE: logos, icons, UI elements, related products
      const excludePatterns = [
        '/logo',
        '/icon',
        '/brand',
        '/payment',
        '/delivery',
        '/badge',
        '/sprite',
        'allegro-logo',
        'smart-logo',
        '/ui/',
        '/flags/',
        'seller-badge',
        'seller-extras', // Related products (160x160)
        'statics/', // Static UI elements
        'action-common' // UI icons
      ];

      // Check if URL contains excluded pattern
      const isExcluded = excludePatterns.some(pattern =>
        src.toLowerCase().includes(pattern.toLowerCase())
      );

      if (isExcluded) {
        console.log(`⚠️ Excluded image: ${src.substring(0, 80)}...`);
        return;
      }

      // REQUIRE alt attribute for product images
      const alt = img.alt || '';
      if (!alt || alt.length < 10) {
        console.log(`⚠️ No alt text (likely UI): ${src.substring(0, 60)}...`);
        return;
      }

      // FILTER by image size (width/height)
      // Product images are usually at least 200x200px
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        if (img.naturalWidth < 200 || img.naturalHeight < 200) {
          console.log(`⚠️ Image too small (${img.naturalWidth}x${img.naturalHeight}): ${src.substring(0, 60)}...`);
          return;
        }
      }

      // Extract base URL without size parameters
      const baseUrl = src.split('?')[0].replace(/_(original|large|medium|small|thumb)\.(jpg|png|webp)/i, '');

      if (!uniqueUrls.has(baseUrl)) {
        uniqueUrls.add(baseUrl);
        validImages.push({ src, width: img.naturalWidth, height: img.naturalHeight });
      }
    });

    // Sort by image size (larger first) and take up to 5 (but don't exceed if we already have main)
    validImages.sort((a, b) => (b.width * b.height) - (a.width * a.height));

    // Add remaining images (skip if already added as main)
    const remainingSlots = 5 - imageUrls.length;
    validImages.slice(0, remainingSlots).forEach(img => {
      if (!imageUrls.includes(img.src)) {
        imageUrls.push(img.src);
      }
    });

    imageCount = uniqueUrls.size;
    console.log(`✅ Found ${imageCount} unique product images in gallery (filtered)`);
  } else {
    // Fallback: try to count images globally
    console.log('⚠️ Gallery container not found, using fallback');
    const allImages = document.querySelectorAll('img[src*="allegroimg.com"]');
    const uniqueUrls = new Set();

    allImages.forEach(img => {
      const src = img.src;
      if (src) {
        const baseUrl = src.split('?')[0];
        uniqueUrls.add(baseUrl);

        if (imageUrls.length < 5) {
          imageUrls.push(src);
        }
      }
    });

    imageCount = Math.min(uniqueUrls.size, 50); // Cap at 50 to avoid counting non-product images
    console.log(`✅ Found ${imageCount} images (fallback method)`);
  }

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

  // Get seller info - try to extract just the name
  let seller = trySelectors([
    '[data-box-name="Seller"] a',
    'div.mpof_ki_seller a',
    'a[data-role="seller-link"]',
    'div.seller-info a',
    'a[href*="/uzytkownik/"]',
    'div[data-box-name="seller info"] a',
    'section[aria-label*="Sprzedawca"] a'
  ]);

  // Clean seller name - remove "Inne przedmioty..." text
  if (seller) {
    // Try to extract from URL if text is too long
    if (seller.length > 50 || seller.includes('Inne przedmioty')) {
      const sellerLink = document.querySelector('a[href*="/uzytkownik/"]');
      if (sellerLink) {
        const match = sellerLink.href.match(/\/uzytkownik\/([^/?]+)/);
        if (match) {
          seller = decodeURIComponent(match[1].replace(/_/g, ' '));
          console.log(`✅ Extracted seller from URL: ${seller}`);
        }
      }
    }

    // Remove common prefixes
    seller = seller.replace(/^(od|from)\s+/i, '').trim();
  }

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
