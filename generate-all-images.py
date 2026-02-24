#!/usr/bin/env python3
"""
Card Image Generator for Job Wars
Extracts all card data and outputs batch generation commands
"""

import re
import os
import json
from pathlib import Path

CARD_DATA_DIR = Path('/Users/larry/Documents/projects/atom/job-wars/src/app/data')
OUTPUT_DIR = Path('/Users/larry/Documents/projects/atom/job-wars/src/assets/images/cards')

DOMAIN_THEMES = {
    'agriculture': 'farming, rural, nature, crops, barn, countryside',
    'arts': 'creative, artistic, cultural, performance, painter, musician',
    'commerce': 'retail, shop, merchant, sales, market, customer',
    'crafts': 'artisan, handmade, workshop, craftsman, skilled worker',
    'energy': 'power plant, electricity, solar, wind, engineer',
    'environment': 'nature, ecology, forest, conservation, wildlife',
    'events': 'magical effect, special event, abstract',
    'finance': 'banking, office, professional suit, money, calculator',
    'firefighter': 'fire truck, hose, helmet, emergency, brave hero',
    'health': 'medical, doctor, nurse, hospital, white coat',
    'it': 'computer, programmer, tech, digital, office',
    'justice': 'legal, judge, lawyer, courthouse, gavel',
    'media': 'journalist, camera, microphone, news, reporter',
    'military': 'soldier, uniform, strategic, defense, tactical',
    'police': 'officer, patrol car, badge, uniform, law enforcement',
    'science': 'laboratory, scientist, research, microscope, experiment',
    'sports': 'athlete, sportswear, competition, stadium, champion',
    'teacher': 'classroom, school, blackboard, professor, books',
    'tourism': 'travel, guide, hotel, landmark, suitcase',
    'transportation': 'vehicle, driver, logistics, train, truck',
    'urban-planning': 'city, architect, blueprint, construction, buildings'
}

def extract_cards_from_file(file_path):
    """Extract card ID and name from TypeScript file"""
    content = file_path.read_text()
    cards = []

    # Match id and name pairs
    pattern = r"{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',"
    matches = re.findall(pattern, content)

    for card_id, name in matches:
        cards.append({'id': card_id, 'name': name})

    return cards

def generate_prompt(card_name, domain):
    """Generate pixel art prompt"""
    theme = DOMAIN_THEMES.get(domain, 'professional worker')

    # Clean special characters
    clean_name = (card_name
        .replace('é', 'e').replace('è', 'e').replace('ê', 'e')
        .replace('à', 'a').replace('â', 'a')
        .replace('ô', 'o').replace('ö', 'o')
        .replace('î', 'i').replace('ï', 'i')
        .replace('ù', 'u').replace('û', 'u')
        .replace('ç', 'c')
    )

    return f"pixel art 8-bit retro game character, {clean_name}, {theme}, portrait view, detailed sprite, card game illustration, vibrant colors, centered character, simple background, NO TEXT, NO LABELS, NO WORDS, character only"

def main():
    print("🎨 Job Wars Card Image Generator - Data Extraction")
    print("=" * 60)

    all_cards = []

    # Process each domain
    for card_file in sorted(CARD_DATA_DIR.glob('*.cards.ts')):
        domain = card_file.stem.replace('.cards', '')
        print(f"\n📂 Processing: {domain}")

        cards = extract_cards_from_file(card_file)
        print(f"   Found {len(cards)} cards")

        for card in cards:
            card['domain'] = domain
            card['prompt'] = generate_prompt(card['name'], domain)
            card['output_path'] = str(OUTPUT_DIR / f"{card['id']}.png")
            card['exists'] = Path(card['output_path']).exists()
            all_cards.append(card)

    # Statistics
    total = len(all_cards)
    existing = sum(1 for c in all_cards if c['exists'])
    missing = total - existing

    print("\n" + "=" * 60)
    print("📊 Statistics")
    print("=" * 60)
    print(f"Total cards:        {total}")
    print(f"Already generated:  {existing}")
    print(f"Missing:            {missing}")

    # Output missing cards to JSON
    missing_cards = [c for c in all_cards if not c['exists']]
    output_json = Path('/Users/larry/Documents/projects/atom/job-wars/missing-cards.json')
    output_json.write_text(json.dumps(missing_cards, indent=2, ensure_ascii=False))
    print(f"\n💾 Missing cards saved to: {output_json}")

    # Create batch file
    batch_file = Path('/Users/larry/Documents/projects/atom/job-wars/batch-generate.txt')
    with batch_file.open('w') as f:
        for i, card in enumerate(missing_cards, 1):
            f.write(f"# Card {i}/{len(missing_cards)}: {card['id']} - {card['name']}\n")
            f.write(f"ID: {card['id']}\n")
            f.write(f"Name: {card['name']}\n")
            f.write(f"Domain: {card['domain']}\n")
            f.write(f"Prompt: {card['prompt']}\n")
            f.write(f"Output: {card['output_path']}\n")
            f.write("\n")

    print(f"📝 Batch file created: {batch_file}")

    # Show first few missing cards
    print(f"\n🎯 First 10 missing cards:")
    for i, card in enumerate(missing_cards[:10], 1):
        print(f"  {i}. {card['id']} - {card['name']}")

if __name__ == '__main__':
    main()
