// Global state
let quotes = [];
let images = []; // Placeholder for image list
let audioFiles = []; // Placeholder for audio list
let usedQuotes = new Set();
let usedImages = new Set();
let usedAudios = new Set();
let soundEnabled = false;
let chimeEnabled = true;
let particlesEnabled = true;
let autoVibeInterval = null;
let audioContext = null;
let gainNode = null;
let filterNode = null;
let chimeBuffer = null;
let ambientBuffers = [];
let currentAmbientSource = null;
let currentAmbientIndex = 0;
let audioEnabled = false;
let canvas = null;
let ctx = null;
let particles = [];
let animationId = null;
let prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let savedMoods = [];
let currentTheme = 'default';
let autoThemeInterval = null;
let themeParticles = [];

// New visual enhancement variables
let ambientLightingEnabled = true;
let motionTrailsEnabled = true;
let glassDistortionEnabled = true;
let customCursorEnabled = true;
let parallaxEnabled = true;
let motionTrailsCanvas = null;
let motionTrailsCtx = null;
let motionTrailParticles = [];
let cursorOrb = null;
let cursorTailParticles = [];
let isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
let parallaxAnimationId = null;
let cursorAnimationId = null;
let trailsAnimationId = null;

// New feature variables
let userQuotes = [];
let customThemes = [];
let adaptiveThemeMode = 'off'; // 'off', 'manual', 'auto'
let moodJournal = {};
let currentJournalDate = new Date().toISOString().split('T')[0];

// Settings persistence
const SETTINGS_KEY = 'ambientMoodboardSettings';

function loadSettings() {
    try {
        const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
        soundEnabled = settings.soundEnabled || false;
        chimeEnabled = settings.chimeEnabled !== false;
        particlesEnabled = settings.particlesEnabled !== false;
        document.getElementById('volumeSlider').value = settings.volume || 0.5;
        document.getElementById('autoVibeInterval').value = settings.autoVibeInterval || 10;
        document.getElementById('focusMode').checked = settings.focusMode || false;
        document.getElementById('chimeToggle').checked = chimeEnabled;
        document.getElementById('particlesToggle').checked = particlesEnabled;
        document.getElementById('autoThemeToggle').checked = settings.autoTheme || false;
        savedMoods = settings.savedMoods || [];
        currentTheme = settings.currentTheme || 'default';

        // Load new features
        userQuotes = settings.userQuotes || [];
        customThemes = settings.customThemes || [];
        adaptiveThemeMode = settings.adaptiveThemeMode || 'off';
        moodJournal = settings.moodJournal || {};

        // Load visual enhancement toggles
        ambientLightingEnabled = settings.ambientLightingEnabled !== false;
        motionTrailsEnabled = settings.motionTrailsEnabled !== false;
        glassDistortionEnabled = settings.glassDistortionEnabled !== false;
        customCursorEnabled = settings.customCursorEnabled !== false;
        parallaxEnabled = settings.parallaxEnabled !== false;

        return settings;
    } catch (error) {
        console.error('Error loading settings:', error);
        return {};
    }
}

function saveSettings() {
    const settings = {
        soundEnabled,
        chimeEnabled,
        particlesEnabled,
        volume: parseFloat(document.getElementById('volumeSlider').value),
        autoVibeInterval: parseInt(document.getElementById('autoVibeInterval').value),
        focusMode: document.getElementById('focusMode').checked,
        autoTheme: document.getElementById('autoThemeToggle').checked,
        savedMoods,
        currentTheme,
        // New features
        userQuotes,
        customThemes,
        adaptiveThemeMode,
        moodJournal,
        // Visual enhancement toggles
        ambientLightingEnabled,
        motionTrailsEnabled,
        glassDistortionEnabled,
        customCursorEnabled,
        parallaxEnabled
    };
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Error saving settings:', error);
        showToast('Failed to save settings', 'error');
    }
}

function saveMood() {
    const currentQuote = document.getElementById('moodQuote').textContent;
    const currentImage = document.getElementById('moodImage').src;
    const currentTag = quotes.find(q => currentQuote.includes(q.text))?.tag || 'general';

    const mood = {
        quote: {
            text: currentQuote.split('—')[0].trim().replace(/"/g, ''),
            author: currentQuote.split('—')[1]?.trim() || 'Unknown'
        },
        image: currentImage || '',
        audio: '', // Placeholder
        tag: currentTag,
        savedAt: new Date().toISOString()
    };

    savedMoods.push(mood);
    saveSettings();
    alert('Mood saved!');
}

function showGallery() {
    renderSavedMoods();
    document.getElementById('savedGallery').style.display = 'block';
}

function renderSavedMoods() {
    const list = document.getElementById('savedMoodsList');
    list.innerHTML = '';

    savedMoods.forEach((mood, index) => {
        const item = document.createElement('div');
        item.className = 'saved-mood-item';

        const img = document.createElement('img');
        img.src = mood.image || '';
        img.alt = 'Saved mood image';
        img.style.display = mood.image ? 'block' : 'none';

        const quote = document.createElement('blockquote');
        quote.innerHTML = `<p>"${mood.quote.text}"</p><cite>— ${mood.quote.author}</cite>`;

        item.appendChild(img);
        item.appendChild(quote);
        list.appendChild(item);
    });
}

// Async data loading
async function loadQuotes() {
    try {
        const response = await fetch('assets/quotes.json');
        if (!response.ok) throw new Error('Failed to load quotes');
        quotes = await response.json();
    } catch (error) {
        console.error('Error loading quotes:', error);
        document.getElementById('moodQuote').textContent = 'Failed to load quotes.';
    }
}

async function loadAssets() {
    // Placeholder: In a real implementation, this would scan assets/images/ and assets/audio/
    // For now, assume empty
    images = [];
    audioFiles = [];
}

// Audio handling with Web Audio API
async function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioContext.createGain();
        filterNode = audioContext.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(1000, audioContext.currentTime); // Initial low-pass
        gainNode.connect(filterNode);
        filterNode.connect(audioContext.destination);
        gainNode.gain.setValueAtTime(parseFloat(document.getElementById('volumeSlider').value), audioContext.currentTime);
    }
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }
}

