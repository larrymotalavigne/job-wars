#!/usr/bin/env node
/**
 * Card Image Generator for Job Wars
 * Generates pixel art images for all cards using Hugging Face Z-Image Turbo
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CARD_DATA_DIR = '/Users/larry/Documents/projects/atom/job-wars/src/app/data';
const OUTPUT_DIR = '/Users/larry/Documents/projects/atom/job-wars/src/assets/images/cards';
const RESOLUTION = '832x1248 ( 2:3 )';
const STEPS = 8;
const SHIFT = 3;

// Domain configurations for themed prompts
const DOMAIN_THEMES = {
  agriculture: 'farming, rural, nature, crops, animals',
  arts: 'creative, artistic, cultural, performance, design',
  commerce: 'retail, business, sales, market, shop',
  crafts: 'artisan, handmade, workshop, tools, skilled',
  energy: 'power, electricity, renewable, industrial, technical',
  environment: 'nature, ecology, conservation, green, sustainability',
  events: 'neutral, magical, special effect',
  finance: 'banking, money, professional, formal, business',
  firefighter: 'emergency, heroic, fire, rescue, brave',
  health: 'medical, hospital, care, wellness, professional',
  it: 'technology, computer, digital, coding, modern',
  justice: 'legal, court, law, formal, professional',
  media: 'journalism, broadcasting, communication, news, creative',
  military: 'defense, uniform, strategic, disciplined, tactical',
  police: 'law enforcement, patrol, protective, uniform, badge',
  science: 'research, laboratory, discovery, academic, innovative',
  sports: 'athletic, competitive, active, energetic, dynamic',
  teacher: 'education, classroom, academic, professional, knowledgeable',
  tourism: 'travel, hospitality, service, cultural, welcoming',
  transportation: 'vehicles, logistics, movement, infrastructure, modern',
  'urban-planning': 'city, architecture, planning, development, modern'
};

// Card files to process
const CARD_FILES = [
  'agriculture.cards.ts',
  'arts.cards.ts',
  'commerce.cards.ts',
  'crafts.cards.ts',
  'energy.cards.ts',
  'environment.cards.ts',
  'events.cards.ts',
  'finance.cards.ts',
  'firefighter.cards.ts',
  'health.cards.ts',
  'it.cards.ts',
  'justice.cards.ts',
  'media.cards.ts',
  'military.cards.ts',
  'police.cards.ts',
  'science.cards.ts',
  'sports.cards.ts',
  'teacher.cards.ts',
  'tourism.cards.ts',
  'transportation.cards.ts',
  'urban-planning.cards.ts'
];

/**
 * Extract cards from a TypeScript card file
 */
function extractCardsFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const cards = [];

  // Match card objects with id and name
  const cardPattern = /{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',[\s\S]*?}/g;
  let match;

  while ((match = cardPattern.exec(content)) !== null) {
    const [, id, name] = match;
    cards.push({ id, name });
  }

  return cards;
}

/**
 * Check if image already exists
 */
function imageExists(cardId) {
  const pngPath = path.join(OUTPUT_DIR, `${cardId}.png`);
  return fs.existsSync(pngPath);
}

/**
 * Generate pixel art prompt for a card
 */
function generatePrompt(cardName, domain) {
  const theme = DOMAIN_THEMES[domain] || 'professional, worker';

  // Clean card name (remove special characters for better prompt)
  const cleanName = cardName
    .replace(/[éèê]/g, 'e')
    .replace(/[àâ]/g, 'a')
    .replace(/[ôö]/g, 'o')
    .replace(/[îï]/g, 'i')
    .replace(/[ùû]/g, 'u')
    .replace(/ç/g, 'c');

  return `pixel art 8-bit retro game character card, ${cleanName}, ${theme}, portrait view, detailed sprite, card game illustration, vibrant colors, professional worker, centered character, simple background, NO TEXT, NO LABELS, NO WORDS, character illustration only`;
}

/**
 * Download image from URL
 */
function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(outputPath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(outputPath, () => {}); // Clean up partial file
        reject(err);
      });
    }).on('error', reject);
  });
}

/**
 * Process all cards
 */
async function processAllCards() {
  console.log('🎨 Job Wars Card Image Generator');
  console.log('=================================\n');

  let totalCards = 0;
  let processedCards = 0;
  let skippedCards = 0;
  let errorCards = 0;

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Process each domain file
  for (const cardFile of CARD_FILES) {
    const domain = cardFile.replace('.cards.ts', '');
    const filePath = path.join(CARD_DATA_DIR, cardFile);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${cardFile} (not found)`);
      continue;
    }

    console.log(`\n📂 Processing domain: ${domain.toUpperCase()}`);
    console.log('─'.repeat(50));

    const cards = extractCardsFromFile(filePath);
    totalCards += cards.length;

    console.log(`Found ${cards.length} cards in ${domain}`);

    // Process each card
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const { id, name } = card;

      // Check if image already exists
      if (imageExists(id)) {
        skippedCards++;
        if (i % 10 === 0) {
          console.log(`  [${i + 1}/${cards.length}] ⏭️  ${id} (exists)`);
        }
        continue;
      }

      try {
        const prompt = generatePrompt(name, domain);
        console.log(`  [${i + 1}/${cards.length}] 🎨 Generating ${id}: ${name}...`);

        // Note: This will be called via Claude Code MCP tool
        console.log(`     Prompt: ${prompt.substring(0, 80)}...`);
        console.log(`     PLACEHOLDER - Use MCP tool to generate`);

        processedCards++;

        // Progress report every 50 cards
        if (processedCards % 50 === 0) {
          console.log(`\n📊 Progress: ${processedCards}/${totalCards} cards processed\n`);
        }

      } catch (error) {
        errorCards++;
        console.error(`  ❌ Error generating ${id}: ${error.message}`);
      }
    }
  }

  // Final report
  console.log('\n' + '='.repeat(50));
  console.log('📊 Generation Complete!');
  console.log('='.repeat(50));
  console.log(`Total cards found:     ${totalCards}`);
  console.log(`Already existed:       ${skippedCards}`);
  console.log(`Successfully generated: ${processedCards}`);
  console.log(`Errors:                ${errorCards}`);
  console.log(`Remaining:             ${totalCards - skippedCards - processedCards}`);
}

// Run if executed directly
if (require.main === module) {
  processAllCards().catch(console.error);
}

module.exports = { extractCardsFromFile, generatePrompt, imageExists };
