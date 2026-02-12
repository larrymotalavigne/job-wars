#!/usr/bin/env node

/**
 * Generate realistic card images using Hugging Face FLUX.1-dev model.
 * Produces high-quality digital illustration style images.
 *
 * Usage:
 *   HF_TOKEN=hf_xxx node scripts/generate-card-images-v3.mjs
 *   HF_TOKEN=hf_xxx node scripts/generate-card-images-v3.mjs --domain IT
 *   HF_TOKEN=hf_xxx node scripts/generate-card-images-v3.mjs --only it-001,it-002
 *   HF_TOKEN=hf_xxx node scripts/generate-card-images-v3.mjs --dry-run
 *   HF_TOKEN=hf_xxx node scripts/generate-card-images-v3.mjs --force
 */

import { HfInference } from '@huggingface/inference';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUTPUT_DIR = join(ROOT, 'public', 'images', 'cards-v3');
const DATA_DIR = join(ROOT, 'src', 'app', 'data');

// ─── Config ───────────────────────────────────────────────────────────────────

const MODEL = 'black-forest-labs/FLUX.1-dev';
const DELAY_MS = 2000;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 15000;

// ─── Domain metadata for prompts ──────────────────────────────────────────────

const DOMAIN_PROMPT_INFO = {
  Informatique: {
    en: 'Information Technology',
    palette: 'cool blue and cyan tones, neon accents',
    setting: 'modern tech office, server room, digital environment',
  },
  Urbanisme: {
    en: 'Urban Planning & Construction',
    palette: 'earthy greens and warm greys',
    setting: 'construction site, city blueprints, urban landscape',
  },
  Enseignement: {
    en: 'Education & Teaching',
    palette: 'warm golden and amber tones',
    setting: 'classroom, library, academic environment',
  },
  Police: {
    en: 'Police & Law Enforcement',
    palette: 'deep navy blue and red accents',
    setting: 'police station, patrol scene, urban streets',
  },
  Santé: {
    en: 'Healthcare & Medicine',
    palette: 'clean teal and white tones',
    setting: 'hospital, medical lab, clinical environment',
  },
  Pompiers: {
    en: 'Firefighting & Rescue',
    palette: 'fiery orange and deep red tones',
    setting: 'fire station, rescue scene, emergency environment',
  },
  Justice: {
    en: 'Justice & Legal System',
    palette: 'regal purple and dark tones',
    setting: 'courtroom, law office, scales of justice',
  },
  Finance: {
    en: 'Finance & Banking',
    palette: 'sleek silver and dark slate tones',
    setting: 'bank interior, stock exchange, financial district',
  },
  Artisanat: {
    en: 'Crafts & Trades',
    palette: 'warm brown and copper tones',
    setting: 'workshop, forge, artisan studio',
  },
  Armée: {
    en: 'Military & Defense',
    palette: 'olive green and khaki tones',
    setting: 'military base, tactical environment, defense post',
  },
};

const RARITY_STYLE = {
  Commune: 'clean, simple lighting, straightforward composition',
  'Peu commune': 'polished, detailed rendering, subtle rim lighting',
  Rare: 'dramatic lighting, volumetric rays, rich detail, slight glow effects',
  Légendaire: 'epic cinematic lighting, golden hour, lens flare, god rays, masterwork quality, breathtaking',
};

const TYPE_SUBJECT = {
  Métier: 'detailed character portrait, professional at work, upper body focus, expressive face',
  Outil: 'detailed object illustration, centered item, dramatic presentation, slight depth of field',
  Événement: 'dramatic wide scene, action moment, dynamic composition, environmental storytelling',
};

// ─── Parse card data from TypeScript files ────────────────────────────────────

function parseCardsFromFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const cards = [];

  const cardBlockRegex = /\{[^{}]*?id:\s*'([^']+)'[\s\S]*?\n  \}/gm;
  let match;

  while ((match = cardBlockRegex.exec(content)) !== null) {
    const block = match[0];
    const id = match[1];

    const get = (key) => {
      const m = block.match(new RegExp(`${key}:\\s*(?:Domain\\.|CardType\\.|Rarity\\.)?(?:['"])?([^'",}]+)`));
      return m ? m[1].trim() : '';
    };

    const getQuoted = (key) => {
      const m = block.match(new RegExp(`${key}:\\s*'((?:[^'\\\\]|\\\\.)*)'`));
      return m ? m[1].replace(/\\'/g, "'") : '';
    };

    const domainMap = {
      IT: 'Informatique', UrbanPlanning: 'Urbanisme', Teacher: 'Enseignement',
      Police: 'Police', Health: 'Santé', Firefighter: 'Pompiers',
      Justice: 'Justice', Finance: 'Finance', Crafts: 'Artisanat', Military: 'Armée',
    };
    const typeMap = { Job: 'Métier', Tool: 'Outil', Event: 'Événement' };
    const rarityMap = {
      Common: 'Commune', Uncommon: 'Peu commune', Rare: 'Rare', Legendary: 'Légendaire',
    };

    const rawDomain = get('domain');
    const rawType = get('type');
    const rawRarity = get('rarity');

    cards.push({
      id,
      name: getQuoted('name'),
      domain: domainMap[rawDomain] || rawDomain,
      type: typeMap[rawType] || rawType,
      rarity: rarityMap[rawRarity] || rawRarity,
      flavorText: getQuoted('flavorText'),
      ability: getQuoted('ability'),
      effect: getQuoted('effect'),
    });
  }

  return cards;
}

