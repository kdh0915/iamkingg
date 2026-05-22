const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayScore = document.getElementById("overlayScore");
const gameContainer = document.querySelector(".game-container");

// 새 물리: 점수와 무관하게 항상 동일
const BIRD = {
  gravity: 0.25,
  jumpForce: -5,
  maxFallSpeed: 4,
};

// 장애물 속도만 5점마다 증가 (시작은 느리게)
const PIPE = {
  startSpeed: 1.35,
  speedPerLevel: 0.2,
  gap: 200,
  width: 52,
  spawnInterval: 105,
};

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
let lastInputTime = 0;
let lastDifficultyLevel = 0;

function getSpeedLevel() {
  return Math.floor(score / 5);
}

function getPipeSpeed() {
  return PIPE.startSpeed + getSpeedLevel() * PIPE.speedPerLevel;
}

function resetGame() {
  bird.y = canvas.height / 2;
  bird.velocity = 0;
  pipes = [];
  frameCount = 0;
  score = 0;
  lastDifficultyLevel = 0;
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
    bird.velocity = BIRD.jumpForce;
  }
}

function spawnPipe() {
  const minTop = 50;
  const maxTop = canvas.height - PIPE.gap - 50;
  const topHeight = minTop + Math.random() * (maxTop - minTop);

  pipes.push({
    x: canvas.width,
    topHeight,
    passed: false,
  });
}

function updateBird() {
  bird.velocity += BIRD.gravity;
  bird.velocity = Math.min(bird.velocity, BIRD.maxFallSpeed);
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
  const pipeSpeed = getPipeSpeed();
  frameCount++;

  if (frameCount % PIPE.spawnInterval === 0) {
    spawnPipe();
  }

  for (let i = pipes.length - 1; i >= 0; i--) {
    const pipe = pipes[i];
    pipe.x -= pipeSpeed;

    if (!pipe.passed && pipe.x + PIPE.width < bird.x) {
      pipe.passed = true;
      score++;
      scoreEl.textContent = score;

      const newLevel = getSpeedLevel();
      if (newLevel > lastDifficultyLevel) {
        lastDifficultyLevel = newLevel;
      }
    }

    if (pipe.x + PIPE.width < 0) {
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
    const topPipe = { x: pipe.x, y: 0, w: PIPE.width, h: pipe.topHeight };
    const bottomPipe = {
      x: pipe.x,
      y: pipe.topHeight + PIPE.gap,
      w: PIPE.width,
      h: canvas.height - (pipe.topHeight + PIPE.gap) - 40,
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
    ctx.fillRect(pipe.x, 0, PIPE.width, pipe.topHeight);
    ctx.strokeRect(pipe.x, 0, PIPE.width, pipe.topHeight);
    ctx.fillRect(pipe.x - 4, pipe.topHeight - 24, PIPE.width + 8, 24);
    ctx.strokeRect(pipe.x - 4, pipe.topHeight - 24, PIPE.width + 8, 24);

    const bottomY = pipe.topHeight + PIPE.gap;
    const bottomH = canvas.height - bottomY - 40;
    ctx.fillRect(pipe.x, bottomY, PIPE.width, bottomH);
    ctx.strokeRect(pipe.x, bottomY, PIPE.width, bottomH);
    ctx.fillRect(pipe.x - 4, bottomY, PIPE.width + 8, 24);
    ctx.strokeRect(pipe.x - 4, bottomY, PIPE.width + 8, 24);
  }
}

function drawHud() {
  if (gameState !== "playing") return;

  const level = getSpeedLevel();
  if (level > 0) {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`파이프 속도 Lv.${level + 1}`, canvas.width / 2, 52);
  }
}

function drawReadyScreen() {
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.font = "bold 24px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Flappy Bird", canvas.width / 2, canvas.height / 2 - 30);
  ctx.font = "16px sans-serif";
  ctx.fillText("탭 또는 스페이스바로 시작", canvas.width / 2, canvas.height / 2);
  ctx.font = "13px sans-serif";
  ctx.fillText("5점마다 파이프만 빨라짐", canvas.width / 2, canvas.height / 2 + 28);
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
    drawHud();
  } else if (gameState === "gameover") {
    drawPipes();
    drawBird();
  }

  requestAnimationFrame(gameLoop);
}

function handleInput() {
  const now = Date.now();
  if (now - lastInputTime < 180) return;
  lastInputTime = now;

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

function bindInput(el) {
  el.addEventListener("click", handleInput);
  el.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      handleInput();
    },
    { passive: false }
  );
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    handleInput();
  }
});

bindInput(canvas);
bindInput(overlay);
bindInput(gameContainer);

gameLoop();
