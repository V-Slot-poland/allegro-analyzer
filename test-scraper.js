/**
 * ALLEGRO ANALYZER - TEST SCRAPER
 *
 * Instrukcja użycia:
 * 1. Otwórz aukcję na Allegro
 * 2. Otwórz DevTools (F12) → Console
 * 3. Skopiuj i wklej cały ten plik do konsoli
 * 4. Naciśnij Enter
 * 5. Wyniki pokażą się automatycznie
 */

console.clear();
console.log('🔍 ALLEGRO ANALYZER - TEST SCRAPER');
console.log('='.repeat(80));

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
          console.log(`✅ Found with selector: "${selector}"`);
          console.log(`   Value: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
          return value;
        }
      }
    } catch (e) {
      // Continue to next selector
    }
  }
  console.log(`❌ NOT FOUND with any selector`);
  return null;
};

console.log('\n📋 Testing Title Selectors:');
console.log('-'.repeat(80));
const title = trySelectors([
  'h1[itemprop="name"]',
  'h1.msts_pt',
  'h1._9a071_3ls6I',
  'h1[data-role="title"]',
  'h1',
  '[data-box-name="Title"] h1',
  'div[data-box-name="listing title"] h1'
]);

console.log('\n💰 Testing Price Selectors:');
console.log('-'.repeat(80));
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

console.log('\n💰 Testing Price Amount (meta):');
console.log('-'.repeat(80));
const priceAmount = trySelectors([
  'meta[itemprop="price"]'
], 'content');

console.log('\n💱 Testing Currency:');
console.log('-'.repeat(80));
const currency = trySelectors([
  'meta[itemprop="priceCurrency"]'
], 'content') || 'PLN';

console.log('\n🖼️ Testing Image Count:');
console.log('-'.repeat(80));
let imageCount = 0;
const imageSelectors = [
  'div[data-box-name="gallery"] img',
  'div.mpof_ki_gallery img',
  'div._9a071_1TeXP img',
  '[data-role="gallery-image"]',
  'div.gallery img'
];

for (const selector of imageSelectors) {
  const images = document.querySelectorAll(selector);
  if (images.length > 0) {
    imageCount = images.length;
    console.log(`✅ Found ${imageCount} images with selector: "${selector}"`);
    break;
  }
}
if (imageCount === 0) {
  console.log(`❌ No images found`);
}

console.log('\n📝 Testing Description:');
console.log('-'.repeat(80));
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
    console.log(`✅ Found description (${descriptionLength} chars) with selector: "${selector}"`);
    break;
  }
}
if (descriptionLength === 0) {
  console.log(`❌ Description not found`);
}

console.log('\n👤 Testing Seller:');
console.log('-'.repeat(80));
const seller = trySelectors([
  '[data-box-name="Seller"] a',
  'div.mpof_ki_seller a',
  'a[data-role="seller-link"]',
  'div.seller-info a'
]);

console.log('\n🏷️ Testing Condition:');
console.log('-'.repeat(80));
const condition = trySelectors([
  '[data-box-name="Parameters"] [data-role="condition"]',
  'div.mpof_or_parameters dd',
  '[itemprop="itemCondition"]'
]);

// Compile results
const results = {
  url: window.location.href,
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

console.log('\n' + '='.repeat(80));
console.log('📊 FINAL RESULTS - SCRAPED DATA');
console.log('='.repeat(80));
console.log(JSON.stringify(results, null, 2));
console.log('='.repeat(80));

console.log('\n📋 Summary Table:');
console.table({
  'Title': results.title?.substring(0, 50) + (results.title?.length > 50 ? '...' : ''),
  'Price': results.price,
  'Price Amount': results.priceAmount,
  'Currency': results.currency,
  'Image Count': results.imageCount,
  'Description Length': results.descriptionLength,
  'Seller': results.seller,
  'Condition': results.condition
});

console.log('\n✅ Test completed!');
console.log('💡 Copy results object: Type "results" in console');

// Make results available globally
window.testResults = results;
