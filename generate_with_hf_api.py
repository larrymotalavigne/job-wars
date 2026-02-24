#!/usr/bin/env python3
"""
Generate card images using HuggingFace Inference API with paid credits
This bypasses ZeroGPU quota limitations
"""

import json
import os
import time
from pathlib import Path
import requests
from io import BytesIO
from PIL import Image

# Configuration
MISSING_CARDS_FILE = Path('/Users/larry/Documents/projects/atom/job-wars/missing-cards.json')
OUTPUT_DIR = Path('/Users/larry/Documents/projects/atom/job-wars/src/assets/images/cards')
PROGRESS_FILE = Path('/Users/larry/Documents/projects/atom/job-wars/generation_progress.json')

# HuggingFace Inference API configuration
# Get your token from: https://huggingface.co/settings/tokens
HF_TOKEN = os.environ.get('HF_TOKEN', '')
if not HF_TOKEN:
    print("ERROR: Please set HF_TOKEN environment variable")
    print("export HF_TOKEN='your_token_here'")
    exit(1)

# Model options for Inference API (these use paid credits, not ZeroGPU)
MODELS = {
    'flux-schnell': 'black-forest-labs/FLUX.1-schnell',  # Fast, good quality
    'sdxl': 'stabilityai/stable-diffusion-xl-base-1.0',  # Classic SDXL
    'playground': 'playgroundai/playground-v2.5-1024px-aesthetic',  # Good for creative
}

# Choose model (sdxl is more widely available)
MODEL_ID = MODELS['sdxl']
API_URL = f"https://router.huggingface.co/models/{MODEL_ID}"

def query_api(prompt, width=832, height=1248, retries=3):
    """Query HuggingFace Inference API"""
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}

    payload = {
        "inputs": prompt,
        "parameters": {
            "width": width,
            "height": height,
            "num_inference_steps": 20,
        }
    }

    for attempt in range(retries):
        try:
            response = requests.post(API_URL, headers=headers, json=payload, timeout=60)

            if response.status_code == 200:
                return Image.open(BytesIO(response.content))

            elif response.status_code == 503:
                # Model is loading
                print(f"   Model loading, waiting 20s... (attempt {attempt + 1}/{retries})")
                time.sleep(20)
                continue

            elif response.status_code == 429:
                # Rate limit
                print(f"   Rate limited, waiting 30s...")
                time.sleep(30)
                continue

            else:
                error_msg = response.json() if response.headers.get('content-type') == 'application/json' else response.text
                print(f"   API Error {response.status_code}: {error_msg}")
                return None

        except Exception as e:
            print(f"   Request failed: {e}")
            if attempt < retries - 1:
                time.sleep(10)
                continue
            return None

    return None

def load_progress():
    """Load generation progress"""
    if PROGRESS_FILE.exists():
        return json.loads(PROGRESS_FILE.read_text())
    return {'generated': [], 'failed': [], 'last_index': 0}

def save_progress(progress):
    """Save generation progress"""
    PROGRESS_FILE.write_text(json.dumps(progress, indent=2))

def main():
    print("🎨 Job Wars Card Image Generator - HuggingFace Inference API")
    print("=" * 70)
    print(f"Model: {MODEL_ID}")
    print(f"Output: {OUTPUT_DIR}")
    print()

    # Load cards
    cards = json.loads(MISSING_CARDS_FILE.read_text())
    print(f"Total cards to process: {len(cards)}")

    # Filter out already generated
    missing = []
    for card in cards:
        image_path = OUTPUT_DIR / f"{card['id']}.png"
        if not image_path.exists():
            missing.append(card)

    print(f"Already generated: {len(cards) - len(missing)}")
    print(f"Remaining: {len(missing)}")
    print()

    # Load progress
    progress = load_progress()
    start_index = progress.get('last_index', 0)

    if start_index > 0:
        print(f"Resuming from card {start_index + 1}")
        print()

    # Generate images
    for i, card in enumerate(missing[start_index:], start=start_index):
        card_id = card['id']
        card_name = card['name']
        prompt = card['prompt']

        print(f"[{i + 1}/{len(missing)}] {card_id} - {card_name}")

        # Generate image
        image = query_api(prompt)

        if image:
            # Save as PNG
            output_path = OUTPUT_DIR / f"{card_id}.png"
            image.save(output_path, 'PNG')
            print(f"   ✅ Saved to {output_path.name}")

            progress['generated'].append(card_id)
        else:
            print(f"   ❌ Failed to generate")
            progress['failed'].append(card_id)

        # Update progress
        progress['last_index'] = i + 1
        save_progress(progress)

        # Report progress every 50 cards
        if (i + 1) % 50 == 0:
            generated_count = len(progress['generated'])
            failed_count = len(progress['failed'])
            percent = ((i + 1) / len(missing)) * 100
            print()
            print(f"📊 Progress Report:")
            print(f"   Completed: {i + 1}/{len(missing)} ({percent:.1f}%)")
            print(f"   Successful: {generated_count}")
            print(f"   Failed: {failed_count}")
            print()

        # Small delay to avoid rate limiting
        time.sleep(1)

    # Final report
    print()
    print("=" * 70)
    print("🎉 Generation Complete!")
    print(f"   Successfully generated: {len(progress['generated'])}")
    print(f"   Failed: {len(progress['failed'])}")

    if progress['failed']:
        print(f"\n⚠️  Failed cards:")
        for card_id in progress['failed']:
            print(f"   - {card_id}")

if __name__ == '__main__':
    main()
