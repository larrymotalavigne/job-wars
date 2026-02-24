# Job Wars Card Image Generation Report

**Date:** February 24, 2026
**Status:** IN PROGRESS - GPU QUOTA EXCEEDED

## Summary

Attempted to generate pixel art images for all 2,009 cards across 21 domains using Hugging Face Z-Image Turbo model. Process was halted due to GPU quota limitations.

## Progress

### Total Cards
- **Total cards in project:** 1,908 (based on extraction)
- **Already existing:** 3 cards (he-001, it-001, po-001)
- **Missing at start:** 1,905 cards
- **Generated this session:** 14 cards
- **Current total:** 17 PNG images

### Completion Rate
- **Generated:** 17 / 1,908 = **0.9%**
- **Remaining:** 1,891 cards

## Generated Cards (This Session)

### Agriculture Domain (14 cards)
1. ✅ ag-001.png - Stagiaire Agricole (Agricultural Intern)
2. ✅ ag-002.png - Ouvrier Agricole (Farm Worker)
3. ✅ ag-003.png - Maraîcher (Market Gardener)
4. ✅ ag-004.png - Éleveur Poulets (Chicken Farmer)
5. ✅ ag-005.png - Apiculteur (Beekeeper)
6. ✅ ag-006.png - Tractoriste (Tractor Driver)
7. ✅ ag-007.png - Arboriculteur (Tree Farmer)
8. ✅ ag-008.png - Céréalier (Grain Farmer)
9. ✅ ag-009.png - Berger (Shepherd)
10. ❌ ag-010.png - Horticulteur (FAILED - content filter)
11. ❌ ag-011.png - Vigneron (QUOTA EXCEEDED)
12. ✅ ag-012.png - Éleveur Bovin (Cattle Rancher)
13. ✅ ag-013.png - Pépiniériste (Nursery Worker)
14. ✅ ag-014.png - Ostréiculteur (Oyster Farmer)
15. ✅ ag-015.png - Mytiliculteur (Mussel Farmer)
16. ✅ ag-016.png - Sylviculteur (Forester)

## Technical Details

### Model Used
- **Name:** Z-Image Turbo (Hugging Face MCP)
- **Resolution:** 832x1248 (2:3 portrait ratio)
- **Steps:** 8
- **Shift:** 3
- **Seed:** Random

### Prompt Template
```
pixel art 8-bit retro game character, [card description], [domain theme],
portrait view, detailed sprite, card game illustration, vibrant colors,
centered character, simple background, NO TEXT, NO LABELS, NO WORDS,
character only
```

### Issues Encountered

1. **GPU Quota Exceeded**
   - HuggingFace Z-Image Turbo has a free GPU quota (60 seconds)
   - Quota exhausted after ~14-16 image generations
   - Reset time: ~23 hours 40 minutes
   - **Impact:** Cannot continue bulk generation with this method

2. **Content Filter False Positives**
   - Some prompts triggered "maybe not safe" filter
   - Affected cards: ag-010 (Horticulteur), ag-011 (Vigneron) first attempts
   - Returned generic "maybe not safe" text image instead of pixel art

3. **Rate Limiting**
   - Processing ~10 cards takes several minutes
   - Estimated time for all 1,891 cards: **~315 hours of continuous generation** (impractical)

## Alternative Strategies

### Option 1: Incremental Daily Generation
- Generate ~14 cards per day (within free quota)
- **Timeline:** 135 days (~4.5 months) to complete all cards
- **Pros:** Free, automated
- **Cons:** Very slow, requires daily intervention

### Option 2: Paid Hugging Face Inference API
- Use Hugging Face Pro/Enterprise subscription
- Unlimited GPU quota
- **Cost:** ~$9-69/month depending on usage
- **Timeline:** Could complete in 1-2 days
- **Pros:** Fast, reliable
- **Cons:** Requires payment