async function preloadAudioBuffers() {
    try {
        // Chime - using a short track
        const chimeResponse = await fetch('assets/audio/SAD!.mp3');
        if (chimeResponse.ok) {
            const arrayBuffer = await chimeResponse.arrayBuffer();
            chimeBuffer = await audioContext.decodeAudioData(arrayBuffer);
        }
        // Ambient loops - using some of the available tracks
        const ambientFiles = [
            'Heat Waves - Slowed.mp3',
            'Love Yourself.mp3',
            'Dandelions - slowed + reverb.mp3'
        ];
        for (const file of ambientFiles) {
            const ambientResponse = await fetch('assets/audio/' + file);
            if (ambientResponse.ok) {
                const arrayBuffer = await ambientResponse.arrayBuffer();
                const buffer = await audioContext.decodeAudioData(arrayBuffer);
                ambientBuffers.push(buffer);
            }
        }
    } catch (error) {
        console.error('Error preloading audio buffers:', error);
    }
}

async function playChime() {
    if (!chimeEnabled || !chimeBuffer || !soundEnabled) return;
    try {
        const source = audioContext.createBufferSource();
        source.buffer = chimeBuffer;
        source.connect(gainNode);
        source.start();
    } catch (error) {
        console.error('Error playing chime:', error);
    }
}

async function crossfadeToAmbient(buffer) {
    if (!buffer) return;

    // Fade out current
    if (currentAmbientSource) {
        const fadeOut = currentAmbientSource.gain;
        fadeOut.setValueAtTime(fadeOut.value, audioContext.currentTime);
        fadeOut.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        setTimeout(() => {
            if (currentAmbientSource) {
                currentAmbientSource.stop();
                currentAmbientSource = null;
            }
        }, 1000);
    }

    // Create new source
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const ambientGain = audioContext.createGain();
    ambientGain.gain.setValueAtTime(0, audioContext.currentTime);
    ambientGain.gain.linearRampToValueAtTime(1, audioContext.currentTime + 1);
    source.connect(ambientGain);
    ambientGain.connect(gainNode);
    source.start();

    currentAmbientSource = { source, gain: ambientGain };
}

function brightenFilter() {
    if (filterNode) {
        filterNode.frequency.setValueAtTime(filterNode.frequency.value, audioContext.currentTime);
        filterNode.frequency.exponentialRampToValueAtTime(5000, audioContext.currentTime + 0.5);
        setTimeout(() => {
            filterNode.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 2);
        }, 500);
    }
}

async function playAudio(audioSrc) {
    if (!soundEnabled || ambientBuffers.length === 0) return;

    try {
        await initAudioContext();
        await crossfadeToAmbient(ambientBuffers[currentAmbientIndex]);
    } catch (error) {
        console.error('Error playing audio:', error);
    }
}

function nextSong() {
    if (!soundEnabled || ambientBuffers.length === 0) return;
    currentAmbientIndex = (currentAmbientIndex + 1) % ambientBuffers.length;
    crossfadeToAmbient(ambientBuffers[currentAmbientIndex]).catch(console.error);
}

function stopAudio() {
    if (currentAmbientSource) {
        currentAmbientSource.gain.gain.setValueAtTime(0, audioContext.currentTime);
        currentAmbientSource.source.stop();
        currentAmbientSource = null;
    }
}

function enableAudio() {
    audioEnabled = true;
    document.getElementById('audioOverlay').classList.add('hidden');
    initAudioContext().then(() => preloadAudioBuffers());
}

// Vibe generation
function getRandomUnused(array, usedSet) {
    if (usedSet.size >= array.length) {
        usedSet.clear(); // Reset when all used
    }
    let index;
    do {
        index = Math.floor(Math.random() * array.length);
    } while (usedSet.has(index));
    usedSet.add(index);
    return array[index];
}

async function generateVibe() {
    if (quotes.length === 0) return;

    const quote = getRandomUnused(quotes, usedQuotes);

    // Spawn particles based on tag
    spawnParticles(quote.tag);

    // Display with animations
    await displayQuote(quote);

    saveSettings();
}

// Display functions with animations
async function displayQuote(quote) {
    const quoteElement = document.getElementById('moodQuote');
    quoteElement.style.opacity = '0';
    await new Promise(resolve => setTimeout(resolve, 200));
    quoteElement.innerHTML = `<p>"${quote.text}"</p><cite>— ${quote.author}</cite>`;
    quoteElement.style.opacity = '1';
}

async function displayImage(imageSrc) {
    const imgElement = document.getElementById('moodImage');
    if (!imageSrc) {
        imgElement.style.display = 'none';
        return;
    }

    imgElement.style.opacity = '0';
    await new Promise(resolve => setTimeout(resolve, 300));
    imgElement.src = imageSrc;
    imgElement.alt = 'Ambient mood image';
    imgElement.style.display = 'block';
    imgElement.style.opacity = '1';
}

// Event handlers
function toggleSound() {
    soundEnabled = !soundEnabled;
    chimeEnabled = soundEnabled; // Also toggle chime with sound
    const btn = document.getElementById('soundToggle');
    btn.textContent = soundEnabled ? 'Sound On' : 'Sound Off';
    btn.setAttribute('aria-pressed', soundEnabled);
    document.getElementById('audioControl').disabled = !soundEnabled;
    document.getElementById('nextSongBtn').disabled = !soundEnabled;
    document.getElementById('chimeToggle').checked = chimeEnabled;
    if (!soundEnabled) stopAudio();
    saveSettings();
}

function toggleAutoVibe() {
    const checkbox = document.getElementById('autoVibe');
    if (checkbox.checked) {
        const interval = parseInt(document.getElementById('autoVibeInterval').value) * 1000;
        autoVibeInterval = setInterval(() => {
            generateVibe().catch(console.error);
        }, interval);
    } else {
        if (autoVibeInterval) {
            clearInterval(autoVibeInterval);
            autoVibeInterval = null;
        }
    }
    saveSettings();
}

function toggleFocusMode() {
    const checkbox = document.getElementById('focusMode');
    document.body.classList.toggle('focus-mode', checkbox.checked);
    saveSettings();
}

