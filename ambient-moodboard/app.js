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
        currentTheme
    };
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Error saving settings:', error);
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

// Keyboard handling
function handleKeydown(event) {
    if (event.key === 'Escape' && document.body.classList.contains('focus-mode')) {
        document.getElementById('focusMode').checked = false;
        toggleFocusMode();
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
    document.addEventListener('keydown', handleKeydown);
});
