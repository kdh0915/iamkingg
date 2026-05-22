const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayScore = document.getElementById("overlayScore");

const GRAVITY = 0.18;
const JUMP_FORCE = -4.2;
const MAX_FALL_SPEED = 3.2;
const PIPE_SPEED = 1.4;
const PIPE_GAP = 200;
const PIPE_WIDTH = 52;
const PIPE_SPAWN_INTERVAL = 110;

const bird = {
  x: 80,
  y: canvas.height / 2,
  width: 34,
  height: 24,
  velocity: 0,
};

let pipes = [];
let frameCount = 0;
let score = 0;
let gameState = "ready";

function resetGame() {
  bird.y = canvas.height / 2;
  bird.velocity = 0;
  pipes = [];
  frameCount = 0;
  score = 0;
  scoreEl.textContent = "0";
  overlay.classList.add("hidden");
}

function startGame() {
  if (gameState === "ready" || gameState === "gameover") {
    resetGame();
    gameState = "playing";
    overlay.classList.add("hidden");
  }
}

function jump() {
  if (gameState === "playing") {
    bird.velocity = JUMP_FORCE;
  }
}

function spawnPipe() {
  const minTop = 50;
  const maxTop = canvas.height - PIPE_GAP - 50;
  const topHeight = minTop + Math.random() * (maxTop - minTop);

  pipes.push({
    x: canvas.width,
    topHeight,
    passed: false,
  });
}

function updateBird() {
  bird.velocity += GRAVITY;
  bird.velocity = Math.min(bird.velocity, MAX_FALL_SPEED);
  bird.y += bird.velocity;

  if (bird.y + bird.height > canvas.height - 40) {
    bird.y = canvas.height - 40 - bird.height;
    endGame();
  }
  if (bird.y < 0) {
    bird.y = 0;
    bird.velocity = 0;
  }
}

function updatePipes() {
  frameCount++;
  if (frameCount % PIPE_SPAWN_INTERVAL === 0) {
    spawnPipe();
  }

  for (let i = pipes.length - 1; i >= 0; i--) {
    const pipe = pipes[i];
    pipe.x -= PIPE_SPEED;

    if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
      pipe.passed = true;
      score++;
      scoreEl.textContent = score;
    }

    if (pipe.x + PIPE_WIDTH < 0) {
      pipes.splice(i, 1);
    }
  }
}

function rectCollision(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function checkCollisions() {
  const bx = bird.x;
  const by = bird.y;
  const bw = bird.width;
  const bh = bird.height;
  const groundY = canvas.height - 40;

  for (const pipe of pipes) {
    const topPipe = { x: pipe.x, y: 0, w: PIPE_WIDTH, h: pipe.topHeight };
    const bottomPipe = {
      x: pipe.x,
      y: pipe.topHeight + PIPE_GAP,
      w: PIPE_WIDTH,
      h: canvas.height - (pipe.topHeight + PIPE_GAP) - 40,
    };

    if (
      rectCollision(bx, by, bw, bh, topPipe.x, topPipe.y, topPipe.w, topPipe.h) ||
      rectCollision(bx, by, bw, bh, bottomPipe.x, bottomPipe.y, bottomPipe.w, bottomPipe.h)
    ) {
      endGame();
      return;
    }
  }

  if (by + bh >= groundY) {
    endGame();
  }
}

function endGame() {
  gameState = "gameover";
  overlayTitle.textContent = "Game Over";
  overlayScore.textContent = `Score: ${score}`;
  overlay.classList.remove("hidden");
}

function drawBackground() {
  ctx.fillStyle = "#70c5ce";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ded895";
  ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
  ctx.fillStyle = "#73bf2e";
  ctx.fillRect(0, canvas.height - 40, canvas.width, 8);
}

function drawBird() {
  ctx.save();
  ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
  ctx.rotate(Math.min(bird.velocity * 0.08, Math.PI / 4));
  ctx.fillStyle = "#f7d308";
  ctx.beginPath();
  ctx.ellipse(0, 0, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(8, -4, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e65c00";
  ctx.beginPath();
  ctx.moveTo(bird.width / 2, 0);
  ctx.lineTo(bird.width / 2 + 10, 4);
  ctx.lineTo(bird.width / 2, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPipes() {
  ctx.fillStyle = "#73bf2e";
  ctx.strokeStyle = "#558c22";
  ctx.lineWidth = 3;

  for (const pipe of pipes) {
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
    ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
    ctx.fillRect(pipe.x - 4, pipe.topHeight - 24, PIPE_WIDTH + 8, 24);
    ctx.strokeRect(pipe.x - 4, pipe.topHeight - 24, PIPE_WIDTH + 8, 24);

    const bottomY = pipe.topHeight + PIPE_GAP;
    const bottomH = canvas.height - bottomY - 40;
    ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, bottomH);
    ctx.strokeRect(pipe.x, bottomY, PIPE_WIDTH, bottomH);
    ctx.fillRect(pipe.x - 4, bottomY, PIPE_WIDTH + 8, 24);
    ctx.strokeRect(pipe.x - 4, bottomY, PIPE_WIDTH + 8, 24);
  }
}

function drawReadyScreen() {
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.font = "bold 24px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Flappy Bird", canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = "16px sans-serif";
  ctx.fillText("스페이스바로 시작", canvas.width / 2, canvas.height / 2 + 20);
}

function gameLoop() {
  drawBackground();

  if (gameState === "ready") {
    drawBird();
    drawReadyScreen();
  } else if (gameState === "playing") {
    updateBird();
    updatePipes();
    checkCollisions();
    drawPipes();
    drawBird();
  } else if (gameState === "gameover") {
    drawPipes();
    drawBird();
  }

  requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (gameState === "ready") {
      startGame();
      jump();
    } else if (gameState === "playing") {
      jump();
    } else if (gameState === "gameover") {
      startGame();
      jump();
    }
  }
});

canvas.addEventListener("click", () => {
  if (gameState === "ready") {
    startGame();
    jump();
  } else if (gameState === "playing") {
    jump();
  } else if (gameState === "gameover") {
    startGame();
    jump();
  }
});

gameLoop();
