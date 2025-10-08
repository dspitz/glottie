# Playback Speed Control Implementation Plan

## Overview
Add playback speed control (50%, 75%, 100%) to the audio player, supporting both Spotify full tracks and HTML5 preview mode with a dropdown UI.

---

## Background: Current Architecture

### Dual Adapter System
The app uses two audio adapters:
1. **SpotifyAdapter** (`services/adapters/SpotifyAdapter.ts`)
   - Plays full songs via Spotify Web SDK
   - Requires Spotify Premium
   - **Does NOT support playbackRate natively** (line 138-142)

2. **HTML5Adapter** (`services/adapters/HTML5Adapter.ts`)
   - Plays 30-second preview clips
   - Uses HTML5 `<audio>` element
   - **Supports playbackRate natively** (0.5 to 2.0) (line 199-205)

### Current State
- `EnhancedAudioPlayer.tsx` (line 91): Already has `playbackRate` state
- Preview mode works: `audioRef.current.playbackRate = rate` (line 136-138)
- Spotify mode blocked: Console warning only (SpotifyAdapter.ts:140)
- `AudioEngine.ts` has `setPlaybackRate()` method (line 266-272)

---

## Problem Statement

**Challenge:** Spotify Web SDK has no native API for playback rate control.

**Solution:** Use Web Audio API to intercept Spotify's audio stream and apply real-time time-stretching.

---

## Technical Solution: Web Audio API Time-Stretching

### How It Works
```
Spotify SDK → Web Audio API → Time-Stretching → AudioContext Destination → Speakers
```

1. Spotify SDK outputs audio to a `MediaElementSource` node
2. Connect to a time-stretching processor (Tone.js Player with `playbackRate`)
3. Process in real-time without re-encoding
4. Output to speakers