function toggleAudio() {
    if (!audioEnabled) {
        enableAudio();
    }
    if (currentAmbientSource) {
        stopAudio();
    } else {
        // Play current ambient
        crossfadeToAmbient(ambientBuffers[currentAmbientIndex]).catch(console.error);
    }
}

function handleVolumeChange() {
    if (gainNode) {
        gainNode.gain.setValueAtTime(parseFloat(document.getElementById('volumeSlider').value), audioContext.currentTime);
    }
    saveSettings();
}

function handleChimeToggle() {
    chimeEnabled = document.getElementById('chimeToggle').checked;
    saveSettings();
}

function handleParticlesToggle() {
    particlesEnabled = document.getElementById('particlesToggle').checked;
    if (!particlesEnabled) {
        particles = [];
        themeParticles = [];
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    } else {
        initCanvas();
        animateParticles();
    }
    saveSettings();
}

function applyTheme(theme) {
    // Remove previous theme classes
    document.body.classList.remove('theme-cozy-winter', 'theme-golden-hour', 'theme-rainy-loft', 'theme-starlit-night');
    if (theme !== 'default') {
        document.body.classList.add('theme-' + theme);
    }
    currentTheme = theme;
    spawnThemeParticles(theme);
    saveSettings();
}

function showThemeCaption(theme) {
    const captions = {
        'cozy-winter': 'Cozy Winter',
        'golden-hour': 'Golden Hour',
        'rainy-loft': 'Rainy Loft',
        'starlit-night': 'Starlit Night'
    };
    const caption = document.getElementById('themeCaption');
    if (captions[theme]) {
        caption.textContent = `Now playing: ${captions[theme]}`;
        caption.style.display = 'block';
        setTimeout(() => {
            caption.style.display = 'none';
        }, 2000);
    }
}

function handleThemeChange() {
    const select = document.getElementById('themeSelect');
    const theme = select.value;
    applyTheme(theme);
    showThemeCaption(theme);
    // Play chime on theme change
    if (soundEnabled && chimeEnabled) playChime();
}

function handleAutoThemeToggle() {
    const checkbox = document.getElementById('autoThemeToggle');
    if (checkbox.checked) {
        cycleTheme(); // Start immediately
        autoThemeInterval = setInterval(cycleTheme, 300000); // 5 minutes
    } else {
        if (autoThemeInterval) {
            clearInterval(autoThemeInterval);
            autoThemeInterval = null;
        }
    }
    saveSettings();
}

function cycleTheme() {
    const themes = ['default', 'cozy-winter', 'golden-hour', 'rainy-loft', 'starlit-night'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    document.getElementById('themeSelect').value = nextTheme;
    applyTheme(nextTheme);
    showThemeCaption(nextTheme);
}

// Particle system
class Particle {
    constructor(x, y, color, type = 'quote') {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.life = 1;
        this.maxLife = 1;
        this.color = color;
        this.size = Math.random() * 2 + 1;
        this.type = type;
        this.alpha = 1; // for twinkling

        if (type === 'snow') {
            this.color = 'rgba(255,255,255,0.8)';
            this.size = Math.random() * 2 + 2;
            this.vx = (Math.random() - 0.5) * 0.2;
            this.vy = Math.random() * 0.5 + 0.1;
        } else if (type === 'dust') {
            this.color = 'rgba(255,215,0,0.6)';
            this.size = Math.random() * 1 + 0.5;
            this.vx = (Math.random() - 0.5) * 0.1;
            this.vy = Math.random() * 0.1;
        } else if (type === 'star') {
            this.color = 'rgba(255,255,255,0.9)';
            this.size = Math.random() * 1 + 0.5;
            this.vx = 0;
            this.vy = 0;
        }
    }

    update() {
        if (this.type === 'snow') {
            this.y += this.vy;
            if (this.y > window.innerHeight) {
                this.y = -10;
                this.x = Math.random() * window.innerWidth;
            }
        } else if (this.type === 'dust') {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0) this.x = window.innerWidth;
            if (this.x > window.innerWidth) this.x = 0;
            if (this.y > window.innerHeight) this.y = 0;
        } else if (this.type === 'star') {
            // twinkle
            this.alpha = 0.3 + 0.7 * Math.sin(Date.now() * 0.002 + this.x * 0.01);
        } else {
            this.x += this.vx;
            this.y += this.vy;
            this.life -= 0.005;
            this.vy += 0.01; // gravity
        }
    }

    draw() {
        if (!ctx) return;
        if (this.type === 'star') {
            ctx.globalAlpha = this.alpha;
        } else {
            ctx.globalAlpha = this.life / this.maxLife;
        }
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    isDead() {
        return this.type === 'quote' && this.life <= 0;
    }
}

function initCanvas() {
    canvas = document.getElementById('particleCanvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function spawnParticles(tag, count = 5) {
    if (!particlesEnabled || prefersReducedMotion) return;

    const tagColors = {
        'peace': 'rgba(168, 213, 226, 0.6)',
        'motivation': 'rgba(184, 230, 184, 0.6)',
        'dreams': 'rgba(247, 198, 199, 0.6)',
        'opportunity': 'rgba(184, 230, 184, 0.6)',
        'future': 'rgba(168, 213, 226, 0.6)',
        'limits': 'rgba(247, 198, 199, 0.6)',
        'mind': 'rgba(184, 230, 184, 0.6)',
        'action': 'rgba(168, 213, 226, 0.6)',
        'life': 'rgba(247, 198, 199, 0.6)',
        'happiness': 'rgba(184, 230, 184, 0.6)',
        'journey': 'rgba(168, 213, 226, 0.6)',
        'belief': 'rgba(247, 198, 199, 0.6)',
        'work': 'rgba(184, 230, 184, 0.6)',
        'optimism': 'rgba(168, 213, 226, 0.6)',
        'perseverance': 'rgba(247, 198, 199, 0.6)',
        'success': 'rgba(184, 230, 184, 0.6)',
        'inner strength': 'rgba(168, 213, 226, 0.6)',
        'positivity': 'rgba(247, 198, 199, 0.6)'
    };

    const color = tagColors[tag] || 'rgba(168, 213, 226, 0.6)';
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    for (let i = 0; i < count; i++) {
        if (particles.length < 80) {
            const x = centerX + (Math.random() - 0.5) * 100;
            const y = centerY + (Math.random() - 0.5) * 100;
            particles.push(new Particle(x, y, color));
        }
    }
}

function spawnThemeParticles(theme) {
    if (!particlesEnabled || prefersReducedMotion) return;
    themeParticles = [];
    if (theme === 'cozy-winter') {
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            themeParticles.push(new Particle(x, y, '', 'snow'));
        }
    } else if (theme === 'golden-hour') {
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            themeParticles.push(new Particle(x, y, '', 'dust'));
        }
    } else if (theme === 'starlit-night') {
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            themeParticles.push(new Particle(x, y, '', 'star'));
        }
    }
    // rainy-loft has CSS rain, no particles
}

