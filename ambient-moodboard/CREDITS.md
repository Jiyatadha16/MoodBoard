# Credits and Asset Sourcing

This document provides guidance on sourcing and replacing assets for the Ambient Moodboard project. All assets are designed to be royalty-free and permissively licensed to ensure the project remains dependency-free and deployable as static files.

## Quotes

The quotes in `assets/quotes.json` are sourced from public domain or permissively licensed works. They are short, cozy, and inspirational quotes from various authors.

## Audio Assets

### Recommended Ambient Loop Filenames

Here are 12 suggested royalty-free ambient loop filenames with descriptions. These are placeholders for actual audio files you can source and add to `assets/audio/`.

1. `ambient-loop-1.mp3` - Soft, continuous white noise with subtle high-frequency hiss
2. `rain-gentle-1.mp3` - Light rain on a window, calming and rhythmic
3. `forest-birds-1.mp3` - Distant bird calls in a forest, peaceful and natural
4. `ocean-waves-1.mp3` - Gentle ocean waves lapping on shore
5. `fireplace-crackle-1.mp3` - Cozy fireplace crackling sounds
6. `wind-chimes-1.mp3` - Soft wind chimes in a gentle breeze
7. `cafe-ambience-1.mp3` - Background noise of a quiet coffee shop
8. `mountain-stream-1.mp3` - Flowing mountain stream water
9. `night-crickets-1.mp3` - Evening cricket chorus
10. `tibetan-bowls-1.mp3` - Low, resonant Tibetan singing bowl tones
11. `soft-piano-1.mp3` - Gentle, looping piano melody
12. `binaural-rain-1.mp3` - Binaural rain for immersive listening

### Sourcing Audio

- **Freesound.org**: Search for "royalty free ambient loops". Look for files tagged with Creative Commons Zero (CC0) or Attribution licenses.
- **Zapsplat.com**: Offers royalty-free sound effects, including ambient loops.
- **Epidemic Sound**: Provides high-quality ambient tracks (subscription required, but permissive for personal use).
- **YouTube Audio Library**: Free audio tracks, ensure they are marked as royalty-free.

**License Requirements**: Prefer Creative Commons Zero (CC0) or public domain audio. Avoid copyrighted material. Always check the license terms.

## Image Assets

### Recommended Image Filenames

Here are 20 suggested image filenames with keywords for sourcing high-quality, permissively licensed images. Add these to `assets/images/`.

1. `cozy-window-1.jpg` - Keywords: cozy window, reading nook, warm light
2. `warm-lamp-2.jpg` - Keywords: desk lamp, warm glow, study space
3. `fireplace-3.jpg` - Keywords: fireplace, living room, cozy evening
4. `book-stack-4.jpg` - Keywords: books, reading, literature
5. `tea-cup-5.jpg` - Keywords: tea, mug, steam, comfort
6. `candle-flame-6.jpg` - Keywords: candle, flame, soft light
7. `rainy-window-7.jpg` - Keywords: rain, window, droplets
8. `blanket-fort-8.jpg` - Keywords: blanket, fort, cozy hideaway
9. `sunset-view-9.jpg` - Keywords: sunset, horizon, peaceful
10. `plant-leaves-10.jpg` - Keywords: houseplant, green, nature
11. `coffee-mug-11.jpg` - Keywords: coffee, steam, morning
12. `wooden-desk-12.jpg` - Keywords: wooden desk, workspace, minimal
13. `starry-sky-13.jpg` - Keywords: stars, night sky, galaxy
14. `ocean-waves-14.jpg` - Keywords: ocean, waves, beach
15. `mountain-lake-15.jpg` - Keywords: mountain, lake, reflection
16. `forest-path-16.jpg` - Keywords: forest, path, trees
17. `hot-chocolate-17.jpg` - Keywords: hot chocolate, marshmallows
18. `vintage-radio-18.jpg` - Keywords: vintage radio, retro, music
19. `snowy-window-19.jpg` - Keywords: snow, window, winter
20. `butterfly-garden-20.jpg` - Keywords: butterfly, garden, flowers

### Sourcing Images

- **Unsplash.com**: High-quality, free images. Search using the keywords above. All images are under Unsplash license (free for personal and commercial use).
- **Pexels.com**: Similar to Unsplash, royalty-free stock photos.
- **Pixabay.com**: Free images, illustrations, and videos.
- **Wikimedia Commons**: Public domain and Creative Commons licensed media.

**License Requirements**: Prefer Creative Commons Zero (CC0), Unsplash license, or public domain images. Ensure the images are high-resolution (at least 1920x1080) and suitable for ambient/cozy themes.

## How to Replace Assets

1. **Quotes**: Edit `assets/quotes.json` directly. Ensure each object has `text`, `author`, and `tag` fields.

2. **Images**:
   - Download images using the suggested filenames.
   - Place them in `assets/images/`.
   - The app will automatically detect and use them.

3. **Audio**:
   - Download ambient loops and the chime sound.
   - Place loops in `assets/audio/` with names like `ambient1.mp3`, `ambient2.mp3`, etc.
   - Place the chime as `chime.mp3`.
   - The app preloads these on audio enable.

4. **Testing**: After adding assets, refresh the page and test the VIBE button to ensure everything loads correctly.

## Additional Notes

- Keep file sizes reasonable (images < 2MB, audio < 5MB each) for web performance.
- Ensure audio files are in MP3 format for broad compatibility.
- If you create your own assets, consider releasing them under CC0 for others to use.
- This project is designed to be fully static and deployable to any hosting service.

## Attribution

If using assets that require attribution, add credits here. For CC0 assets, no attribution is needed.