### Option 3: Local Stable Diffusion
- Run Stable Diffusion locally with LoRA models
- Use ComfyUI or Automatic1111
- **Requirements:** GPU with 8GB+ VRAM
- **Timeline:** 2-3 days with good GPU
- **Pros:** No quota limits, full control
- **Cons:** Requires powerful hardware, setup time

### Option 4: Alternative Image Generation Services
- **Replicate.com:** Pay-per-use API (~$0.002-0.01 per image)
  - Cost for 1,891 images: ~$4-$19
- **OpenAI DALL-E 3:** $0.04 per image
  - Cost for 1,891 images: ~$76
- **Midjourney:** Subscription required
  - $10/month (200 images), $30/month (unlimited relaxed)

### Option 5: Batch Processing Script
- Create automated script that:
  1. Processes cards in batches of 10-14
  2. Waits for quota reset
  3. Resumes automatically
- **Timeline:** Same as Option 1 but fully automated
- **Pros:** No manual intervention
- **Cons:** Still takes ~4.5 months

## Recommended Approach

Given the constraints, I recommend **Option 3 (Local Stable Diffusion)** if you have suitable hardware, or **Option 4 (Replicate.com)** for cost-effectiveness:

### Replicate.com Approach
1. Use Replicate's SDXL or similar pixel art model
2. Estimated cost: $4-19 for all cards
3. Can complete in 1-2 days with API
4. No hardware requirements

### Implementation Plan
1. ✅ Card data extraction (COMPLETED)
   - Generated `missing-cards.json` with 1,905 cards
   - Created domain-specific prompts

2. 🔄 Image generation (IN PROGRESS - 0.9%)
   - Need to select alternative method
   - Set up API credentials
   - Create bulk generation script

3. ⏳ Post-processing (PENDING)
   - Verify all images generated successfully
   - Check for content filter failures
   - Resize/optimize if needed

4. ⏳ Integration (PENDING)
   - Update card image references
   - Test in application

## Files Created

- `/Users/larry/Documents/projects/atom/job-wars/missing-cards.json` - Full list of cards needing images
- `/Users/larry/Documents/projects/atom/job-wars/batch-generate.txt` - Batch processing guide
- `/Users/larry/Documents/projects/atom/job-wars/generate-all-images.py` - Python extraction script
- `/Users/larry/Documents/projects/atom/job-wars/auto-generate.py` - Automated batch processor
- `/Users/larry/Documents/projects/atom/job-wars/generate-card-images.js` - Node.js helper script
- `/Users/larry/Documents/projects/atom/job-wars/batch-generator.js` - Batch generator

## Next Steps

### Immediate Actions Needed
1. **Decision Required:** Choose image generation method (see options above)
2. **If HuggingFace:** Wait 23:40:37 for quota reset, continue incremental generation
3. **If Replicate/Other API:** Set up API key, create bulk generation script
4. **If Local SD:** Set up Stable Diffusion with pixel art LoRA

### Long-term Considerations
- Consider commissioning artist for unique card art
- Explore AI art generation with consistent style guides
- Create asset pipeline for future card additions

## Domain Breakdown

Cards remaining per domain (approximate):
- Agriculture: 83 remaining
- Arts: 94 remaining
- Commerce: 99 remaining
- Crafts: 95 remaining
- Energy: 98 remaining
- Environment: 93 remaining
- Events: 9 remaining
- Finance: 97 remaining
- Firefighter: 93 remaining
- Health: 93 remaining (3 exist: he-001)
- IT: 99 remaining (1 exists: it-001)
- Justice: 96 remaining
- Media: 96 remaining
- Military: 98 remaining
- Police: 92 remaining (1 exists: po-001)
- Science: 95 remaining
- Sports: 94 remaining
- Teacher: 94 remaining
- Tourism: 80 remaining
- Transportation: 96 remaining
- Urban Planning: 95 remaining

**Total Remaining:** 1,891 cards

---

*Report generated automatically during image generation process*