function animateParticles() {
    if (!particlesEnabled || prefersReducedMotion) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles = particles.filter(particle => {
        particle.update();
        particle.draw();
        return !particle.isDead();
    });

    themeParticles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    if (particles.length > 0 || themeParticles.length > 0) {
        animationId = requestAnimationFrame(animateParticles);
    } else {
        animationId = null;
    }
}

// Toast notifications
function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `${message}<button class="close-btn" onclick="this.parentElement.remove()">&times;</button>`;

    container.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

// Custom Quotes functionality
function showCustomQuotesModal() {
    renderUserQuotes();
    document.getElementById('customQuotesModal').style.display = 'flex';
    document.getElementById('quoteText').focus();
}

function closeCustomQuotesModal() {
    document.getElementById('customQuotesModal').style.display = 'none';
}

function addUserQuote() {
    const text = document.getElementById('quoteText').value.trim();
    const author = document.getElementById('quoteAuthor').value.trim();

    if (!text) {
        showToast('Quote text is required', 'error');
        return;
    }

    if (text.length > 300) {
        showToast('Quote text must be 300 characters or less', 'error');
        return;
    }

    const quote = {
        text,
        author: author || 'Unknown',
        id: Date.now()
    };

    userQuotes.push(quote);
    quotes.push(quote); // Add to active quotes pool
    saveSettings();

    // Clear form
    document.getElementById('quoteText').value = '';
    document.getElementById('quoteAuthor').value = '';

    renderUserQuotes();
    showToast('Quote added successfully');
}

function renderUserQuotes() {
    const list = document.getElementById('quotesList');
    list.innerHTML = '';

    userQuotes.forEach(quote => {
        const item = document.createElement('div');
        item.className = 'quote-item';
        item.innerHTML = `
            <blockquote>
                <p>"${quote.text}"</p>
                <cite>— ${quote.author}</cite>
            </blockquote>
            <button onclick="removeUserQuote(${quote.id})" aria-label="Remove quote">Remove</button>
        `;
        list.appendChild(item);
    });
}

function removeUserQuote(id) {
    userQuotes = userQuotes.filter(q => q.id !== id);
    quotes = quotes.filter(q => q.id !== id); // Remove from active pool
    saveSettings();
    renderUserQuotes();
    showToast('Quote removed');
}

