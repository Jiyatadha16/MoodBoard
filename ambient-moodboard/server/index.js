const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: true, // Allow all origins for development
    credentials: true
}));
app.use(bodyParser.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

const moodsFile = path.join(__dirname, '../data/moods.json');

// Helper functions
async function loadMoods() {
    try {
        const data = await fs.readFile(moodsFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading moods:', error);
        return [];
    }
}

async function saveMoods(moods) {
    try {
        await fs.writeFile(moodsFile, JSON.stringify(moods, null, 2));
    } catch (error) {
        console.error('Error saving moods:', error);
    }
}

// Routes
app.get('/api/moods', async (req, res) => {
    const count = parseInt(req.query.count) || 1;
    const moods = await loadMoods();

    if (moods.length === 0) {
        return res.status(404).json({ error: 'No moods available' });
    }

    const selected = [];
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * moods.length);
        selected.push(moods[randomIndex]);
    }

    res.json(selected);
});

app.post('/api/moods', async (req, res) => {
    const newMood = req.body;

    // Validate required fields
    if (!newMood.quote || !newMood.image || !newMood.audio || !newMood.tag) {
        return res.status(400).json({
            error: 'Missing required fields: quote (object with text and author), image, audio, tag'
        });
    }

    const moods = await loadMoods();
    moods.push(newMood);
    await saveMoods(moods);

    res.status(201).json({
        message: 'Mood added successfully',
        mood: newMood
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Ambient Moodboard Server running on http://localhost:${PORT}`);
    console.log(`Static files served from: ${path.join(__dirname, '../public')}`);
    console.log(`API endpoints:`);
    console.log(`  GET  /api/moods?count=1 - Get random moods`);
    console.log(`  POST /api/moods - Add new mood`);
});
