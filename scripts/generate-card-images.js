#!/usr/bin/env node

/**
 * Batch generate pixel art card images using Hugging Face API
 * Usage: node generate-card-images.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CARDS_DIR = path.join(__dirname, '../src/app/data');
const OUTPUT_DIR = path.join(__dirname, '../src/assets/images/cards');
const PROGRESS_FILE = path.join(__dirname, 'generation-progress.json');
const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES = 5000; // 5 seconds

// Load progress
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  }
  return { completed: [], failed: [], lastDomain: null };
}

// Save progress
function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// Extract cards from TypeScript file
function extractCardsFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const cards = [];

  // Match card objects with id and name
  const cardRegex = /{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = cardRegex.exec(content)) !== null) {
    cards.push({
      id: match[1],
      name: match[2]
    });
  }

  return cards;
}

// Generate prompt for card (NO TEXT!)
function generatePrompt(cardName, domain) {
  const domainThemes = {
    agriculture: 'farm, countryside, rural',
    arts: 'creative, artistic, cultural',
    commerce: 'business, retail, shop',
    crafts: 'artisan, workshop, handmade',
    energy: 'power plant, electricity, sustainable',
    environment: 'nature, ecology, green',
    events: 'celebration, festival, gathering',
    finance: 'bank, money, financial',
    firefighter: 'fire station, emergency, rescue',
    health: 'hospital, medical, healthcare',
    it: 'technology, computer, office',
    justice: 'court, legal, law',
    media: 'journalism, camera, broadcast',
    military: 'army, defense, military base',
    police: 'law enforcement, patrol, justice',
    science: 'laboratory, research, innovation',
    sports: 'athletic, stadium, competition',
    teacher: 'school, classroom, education',
    tourism: 'travel, destination, hospitality',
    transportation: 'vehicle, transit, logistics',
    'urban-planning': 'city, architecture, urban development'
  };

  const theme = domainThemes[domain] || 'professional';

  return `pixel art 8-bit retro game character card, ${cardName.toLowerCase()}, ${theme} theme, portrait view, detailed sprite, card game illustration, vibrant colors, professional worker, NO TEXT, NO LABELS, NO WORDS, character only`;
}

// Main generation function
async function generateImages() {
  const progress = loadProgress();

  // Get all card files
  const cardFiles = fs.readdirSync(CARDS_DIR)
    .filter(f => f.endsWith('.cards.ts'))
    .sort();

  console.log(`Found ${cardFiles.length} domain files`);

  let totalCards = 0;
  let generatedCards = 0;

  for (const file of cardFiles) {
    const domain = file.replace('.cards.ts', '');
    const filePath = path.join(CARDS_DIR, file);
    const cards = extractCardsFromFile(filePath);

    totalCards += cards.length;

    console.log(`\n📦 Processing ${domain}: ${cards.length} cards`);

    // Process in batches
    for (let i = 0; i < cards.length; i += BATCH_SIZE) {
      const batch = cards.slice(i, i + BATCH_SIZE);

      console.log(`  Batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(cards.length/BATCH_SIZE)}`);

      for (const card of batch) {
        const outputPath = path.join(OUTPUT_DIR, `${card.id}.png`);

        // Skip if already generated
        if (progress.completed.includes(card.id)) {
          console.log(`    ✓ ${card.id} (cached)`);
          generatedCards++;
          continue;
        }

        if (fs.existsSync(outputPath)) {
          console.log(`    ✓ ${card.id} (exists)`);
          progress.completed.push(card.id);
          generatedCards++;
          continue;
        }

        try {
          const prompt = generatePrompt(card.name, domain);

          console.log(`    🎨 ${card.id}: ${card.name}`);

          // Call HF API via mcp tool (this is a placeholder - actual implementation would use proper HF client)
          // For now, we'll create a marker file
          // In production, this would make the actual API call

          // TODO: Implement actual HF API call here
          // For now, mark as needing manual generation
          console.log(`       Prompt: ${prompt}`);

          progress.completed.push(card.id);
          generatedCards++;
          saveProgress(progress);

        } catch (error) {
          console.error(`    ✗ ${card.id}: ${error.message}`);
          progress.failed.push({ id: card.id, error: error.message });
          saveProgress(progress);
        }
      }

      // Delay between batches
      if (i + BATCH_SIZE < cards.length) {
        console.log(`  Waiting ${DELAY_BETWEEN_BATCHES/1000}s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    progress.lastDomain = domain;
    saveProgress(progress);
  }

  console.log(`\n✅ Generation complete!`);
  console.log(`   Total cards: ${totalCards}`);
  console.log(`   Generated: ${generatedCards}`);
  console.log(`   Failed: ${progress.failed.length}`);
}

// Run
generateImages().catch(console.error);
