const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../extension/icons');

const sizes = [
  { size: 16, input: 'icon16.svg', output: 'icon16.png' },
  { size: 48, input: 'icon48.svg', output: 'icon48.png' },
  { size: 128, input: 'icon128.svg', output: 'icon128.png' }
];

async function generateIcons() {
  console.log('🎨 Generating PNG icons from SVG...\n');

  for (const { size, input, output } of sizes) {
    const inputPath = path.join(iconsDir, input);
    const outputPath = path.join(iconsDir, output);

    try {
      await sharp(inputPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated ${output} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Error generating ${output}:`, error.message);
    }
  }

  console.log('\n🎉 All icons generated successfully!');
}

generateIcons().catch(console.error);
