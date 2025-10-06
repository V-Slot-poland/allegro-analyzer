/**
 * AUTOMATED AUCTION TESTING SCRIPT
 * Tests the scraper on multiple Allegro auctions
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Test URLs
const testAuctions = [
  'https://allegro.pl/oferta/daisy-beta-50w-nw-5500-6200lm-projektor-naswietlacz-led-17945721837',
  'https://allegro.pl/oferta/gube-r-black-2gu10-kinkiet-2xgu10-elewacyjny-17945721966'
];

// Read the content script
const contentScriptPath = path.join(__dirname, '../extension/content/content-script.js');
const contentScript = fs.readFileSync(contentScriptPath, 'utf8');

async function testAuction(browser, url, index) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 Testing Auction ${index + 1}/${testAuctions.length}`);
  console.log(`📍 URL: ${url}`);
  console.log('='.repeat(80));

  const page = await browser.newPage();

  // Set viewport
  await page.setViewport({ width: 1920, height: 1080 });

  // Listen to console logs from the page
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Allegro Analyzer') || text.includes('📊') || text.includes('✅') || text.includes('❌')) {
      console.log(`[PAGE] ${text}`);
    }
  });

  try {
    console.log('⏳ Loading page...');
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('✅ Page loaded');

    // Handle cookie consent popup
    try {
      await page.waitForSelector('[data-role="accept-consent"]', { timeout: 3000 });
      await page.click('[data-role="accept-consent"]');
      console.log('✅ Clicked cookie consent');
    } catch (e) {
      // Try alternative selector
      try {
        await page.click('button:has-text("OK, ZGADZAM SIĘ")');
        console.log('✅ Clicked cookie consent (alt)');
      } catch (e2) {
        console.log('⚠️  No cookie consent found or already accepted');
      }
    }

    // Wait a bit for dynamic content
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Take screenshot for debugging
    const screenshotPath = path.join(__dirname, `../debug-screenshot-${index + 1}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);

    // Check page title
    const pageTitle = await page.title();
    console.log(`📄 Page title: ${pageTitle}`);

    // Get HTML snippet
    const htmlSnippet = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return {
        hasH1: !!h1,
        h1Text: h1 ? h1.textContent.substring(0, 100) : 'NO H1',
        bodyLength: document.body.innerHTML.length
      };
    });
    console.log(`🔍 HTML Check:`, htmlSnippet);

    console.log('🔍 Injecting scraper script...');

    // Inject and run the scraper
    const scrapedData = await page.evaluate(() => {
      // Helper function
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
            // Continue
          }
        }
        return null;
      };

      // Extract auction ID
      const getAuctionId = () => {
        const match = window.location.href.match(/\/oferta\/([^?#]+)/);
        return match ? match[1] : null;
      };

      // Get title
      const title = trySelectors([
        'h1[itemprop="name"]',
        'h1.msts_pt',
        'h1._9a071_3ls6I',
        'h1[data-role="title"]',
        'h1',
        '[data-box-name="Title"] h1',
        'div[data-box-name="listing title"] h1'
      ]);

      // Get price
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

      const priceAmount = trySelectors(['meta[itemprop="price"]'], 'content');
      const currency = trySelectors(['meta[itemprop="priceCurrency"]'], 'content') || 'PLN';

      // Count images
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

      // Get seller
      const seller = trySelectors([
        '[data-box-name="Seller"] a',
        'div.mpof_ki_seller a',
        'a[data-role="seller-link"]',
        'div.seller-info a',
        'a[href*="/uzytkownik/"]',
        'div[data-box-name="seller info"] a'
      ]);

      // Get condition - try to extract from text
      let condition = trySelectors([
        '[data-box-name="Parameters"] [data-role="condition"]',
        'div.mpof_or_parameters dd',
        '[itemprop="itemCondition"]'
      ]);

      // Fallback: search for "Nowy" or "Używany" in text
      if (!condition) {
        const bodyText = document.body.innerText;
        if (bodyText.includes('Stan: Nowy') || bodyText.match(/\bNowy\b/)) {
          condition = 'Nowy';
          console.log('✅ Found condition from text: Nowy');
        } else if (bodyText.includes('Stan: Używany') || bodyText.includes('Używany')) {
          condition = 'Używany';
          console.log('✅ Found condition from text: Używany');
        }
      }

      return {
        url: window.location.href,
        auctionId: getAuctionId(),
        title: title || 'NOT FOUND',
        price: price || priceAmount || 'NOT FOUND',
        priceAmount: priceAmount ? parseFloat(priceAmount) : null,
        currency: currency,
        imageCount: imageCount,
        descriptionLength: descriptionLength,
        hasDescription: descriptionLength > 0,
        seller: seller || 'NOT FOUND',
        condition: condition || 'NOT FOUND',
        timestamp: new Date().toISOString()
      };
    });

    console.log('\n📊 SCRAPED DATA:');
    console.log(JSON.stringify(scrapedData, null, 2));

    // Validate results
    console.log('\n✅ VALIDATION:');
    const validations = {
      'Title found': scrapedData.title !== 'NOT FOUND',
      'Price found': scrapedData.price !== 'NOT FOUND',
      'Images found': scrapedData.imageCount > 0,
      'Description found': scrapedData.hasDescription,
      'Seller found': scrapedData.seller !== 'NOT FOUND'
    };

    for (const [check, passed] of Object.entries(validations)) {
      console.log(`${passed ? '✅' : '❌'} ${check}`);
    }

    await page.close();
    return scrapedData;

  } catch (error) {
    console.error(`❌ Error testing auction:`, error.message);
    await page.close();
    return null;
  }
}

async function main() {
  console.log('🚀 ALLEGRO ANALYZER - AUTOMATED AUCTION TESTING');
  console.log('='.repeat(80));

  const browser = await puppeteer.launch({
    headless: false,  // Changed to false to see what's happening
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--window-size=1920,1080'
    ]
  });

  const results = [];

  for (let i = 0; i < testAuctions.length; i++) {
    const result = await testAuction(browser, testAuctions[i], i);
    if (result) {
      results.push(result);
    }
  }

  await browser.close();

  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nTested ${results.length}/${testAuctions.length} auctions\n`);

  results.forEach((result, i) => {
    console.log(`Auction ${i + 1}:`);
    console.log(`  Title: ${result.title?.substring(0, 60)}...`);
    console.log(`  Price: ${result.price}`);
    console.log(`  Images: ${result.imageCount}`);
    console.log(`  Description: ${result.descriptionLength} chars`);
    console.log(`  Seller: ${result.seller}`);
    console.log('');
  });

  // Save results to file
  const outputPath = path.join(__dirname, '../test-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`💾 Results saved to: ${outputPath}`);

  console.log('\n✅ All tests completed!');
}

main().catch(console.error);
