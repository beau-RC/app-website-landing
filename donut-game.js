/**
 * Donut Swipe Game
 * Swipe left to toss, swipe right to eat
 * Collect 6 donuts to fill your box!
 */

// Donut data with variety of flavors and colors
const DONUT_DATA = [
    { name: "Strawberry Glazed", flavor: "Sweet & Fruity", color: "#ff6b9d", topping: "#fff", sprinkles: true },
    { name: "Chocolate Dream", flavor: "Rich Chocolate", color: "#5c3d2e", topping: "#8B4513", sprinkles: false },
    { name: "Vanilla Cloud", flavor: "Classic Vanilla", color: "#fff8e7", topping: "#ffd700", sprinkles: true },
    { name: "Blueberry Bliss", flavor: "Berry Fresh", color: "#7c83fd", topping: "#4834d4", sprinkles: false },
    { name: "Caramel Crunch", flavor: "Buttery Caramel", color: "#f39c12", topping: "#d35400", sprinkles: true },
    { name: "Mint Chocolate", flavor: "Cool & Refreshing", color: "#1abc9c", topping: "#5c3d2e", sprinkles: false },
    { name: "Raspberry Ripple", flavor: "Tangy Berry", color: "#e84393", topping: "#fd79a8", sprinkles: true },
    { name: "Maple Bacon", flavor: "Sweet & Savory", color: "#e17055", topping: "#d63031", sprinkles: false },
    { name: "Lemon Zest", flavor: "Citrus Burst", color: "#ffeaa7", topping: "#fdcb6e", sprinkles: true },
    { name: "Cookies & Cream", flavor: "Creamy Delight", color: "#dfe6e9", topping: "#2d3436", sprinkles: false },
    { name: "Rainbow Sprinkle", flavor: "Party Time!", color: "#ff9ff3", topping: "#fff", sprinkles: true },
    { name: "Boston Cream", flavor: "Custard Filled", color: "#5c3d2e", topping: "#f8b739", sprinkles: false },
    { name: "Apple Cider", flavor: "Fall Favorite", color: "#cd853f", topping: "#8b4513", sprinkles: true },
    { name: "Coconut Paradise", flavor: "Tropical Dream", color: "#fff", topping: "#f5f5dc", sprinkles: false },
    { name: "Red Velvet", flavor: "Luxurious", color: "#c0392b", topping: "#ecf0f1", sprinkles: false },
];

// Game state
let gameState = {
    donuts: [],
    collectedDonuts: [],
    currentCardIndex: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    targetDonuts: 6,
};

// DOM Elements
const cardStack = document.getElementById('cardStack');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const tossIndicator = document.getElementById('tossIndicator');
const eatIndicator = document.getElementById('eatIndicator');
const btnToss = document.getElementById('btnToss');
const btnEat = document.getElementById('btnEat');
const donutBoxOverlay = document.getElementById('donutBoxOverlay');
const donutsInBox = document.getElementById('donutsInBox');
const confettiContainer = document.getElementById('confettiContainer');
const btnPlayAgain = document.getElementById('btnPlayAgain');
const emptyState = document.getElementById('emptyState');
const btnReload = document.getElementById('btnReload');
const progressBar = document.querySelector('.progress-bar');

