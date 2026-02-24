#!/usr/bin/env python3
import json
import requests
import time
from pathlib import Path
from PIL import Image
from io import BytesIO

MISSING_CARDS = Path('/Users/larry/Documents/projects/atom/job-wars/missing-cards.json')
OUTPUT_DIR = Path('/Users/larry/Documents/projects/atom/job-wars/src/assets/images/cards')
TOKEN = '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'

def generate(prompt):
    url = "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5"
    headers = {"Authorization": f"Bearer {TOKEN}"}
    response = requests.post(url, headers=headers, json={"inputs": prompt}, timeout=120)
    if response.status_code == 200:
        return Image.open(BytesIO(response.content))
    print(f"Error {response.status_code}: {response.text[:200]}")
    return None

cards = json.loads(MISSING_CARDS.read_text())[:20]  # First 20 cards
print(f"Generating {len(cards)} cards...")

for i, card in enumerate(cards, 1):
    output = OUTPUT_DIR / f"{card['id']}.png"
    if output.exists():
        print(f"[{i}] {card['id']} - exists")
        continue

    print(f"[{i}] {card['id']} - {card['name']}")
    prompt = f"{card['prompt']} NO TEXT NO LABELS"

    img = generate(prompt)
    if img:
        img.save(output)
        print(f"  ✓ Saved")
    else:
        print(f"  ✗ Failed")

    time.sleep(3)

print("Done!")