function importQuotes() {
    const fileInput = document.getElementById('quotesFileInput');
    const file = fileInput.files[0];

    if (!file) {
        showToast('Please select a file', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            let importedQuotes = [];

            if (file.name.endsWith('.json')) {
                importedQuotes = JSON.parse(e.target.result);
            } else if (file.name.endsWith('.txt')) {
                // Parse text file (one quote per line, format: "text" — author)
                const lines = e.target.result.split('\n').filter(line => line.trim());
                importedQuotes = lines.map(line => {
                    const match = line.match(/"([^"]+)"\s*—\s*(.+)/);
                    if (match) {
                        return { text: match[1], author: match[2] };
                    }
                    return { text: line, author: 'Unknown' };
                });
            } else {
                throw new Error('Unsupported file format');
            }

            // Validate and deduplicate
            const validQuotes = importedQuotes
                .filter(q => q.text && q.text.trim())
                .map(q => ({
                    text: q.text.trim(),
                    author: (q.author || 'Unknown').trim(),
                    id: Date.now() + Math.random()
                }));

            // Remove duplicates
            const existingTexts = new Set(userQuotes.map(q => q.text.toLowerCase()));
            const uniqueQuotes = validQuotes.filter(q => !existingTexts.has(q.text.toLowerCase()));

            userQuotes.push(...uniqueQuotes);
            quotes.push(...uniqueQuotes);
            saveSettings();

            renderUserQuotes();
            showToast(`Imported ${uniqueQuotes.length} quotes`);
        } catch (error) {
            showToast('Failed to import quotes: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

function exportQuotes() {
    const dataStr = JSON.stringify(userQuotes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'user-quotes.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Quotes exported');
}

// Theme Builder functionality
function showThemeBuilderModal() {
    updateThemePreview();
    renderCustomThemes();
    document.getElementById('themeBuilderModal').style.display = 'flex';
}

function closeThemeBuilderModal() {
    document.getElementById('themeBuilderModal').style.display = 'none';
}

function updateThemePreview() {
    const bgColor1 = document.getElementById('bgColor1').value;
    const bgColor2 = document.getElementById('bgColor2').value;
    const accentColor = document.getElementById('accentColor').value;
    const blurValue = document.getElementById('blurSlider').value;
    const contrastValue = document.getElementById('contrastSlider').value;
    const fontFamily = document.getElementById('fontSelect').value;

    const previewCard = document.querySelector('.preview-card');
    const previewQuote = document.querySelector('.preview-quote');

    previewCard.style.background = `linear-gradient(135deg, ${bgColor1}, ${bgColor2})`;
    previewCard.style.backdropFilter = `blur(${blurValue}px)`;
    previewCard.style.filter = `contrast(${contrastValue})`;
    previewCard.style.fontFamily = fontFamily;
    previewQuote.style.borderLeftColor = accentColor;
}

function saveCustomTheme() {
    const name = prompt('Enter theme name:');
    if (!name || !name.trim()) {
        showToast('Theme name is required', 'error');
        return;
    }

    const theme = {
        name: name.trim(),
        bgColor1: document.getElementById('bgColor1').value,
        bgColor2: document.getElementById('bgColor2').value,
        accentColor: document.getElementById('accentColor').value,
        blur: document.getElementById('blurSlider').value,
        contrast: document.getElementById('contrastSlider').value,
        fontFamily: document.getElementById('fontSelect').value,
        id: Date.now()
    };

    customThemes.push(theme);
    saveSettings();
    renderCustomThemes();
    showToast('Theme saved');
}

function renderCustomThemes() {
    const list = document.getElementById('customThemesList');
    list.innerHTML = '';

    customThemes.forEach(theme => {
        const item = document.createElement('div');
        item.className = 'custom-theme-item';
        item.innerHTML = `
            <span class="theme-name">${theme.name}</span>
            <button class="apply-btn" onclick="applyCustomTheme(${theme.id})" aria-label="Apply theme ${theme.name}">Apply</button>
            <button class="delete-btn" onclick="deleteCustomTheme(${theme.id})" aria-label="Delete theme ${theme.name}">Delete</button>
        `;
        list.appendChild(item);
    });
}

function applyCustomTheme(id) {
    const theme = customThemes.find(t => t.id === id);
    if (!theme) return;

    // Apply CSS variables
    document.documentElement.style.setProperty('--custom-bg-grad-a', theme.bgColor1);
    document.documentElement.style.setProperty('--custom-bg-grad-b', theme.bgColor2);
    document.documentElement.style.setProperty('--custom-accent', theme.accentColor);
    document.documentElement.style.setProperty('--custom-card-blur', theme.blur + 'px');
    document.documentElement.style.setProperty('--custom-ui-font', theme.fontFamily);

    // Remove other theme classes and add custom
    document.body.classList.remove('theme-cozy-winter', 'theme-golden-hour', 'theme-rainy-loft', 'theme-starlit-night');
    document.body.classList.add('theme-custom');

    currentTheme = 'custom';
    saveSettings();
    showToast(`Applied theme: ${theme.name}`);
}

function deleteCustomTheme(id) {
    customThemes = customThemes.filter(t => t.id !== id);
    saveSettings();
    renderCustomThemes();
    showToast('Theme deleted');
}

function applyCustomThemePreview() {
    const bgColor1 = document.getElementById('bgColor1').value;
    const bgColor2 = document.getElementById('bgColor2').value;
    const accentColor = document.getElementById('accentColor').value;
    const blurValue = document.getElementById('blurSlider').value;
    const contrastValue = document.getElementById('contrastSlider').value;
    const fontFamily = document.getElementById('fontSelect').value;

    // Apply to main interface temporarily
    document.documentElement.style.setProperty('--custom-bg-grad-a', bgColor1);
    document.documentElement.style.setProperty('--custom-bg-grad-b', bgColor2);
    document.documentElement.style.setProperty('--custom-accent', accentColor);
    document.documentElement.style.setProperty('--custom-card-blur', blurValue + 'px');
    document.documentElement.style.setProperty('--custom-ui-font', fontFamily);

    document.body.classList.remove('theme-cozy-winter', 'theme-golden-hour', 'theme-rainy-loft', 'theme-starlit-night');
    document.body.classList.add('theme-custom');

    currentTheme = 'custom';
    showToast('Preview theme applied');
}

// Auto-Adaptive Theme functionality
function toggleAdaptiveTheme() {
    const modes = ['off', 'manual', 'auto'];
    const currentIndex = modes.indexOf(adaptiveThemeMode);
    adaptiveThemeMode = modes[(currentIndex + 1) % modes.length];

    const btn = document.getElementById('adaptiveThemeToggle');
    btn.textContent = `Adaptive ${adaptiveThemeMode.charAt(0).toUpperCase() + adaptiveThemeMode.slice(1)}`;
    btn.setAttribute('aria-pressed', adaptiveThemeMode !== 'off');

    saveSettings();
    showToast(`Adaptive theme: ${adaptiveThemeMode}`);
}

async function extractDominantColor(imageSrc) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Downscale for performance
            const scale = Math.min(40 / img.width, 40 / img.height);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Quantize colors and find dominant
            const colorBuckets = {};
            for (let i = 0; i < data.length; i += 4) {
                const r = Math.floor(data[i] / 16) * 16;
                const g = Math.floor(data[i + 1] / 16) * 16;
                const b = Math.floor(data[i + 2] / 16) * 16;
                const key = `${r},${g},${b}`;

                colorBuckets[key] = (colorBuckets[key] || 0) + 1;
            }

            let dominantColor = [128, 128, 128]; // Default gray
            let maxCount = 0;

            for (const [key, count] of Object.entries(colorBuckets)) {
                if (count > maxCount) {
                    dominantColor = key.split(',').map(Number);
                    maxCount = count;
                }
            }

            resolve(dominantColor);
        };
        img.src = imageSrc;
    });
}

async function applyAdaptiveTheme(imageSrc) {
    if (adaptiveThemeMode === 'off') return;

    try {
        const [r, g, b] = await extractDominantColor(imageSrc);

        // Convert to HSL for adjustments
        const hsl = rgbToHsl(r, g, b);

        // Create complementary colors
        const accentHsl = [...hsl];
        accentHsl[0] = (accentHsl[0] + 180) % 360; // Complementary hue
        accentHsl[1] = Math.min(100, accentHsl[1] + 20); // Increase saturation
        accentHsl[2] = Math.min(70, accentHsl[2] + 20); // Lighten

        const gradientHsl = [...hsl];
        gradientHsl[2] = Math.max(20, gradientHsl[2] - 30); // Darken for gradient

        const accentRgb = hslToRgb(...accentHsl);
        const gradientRgb = hslToRgb(...gradientHsl);

        // Apply theme
        document.documentElement.style.setProperty('--custom-bg-grad-a', `rgb(${r}, ${g}, ${b})`);
        document.documentElement.style.setProperty('--custom-bg-grad-b', `rgb(${gradientRgb[0]}, ${gradientRgb[1]}, ${gradientRgb[2]})`);
        document.documentElement.style.setProperty('--custom-accent', `rgb(${accentRgb[0]}, ${accentRgb[1]}, ${accentRgb[2]})`);

        document.body.classList.remove('theme-cozy-winter', 'theme-golden-hour', 'theme-rainy-loft', 'theme-starlit-night');
        document.body.classList.add('theme-custom');

        currentTheme = 'custom';

        if (adaptiveThemeMode === 'manual') {
            showToast('Adaptive theme applied');
        }
    } catch (error) {
        console.error('Failed to extract dominant color:', error);
    }
}

