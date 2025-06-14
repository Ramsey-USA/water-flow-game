// Game Elements
const gameContainer = document.getElementById('game-container');
const player = document.getElementById('player');
const scoreDisplay = document.getElementById('score');
const messageOverlay = document.getElementById('message-overlay');
const startButton = document.getElementById('start-button');
const gameOverOverlay = document.getElementById('game-over-overlay');
const finalScoreDisplay = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');

// Game Variables
let gameRunning = false;
let score = 0;
let playerBottom = 80;
let playerLeft = 50;
let isJumping = false;
let gameSpeed = 3; // initial speed
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
let lastSpeedIncreaseScore = 0; // Track last score at which speed increased
const minObstacleInterval = 900;   // Minimum ms between obstacles
const maxObstacleInterval = 1600;  // Maximum ms between obstacles

// --- Game Initialization and Control ---

document.addEventListener('DOMContentLoaded', () => {
    messageOverlay.classList.remove('hidden');
    gameOverOverlay.classList.add('hidden');
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

function startGame() {
    score = 0;
    scoreDisplay.textContent = 'Score: 0';
    playerBottom = 80;
    player.style.bottom = playerBottom + 'px';
    isJumping = false;
    player.classList.remove('jump');
    gameSpeed = 3;

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

function endGame() {
    gameRunning = false;
    cancelAnimationFrame(gameLoopId);
    clearInterval(obstacleInterval);
    clearInterval(collectibleInterval);

    finalScoreDisplay.textContent = score;
    gameOverOverlay.classList.remove('hidden');
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
    const now = Date.now();
    if (now - lastObstacleTime < minObstacleInterval) return;
    lastObstacleTime = now;

    // Randomly choose obstacle type: bush or pipe
    const obstacleType = Math.random() < 0.7 ? 'bush' : 'pipe'; // 70% bush, 30% pipe
    const obstacle = document.createElement('div');
    if (obstacleType === 'pipe') {
        obstacle.className = 'obstacle obstacle-pipe';
        obstacle.style.width = '70px';
        obstacle.style.height = '100px';
        obstacle.style.background = "url('../assets/obstacle_pipe.png') center/contain no-repeat";
        obstacle.style.bottom = '80px';
    } else {
        obstacle.className = 'obstacle';
        obstacle.style.width = '40px';
        obstacle.style.height = '60px';
        obstacle.style.background = "url('../assets/thorny_bush.png') center/contain no-repeat";
        obstacle.style.bottom = '80px';
    }
    obstacle.style.left = '800px';
    gameContainer.appendChild(obstacle);
}

function generateCollectible() {
    if (!gameRunning) return;
    const collectible = document.createElement('div');
    collectible.className = 'collectible';
    collectible.style.left = '800px';
    collectible.style.bottom = `${Math.random() * 100 + 100}px`;
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
    if (!gameRunning) return;

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
            endGame();
        }

        if (currentLeft < -obstacle.offsetWidth) {
            obstacle.remove();
        }
    });

    document.querySelectorAll('.collectible').forEach(collectible => {
        let currentLeft = parseFloat(collectible.style.left);
        collectible.style.left = (currentLeft - gameSpeed) + 'px';

        if (isColliding(player, collectible)) {
            collectible.remove();
            score++;
            scoreDisplay.textContent = 'Score: ' + score;

            // Increase speed every 10 points
            if (score % 10 === 0 && score !== 0 && score !== lastSpeedIncreaseScore) {
                gameSpeed += 1.5;
                lastSpeedIncreaseScore = score;
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