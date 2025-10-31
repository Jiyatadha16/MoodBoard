# Ambient Moodboard

A minimal ambient moodboard website built with plain HTML, CSS, and JavaScript. Displays inspirational quotes in a grid layout with a dark, ambient theme.

## Features

- Semantic HTML with accessibility attributes
- Responsive grid layout
- Dark ambient theme
- Dynamic quote loading from JSON
- Dependency-free static site

## Setup

No dependencies required. All files are static and can be deployed directly.

## Running Locally

### Static File Server

To serve the static files locally, you can use Python's built-in HTTP server:

```bash
cd ambient-moodboard
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

Alternatively, if you have Node.js installed, you can use `npx http-server`:

```bash
npx http-server ambient-moodboard -p 8000
```

### Express Server (Optional)

For API functionality and dynamic mood serving, use the included Express server:

```bash
cd ambient-moodboard/server
npm install
npm start
```

The server will run on `http://localhost:3000` and serve both static files and API endpoints.

#### API Endpoints

- `GET /api/moods?count=1` - Returns random mood objects from `data/moods.json`
- `POST /api/moods` - Adds a new mood object (accepts JSON with quote, image, audio, tag fields)

CORS is enabled to allow cross-origin requests from separate frontend applications.

## File Structure

```
ambient-moodboard/
├── index.html
├── styles.css
├── app.js
├── README.md
└── assets/
    ├── quotes.json
    ├── images/
    └── audio/
```

## Testing

### Manual Test Checklist

- [ ] **Keyboard Navigation**: Tab through all interactive elements (buttons, checkboxes, sliders) without using mouse
- [ ] **Audio Start Behavior**: Click VIBE button, confirm audio overlay appears and disappears after click, audio starts
- [ ] **localStorage Persistence**: Change settings (volume, toggles), refresh page, confirm settings persist
- [ ] **Auto-Vibe Timing**: Enable Auto-Vibe with 5-second interval, confirm new vibes appear every 5 seconds
- [ ] **Focus Mode**: Enable Focus Mode, confirm controls hide, press Escape to exit
- [ ] **Particles**: Toggle particles on/off, confirm they appear/disappear appropriately
- [ ] **Save Mood**: Click Save Mood, then View Saved, confirm mood appears in gallery
- [ ] **Accessibility**: Use screen reader to navigate, confirm ARIA labels are announced
- [ ] **Responsive**: Resize window to mobile size, confirm layout adapts

### Automated Test Snippet (Playwright)

```javascript
const { test, expect } = require('@playwright/test');

test('Ambient Moodboard basic functionality', async ({ page }) => {
  await page.goto('http://localhost:8000'); // Adjust URL as needed

  // Wait for initial load
  await page.waitForSelector('#vibeBtn');

  // Get initial quote text
  const initialQuote = await page.locator('#moodQuote').textContent();

  // Click VIBE button
  await page.click('#vibeBtn');

  // Wait for animation
  await page.waitForTimeout(1000);

  // Check that quote changed (basic assertion)
  const newQuote = await page.locator('#moodQuote').textContent();
  expect(newQuote).not.toBe(initialQuote);

  // Mock audio check (since we can't easily test Web Audio API)
  // In a real test, you might need to mock the audio context
  console.log('VIBE button clicked, quote changed from:', initialQuote, 'to:', newQuote);
});
```

To run: `npx playwright test` (requires Playwright installation and setup).

## Performance Considerations

For optimal performance when adding custom assets:
- Keep audio files small (< 5MB each) and use efficient formats like MP3
- Use lazy loading for images: `<img loading="lazy" ...>`
- Consider responsive images with `srcset` for different screen sizes
- Minimize JavaScript bundle size by avoiding unnecessary libraries
- Enable gzip compression on your hosting platform

## Deployment

Since it's a static site, you can deploy it to any static hosting service like GitHub Pages, Netlify, or Vercel by uploading the `ambient-moodboard/` folder.

### Quick Deploy Script

Run `./deploy.sh` for a local preview and deployment instructions. The script starts a local server on port 8080 for testing before deployment.

### Platform-Specific Instructions

**Vercel:**
1. Push code to GitHub
2. Import project on vercel.com
3. Deploy (no build step needed)

**Netlify:**
1. Drag and drop the `ambient-moodboard/` folder to netlify.com
2. Or connect your GitHub repo for auto-deployment

**GitHub Pages:**
1. Push to GitHub
2. Go to repository Settings > Pages
3. Set source to main branch and root folder
4. Access at `https://username.github.io/repository/`

The included `netlify.toml` provides default static site configuration. Update `robots.txt` and `sitemap.xml` with your actual domain after deployment.