// Generate SVG donut image
function generateDonutSVG(donut, size = 300) {
    const sprinkleColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#fd79a8', '#00b894'];

    let sprinklesHTML = '';
    if (donut.sprinkles) {
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const radius = 70 + Math.random() * 30;
            const x = 150 + Math.cos(angle) * radius;
            const y = 150 + Math.sin(angle) * radius;
            const rotation = Math.random() * 360;
            const color = sprinkleColors[Math.floor(Math.random() * sprinkleColors.length)];
            sprinklesHTML += `<rect x="${x-4}" y="${y-1.5}" width="8" height="3" rx="1.5" fill="${color}" transform="rotate(${rotation}, ${x}, ${y})"/>`;
        }
    }

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="${size}" height="${size}">
            <defs>
                <radialGradient id="donutGrad_${donut.name.replace(/\s/g, '')}" cx="30%" cy="30%">
                    <stop offset="0%" style="stop-color:${adjustColor(donut.color, 30)}"/>
                    <stop offset="100%" style="stop-color:${donut.color}"/>
                </radialGradient>
                <radialGradient id="glazeGrad_${donut.name.replace(/\s/g, '')}" cx="30%" cy="30%">
                    <stop offset="0%" style="stop-color:${adjustColor(donut.topping, 40)}"/>
                    <stop offset="100%" style="stop-color:${donut.topping}"/>
                </radialGradient>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="3" dy="8" stdDeviation="8" flood-opacity="0.3"/>
                </filter>
            </defs>

            <!-- Donut base (torus shape) -->
            <ellipse cx="150" cy="160" rx="110" ry="100" fill="url(#donutGrad_${donut.name.replace(/\s/g, '')})" filter="url(#shadow)"/>

            <!-- Inner shadow for depth -->
            <ellipse cx="150" cy="155" rx="105" ry="95" fill="none" stroke="${adjustColor(donut.color, -30)}" stroke-width="8" opacity="0.3"/>

            <!-- Glaze/Frosting -->
            <path d="M 50 140
                     Q 50 80, 150 70
                     Q 250 80, 250 140
                     Q 260 180, 200 200
                     Q 150 210, 100 200
                     Q 40 180, 50 140 Z"
                  fill="url(#glazeGrad_${donut.name.replace(/\s/g, '')})"
                  opacity="0.95"/>

            <!-- Glaze highlight -->
            <ellipse cx="120" cy="110" rx="40" ry="20" fill="white" opacity="0.3"/>

            <!-- Donut hole -->
            <ellipse cx="150" cy="150" rx="38" ry="35" fill="#f8b739"/>
            <ellipse cx="150" cy="150" rx="35" ry="32" fill="#d68910"/>
            <ellipse cx="150" cy="148" rx="30" ry="28" fill="#b7950b" opacity="0.7"/>

            <!-- Sprinkles -->
            ${sprinklesHTML}
        </svg>
    `;

    return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

// Helper to lighten/darken colors
function adjustColor(color, amount) {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);

    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;

    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Shuffle array
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Initialize game
function initGame() {
    gameState = {
        donuts: shuffleArray([...DONUT_DATA]),
        collectedDonuts: [],
        currentCardIndex: 0,
        isDragging: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        targetDonuts: 6,
    };

    // Reset UI
    cardStack.innerHTML = '';
    donutsInBox.innerHTML = '';
    confettiContainer.innerHTML = '';
    donutBoxOverlay.classList.remove('visible');
    emptyState.classList.remove('visible');
    progressBar.classList.remove('complete');
    updateProgress();

    // Create initial cards
    renderCards();
}

// Create a donut card element
function createCardElement(donut, index) {
    const card = document.createElement('div');
    card.className = 'donut-card';
    card.dataset.index = index;

    card.innerHTML = `
        <img class="donut-image" src="${generateDonutSVG(donut)}" alt="${donut.name}" draggable="false">
        <div class="donut-info">
            <h3 class="donut-name">${donut.name}</h3>
            <p class="donut-flavor">${donut.flavor}</p>
        </div>
    `;

    // Add event listeners
    addCardEventListeners(card);

    return card;
}

// Render visible cards
function renderCards() {
    cardStack.innerHTML = '';

    const startIndex = gameState.currentCardIndex;
    const visibleCount = Math.min(4, gameState.donuts.length - startIndex);

    if (visibleCount === 0) {
        emptyState.classList.add('visible');
        return;
    }

    // Add cards in reverse order so the first one is on top
    for (let i = visibleCount - 1; i >= 0; i--) {
        const donutIndex = startIndex + i;
        if (donutIndex < gameState.donuts.length) {
            const card = createCardElement(gameState.donuts[donutIndex], donutIndex);
            cardStack.appendChild(card);
        }
    }
}

// Add event listeners to a card
function addCardEventListeners(card) {
    // Touch events
    card.addEventListener('touchstart', handleDragStart, { passive: false });
    card.addEventListener('touchmove', handleDragMove, { passive: false });
    card.addEventListener('touchend', handleDragEnd);

    // Mouse events
    card.addEventListener('mousedown', handleDragStart);
}

// Get top card
function getTopCard() {
    return cardStack.querySelector('.donut-card:last-child');
}

// Handle drag start
function handleDragStart(e) {
    const card = getTopCard();
    if (!card || card !== e.currentTarget) return;

    e.preventDefault();

    gameState.isDragging = true;
    card.classList.add('dragging');

    const point = e.touches ? e.touches[0] : e;
    gameState.startX = point.clientX;
    gameState.startY = point.clientY;
    gameState.currentX = 0;
    gameState.currentY = 0;

    // Add global listeners
    if (!e.touches) {
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
    }
}

// Handle drag move
function handleDragMove(e) {
    if (!gameState.isDragging) return;

    e.preventDefault();

    const card = getTopCard();
    if (!card) return;

    const point = e.touches ? e.touches[0] : e;
    gameState.currentX = point.clientX - gameState.startX;
    gameState.currentY = point.clientY - gameState.startY;

    // Calculate rotation based on horizontal movement
    const rotation = gameState.currentX * 0.1;
    const maxRotation = 30;
    const clampedRotation = Math.max(-maxRotation, Math.min(maxRotation, rotation));

    // Apply transform
    card.style.transform = `translateX(${gameState.currentX}px) translateY(${gameState.currentY}px) rotate(${clampedRotation}deg)`;

    // Show indicators based on swipe direction
    const threshold = 50;
    if (gameState.currentX < -threshold) {
        tossIndicator.classList.add('visible');
        eatIndicator.classList.remove('visible');
        tossIndicator.style.opacity = Math.min(1, Math.abs(gameState.currentX) / 150);
    } else if (gameState.currentX > threshold) {
        eatIndicator.classList.add('visible');
        tossIndicator.classList.remove('visible');
        eatIndicator.style.opacity = Math.min(1, Math.abs(gameState.currentX) / 150);
    } else {
        tossIndicator.classList.remove('visible');
        eatIndicator.classList.remove('visible');
    }
}

// Handle drag end
function handleDragEnd(e) {
    if (!gameState.isDragging) return;

    gameState.isDragging = false;

    const card = getTopCard();
    if (!card) return;

    card.classList.remove('dragging');

    // Remove global listeners
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);

    // Hide indicators
    tossIndicator.classList.remove('visible');
    eatIndicator.classList.remove('visible');

    // Determine action based on swipe distance
    const swipeThreshold = 100;

    if (gameState.currentX < -swipeThreshold) {
        // Toss (swipe left)
        swipeCard('left');
    } else if (gameState.currentX > swipeThreshold) {
        // Eat (swipe right)
        swipeCard('right');
    } else {
        // Reset card position
        card.style.transform = '';
    }
}

// Swipe card programmatically
function swipeCard(direction) {
    const card = getTopCard();
    if (!card) return;

    const donutIndex = parseInt(card.dataset.index);
    const donut = gameState.donuts[donutIndex];

    // Add animation class
    card.classList.add(direction === 'left' ? 'swipe-left' : 'swipe-right');

    // Add feedback animation to stack
    cardStack.classList.add(direction === 'left' ? 'shake' : 'yummy');
    setTimeout(() => {
        cardStack.classList.remove('shake', 'yummy');
    }, 300);

    if (direction === 'right') {
        // Collect the donut
        gameState.collectedDonuts.push(donut);
        updateProgress();

        // Check if we've collected enough
        if (gameState.collectedDonuts.length >= gameState.targetDonuts) {
            setTimeout(() => showCelebration(), 500);
            return;
        }
    }

    // Move to next card after animation
    setTimeout(() => {
        gameState.currentCardIndex++;
        renderCards();
    }, 400);
}

// Update progress bar
function updateProgress() {
    const count = gameState.collectedDonuts.length;
    const percentage = (count / gameState.targetDonuts) * 100;

    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `${count} / ${gameState.targetDonuts} donuts eaten`;

    if (count >= gameState.targetDonuts) {
        progressBar.classList.add('complete');
    }
}

// Show celebration
function showCelebration() {
    donutBoxOverlay.classList.add('visible');

    // Create confetti
    createConfetti();

    // Add donuts to box with staggered animation
    gameState.collectedDonuts.forEach((donut, index) => {
        const miniDonut = document.createElement('img');
        miniDonut.className = 'mini-donut';
        miniDonut.src = generateDonutSVG(donut, 80);
        miniDonut.alt = donut.name;
        miniDonut.style.animationDelay = `${1.5 + index * 0.15}s`;
        donutsInBox.appendChild(miniDonut);
    });
}

// Create confetti particles
function createConfetti() {
    const colors = ['#ff6b9d', '#ffd700', '#4ecdc4', '#ff6b6b', '#45b7d1', '#6c5ce7', '#fd79a8', '#00b894'];
    const shapes = ['circle', 'square', 'triangle'];

    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';

        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const left = Math.random() * 100;
        const delay = Math.random() * 2;
        const duration = 2 + Math.random() * 2;
        const size = 8 + Math.random() * 8;

        confetti.style.cssText = `
            left: ${left}%;
            animation-delay: ${delay}s;
            animation-duration: ${duration}s;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            ${shape === 'circle' ? 'border-radius: 50%;' : ''}
            ${shape === 'triangle' ? `
                width: 0;
                height: 0;
                background: transparent;
                border-left: ${size/2}px solid transparent;
                border-right: ${size/2}px solid transparent;
                border-bottom: ${size}px solid ${color};
            ` : ''}
        `;

        confettiContainer.appendChild(confetti);
    }
}

// Button event listeners
btnToss.addEventListener('click', () => swipeCard('left'));
btnEat.addEventListener('click', () => swipeCard('right'));
btnPlayAgain.addEventListener('click', initGame);
btnReload.addEventListener('click', initGame);

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (donutBoxOverlay.classList.contains('visible')) {
        if (e.key === 'Enter' || e.key === ' ') {
            initGame();
        }
        return;
    }

    if (e.key === 'ArrowLeft') {
        swipeCard('left');
    } else if (e.key === 'ArrowRight') {
        swipeCard('right');
    }
});

// Initialize game on load
document.addEventListener('DOMContentLoaded', initGame);
