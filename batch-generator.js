#!/usr/bin/env node
/**
 * Batch Card Image Generator
 * This script outputs the card data that Claude Code will use to generate images
 */

const fs = require('fs');
const path = require('path');

const MISSING_CARDS_FILE = '/Users/larry/Documents/projects/atom/job-wars/missing-cards.json';
const BATCH_SIZE = 50; // Process 50 cards at a time

function main() {
  const cards = JSON.parse(fs.readFileSync(MISSING_CARDS_FILE, 'utf8'));

  // Get batch number from command line
  const batchNum = parseInt(process.argv[2] || '0');
  const startIdx = batchNum * BATCH_SIZE;
  const endIdx = Math.min(startIdx + BATCH_SIZE, cards.length);

  const batch = cards.slice(startIdx, endIdx);

  console.log(`📦 Batch ${batchNum + 1}`);
  console.log(`   Range: ${startIdx + 1} - ${endIdx} of ${cards.length}`);
  console.log(`   Cards in batch: ${batch.length}`);
  console.log('');

  // Output batch data as JSON for Claude to process
  console.log(JSON.stringify(batch, null, 2));

  // Calculate remaining batches
  const totalBatches = Math.ceil(cards.length / BATCH_SIZE);
  const remainingBatches = totalBatches - (batchNum + 1);

  console.error(`\n📊 Progress: Batch ${batchNum + 1}/${totalBatches}`);
  console.error(`   Remaining batches: ${remainingBatches}`);
  console.error(`   Remaining cards: ${cards.length - endIdx}`);
}

main();
