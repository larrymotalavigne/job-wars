# Image Generation Solution - HuggingFace Credit Usage

## Problem Identified

**The $4.78 HuggingFace credits cannot be used with the current tools because:**

1. **Z-Image Turbo** uses ZeroGPU (free tier with quota limits)
2. **MCP Spaces** (FLUX, Qwen) may also use ZeroGPU or have different quota systems
3. **Paid HF credits** are for the Inference API, not for Spaces

## Current Status

- **Generated:** 17/1,908 cards (0.9%)
- **Remaining:** 1,891 cards
- **Free ZeroGPU quota:** Exhausted (resets in ~23 hours)
- **HF Credits:** $4.78 available but not usable with current tools

## Recommended Solutions

### Option 1: Use Replicate API (BEST FOR BULK)
**Cost:** ~$4-19 for 1,891 images
**Time:** 1-2 days with automation

```python
# Install: pip install replicate
import replicate

output = replicate.run(
    "black-forest-labs/flux-schnell",  # or pixel art model
    input={
        "prompt": "pixel art 8-bit character...",
        "width": 832,
        "height": 1248
    }
)
```

**Pros:**
- Pay per image (~$0.002-0.01 each)
- No quota limits
- Fast processing
- API is simple to use

**Cons:**
- Requires Replicate account
- Need to add payment method

### Option 2: Local Stable Diffusion (FREE, FASTEST)
**Cost:** Free
**Time:** 1-2 days
**Requirements:** GPU with 6GB+ VRAM

**Setup:**
1. Install Automatic1111 or ComfyUI
2. Download SDXL + pixel art LoRA
3. Batch process with scripts

**Pros:**
- Completely free
- Full control over quality
- No API limits
- Can regenerate easily

**Cons:**
- Requires decent GPU
- Initial setup time (~1 hour)

### Option 3: Wait for ZeroGPU Reset (SLOW BUT FREE)
**Cost:** Free
**Time:** 135 days (~14 images/day)

**Process:**
- Generate 14 images when quota resets (every 24h)
- Use provided auto-generate.py script
- Fully automated with cron job

**Pros:**
- No cost
- Can be automated
- Uses existing infrastructure

**Cons:**
- Very slow (4.5 months)
- Daily quota management

### Option 4: HuggingFace Pro Subscription
**Cost:** $9/month
**Time:** 2-3 days

**May provide:**
- Higher ZeroGPU quotas
- Priority access
- Faster inference

**Note:** Need to verify if Pro subscription increases ZeroGPU limits

## Immediate Action Plan

### Recommended: Try Local Stable Diffusion

**Step 1: Check Hardware**
```bash
# Check if you have NVIDIA GPU
nvidia-smi
```

**Step 2: Install ComfyUI (easier than Auto1111)**
```bash
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI
pip install -r requirements.txt
```

**Step 3: Download Models**
- SDXL base: https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0
- Pixel Art LoRA: https://civitai.com/models/120096/pixel-art-xl

**Step 4: Create Batch Script**
I can provide a Python script that:
- Reads missing-cards.json
- Generates all 1,891 images
- Saves to correct directory
- Reports progress

### Alternative: Use Replicate API

If no suitable GPU, Replicate is the best option:

**Step 1: Sign up at replicate.com**

**Step 2: Get API token**

**Step 3: Run batch script**
```python
import replicate
import json
from pathlib import Path

cards = json.load(open('missing-cards.json'))
output_dir = Path('src/assets/images/cards')

for i, card in enumerate(cards, 1):
    if (output_dir / f"{card['id']}.png").exists():
        continue

    output = replicate.run(
        "black-forest-labs/flux-schnell",
        input={
            "prompt": card['prompt'],
            "width": 832,
            "height": 1248,
            "num_outputs": 1
        }
    )

    # Download and save
    download_and_save(output[0], f"{card['id']}.png")

    if i % 50 == 0:
        print(f"Progress: {i}/1891 ({i/1891*100:.1f}%)")
```

**Estimated cost:** ~$4-19 depending on model

## Files Ready

All infrastructure is in place:
- ✅ missing-cards.json - Full card database
- ✅ auto-generate.py - Batch processor
- ✅ IMAGE_GENERATION_REPORT.md - Status tracking

## Decision Required

**Which approach would you like to use?**

1. **Local SD** (free, fast, requires GPU)
2. **Replicate** (cheap $4-19, reliable)
3. **Wait for ZeroGPU** (free, very slow)
4. **Try HF Pro** ($9/month, uncertain benefit)

I can help set up whichever option you choose.
