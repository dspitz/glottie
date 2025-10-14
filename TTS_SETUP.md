# Text-to-Speech Setup

The vocabulary modal supports high-quality text-to-speech with automatic fallback.

## Current Setup

**Default**: Uses browser's built-in Web Speech API
- ✅ Works immediately, no setup needed
- ✅ Free
- ⚠️ Voice quality varies by browser/OS
- ⚠️ Limited voice options

## Premium Voice Options

### Option 1: Google Cloud Text-to-Speech (Recommended)

**Best quality/price ratio for production**

**Pricing**: ~$4 per 1 million characters (Neural2 voices)
**Quality**: Excellent, very natural sounding
**Languages**: 40+ languages with multiple voices per language

**Setup**:
1. Create a Google Cloud account: https://cloud.google.com/text-to-speech
2. Enable the Text-to-Speech API
3. Create an API key
4. Add to `.env.local`:
   ```bash
   GOOGLE_CLOUD_TTS_API_KEY=your_api_key_here
   ```

**Cost estimate for language learning app**:
- Average sentence: ~50 characters
- 1000 TTS requests = 50,000 characters = $0.20
- 10,000 requests/month = ~$2/month

### Option 2: ElevenLabs (Ultra-realistic)

**Best quality available, most expensive**

**Pricing**: ~$0.30 per 1000 characters
**Quality**: State-of-the-art, indistinguishable from human
**Languages**: 29+ languages with emotional control

**Setup**:
1. Create an ElevenLabs account: https://elevenlabs.io/
2. Subscribe to a plan (Creator: $5/month for 30k characters)
3. Get your API key from dashboard
4. Add to `.env.local`:
   ```bash
   ELEVENLABS_API_KEY=your_api_key_here
   ```

**Cost estimate**:
- Average sentence: ~50 characters
- 1000 TTS requests = 50,000 characters = $15
- Better suited for premium features or paid tiers

## How It Works

The system automatically:
1. Tries Google Cloud TTS first (if API key exists)
2. Falls back to ElevenLabs (if API key exists)
3. Falls back to browser TTS (always works)

No code changes needed - just add API keys to enable premium voices!

## Voice Quality Comparison

| Provider | Quality | Cost per 1k requests | Languages | Best For |
|----------|---------|---------------------|-----------|----------|
| Browser TTS | 6/10 | Free | All | Development/Testing |
| Google Neural2 | 9/10 | $0.20 | 40+ | Production (best value) |
| ElevenLabs | 10/10 | $15 | 29+ | Premium features |

## Testing

To test premium voices:
1. Add API key to `.env.local`
2. Restart dev server: `npm run dev`
3. Open a song, click vocabulary word
4. Click "Listen" button
5. Check browser console for "Using [provider] TTS"

## Recommendation

**For production**: Start with Google Cloud TTS
- Excellent quality at low cost
- Scales easily
- Reliable and fast

**Consider ElevenLabs for**:
- Premium subscription tier
- Marketing/demo videos
- Extra emphasis on voice quality
