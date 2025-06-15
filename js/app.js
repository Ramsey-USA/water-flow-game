// ======= Adjustable Player Jump Settings =======
let maxJump = 420;    // Maximum jump height in px (adjustable)
let jumpForce = 12;   // Jump force per frame (adjustable)
let gravity = 2;    // Gravity strength (adjustable)
let groundLevel = 80; // Ground Y position (adjustable)
let playerBottom = groundLevel;
let isJumping = false;

// ======= Game Elements and State =======
const gameContainer = document.getElementById('game-container');
const player = document.getElementById('player');
const scoreBar = document.getElementById('score-bar');
const scoreLabel = document.getElementById('score-label');
const messageOverlay = document.getElementById('message-overlay');
const startButton = document.getElementById('start-button');
const gameOverOverlay = document.getElementById('game-over-overlay');
const finalScoreDisplay = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');
const pauseBtn = document.getElementById('pause-btn');
const WIN_SCORE = 50;

let gameRunning = false;
let paused = false;
let score = 0;
let lastSpeedIncreaseScore = 0;
let gameSpeed = 3;
let gameLoopId;
let obstacleInterval;
let collectibleInterval;

// ======= Utility Functions =======
function updateScoreBar() {
    const percent = Math.min((score / WIN_SCORE) * 100, 100);
    scoreBar.style.width = percent + '%';
    scoreLabel.textContent = `${score} / ${WIN_SCORE}`;
}

function isColliding(a, b) {
    const aRect = a.getBoundingClientRect();
    const bRect = b.getBoundingClientRect();
    return !(
        aRect.right < bRect.left ||
        aRect.left > bRect.right ||
        aRect.bottom < bRect.top ||
        aRect.top > bRect.bottom
    );
}