function loadAllCards() {
  const cards = [];
  const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.cards.ts'));

  for (const file of files) {
    const parsed = parseCardsFromFile(join(DATA_DIR, file));
    cards.push(...parsed);
  }

  cards.sort((a, b) => a.id.localeCompare(b.id));
  return cards;
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(card) {
  const domainInfo = DOMAIN_PROMPT_INFO[card.domain] || {
    en: card.domain,
    palette: 'neutral tones',
    setting: 'professional environment',
  };
  const rarityStyle = RARITY_STYLE[card.rarity] || 'clean composition';
  const typeSubject = TYPE_SUBJECT[card.type] || 'detailed scene';

  const flavorHint = card.flavorText
    ? `, mood: ${card.flavorText.replace(/[«»"]/g, '')}`
    : '';

  return [
    `Digital illustration for a collectible card game, high quality, professional artwork.`,
    `${typeSubject}.`,
    `Subject: "${card.name}", ${domainInfo.en} professional${flavorHint}.`,
    `Setting: ${domainInfo.setting}. Color palette: ${domainInfo.palette}.`,
    `Style: ${rarityStyle}.`,
    `Painterly digital art, soft brushstrokes, rich colors, square format.`,
    `Pure illustration, absolutely no text, no writing, no letters, no numbers, no words, no symbols, no watermarks, no labels, no captions.`,
  ].join(' ');
}

// ─── Image generation ─────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateImage(hf, card, attempt = 1) {
  const prompt = buildPrompt(card);

  try {
    const blob = await hf.textToImage({
      model: MODEL,
      inputs: prompt,
      parameters: {
        width: 512,
        height: 512,
        num_inference_steps: 28,
        guidance_scale: 3.5,
      },
    });

    return Buffer.from(await blob.arrayBuffer());
  } catch (error) {
    if (attempt <= RETRY_ATTEMPTS) {
      const isRateLimit = error.message?.includes('429') || error.message?.includes('rate')
        || error.message?.includes('Too Many') || error.statusCode === 429;
      const isLoading = error.message?.includes('loading') || error.message?.includes('503');
      const delay = isLoading ? 30000 : isRateLimit ? RETRY_DELAY_MS * attempt : RETRY_DELAY_MS;
      console.log(`    Retry ${attempt}/${RETRY_ATTEMPTS} in ${delay / 1000}s... (${error.message || error})`);
      await sleep(delay);
      return generateImage(hf, card, attempt + 1);
    }
    throw error;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');

  const domainFlag = args.indexOf('--domain');
  const filterDomain = domainFlag >= 0 ? args[domainFlag + 1] : null;

  const onlyFlag = args.indexOf('--only');
  const filterIds = onlyFlag >= 0 ? args[onlyFlag + 1].split(',') : null;

  const token = process.env.HF_TOKEN;
  if (!token && !dryRun) {
    console.error('Error: Set HF_TOKEN environment variable.');
    console.error('Get a free token at https://huggingface.co/settings/tokens');
    process.exit(1);
  }

  const hf = token ? new HfInference(token) : null;

  console.log('Loading card data...');
  let cards = loadAllCards();
  console.log(`Found ${cards.length} cards total.`);

  if (filterDomain) {
    const domainMatch = Object.entries(DOMAIN_PROMPT_INFO)
      .find(([k]) => k.toLowerCase().startsWith(filterDomain.toLowerCase()));
    if (domainMatch) {
      cards = cards.filter(c => c.domain === domainMatch[0]);
      console.log(`Filtered to domain "${domainMatch[0]}": ${cards.length} cards.`);
    } else {
      console.error(`Unknown domain: ${filterDomain}`);
      console.error(`Available: ${Object.keys(DOMAIN_PROMPT_INFO).join(', ')}`);
      process.exit(1);
    }
  }

  if (filterIds) {
    cards = cards.filter(c => filterIds.includes(c.id));
    console.log(`Filtered to specific IDs: ${cards.length} cards.`);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });
  let toGenerate = cards;

  if (!force) {
    toGenerate = cards.filter(c => {
      const pngPath = join(OUTPUT_DIR, `${c.id}.png`);
      if (existsSync(pngPath)) {
        const stat = statSync(pngPath);
        return stat.size < 1000;
      }
      return true;
    });
    const skipped = cards.length - toGenerate.length;
    if (skipped > 0) {
      console.log(`Skipping ${skipped} already-generated images. Use --force to regenerate.`);
    }
  }

  if (toGenerate.length === 0) {
    console.log('Nothing to generate! All images exist.');
    return;
  }

  console.log(`\nModel: ${MODEL}`);
  console.log(`Will generate ${toGenerate.length} realistic images.`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  if (dryRun) {
    console.log('=== DRY RUN — Prompts only ===\n');
    for (const card of toGenerate) {
      console.log(`[${card.id}] ${card.name} (${card.domain} / ${card.type} / ${card.rarity})`);
      console.log(`  Prompt: ${buildPrompt(card)}`);
      console.log();
    }
    console.log(`Total: ${toGenerate.length} images would be generated.`);
    return;
  }

  let generated = 0;
  let failed = 0;
  const failures = [];
  const startTime = Date.now();

  for (let i = 0; i < toGenerate.length; i++) {
    const card = toGenerate[i];
    const progress = `[${i + 1}/${toGenerate.length}]`;

    process.stdout.write(`${progress} ${card.id} (${card.name})... `);

    try {
      const imageBuffer = await generateImage(hf, card);
      const outputPath = join(OUTPUT_DIR, `${card.id}.png`);
      writeFileSync(outputPath, imageBuffer);

      const sizeKB = (imageBuffer.length / 1024).toFixed(1);
      console.log(`done (${sizeKB}KB)`);
      generated++;
    } catch (error) {
      console.log(`FAILED: ${error.message || error}`);
      failures.push(card.id);
      failed++;
    }

    if (i < toGenerate.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n=== Done in ${elapsed}s ===`);
  console.log(`Generated: ${generated}, Failed: ${failed}, Skipped: ${cards.length - toGenerate.length}`);

  if (failures.length > 0) {
    const failedFile = join(__dirname, 'failed-cards-v3.txt');
    writeFileSync(failedFile, failures.join('\n') + '\n');
    console.log(`\nFailed IDs written to: ${failedFile}`);
    console.log(`Re-run with: HF_TOKEN=... node scripts/generate-card-images-v3.mjs --only ${failures.join(',')}`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
