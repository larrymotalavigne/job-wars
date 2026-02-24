#!/usr/bin/env python3
"""
Automated Card Image Generation Script
This script processes cards in batches and outputs JSON for Claude to process
"""

import json
import sys
from pathlib import Path

MISSING_CARDS_FILE = Path('/Users/larry/Documents/projects/atom/job-wars/missing-cards.json')
OUTPUT_DIR = Path('/Users/larry/Documents/projects/atom/job-wars/src/assets/images/cards')

def get_missing_cards():
    """Load and return cards that still need images"""
    cards = json.loads(MISSING_CARDS_FILE.read_text())
    missing = []

    for card in cards:
        image_path = OUTPUT_DIR / f"{card['id']}.png"
        if not image_path.exists():
            missing.append(card)

    return missing

def get_batch(batch_num, batch_size=10):
    """Get a specific batch of cards"""
    missing = get_missing_cards()
    start = batch_num * batch_size
    end = min(start + batch_size, len(missing))

    return missing[start:end], len(missing), start, end

def print_batch_info(batch_num, batch_size=10):
    """Print information about a batch"""
    batch, total_missing, start, end = get_batch(batch_num, batch_size)

    print(f"📦 Batch {batch_num}")
    print(f"   Cards {start + 1}-{end} of {total_missing} remaining")
    print(f"   Batch size: {len(batch)}")
    print()

    # Group by domain for better organization
    by_domain = {}
    for card in batch:
        domain = card['domain']
        if domain not in by_domain:
            by_domain[domain] = []
        by_domain[domain].append(card)

    for domain, cards in sorted(by_domain.items()):
        print(f"   {domain.upper()}: {len(cards)} cards")

    print()
    return batch

def print_card_list(batch):
    """Print the cards in the batch"""
    for i, card in enumerate(batch, 1):
        print(f"{i:3d}. {card['id']:10s} | {card['name'][:40]:40s} | {card['domain']}")

def export_batch_json(batch, filename='current_batch.json'):
    """Export batch to JSON file"""
    output_file = Path(f'/Users/larry/Documents/projects/atom/job-wars/{filename}')
    output_file.write_text(json.dumps(batch, indent=2, ensure_ascii=False))
    print(f"\n💾 Batch exported to: {output_file}")
    return output_file

def main():
    batch_num = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    batch_size = int(sys.argv[2]) if len(sys.argv) > 2 else 10

    print("🎨 Job Wars - Automated Card Image Generator")
    print("=" * 60)
    print()

    batch = print_batch_info(batch_num, batch_size)

    if not batch:
        print("✅ All cards have been generated!")
        return

    print("\nCards in this batch:")
    print("-" * 60)
    print_card_list(batch)
    print("-" * 60)

    export_batch_json(batch)

    # Calculate progress
    missing = get_missing_cards()
    total_cards = 1908  # Known total from earlier
    generated = total_cards - len(missing)
    percent = (generated / total_cards) * 100

    print(f"\n📊 Overall Progress:")
    print(f"   Generated: {generated}/{total_cards} ({percent:.1f}%)")
    print(f"   Remaining: {len(missing)}")
    print(f"   Estimated batches remaining: {(len(missing) + batch_size - 1) // batch_size}")

if __name__ == '__main__':
    main()