// ======= Game Control =======
document.addEventListener('DOMContentLoaded', () => {
    messageOverlay.classList.remove('hidden');
    gameOverOverlay.classList.add('hidden');
    updateScoreBar();
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

pauseBtn.addEventListener('click', () => {
    if (!gameRunning) return;
    paused = !paused;
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
    if (!paused) {
        gameLoopId = requestAnimationFrame(gameLoop);
    }
});

function startGame() {
    score = 0;
    lastSpeedIncreaseScore = 0;
    gameSpeed = 3;
    playerBottom = groundLevel;
    isJumping = false;
    updateScoreBar();

    // Remove obstacles/collectibles
    document.querySelectorAll('.obstacle, .collectible').forEach(el => el.remove());

    messageOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
    gameRunning = true;
    paused = false;
    pauseBtn.textContent = 'Pause';

    // Start game loop and object generation
    gameLoopId = requestAnimationFrame(gameLoop);
    startGeneratingObstacles();
    startGeneratingCollectibles();
}

// ======= Player Movement =======
document.addEventListener('keydown', handleJump);
gameContainer.addEventListener('mousedown', handleJump);

function handleJump(event) {
    if (!gameRunning || isJumping || paused) return;
    if (
        (event.type === 'keydown' && (event.code === 'Space' || event.code === 'ArrowUp' || event.key === ' ')) ||
        event.type === 'mousedown'
    ) {
        isJumping = true;
        let jumpHeight = 0;
        player.classList.add('jump');
        function jumpStep() {
            if (jumpHeight < maxJump) {
                playerBottom += jumpForce;
                player.style.bottom = playerBottom + 'px';
                jumpHeight += jumpForce;
                requestAnimationFrame(jumpStep);
            } else {
                fallStep();
            }
        }
        function fallStep() {
            if (playerBottom > groundLevel) {
                playerBottom -= gravity * 2;
                player.style.bottom = playerBottom + 'px';
                requestAnimationFrame(fallStep);
            } else {
                playerBottom = groundLevel;
                player.style.bottom = playerBottom + 'px';
                isJumping = false;
                player.classList.remove('jump');
            }
        }
        jumpStep();
    }
}

// ======= Obstacle & Collectible Generation =======
function startGeneratingObstacles() {
    generateObstacle();
    clearInterval(obstacleInterval);
    obstacleInterval = setInterval(generateObstacle, 1500);
}

function startGeneratingCollectibles() {
    generateCollectible();
    clearInterval(collectibleInterval);
    collectibleInterval = setInterval(generateCollectible, 1200);
}

function generateObstacle() {
    if (!gameRunning) return;
    const GAME_WIDTH = gameContainer.offsetWidth > 0 ? gameContainer.offsetWidth : 800;
    const rand = Math.random();
    let obstacle;
    if (rand < 0.33) {
        // Thorny bush (bottom row)
        obstacle = document.createElement('div');
        obstacle.className = 'obstacle';
        obstacle.dataset.type = 'bush';
        obstacle.style.width = '150px';
        obstacle.style.height = '150px';
        obstacle.style.background = "url('../assets/thorny_bush.png') center/contain no-repeat";
        obstacle.style.bottom = '80px';
    } else if (rand < 0.66) {
        // Pipe (middle row only)
        obstacle = document.createElement('div');
        obstacle.className = 'obstacle obstacle-pipe';
        obstacle.dataset.type = 'pipe';
        obstacle.style.width = '200px';
        obstacle.style.height = '200px';
        obstacle.style.background = "url('../assets/obstacle_pipe.png') center/contain no-repeat";
        // Middle row: between bottom and top row
        const gameHeight = gameContainer.offsetHeight;
        const scoreBar = document.getElementById('score-bar-container');
        const scoreBarRect = scoreBar.getBoundingClientRect();
        const gameRect = gameContainer.getBoundingClientRect();
        const topRowBottom = gameHeight - (scoreBarRect.bottom - gameRect.top) - scoreBarRect.height - 10;
        // Place pipe in the middle row (between bottom and topRowBottom)
        const minMiddle = groundLevel + 60;
        const maxMiddle = topRowBottom - 100;
        const pipeY = Math.max(minMiddle, Math.min(maxMiddle, gameHeight * 0.5));
        obstacle.style.bottom = `${pipeY}px`;
    } else {
        // Seagull (top/middle row, just below score bar)
        obstacle = document.createElement('div');
        obstacle.className = 'obstacle obstacle-seagull';
        obstacle.dataset.type = 'seagull';
        obstacle.style.width = '120px';
        obstacle.style.height = '120px';
        obstacle.style.background = "url('../assets/obstacle_seagull.png') center/contain no-repeat";
        const scoreBar = document.getElementById('score-bar-container');
        const gameRect = gameContainer.getBoundingClientRect();
        const scoreBarRect = scoreBar.getBoundingClientRect();
        // Top row: just below the score bar, with a buffer
        const topRowBottom = gameRect.height - (scoreBarRect.bottom - gameRect.top) - scoreBarRect.height - 10;
        // Middle/top: randomize between topRowBottom and 80% of game height
        const minY = topRowBottom;
        const maxY = gameRect.height * 0.8;
        const seagullY = Math.random() * (maxY - minY) + minY;
        obstacle.style.bottom = `${seagullY}px`;
    }
    obstacle._x = GAME_WIDTH;
    obstacle.style.left = '0';
    obstacle.style.transform = `translateX(${obstacle._x}px)`;
    gameContainer.appendChild(obstacle);
}

function generateCollectible() {
    if (!gameRunning) return;
    const GAME_WIDTH = gameContainer.offsetWidth > 0 ? gameContainer.offsetWidth : 800;
    const collectibleType = Math.random() < 0.8 ? 'droplet' : 'barrel';
    const collectible = document.createElement('div');
    if (collectibleType === 'barrel') {
        // Barrel (bottom row)
        collectible.className = 'collectible collectible-barrel';
        collectible.style.width = '100px';
        collectible.style.height = '100px';
        collectible.style.background = "url('../assets/water_barrel.png') center/contain no-repeat";
        collectible.style.bottom = '80px';
    } else {
        // Droplet (middle/top row, never bottom)
        collectible.className = 'collectible';
        collectible.style.width = '66px';
        collectible.style.height = '66px';
        collectible.style.background = "url('../assets/water_drop.png') center/contain no-repeat";
        const scoreBar = document.getElementById('score-bar-container');
        const gameRect = gameContainer.getBoundingClientRect();
        const scoreBarRect = scoreBar.getBoundingClientRect();
        // Top row: just below the score bar, with a buffer
        const topRowBottom = gameRect.height - (scoreBarRect.bottom - gameRect.top) - scoreBarRect.height - 10;
        // Middle/top: randomize between topRowBottom and 80% of game height
        const minY = topRowBottom;
        const maxY = gameRect.height * 0.8;
        const dropletY = Math.random() * (maxY - minY) + minY;
        collectible.style.bottom = `${dropletY}px`;
    }
    collectible._x = GAME_WIDTH;
    collectible.style.left = '0';
    collectible.style.transform = `translateX(${collectible._x}px)`;
    gameContainer.appendChild(collectible);
}

// ======= Game Loop =======
function gameLoop() {
    if (!gameRunning || paused) return;

    // Player jump physics
    // (Jump logic is now adjustable via maxJump, jumpForce, gravity, groundLevel)
    // The jump logic is handled in handleJump()

    // Move obstacles
    document.querySelectorAll('.obstacle').forEach(obstacle => {
        obstacle._x -= gameSpeed;
        obstacle.style.transform = `translateX(${obstacle._x}px)`;

        // Collision detection
        if (isColliding(player, obstacle)) {
            if (obstacle.dataset.type === 'seagull') {
                score = Math.max(0, score - 3);
            } else if (obstacle.dataset.type === 'pipe') {
                score = Math.max(0, score - 2);
            } else {
                score = Math.max(0, score - 2);
            }
            updateScoreBar();
            obstacle.remove();
        }

        if (obstacle._x < -100) {
            obstacle.remove();
        }
    });

    // Move collectibles
    document.querySelectorAll('.collectible').forEach(collectible => {
        collectible._x -= gameSpeed;
        collectible.style.transform = `translateX(${collectible._x}px)`;

        if (isColliding(player, collectible)) {
            collectible.remove();
            if (collectible.classList.contains('collectible-barrel')) {
                score += 5;
            } else {
                score++;
            }
            updateScoreBar();

            // Increase speed every 10 points
            if (score % 10 === 0 && score !== 0 && score !== lastSpeedIncreaseScore) {
                gameSpeed += 1.5;
                lastSpeedIncreaseScore = score;
            }

            // Win condition
            if (score >= WIN_SCORE) {
                endGame(true);
            }
        }

        if (collectible._x < -100) {
            collectible.remove();
        }
    });

    gameLoopId = requestAnimationFrame(gameLoop);
}

// ======= End Game =======
function endGame(won = false) {
    gameRunning = false;
    paused = false;
    cancelAnimationFrame(gameLoopId);
    clearInterval(obstacleInterval);
    clearInterval(collectibleInterval);

    finalScoreDisplay.textContent = score;
    gameOverOverlay.classList.remove('hidden');
    const gameOverContent = document.getElementById('game-over-content');
    if (won) {
        gameOverContent.querySelector('h2').textContent = "You Win!";
        gameOverContent.querySelector('p').innerHTML =
            `You delivered <span id="final-score">${score}</span> drops of clean water!<br>Thank you for making a difference!`;
    } else {
        gameOverContent.querySelector('h2').textContent = "Game Over!";
        gameOverContent.querySelector('p').innerHTML =
            `You delivered <span id="final-score">${score}</span> drops of clean water!`;
    }
}