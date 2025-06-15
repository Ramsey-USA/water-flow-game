// Game Elements
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

// Game Variables
let gameRunning = false;
let score = 0;
let lastSpeedIncreaseScore = 0;
let gameSpeed = 3;
let playerBottom = 80;
let playerLeft = 50;
let isJumping = false;
let obstacleInterval;
let collectibleInterval;
let gameLoopId;
let jumpForce = 8;
let gravity = 0.3;
let jumpHeld = false;
let jumpStart = false;
let jumpPeak = 200; // max jump height
let jumpSpeed = 5;  // how fast to rise
let lastObstacleTime = 0;
const minObstacleInterval = 900;   // Minimum ms between obstacles
const maxObstacleInterval = 1600;  // Maximum ms between obstacles
let paused = false;

// --- Game Initialization and Control ---

document.addEventListener('DOMContentLoaded', () => {
    messageOverlay.classList.remove('hidden');
    gameOverOverlay.classList.add('hidden');
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

function startGame() {
    score = 0;
    lastSpeedIncreaseScore = 0;
    gameSpeed = 3;
    updateScoreBar();
    playerBottom = 80;
    player.style.bottom = playerBottom + 'px';
    isJumping = false;
    player.classList.remove('jump');

    // Remove obstacles/collectibles
    document.querySelectorAll('.obstacle, .collectible').forEach(el => el.remove());

    messageOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
    gameRunning = true;

    // Start game loop and object generation
    gameLoopId = requestAnimationFrame(gameLoop);
    startGeneratingObjects();
}

// Add listeners ONCE
document.addEventListener('keydown', jumpKeyDown);
document.addEventListener('keyup', jumpKeyUp);
gameContainer.addEventListener('mousedown', jumpMouseDown);
gameContainer.addEventListener('mouseup', jumpMouseUp);
gameContainer.addEventListener('touchstart', jumpMouseDown);
gameContainer.addEventListener('touchend', jumpMouseUp);

function jumpKeyDown(e) {
    if (!gameRunning) return;
    if ((e.code === 'Space' || e.code === 'ArrowUp' || e.key === ' ') && !jumpHeld) {
        jumpHeld = true;
        if (!isJumping) startJump();
    }
}
function jumpKeyUp(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === ' ') {
        jumpHeld = false;
    }
}
function jumpMouseDown(e) {
    if (!gameRunning) return;
    jumpHeld = true;
    if (!isJumping) startJump();
}
function jumpMouseUp(e) {
    jumpHeld = false;
}

function startJump() {
    isJumping = true;
    player.classList.add('jump');
    let jumpTop = playerBottom + jumpPeak;
    function jumpLoop() {
        // Continue rising while jumpHeld and not at max height
        if (jumpHeld && playerBottom < jumpTop) {
            playerBottom += jumpSpeed;
            player.style.bottom = playerBottom + 'px';
            requestAnimationFrame(jumpLoop);
        } else {
            fallDown();
        }
    }
    function fallDown() {
        if (playerBottom > 80) {
            playerBottom -= gravity * 8;
            player.style.bottom = playerBottom + 'px';
            requestAnimationFrame(fallDown);
        } else {
            playerBottom = 80;
            player.style.bottom = playerBottom + 'px';
            isJumping = false;
            player.classList.remove('jump');
        }
    }
    jumpLoop();
}

function updateScoreBar() {
    const percent = Math.min((score / WIN_SCORE) * 100, 100);
    scoreBar.style.width = percent + '%';
    scoreLabel.textContent = `${score} / ${WIN_SCORE}`;
}

function endGame(won = false) {
    gameRunning = false;
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

// --- Player Movement ---

// function handleJump(event) {
//     if ((event.code === 'Space' || event.type === 'click') && !isJumping && gameRunning) {
//         isJumping = true;
//         let jumpHeight = 0;
//         player.classList.add('jump');
//         const maxJump = 150;
//         const jumpStep = () => {
//             if (jumpHeight < maxJump) {
//                 playerBottom += jumpForce;
//                 player.style.bottom = playerBottom + 'px';
//                 jumpHeight += jumpForce;
//                 requestAnimationFrame(jumpStep);
//             } else {
//                 fallStep();
//             }
//         };
//         const fallStep = () => {
//             if (playerBottom > 80) {
//                 playerBottom -= gravity * 2;
//                 player.style.bottom = playerBottom + 'px';
//                 requestAnimationFrame(fallStep);
//             } else {
//                 playerBottom = 80;
//                 player.style.bottom = playerBottom + 'px';
//                 isJumping = false;
//                 player.classList.remove('jump');
//             }
//         };
//         jumpStep();
//     }
// }

// --- Obstacle & Collectible Generation ---

function scheduleNextObstacle() {
    if (!gameRunning) return;
    // Randomize the next gap, but always enforce a minimum
    const nextGap = Math.random() * (maxObstacleInterval - minObstacleInterval) + minObstacleInterval;
    setTimeout(() => {
        generateObstacle();
        scheduleNextObstacle();
    }, nextGap);
}

function generateObstacle() {
    if (!gameRunning) return;
    // Randomly pick obstacle type
    const rand = Math.random();
    let obstacle;
    if (rand < 0.33) {
        // Thorny bush
        obstacle = document.createElement('div');
        obstacle.className = 'obstacle';
        obstacle.dataset.type = 'bush';
        obstacle.style.width = '40px';
        obstacle.style.height = '60px';
        obstacle.style.background = "url('../assets/thorny_bush.png') center/contain no-repeat";
        obstacle.style.left = '800px';
        obstacle.style.bottom = '80px';
    } else if (rand < 0.66) {
        // Pipe
        obstacle = document.createElement('div');
        obstacle.className = 'obstacle obstacle-pipe';
        obstacle.dataset.type = 'pipe';
        obstacle.style.width = '70px';
        obstacle.style.height = '100px';
        obstacle.style.background = "url('../assets/obstacle_pipe.png') center/contain no-repeat";
        obstacle.style.left = '800px';
        obstacle.style.bottom = '80px';
    } else {
        // Seagull
        obstacle = document.createElement('div');
        obstacle.className = 'obstacle obstacle-seagull';
        obstacle.dataset.type = 'seagull';
        obstacle.style.width = '70px';
        obstacle.style.height = '48px';
        obstacle.style.background = "url('../assets/obstacle_seagull.png') center/contain no-repeat";
        obstacle.style.left = '800px';
        obstacle.style.bottom = '180px';
    }
    gameContainer.appendChild(obstacle);
}

// Call this at game start and on interval
function startGeneratingObstacles() {
    generateObstacle();
    obstacleInterval = setInterval(generateObstacle, 1500);
}

function generateCollectible() {
    if (!gameRunning) return;
    const collectibleType = Math.random() < 0.8 ? 'droplet' : 'barrel'; // 80% droplet, 20% barrel
    const collectible = document.createElement('div');
    if (collectibleType === 'barrel') {
        collectible.className = 'collectible collectible-barrel';
        collectible.style.width = '38px';
        collectible.style.height = '38px';
        collectible.style.background = "url('../assets/water_barrel.png') center/contain no-repeat";
        collectible.style.left = '800px';
        collectible.style.bottom = '80px'; // rolls on the ground
    } else {
        collectible.className = 'collectible';
        collectible.style.width = '30px';
        collectible.style.height = '30px';
        collectible.style.background = "url('../assets/water_drop.png') center/contain no-repeat";
        collectible.style.left = '800px';
        collectible.style.bottom = `${Math.random() * 100 + 100}px`; // appears in the air
    }
    gameContainer.appendChild(collectible);
}

function startGeneratingObjects() {
    // Start the obstacle scheduling loop
    lastObstacleTime = Date.now() - minObstacleInterval; // Allow immediate first spawn
    scheduleNextObstacle();

    // Collectibles can use a regular interval or similar random scheduling
    collectibleInterval = setInterval(() => {
        if (gameRunning) generateCollectible();
    }, 1500 / gameSpeed);
}

// --- Game Loop (Main Update Function) ---

function gameLoop() {
    if (!gameRunning || paused) return;

    // Gravity
    if (!isJumping && playerBottom > 80) {
        playerBottom -= gravity * 8;
        if (playerBottom < 80) playerBottom = 80;
        player.style.bottom = playerBottom + 'px';
    }

    // Move obstacles and collectibles
    document.querySelectorAll('.obstacle').forEach(obstacle => {
        let currentLeft = parseFloat(obstacle.style.left);
        obstacle.style.left = (currentLeft - gameSpeed) + 'px';

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

        if (currentLeft < -100) {
            obstacle.remove();
        }
    });

    document.querySelectorAll('.collectible').forEach(collectible => {
        let currentLeft = parseFloat(collectible.style.left);
        collectible.style.left = (currentLeft - gameSpeed) + 'px';

        if (isColliding(player, collectible)) {
            collectible.remove();
            if (collectible.classList.contains('collectible-barrel')) {
                score += 5; // Water barrel adds 5 points
            } else {
                score++; // Regular droplet adds 1 point
            }
            updateScoreBar();

            // Increase speed every 10 points
            if (score % 10 === 0 && score !== 0 && score !== lastSpeedIncreaseScore) {
                gameSpeed += 1.5;
                lastSpeedIncreaseScore = score;
            }

            // Win condition
            if (score >= WIN_SCORE) {
                endGame(true); // Pass true to indicate a win
            }
        }

        if (currentLeft < -collectible.offsetWidth) {
            collectible.remove();
        }
    });

    gameLoopId = requestAnimationFrame(gameLoop);
}

// --- Collision Detection ---

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

pauseBtn.addEventListener('click', () => {
    if (!gameRunning) return;
    paused = !paused;
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
    if (!paused) {
        gameLoopId = requestAnimationFrame(gameLoop);
    }
});