// HSL/RGB conversion utilities
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h * 360, s * 100, l * 100];
}

function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    };

    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Daily Mood Journal functionality
function updateJournalDate() {
    const dateInput = document.getElementById('journalDate');
    const indicator = document.getElementById('journalIndicator');

    currentJournalDate = dateInput.value;
    const hasEntry = moodJournal[currentJournalDate];

    indicator.classList.toggle('has-entry', !!hasEntry);
    loadJournalEntry();
}

function loadJournalEntry() {
    const entry = moodJournal[currentJournalDate] || '';
    document.getElementById('journalEntry').value = entry;
}

function saveJournalEntry() {
    const entry = document.getElementById('journalEntry').value.trim();

    if (entry) {
        moodJournal[currentJournalDate] = entry;
    } else {
        delete moodJournal[currentJournalDate];
    }

    saveSettings();
    updateJournalDate();
    showToast('Journal entry saved');
}

function navigateJournal(direction) {
    const date = new Date(currentJournalDate);
    date.setDate(date.getDate() + direction);
    document.getElementById('journalDate').value = date.toISOString().split('T')[0];
    updateJournalDate();
}

function exportJournal() {
    const dataStr = JSON.stringify(moodJournal, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `mood-journal-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Journal exported');
}

// Visual Enhancement Features

// 1. Dynamic Ambient Lighting
function setAmbientColors({a, b, c}) {
    if (!ambientLightingEnabled) return;
    document.documentElement.style.setProperty('--bg-a', a);
    document.documentElement.style.setProperty('--bg-b', b);
    document.documentElement.style.setProperty('--bg-c', c);
}

function updateAmbientLighting() {
    if (!ambientLightingEnabled) return;

    // Default slow cycling if no audio
    const time = Date.now() * 0.0005;
    const hue1 = (time * 60) % 360;
    const hue2 = (time * 60 + 120) % 360;
    const hue3 = (time * 60 + 240) % 360;

    const a = `hsl(${hue1}, 70%, 60%)`;
    const b = `hsl(${hue2}, 70%, 50%)`;
    const c = `hsl(${hue3}, 70%, 55%)`;

    setAmbientColors({a, b, c});
}

// 2. Soft Motion Trails
class MotionTrailParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2 - 0.5; // Slight upward drift
        this.life = Math.random() * 1.4 + 0.8; // 0.8-2.2s
        this.maxLife = this.life;
        this.size = Math.random() * 2 + 1; // 1-3px
        this.alpha = 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.016; // ~60fps
        this.alpha = this.life / this.maxLife;
        this.vy += 0.01; // gravity
    }

    draw() {
        if (!motionTrailsCtx) return;
        motionTrailsCtx.globalAlpha = this.alpha;
        motionTrailsCtx.fillStyle = `rgba(255,255,255,${this.alpha * 0.6})`;
        motionTrailsCtx.beginPath();
        motionTrailsCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        motionTrailsCtx.fill();
    }

    isDead() {
        return this.life <= 0;
    }
}

function initMotionTrailsCanvas() {
    if (motionTrailsCanvas) return;

    motionTrailsCanvas = document.createElement('canvas');
    motionTrailsCanvas.className = 'motion-trails-canvas';
    motionTrailsCanvas.width = window.innerWidth;
    motionTrailsCanvas.height = window.innerHeight;
    motionTrailsCtx = motionTrailsCanvas.getContext('2d');
    document.body.appendChild(motionTrailsCanvas);

    // Resize handler
    window.addEventListener('resize', () => {
        if (motionTrailsCanvas) {
            motionTrailsCanvas.width = window.innerWidth;
            motionTrailsCanvas.height = window.innerHeight;
        }
    });
}

function animateMotionTrails() {
    if (!motionTrailsEnabled || !motionTrailsCtx) return;

    motionTrailsCtx.clearRect(0, 0, motionTrailsCanvas.width, motionTrailsCanvas.height);

    motionTrailParticles = motionTrailParticles.filter(particle => {
        particle.update();
        particle.draw();
        return !particle.isDead();
    });

    if (motionTrailParticles.length > 0) {
        trailsAnimationId = requestAnimationFrame(animateMotionTrails);
    } else {
        trailsAnimationId = null;
    }
}

function spawnMotionTrail(x, y) {
    if (!motionTrailsEnabled || motionTrailParticles.length >= 80) return;

    for (let i = 0; i < 3; i++) { // Spawn 3 particles per event
        motionTrailParticles.push(new MotionTrailParticle(x, y));
    }

    if (!trailsAnimationId) {
        animateMotionTrails();
    }
}

// 3. Glass Distortion Effect
function updateGlassDistortion(intensity = 0) {
    if (!glassDistortionEnabled) return;
    document.documentElement.style.setProperty('--distortion-intensity', intensity);
}

function handleGlassDistortionHover(event) {
    if (!glassDistortionEnabled) return;

    const rect = event.target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.sqrt(
        Math.pow(event.clientX - centerX, 2) +
        Math.pow(event.clientY - centerY, 2)
    );
    const maxDistance = Math.sqrt(rect.width * rect.width + rect.height * rect.height) / 2;
    const intensity = Math.max(0, 1 - distance / maxDistance) * 5;

    updateGlassDistortion(intensity);
}

// 4. Custom Cursor
function initCustomCursor() {
    if (cursorOrb) return;

    cursorOrb = document.createElement('div');
    cursorOrb.className = 'cursor-orb';
    document.body.appendChild(cursorOrb);
}

function updateCursorPosition(x, y) {
    if (!customCursorEnabled || !cursorOrb) return;

    // Smooth lerping
    const currentX = parseFloat(cursorOrb.style.left || '0');
    const currentY = parseFloat(cursorOrb.style.top || '0');
    const newX = currentX + (x - currentX) * 0.15;
    const newY = currentY + (y - currentY) * 0.15;

    cursorOrb.style.left = newX + 'px';
    cursorOrb.style.top = newY + 'px';
}

function animateCursor() {
    if (!customCursorEnabled) return;

    cursorAnimationId = requestAnimationFrame(animateCursor);
}

function handleCursorHover(event) {
    if (!customCursorEnabled || !cursorOrb) return;

    if (event.type === 'mouseenter') {
        cursorOrb.classList.add('hover');
    } else {
        cursorOrb.classList.remove('hover');
    }
}

// 5. Subtle Camera Parallax
function updateParallax(mouseX, mouseY) {
    if (!parallaxEnabled) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const deltaX = (mouseX - centerX) / centerX; // -1 to 1
    const deltaY = (mouseY - centerY) / centerY; // -1 to 1

    // Background parallax (0.5-6px depending on viewport)
    const bgOffsetX = deltaX * Math.min(6, window.innerWidth * 0.01);
    const bgOffsetY = deltaY * Math.min(6, window.innerHeight * 0.01);

    // Card tilt (max ±2 degrees)
    const rotateX = deltaY * -2;
    const rotateY = deltaX * 2;

    document.documentElement.style.setProperty('--parallax-x', bgOffsetX + 'px');
    document.documentElement.style.setProperty('--parallax-y', bgOffsetY + 'px');
    document.documentElement.style.setProperty('--parallax-rotate-x', rotateX + 'deg');
    document.documentElement.style.setProperty('--parallax-rotate-y', rotateY + 'deg');
}

function animateParallax() {
    if (!parallaxEnabled) return;

    parallaxAnimationId = requestAnimationFrame(animateParallax);
}

// Toggle handlers
function handleAmbientLightingToggle() {
    ambientLightingEnabled = document.getElementById('ambientLightingToggle').checked;
    saveSettings();

    if (ambientLightingEnabled) {
        updateAmbientLighting();
    } else {
        // Reset to default
        setAmbientColors({
            a: 'var(--primary-color)',
            b: 'var(--secondary-color)',
            c: 'var(--accent-color)'
        });
    }
}

function handleMotionTrailsToggle() {
    motionTrailsEnabled = document.getElementById('motionTrailsToggle').checked;
    saveSettings();

    if (motionTrailsEnabled) {
        initMotionTrailsCanvas();
    } else {
        if (motionTrailsCanvas) {
            motionTrailsCanvas.remove();
            motionTrailsCanvas = null;
            motionTrailsCtx = null;
        }
        motionTrailParticles = [];
        if (trailsAnimationId) {
            cancelAnimationFrame(trailsAnimationId);
            trailsAnimationId = null;
        }
    }
}

function handleGlassDistortionToggle() {
    glassDistortionEnabled = document.getElementById('glassDistortionToggle').checked;
    saveSettings();

    if (!glassDistortionEnabled) {
        updateGlassDistortion(0);
    }
}

function handleCustomCursorToggle() {
    customCursorEnabled = document.getElementById('customCursorToggle').checked;
    saveSettings();

    if (customCursorEnabled && !isTouchDevice) {
        initCustomCursor();
        animateCursor();
        document.body.style.cursor = 'none';
    } else {
        if (cursorOrb) {
            cursorOrb.remove();
            cursorOrb = null;
        }
        document.body.style.cursor = '';
        if (cursorAnimationId) {
            cancelAnimationFrame(cursorAnimationId);
            cursorAnimationId = null;
        }
    }
}

function handleParallaxToggle() {
    parallaxEnabled = document.getElementById('parallaxToggle').checked;
    saveSettings();

    if (parallaxEnabled) {
        animateParallax();
    } else {
        // Reset transforms
        document.documentElement.style.setProperty('--parallax-x', '0px');
        document.documentElement.style.setProperty('--parallax-y', '0px');
        document.documentElement.style.setProperty('--parallax-rotate-x', '0deg');
        document.documentElement.style.setProperty('--parallax-rotate-y', '0deg');
    }
}

// Global event handlers
function handleMouseMove(event) {
    if (customCursorEnabled && !isTouchDevice) {
        updateCursorPosition(event.clientX, event.clientY);
    }

    if (parallaxEnabled) {
        updateParallax(event.clientX, event.clientY);
    }
}

function handleMouseEnter(event) {
    if (motionTrailsEnabled && event.target.matches('#vibeBtn, #moodQuote')) {
        spawnMotionTrail(event.clientX, event.clientY);
    }

    if (glassDistortionEnabled && event.target.matches('.card')) {
        event.target.addEventListener('mousemove', handleGlassDistortionHover);
    }

    if (customCursorEnabled) {
        handleCursorHover(event);
    }
}

function handleMouseLeave(event) {
    if (glassDistortionEnabled && event.target.matches('.card')) {
        event.target.removeEventListener('mousemove', handleGlassDistortionHover);
        updateGlassDistortion(0);
    }

    if (customCursorEnabled) {
        handleCursorHover(event);
    }
}

// API for other systems
const visuals = {
    setThemePalette: setAmbientColors,
    pulseOrb: (intensity, duration) => {
        if (!customCursorEnabled || !cursorOrb) return;
        cursorOrb.style.transform = `scale(${1 + intensity * 0.5})`;
        setTimeout(() => {
            if (cursorOrb) cursorOrb.style.transform = '';
        }, duration);
    },
    spawnHoverTrail: spawnMotionTrail
};

// Keyboard handling
function handleKeydown(event) {
    if (event.key === 'Escape') {
        // Close modals
        if (document.getElementById('customQuotesModal').style.display === 'flex') {
            closeCustomQuotesModal();
        } else if (document.getElementById('themeBuilderModal').style.display === 'flex') {
            closeThemeBuilderModal();
        } else if (document.body.classList.contains('focus-mode')) {
            document.getElementById('focusMode').checked = false;
            toggleFocusMode();
        }
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    loadSettings();

    applyTheme(currentTheme);
    document.getElementById('themeSelect').value = currentTheme;
    if (document.getElementById('autoThemeToggle').checked) {
        handleAutoThemeToggle();
    }

    await Promise.all([loadQuotes(), loadAssets()]);

    // Set initial state
    document.getElementById('soundToggle').textContent = soundEnabled ? 'Sound On' : 'Sound Off';
    document.getElementById('soundToggle').setAttribute('aria-pressed', soundEnabled);
    document.getElementById('audioControl').disabled = !soundEnabled;

    // Show audio overlay if not enabled
    if (!audioEnabled) {
        document.getElementById('audioOverlay').classList.remove('hidden');
    }

    // Initial vibe
    await generateVibe();

    // Init canvas if particles enabled
    if (particlesEnabled && !prefersReducedMotion) {
        initCanvas();
    }

    // Initialize new features
    document.getElementById('journalDate').value = currentJournalDate;
    updateJournalDate();

    // Update adaptive theme button
    const adaptiveBtn = document.getElementById('adaptiveThemeToggle');
    adaptiveBtn.textContent = `Adaptive ${adaptiveThemeMode.charAt(0).toUpperCase() + adaptiveThemeMode.slice(1)}`;
    adaptiveBtn.setAttribute('aria-pressed', adaptiveThemeMode !== 'off');

    // Event listeners
    document.getElementById('vibeBtn').addEventListener('click', () => {
        generateVibe().catch(console.error);
    });
    document.getElementById('soundToggle').addEventListener('click', toggleSound);
    document.getElementById('volumeSlider').addEventListener('input', handleVolumeChange);
    document.getElementById('chimeToggle').addEventListener('change', handleChimeToggle);
    document.getElementById('particlesToggle').addEventListener('change', handleParticlesToggle);
    document.getElementById('themeSelect').addEventListener('change', handleThemeChange);
    document.getElementById('autoThemeToggle').addEventListener('change', handleAutoThemeToggle);
    document.getElementById('autoVibe').addEventListener('change', toggleAutoVibe);
    document.getElementById('focusMode').addEventListener('change', toggleFocusMode);
    document.getElementById('audioControl').addEventListener('click', toggleAudio);
    document.getElementById('nextSongBtn').addEventListener('click', nextSong);
    document.getElementById('saveMoodBtn').addEventListener('click', saveMood);
    document.getElementById('viewSavedBtn').addEventListener('click', showGallery);
    document.getElementById('closeGalleryBtn').addEventListener('click', () => {
        document.getElementById('savedGallery').style.display = 'none';
    });
    document.getElementById('audioOverlay').addEventListener('click', enableAudio);

    // New feature event listeners
    document.getElementById('customQuotesBtn').addEventListener('click', showCustomQuotesModal);
    document.getElementById('closeQuotesModalBtn').addEventListener('click', closeCustomQuotesModal);
    document.getElementById('addQuoteBtn').addEventListener('click', addUserQuote);
    document.getElementById('importQuotesBtn').addEventListener('click', importQuotes);
    document.getElementById('exportQuotesBtn').addEventListener('click', exportQuotes);

    document.getElementById('themeBuilderBtn').addEventListener('click', showThemeBuilderModal);
    document.getElementById('closeThemeBuilderBtn').addEventListener('click', closeThemeBuilderModal);
    document.getElementById('saveCustomThemeBtn').addEventListener('click', saveCustomTheme);
    document.getElementById('applyCustomThemeBtn').addEventListener('click', () => {
        updateThemePreview();
        applyCustomThemePreview();
    });

    // Theme builder live preview
    ['bgColor1', 'bgColor2', 'accentColor', 'blurSlider', 'contrastSlider', 'fontSelect'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateThemePreview);
    });

    document.getElementById('adaptiveThemeToggle').addEventListener('click', toggleAdaptiveTheme);

    // Visual enhancement toggles
    document.getElementById('ambientLightingToggle').addEventListener('change', handleAmbientLightingToggle);
    document.getElementById('motionTrailsToggle').addEventListener('change', handleMotionTrailsToggle);
    document.getElementById('glassDistortionToggle').addEventListener('change', handleGlassDistortionToggle);
    document.getElementById('customCursorToggle').addEventListener('change', handleCustomCursorToggle);
    document.getElementById('parallaxToggle').addEventListener('change', handleParallaxToggle);

    document.getElementById('journalDate').addEventListener('change', updateJournalDate);
    document.getElementById('journalEntry').addEventListener('input', () => {
        // Auto-save after 2 seconds of inactivity
        clearTimeout(window.journalSaveTimeout);
        window.journalSaveTimeout = setTimeout(saveJournalEntry, 2000);
    });
    document.getElementById('saveJournalBtn').addEventListener('click', saveJournalEntry);
    document.getElementById('prevDayBtn').addEventListener('click', () => navigateJournal(-1));
    document.getElementById('nextDayBtn').addEventListener('click', () => navigateJournal(1));
    document.getElementById('exportJournalBtn').addEventListener('click', exportJournal);

    document.addEventListener('keydown', handleKeydown);

    // Global visual enhancement event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);

    // Initialize visual enhancements based on settings
    if (ambientLightingEnabled) {
        updateAmbientLighting();
        setInterval(updateAmbientLighting, 100); // Update every 100ms for smooth animation
    }

    if (motionTrailsEnabled) {
        initMotionTrailsCanvas();
    }

    if (customCursorEnabled && !isTouchDevice) {
        initCustomCursor();
        animateCursor();
        document.body.style.cursor = 'none';
    }

    if (parallaxEnabled) {
        animateParallax();
    }

    // Set initial checkbox states
    document.getElementById('ambientLightingToggle').checked = ambientLightingEnabled;
    document.getElementById('motionTrailsToggle').checked = motionTrailsEnabled;
    document.getElementById('glassDistortionToggle').checked = glassDistortionEnabled;
    document.getElementById('customCursorToggle').checked = customCursorEnabled;
    document.getElementById('parallaxToggle').checked = parallaxEnabled;

    // Expose visuals API globally for other systems
    window.visuals = visuals;
});