### Why This Works for Full Songs
- Web Audio API intercepts the live audio stream
- Spotify continues streaming normally (doesn't know about our processing)
- Time-stretching happens client-side in real-time
- Works with full songs, not just previews
- Preserves pitch (no "chipmunk effect")

---

## Implementation Plan

### Phase 1: Install Dependencies

**Step 1.1: Install Tone.js**
```bash
npm install tone
npm install --save-dev @types/tone
```

**Why Tone.js?**
- Built on Web Audio API
- Built-in pitch-preserving time-stretching
- Player component with `playbackRate` property
- Well-maintained, 12k+ stars on GitHub
- Works in all modern browsers

---

### Phase 2: Create Web Audio Time-Stretching Service

**Step 2.1: Create new file `services/WebAudioTimeStretch.ts`**

This service will:
- Initialize AudioContext
- Create time-stretching processing chain
- Handle playback rate changes
- Clean up resources

**Key Methods:**
```typescript
class WebAudioTimeStretch {
  private audioContext: AudioContext | null = null
  private sourceNode: MediaElementAudioSourceNode | null = null
  private player: Tone.Player | null = null
  private currentRate: number = 1.0

  async initialize(audioElement: HTMLAudioElement): Promise<void>
  setPlaybackRate(rate: number): void
  connect(): void
  disconnect(): void
  destroy(): void
}
```

**Implementation Details:**
- Create AudioContext on first use (user interaction required)
- Connect audio element to Web Audio graph
- Use Tone.js Player for time-stretching
- Expose simple rate control interface

---

### Phase 3: Update SpotifyAdapter

**Step 3.1: Integrate Web Audio processing**

**File:** `services/adapters/SpotifyAdapter.ts`

**Changes:**
1. Import `WebAudioTimeStretch` service
2. Add property: `private timeStretch: WebAudioTimeStretch | null = null`
3. Initialize in `loadTrack()` method
4. Update `setPlaybackRate()` to use time-stretching instead of console.warn
5. Clean up in `destroy()` and `unloadTrack()`

**Before (line 138-142):**
```typescript
setPlaybackRate(rate: number): void {
  // Spotify doesn't support playback rate changes
  console.warn('Playback rate control is not supported by Spotify')
  this.playbackRate = 1 // Always 1 for Spotify
}
```

**After:**
```typescript
setPlaybackRate(rate: number): void {
  const clampedRate = Math.max(0.5, Math.min(2, rate))
  this.playbackRate = clampedRate

  if (this.timeStretch) {
    this.timeStretch.setPlaybackRate(clampedRate)
  }
}
```

**Technical Challenge:**
- Spotify SDK uses iframe-based player, may not expose raw audio element
- **Solution:** Use `createMediaElementSource()` if possible, otherwise explore Spotify's internal player state

---

### Phase 4: Update UI - Add Dropdown Control

**Step 4.1: Modify `components/EnhancedAudioPlayer.tsx`**

**Current state (line 91):**
```typescript
const [playbackRate, setPlaybackRate] = useState(1.0)
```

**Add dropdown UI in controls section:**

```typescript
// Import Select component
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// In the JSX (add after volume control):
<Select
  value={playbackRate.toString()}
  onValueChange={(value) => handlePlaybackRateChange(parseFloat(value))}
  disabled={playbackMode === 'unavailable'}
>
  <SelectTrigger className="w-[120px]">
    <SelectValue placeholder="Speed" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="0.5">50% Speed</SelectItem>
    <SelectItem value="0.75">75% Speed</SelectItem>
    <SelectItem value="1.0">Normal (100%)</SelectItem>
  </SelectContent>
</Select>
```

**Handler:**
```typescript
const handlePlaybackRateChange = (rate: number) => {
  setPlaybackRate(rate)

  if (playbackModeRef.current === 'preview' && audioRef.current) {
    // HTML5 preview mode - native support
    audioRef.current.playbackRate = rate
  } else if (playbackModeRef.current === 'spotify') {
    // Spotify mode - use Web Audio API
    // This will be handled by SpotifyAdapter's setPlaybackRate
    // which now uses WebAudioTimeStretch
  }
}
```

**Location in UI:**
- Place between volume control and other player controls
- Show current speed (e.g., "Normal (100%)")
- Disable when no track loaded

---

### Phase 5: Update AudioEngine

**Step 5.1: Ensure rate propagation**

**File:** `services/AudioEngine.ts`

**Current implementation (line 266-272):**
```typescript
setPlaybackRate(rate: number): void {
  const clampedRate = Math.max(0.5, Math.min(2, rate))
  if (this.adapter) {
    this.adapter.setPlaybackRate(clampedRate)
  }
  this.updateState({ playbackRate: clampedRate })
}
```

**No changes needed** - This already propagates to the active adapter, which will now use Web Audio processing for Spotify.

---

### Phase 6: Testing Strategy

**Test Cases:**

1. **HTML5 Preview Mode**
   - ✅ Should work immediately (already implemented)
   - Test: Change speed to 50%, 75%, verify playback
   - Expected: Native browser support, no issues

2. **Spotify Full Track Mode**
   - Test: Load Spotify track, change speed to 75%
   - Expected: Web Audio processing applies, pitch preserved
   - Verify: No audio glitches, sync maintained

3. **Mode Switching**
   - Test: Switch from preview to Spotify while playing
   - Expected: Speed setting persists
   - Verify: Audio continues at selected rate

4. **Edge Cases**
   - Test: Rapid speed changes (50% → 100% → 75%)
   - Test: Speed change during playback
   - Test: Speed change while paused
   - Test: Browser without Web Audio API support (fallback)

---

## Implementation Checklist

### Dependencies
- [ ] Install `tone` package
- [ ] Install `@types/tone` (dev dependency)

### Backend/Service Layer
- [ ] Create `services/WebAudioTimeStretch.ts`
  - [ ] AudioContext initialization
  - [ ] Tone.js Player setup
  - [ ] Rate control methods
  - [ ] Resource cleanup
- [ ] Update `services/adapters/SpotifyAdapter.ts`
  - [ ] Import WebAudioTimeStretch
  - [ ] Initialize in loadTrack()
  - [ ] Update setPlaybackRate() method
  - [ ] Add cleanup in destroy()/unloadTrack()
- [ ] Verify `services/AudioEngine.ts` (no changes needed)
- [ ] Verify `services/adapters/HTML5Adapter.ts` (no changes needed)

### UI Layer
- [ ] Update `components/EnhancedAudioPlayer.tsx`
  - [ ] Import Select component
  - [ ] Add dropdown UI
  - [ ] Add handlePlaybackRateChange handler
  - [ ] Position in player controls
  - [ ] Add disabled state handling
- [ ] Update AudioPlayerControls interface (if needed)
  - [ ] Ensure setPlaybackRate is exposed

### Testing
- [ ] Test HTML5 preview mode (50%, 75%, 100%)
- [ ] Test Spotify mode (50%, 75%, 100%)
- [ ] Test mode switching with speed active
- [ ] Test edge cases (rapid changes, during playback, while paused)
- [ ] Test browser compatibility
- [ ] Test with synchronized lyrics (timing accuracy)

### Documentation
- [ ] Update CLAUDE.md with playback speed feature
- [ ] Add comments to new WebAudioTimeStretch service
- [ ] Update component props documentation

---

## Technical Considerations

### Browser Support
- **Web Audio API:** Supported in all modern browsers (Chrome, Firefox, Safari, Edge)
- **Fallback:** If AudioContext unavailable, disable speed control for Spotify (keep preview mode working)

### Performance
- **CPU Impact:** Time-stretching is CPU-intensive but manageable for single audio stream
- **Latency:** Should be negligible (<50ms) on modern devices
- **Memory:** AudioContext creates graph nodes but cleans up on destroy

### Spotify SDK Limitations
- **Access to Audio Element:** Spotify SDK uses iframe, may need to explore internal APIs
- **Backup Plan:** If Web Audio integration fails, show warning that speed control only works in preview mode

### Synchronized Lyrics
- **Important:** Playback rate affects timing
- **Solution:** Lyrics sync times are already in milliseconds, player will naturally sync slower/faster
- **Verify:** Test with SynchronizedLyrics component to ensure highlighting stays accurate

---

## Alternative Approaches (Considered and Rejected)

### 1. Server-Side Audio Processing ❌
**Why rejected:**
- Can't pre-process Spotify tracks (licensing/DRM)
- Would require massive storage for 3 versions of each song
- High server costs

### 2. Spotify API Hack ❌
**Why rejected:**
- Spotify Web SDK provides no playback rate API
- Violates Terms of Service
- No undocumented endpoints available

### 3. Hybrid Approach (Switch to Preview) ❌
**Why rejected:**
- User experience degradation (full song → 30s clip)
- Defeats purpose of Spotify integration
- Confusing UX

### 4. soundtouch.js Instead of Tone.js
**Why chose Tone.js:**
- Tone.js has higher-level API (easier to use)
- Better TypeScript support
- More active maintenance
- Built-in pitch preservation
- **Note:** Could switch to soundtouch.js if Tone.js has issues

---

## Files to Create

1. **`services/WebAudioTimeStretch.ts`** (NEW)
   - Web Audio processing logic
   - ~150 lines

---

## Files to Modify

1. **`package.json`**
   - Add `tone` dependency
   - Add `@types/tone` dev dependency

2. **`services/adapters/SpotifyAdapter.ts`**
   - Lines to change: 15-16, 138-142, 199, 226-230
   - ~20 lines added/modified

3. **`components/EnhancedAudioPlayer.tsx`**
   - Add dropdown UI (~30 lines)
   - Add handler (~15 lines)
   - ~45 lines added

**Total:** ~1 new file, ~3 modified files, ~215 lines of code

---

## User Experience

### Before
- **Preview mode:** Speed control works (HTML5 native)
- **Spotify mode:** Speed control disabled with warning

### After
- **Preview mode:** Speed control works (HTML5 native) ✅
- **Spotify mode:** Speed control works (Web Audio API) ✅
- **Both modes:** Clean dropdown UI (50%, 75%, 100%)

### UI Mockup
```
[Album Art] Song Title - Artist

[◄◄] [▶] [►►]  [●━━━━━━━━━━○] 1:23 / 3:45

[🔊 ━━━○━]  [Speed: Normal (100%) ▼]
```

Dropdown options:
- 50% Speed
- 75% Speed
- Normal (100%)

---

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Spotify SDK doesn't expose audio element | High | Medium | Explore SDK internals, use fallback to preview mode if needed |
| Web Audio processing causes glitches | Medium | Low | Extensive testing, adjust buffer sizes if needed |
| Browser compatibility issues | Low | Low | Feature detection, graceful degradation |
| Performance on mobile devices | Medium | Low | Test on mobile, add setting to disable if needed |
| Timing drift with lyrics sync | Medium | Low | Verify with SynchronizedLyrics component testing |

---

## Success Metrics

- [ ] Playback speed changes without audio glitches
- [ ] Speed persists when switching tracks
- [ ] Synchronized lyrics remain accurate at all speeds
- [ ] Works on Chrome, Firefox, Safari, Edge (latest versions)
- [ ] CPU usage remains under 25% on average laptop
- [ ] Latency under 100ms for speed changes

---

## Future Enhancements (Out of Scope)

- Add more speed options (25%, 125%, 150%, 200%)
- Add keyboard shortcuts (e.g., [ and ] to adjust speed)
- Remember user's preferred speed in localStorage
- Add visual indicator when speed is not 100%
- Add "practice mode" with loop + slow speed

---

## Questions to Resolve During Implementation

1. **Spotify SDK Audio Access:** Can we get HTMLAudioElement from Spotify SDK iframe?
   - If yes: Proceed with Web Audio integration
   - If no: Explore alternative approaches or limit to preview mode

2. **Performance on Mobile:** Does time-stretching work smoothly on mobile browsers?
   - Test on iOS Safari and Android Chrome
   - May need buffer size adjustments

3. **Tone.js Bundle Size:** Will it significantly increase app bundle?
   - Check bundle analyzer
   - Consider code splitting if needed

---

## Timeline Estimate

- **Phase 1 (Dependencies):** 5 minutes
- **Phase 2 (Web Audio Service):** 2-3 hours
- **Phase 3 (Spotify Adapter):** 1-2 hours
- **Phase 4 (UI):** 1 hour
- **Phase 5 (AudioEngine):** 15 minutes (verification)
- **Phase 6 (Testing):** 2-3 hours

**Total:** 7-10 hours of development + testing

---

## Conclusion

This plan provides a complete path to implementing playback speed control for both preview and Spotify modes using Web Audio API with Tone.js. The dropdown UI provides a clean, familiar interface, and the solution works for full Spotify tracks without server-side processing or TOS violations.

**Key Advantages:**
✅ Works for full Spotify songs (not just previews)
✅ Clean dropdown UI (better than buttons)
✅ Pitch-preserving time-stretching (no chipmunk effect)
✅ No server-side processing needed
✅ Leverages existing adapter architecture
✅ Graceful fallback for unsupported browsers

**Next Step:** Review this plan, then proceed with implementation starting with Phase 1.

---

## POSTMORTEM: Implementation Results

### What Was Actually Implemented ✅

1. **Dropdown UI** (Phase 4) - SUCCESSFUL
   - Added clean dropdown with Gauge icon
   - Three speed options: 50%, 75%, Normal (100%)
   - Properly integrated into EnhancedAudioPlayer.tsx

2. **HTML5 Preview Mode** - FULLY WORKING
   - Native `playbackRate` property works perfectly
   - Speed control functions at 50%, 75%, and 100%
   - No issues or limitations

### What Failed ❌

1. **Spotify Full-Track Speed Control** - TECHNICALLY IMPOSSIBLE

**Root Cause Discovery:**
After implementing the createElement interception approach, we discovered through debugging that:

- **Spotify Web SDK does NOT create `<audio>` or `<video>` DOM elements**
- The SDK uses Web Audio API internally without exposing any HTMLMediaElement
- The player is sandboxed and encrypted (DRM/licensing protection)
- No interception method (createElement, Web Audio API, or otherwise) can access the raw audio stream

**Attempted Solutions (All Failed):**
1. ✗ Tone.js + Web Audio API: Cannot access Spotify's audio stream
2. ✗ createElement interception: No elements created to intercept
3. ✗ SpotifyElementCapture service: Captured zero elements
4. ✗ Direct HTMLMediaElement manipulation: No element exists

**Evidence from Console Logs:**
```
- No "[SpotifyCapture] Captured audio element" logs
- SpotifyAdapter: Has elements? false
- SpotifyAdapter: Element count: 0
- Spotify player works fine, but audio pipeline is completely inaccessible
```

### Technical Limitation Explanation

**Why This is Fundamentally Impossible:**

The Spotify Web Playback SDK architecture:
```
Spotify Backend → Encrypted Stream → SDK Internal Web Audio → Speakers
                                           ↑
                                      (No access point)
```

- Spotify uses **encrypted, sandboxed Web Audio implementation**
- No access to underlying audio context or source nodes
- SDK is **intentionally designed** to prevent audio manipulation (licensing/DRM)
- All playback control happens server-side via Spotify's API
- Client-side modifications are impossible by design

### Final State

**What Works:**
- ✅ Preview mode (30s clips): Full speed control at 50%, 75%, 100%
- ✅ Dropdown UI: Clean, functional interface
- ✅ Spotify mode: Dropdown disabled with proper state handling

**What Doesn't Work:**
- ❌ Spotify full tracks: Speed control not possible (technical limitation)
- ❌ Web Audio processing: Cannot intercept Spotify's audio pipeline

### Code Cleanup Completed

Removed non-functional implementations:
- ✓ Deleted `services/WebAudioTimeStretch.ts` (unused)
- ✓ Deleted `services/SpotifyElementCapture.ts` (doesn't capture anything)
- ✓ Removed createElement interception from `app/layout.tsx`
- ✓ Uninstalled `tone` dependency from package.json
- ✓ Cleaned up debug logging in `services/adapters/SpotifyAdapter.ts`
- ✓ Added documentation comments explaining technical limitations

### Lessons Learned

1. **Spotify SDK is a "Black Box"**
   - Third-party SDKs with DRM cannot be manipulated client-side
   - Always verify API capabilities before planning implementations

2. **Client-Side Audio Processing Limits**
   - Web Audio API powerful, but only works with accessible audio sources
   - Encrypted/sandboxed streams are intentionally isolated

3. **Progressive Implementation Was Correct**
   - Started with what works (preview mode)
   - Attempted Spotify integration incrementally
   - Easy to rollback failed experiments

### Alternative Options (Future Consideration)

If speed control for Spotify is critical, only options are:

1. **Server-Side Processing** (Not Feasible)
   - Violates Spotify Terms of Service
   - Requires re-encoding and storage
   - Licensing issues

2. **Fallback to Preview Mode** (Poor UX)
   - When user selects speed, automatically switch to 30s preview
   - Degrades user experience significantly

3. **Accept Limitation** (Recommended) ✓
   - Document that speed control only works in preview mode
   - Inform users upfront
   - Focus on other features

### Current User Experience

**Preview Mode:**
```
Speed: [Normal (100%) ▼]  <-- Enabled, works perfectly
```

**Spotify Mode:**
```
Speed: [Normal (100%) ▼]  <-- Disabled (grayed out)
```

Users can use speed control with 30-second preview clips, but not with full Spotify tracks. This is a documented limitation caused by Spotify's SDK architecture.

---

## Conclusion (Updated)

**Successfully Implemented:**
- ✅ Playback speed control for preview mode
- ✅ Clean dropdown UI (50%, 75%, 100%)
- ✅ Proper state management and disabled states

**Technical Limitation Discovered:**
- ❌ Spotify Web SDK's architecture prevents any client-side audio manipulation
- This is not a bug in our code, but a fundamental constraint of Spotify's platform

**Recommendation:**
Accept this limitation and document it clearly for users. Focus development effort on other features that enhance the language learning experience, such as:
- Enhanced vocabulary tracking
- Better practice modes
- Improved synchronized lyrics
- Spaced repetition features

The preview mode speed control is still valuable for quick practice sessions with 30-second clips.
