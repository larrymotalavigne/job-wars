# HuggingFace API Image Generation Guide

## Using Your $4.78 Credits

The HuggingFace **Inference API** can use your paid credits and bypasses ZeroGPU quotas. This is the best way to generate all remaining cards.

## Setup Instructions

### Step 1: Get HuggingFace API Token

1. Go to https://huggingface.co/settings/tokens
2. Create a new token with **read** permissions
3. Copy the token (starts with `hf_...`)

### Step 2: Set Environment Variable

```bash
export HF_TOKEN='hf_your_token_here'
```

Or add to your `~/.zshrc` or `~/.bashrc`:
```bash
echo 'export HF_TOKEN="hf_your_token_here"' >> ~/.zshrc
source ~/.zshrc
```

### Step 3: Install Dependencies

```bash
pip3 install requests pillow
```

### Step 4: Run Generation Script

```bash
cd /Users/larry/Documents/projects/atom/job-wars
python3 generate_with_hf_api.py
```

## What the Script Does

1. ✅ Loads all missing cards from `missing-cards.json`
2. ✅ Skips already generated images
3. ✅ Uses HuggingFace Inference API (paid credits, no quota)
4. ✅ Generates 832x1248 PNG images
5. ✅ Saves to correct directory
6. ✅ Tracks progress (can resume if interrupted)
7. ✅ Reports every 50 cards

## Cost Estimate

**Inference API Pricing:**
- FLUX.1-schnell: ~$0.003-0.005 per image
- SDXL: ~$0.002-0.004 per image

**For 1,891 cards:**
- Low estimate: $3.78 (under your $4.78 budget!)
- High estimate: $9.46 (may need more credits)

**Note:** The script will stop if credits run out. You can check balance at:
https://huggingface.co/settings/billing

## Progress Tracking

The script creates `generation_progress.json` to track:
- Last processed card index
- Successfully generated cards
- Failed cards

If interrupted, just run the script again - it will resume from where it stopped.

## Alternative: Free ZeroGPU Method

If you want to avoid using credits, wait ~23 hours for quota reset:

```bash
# Wait for quota reset, then generate 14 more cards
python3 auto-generate.py 1 10  # Get next batch
```

Then manually call the MCP tool for each card.

## Model Options

The script defaults to `FLUX.1-schnell` (fast, good quality). You can change the model in the script:

```python
MODEL_ID = MODELS['flux-schnell']  # Current (recommended)
MODEL_ID = MODELS['sdxl']          # Alternative
MODEL_ID = MODELS['playground']    # Creative style
```

## Troubleshooting

### "Please set HF_TOKEN environment variable"
- You forgot to export your HuggingFace token
- Run: `export HF_TOKEN='hf_your_token_here'`

### "Model is loading"
- The model is being initialized (takes 20-60 seconds)
- Script will wait and retry automatically

### "Rate limited"
- Too many requests too fast
- Script will wait 30s and retry

### "Insufficient credits"
- You've used all $4.78 credits
- Add more at: https://huggingface.co/settings/billing
- Or wait for ZeroGPU quota reset (free but slow)

## Estimated Timeline

**With Inference API (paid):**
- ~1-2 seconds per image
- ~1,891 cards = 60-95 minutes total
- **Can complete today!**

**With ZeroGPU (free):**
- ~14 cards per day
- ~135 days total
- Daily manual intervention needed

## Current Status

- **Total cards:** 1,908
- **Generated:** 17 (0.9%)
- **Remaining:** 1,891
- **Credits available:** $4.78
- **Estimated cost:** $3.78-9.46

## Recommendation

**Run the Inference API script** - it should complete all cards within your budget, and finish in ~1-2 hours instead of 4.5 months!

```bash
export HF_TOKEN='your_token'
pip3 install requests pillow
python3 generate_with_hf_api.py
```
