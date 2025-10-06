/**
 * DEBUG SCRIPT - Znajdź galerie zdjęć produktu
 *
 * Instrukcja:
 * 1. Otwórz aukcję Allegro
 * 2. F12 → Console
 * 3. Wklej i uruchom ten skrypt
 * 4. Przeanalizuj wyniki
 */

console.clear();
console.log('🔍 ALLEGRO IMAGE DEBUG TOOL');
console.log('='.repeat(80));

// Find all images
const allImages = document.querySelectorAll('img');
console.log(`\n📊 Total images on page: ${allImages.length}\n`);

// Analyze each image
const imageData = [];
allImages.forEach((img, index) => {
  const data = {
    index,
    src: img.src,
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
    alt: img.alt,
    class: img.className,
    parent: img.parentElement?.tagName,
    parentClass: img.parentElement?.className,
    'data-role': img.getAttribute('data-role'),
    'data-testid': img.getAttribute('data-testid')
  };

  imageData.push(data);
});

// Filter Allegro images only
const allegroImages = imageData.filter(img =>
  img.src.includes('allegroimg.com') || img.src.includes('allegrostatic')
);

console.log(`📸 Allegro images: ${allegroImages.length}\n`);

// Sort by size (largest first)
allegroImages.sort((a, b) => (b.width * b.height) - (a.width * a.height));

// Display top 10
console.log('🏆 TOP 10 LARGEST IMAGES:');
console.log('='.repeat(80));
allegroImages.slice(0, 10).forEach((img, i) => {
  console.log(`\n${i + 1}. [${img.width}x${img.height}px]`);
  console.log(`   URL: ${img.src.substring(0, 100)}...`);
  console.log(`   Alt: ${img.alt || 'N/A'}`);
  console.log(`   Class: ${img.class || 'N/A'}`);
  console.log(`   Parent: <${img.parent}> class="${img.parentClass}"`);
  if (img['data-role']) console.log(`   data-role: ${img['data-role']}`);
  if (img['data-testid']) console.log(`   data-testid: ${img['data-testid']}`);
});

// Try to find gallery container
console.log('\n\n🎯 SEARCHING FOR GALLERY CONTAINER:');
console.log('='.repeat(80));

const gallerySelectors = [
  'div[data-box-name="gallery"]',
  'div[data-box-name="Gallery"]',
  '[data-testid="gallery"]',
  'section[aria-label*="galeria"]',
  '[data-role="gallery"]',
  'div.opbox-sheet',
  'div[class*="gallery"]',
  'div[class*="Gallery"]'
];

gallerySelectors.forEach(selector => {
  const element = document.querySelector(selector);
  if (element) {
    const imagesInside = element.querySelectorAll('img').length;
    console.log(`✅ FOUND: "${selector}"`);
    console.log(`   Images inside: ${imagesInside}`);
    console.log(`   Element:`, element);
  }
});

// Find main product image
console.log('\n\n🎯 MAIN PRODUCT IMAGE:');
console.log('='.repeat(80));

const mainImageSelectors = [
  'div[data-box-name="gallery"] img[data-role="photo-preview"]',
  'img[data-testid="main-image"]',
  'div.opbox-sheet img:first-of-type',
  'picture:first-of-type img'
];

mainImageSelectors.forEach(selector => {
  const img = document.querySelector(selector);
  if (img) {
    console.log(`✅ FOUND with selector: "${selector}"`);
    console.log(`   URL: ${img.src}`);
    console.log(`   Size: ${img.naturalWidth}x${img.naturalHeight}`);
    console.log(`   Element:`, img);
  }
});

// Check for logo specifically
console.log('\n\n⚠️  LOGO CHECK:');
console.log('='.repeat(80));
const logos = imageData.filter(img =>
  img.src.toLowerCase().includes('logo') ||
  img.alt.toLowerCase().includes('logo') ||
  img.class.toLowerCase().includes('logo')
);

logos.forEach(logo => {
  console.log(`🚫 Logo found: [${logo.width}x${logo.height}] ${logo.src.substring(0, 80)}`);
});

console.log('\n\n' + '='.repeat(80));
console.log('✅ Debug complete! Check the data above.');
console.log('Copy interesting selectors to content-script.js');
console.log('='.repeat(80));

// Make data available globally
window.debugImageData = allegroImages;
console.log('\n💡 Tip: Access full data via window.debugImageData');
