#!/usr/bin/env python3
"""Generate cards using official HuggingFace Hub client"""
import json
from pathlib import Path
from huggingface_hub import InferenceClient
import time

# Configuration
MISSING_CARDS = Path('/Users/larry/Documents/projects/atom/job-wars/missing-cards.json')
OUTPUT_DIR = Path('/Users/larry/Documents/projects/atom/job-wars/src/assets/images/cards')
PROGRESS_FILE = Path('/Users/larry/Documents/projects/atom/job-wars/hub-progress.json')
TOKEN = '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'

# Initialize client
client = InferenceClient(token=TOKEN)

# Load progress
if PROGRESS_FILE.exists():
    progress = json.loads(PROGRESS_FILE.read_text())
else:
    progress = {'index': 0, 'completed': []}

# Load cards
cards = json.loads(MISSING_CARDS.read_text())

print(f"🎨 Job Wars - HuggingFace Hub Generator")
print(f"Starting from card {progress['index']}/{len(cards)}\n")

# Process all remaining cards
end_index = len(cards)

for i in range(progress['index'], end_index):
    card = cards[i]
    card_id = card['id']
    output_path = OUTPUT_DIR / f"{card_id}.png"

    # Skip if exists
    if output_path.exists():
        print(f"[{i+1}/{len(cards)}] {card_id} - exists, skipping")
        progress['index'] = i + 1
        continue

    prompt = f"{card['prompt']} NO TEXT, NO LABELS, NO WORDS, character illustration only"
    print(f"[{i+1}/{len(cards)}] {card_id} - {card['name']}")

    try:
        # Generate image with SDXL
        image = client.text_to_image(
            prompt=prompt,
            model="stabilityai/stable-diffusion-xl-base-1.0"
        )

        # Save
        image.save(output_path)
        print(f"  ✓ Saved")

        progress['completed'].append(card_id)

    except Exception as e:
        print(f"  ✗ Error: {str(e)[:100]}")

    # Update progress
    progress['index'] = i + 1
    PROGRESS_FILE.write_text(json.dumps(progress, indent=2))

    # Rate limiting
    time.sleep(1)

print(f"\n✅ Batch complete! Processed {progress['index']}/{len(cards)} cards")
print(f"Generated: {len(progress['completed'])} cards")
