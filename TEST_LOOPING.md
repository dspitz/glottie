# Testing the Looping Feature

## Setup
1. Open http://localhost:3000/levels/1 in your browser
2. Open the browser console (F12 or Cmd+Option+I)

## Test Steps

### Test 1: Basic Looping Setup
1. Click on "Burbujas de Amor" or any song with synchronized lyrics
2. Click on any lyric line to open the TranslationBottomSheet
3. Look for these debug logs in the console:
   - `🔄 Loop useEffect triggered:` - Should show when the modal opens
   - Check that `isPlaying: false` initially
   - Check that `hasAudioControls: true` (if false, that's the problem)

### Test 2: Play Line Button
1. Click the new "Play Line" button (between the < and play/pause buttons)
2. Look for these logs:
   - `🎵 Play Line button clicked`
   - `🎯 Playing line from: [number] ms`
3. The song should start playing from the beginning of that line

### Test 3: Loop Controls
1. While the song is playing, click the Loop button (🔁)
2. It should cycle through:
   - Gray (off) -> Orange (once) -> Green (infinite) -> Gray (off)
3. When loop mode is active AND the song is playing, you should see:
   - `🔄 Loop monitoring started:`
   - `🔍 Loop monitor check:` (every 500ms)

### Test 4: Loop Functionality
1. Set loop to "once" (orange)
2. Play the line
3. When the line ends, you should see:
   - `🎯 Line end reached!`
   - `🔁 Looping once - seeking back to start`
4. After the second play:
   - `✅ Loop once complete - stopping loop`

### Test 5: Infinite Loop
1. Set loop to "infinite" (green)
2. Play the line
3. Should continuously loop with:
   - `♾️ Infinite loop - seeking back to start`

## Expected Console Output When Working

```
🔄 Loop useEffect triggered: {isPlaying: true, loopMode: "once", hasAudioControls: true}
🔄 Loop monitoring started: {loopMode: "once", startTimeMs: 5200, endTimeMs: 8700}
🔍 Loop monitor check: {currentTimeMs: 5500, timeUntilEnd: 3200}
🔍 Loop monitor check: {currentTimeMs: 6000, timeUntilEnd: 2700}
...
🎯 Line end reached! {currentTimeMs: 8750, loopMode: "once"}
🔁 Looping once - seeking back to start
```

## Troubleshooting

If you see:
- `⚠️ No audioControls available in loop monitor` - The audio player isn't initialized
- No `🔄 Loop monitoring started` - Check that isPlaying is true
- No `🎯 Line end reached` - The timing detection isn't working

Report back with what console logs you see!