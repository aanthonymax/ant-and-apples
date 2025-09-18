import "./index.scss";
import "./sprites/ant.png";
import hmpl from "hmpl-js";

document.addEventListener("DOMContentLoaded", () => {
  const antImg = new window.Image();
  antImg.src = "./sprites/ant.png";
  antImg.onerror = () => console.error("Failed to load ant.png:", antImg.src);

  const groundImg = new window.Image();
  groundImg.src =
    "data:image/svg+xml;base64," +
    btoa(
      `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><rect width='32' height='32' fill='#8B5A2B'/><rect y='24' width='32' height='8' fill='#228B22'/></svg>`
    );
  groundImg.onerror = () => console.error("Failed to load groundImg");

  const skyImg = new window.Image();
  skyImg.src =
    "data:image/svg+xml;base64," +
    btoa(
      `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><rect width='32' height='32' fill='#87ceeb'/></svg>`
    );
  skyImg.onerror = () => console.error("Failed to load skyImg");

  const cloudImg = new window.Image();
  cloudImg.src =
    "data:image/svg+xml;base64," +
    btoa(
      `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='32'><ellipse cx='16' cy='24' rx='16' ry='10' fill='#fff'/><ellipse cx='32' cy='20' rx='12' ry='8' fill='#fff' opacity='0.9'/></svg>`
    );
  cloudImg.onerror = () => console.error("Failed to load cloudImg");

  const treeImg = new window.Image();
  treeImg.src =
    "data:image/svg+xml;base64," +
    btoa(
      `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='48'><rect x='13' y='32' width='6' height='16' fill='#8B5A2B'/><ellipse cx='16' cy='28' rx='14' ry='16' fill='#228B22'/></svg>`
    );
  treeImg.onerror = () => console.error("Failed to load treeImg");

  const canvas = document.getElementById("antgame-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const TILE_SIZE = 32;
  const ANT_WIDTH = 48;
  const ANT_HEIGHT = 48;
  const MAP_WIDTH = Math.floor(canvas.width / TILE_SIZE);
  const MAP_HEIGHT = Math.floor(canvas.height / TILE_SIZE);

  const map = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      row.push(y < MAP_HEIGHT - 2 ? 0 : 1);
    }
    map.push(row);
  }

  const clouds = Array.from({ length: 5 }, () => ({
    x: Math.floor(Math.random() * (MAP_WIDTH - 2)),
    y: Math.floor(Math.random() * (MAP_HEIGHT / 2)),
  }));

  const trees = Array.from({ length: 7 }, () => ({
    x: Math.floor(Math.random() * MAP_WIDTH),
    y: MAP_HEIGHT - 3,
  }));

  let ant = {
    x: Math.floor(MAP_WIDTH / 2),
    y: MAP_HEIGHT - 3 + 5 / TILE_SIZE,
    vy: 0,
    onGround: true,
    dir: "right",
    mirrored: false,
  };

  const GRAVITY = 0.25;
  const JUMP_VELOCITY = -6;
  const MOVE_SPEED = 0.15;
  let leftPressed = false;
  let rightPressed = false;
  let jumpPressed = false;

  let apples = [];
  let score = 0;
  const scoreDiv = document.createElement("div");
  scoreDiv.style.position = "absolute";
  scoreDiv.style.top = "10px";
  scoreDiv.style.left = "10px";
  scoreDiv.style.fontSize = "24px";
  scoreDiv.style.color = "#2ecc40";
  scoreDiv.style.fontWeight = "bold";
  scoreDiv.textContent = "Apples: 0";
  document.body.appendChild(scoreDiv);

  let allApplesCollected = false;
  let freezeAnt = false;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (map[y][x] === 1) {
          ctx.drawImage(
            groundImg,
            x * TILE_SIZE,
            y * TILE_SIZE,
            TILE_SIZE,
            TILE_SIZE
          );
        } else {
          ctx.drawImage(
            skyImg,
            x * TILE_SIZE,
            y * TILE_SIZE,
            TILE_SIZE,
            TILE_SIZE
          );
        }
      }
    }
    clouds.forEach((cloud) => {
      ctx.drawImage(cloudImg, cloud.x * TILE_SIZE, cloud.y * TILE_SIZE, 64, 40);
    });
    trees.forEach((tree) => {
      const treeBaseY = (MAP_HEIGHT - 2) * TILE_SIZE;
      ctx.drawImage(treeImg, tree.x * TILE_SIZE, treeBaseY - 48, 32, 48);
    });
    apples.forEach((apple) => {
      if (!apple.eaten) {
        ctx.save();
        ctx.translate(apple.x, apple.y);
        ctx.drawImage(
          apple.img,
          -apple.size / 2,
          -apple.size / 2,
          apple.size,
          apple.size
        );
        ctx.restore();
      }
    });
    ctx.save();
    let px = ant.x * TILE_SIZE + TILE_SIZE / 2 - ANT_WIDTH / 2;
    let py = ant.y * TILE_SIZE + TILE_SIZE - ANT_HEIGHT + 5;
    if (ant.mirrored) {
      ctx.translate(px + ANT_WIDTH / 2, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(antImg, -ANT_WIDTH / 2, py, ANT_WIDTH, ANT_HEIGHT);
    } else {
      ctx.drawImage(antImg, px, py, ANT_WIDTH, ANT_HEIGHT);
    }
    ctx.restore();
  }

  function update() {
    if (freezeAnt) return;
    if (leftPressed) {
      ant.x -= MOVE_SPEED;
      ant.dir = "left";
      ant.mirrored = true;
    }
    if (rightPressed) {
      ant.x += MOVE_SPEED;
      ant.dir = "right";
      ant.mirrored = false;
    }
    if (ant.x < 0) ant.x = 0;
    if (ant.x > MAP_WIDTH - 1) ant.x = MAP_WIDTH - 1;
    if (jumpPressed && ant.onGround) {
      ant.vy = JUMP_VELOCITY;
      ant.onGround = false;
    }
    ant.vy += GRAVITY;
    ant.y += ant.vy / TILE_SIZE;
    if (ant.y >= MAP_HEIGHT - 3 + 5 / TILE_SIZE) {
      ant.y = MAP_HEIGHT - 3 + 5 / TILE_SIZE;
      ant.vy = 0;
      ant.onGround = true;
    } else {
      ant.onGround = false;
    }
    if (ant.y < 1) {
      ant.y = 1;
      if (ant.vy < 0) ant.vy = 0;
    }
    apples.forEach((apple) => {
      if (!apple.eaten) {
        const dx = ant.x * TILE_SIZE + TILE_SIZE / 2 - apple.x;
        const dy = ant.y * TILE_SIZE + TILE_SIZE - ANT_HEIGHT / 2 + 5 - apple.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 32) {
          apple.eaten = true;
          score++;
          scoreDiv.textContent = `Apples: ${score}`;
        }
      }
    });
    if (
      !allApplesCollected &&
      apples.length > 0 &&
      apples.every((a) => a.eaten)
    ) {
      allApplesCollected = true;
      freezeAnt = true;
      setTimeout(() => {
        alert("Congratulations! All the apples are eaten!");
        window.location.reload();
      }, 100);
    }
  }

  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  if (isMobile) {
    const controlsDiv = document.createElement("div");
    controlsDiv.style.position = "absolute";
    controlsDiv.style.bottom = "20px";
    controlsDiv.style.left = "50%";
    controlsDiv.style.transform = "translateX(-50%)";
    controlsDiv.style.display = "flex";
    controlsDiv.style.gap = "20px";
    controlsDiv.style.zIndex = "1000";

    const leftBtn = document.createElement("button");
    leftBtn.textContent = "←";
    leftBtn.style.padding = "15px 20px";
    leftBtn.style.fontSize = "20px";
    leftBtn.style.border = "none";
    leftBtn.style.borderRadius = "10px";
    leftBtn.style.backgroundColor = "#3498db";
    leftBtn.style.color = "white";
    leftBtn.style.cursor = "pointer";

    const rightBtn = document.createElement("button");
    rightBtn.textContent = "→";
    rightBtn.style.padding = "15px 20px";
    rightBtn.style.fontSize = "20px";
    rightBtn.style.border = "none";
    rightBtn.style.borderRadius = "10px";
    rightBtn.style.backgroundColor = "#3498db";
    rightBtn.style.color = "white";
    rightBtn.style.cursor = "pointer";

    const jumpBtn = document.createElement("button");
    jumpBtn.textContent = "↑";
    jumpBtn.style.padding = "15px 20px";
    jumpBtn.style.fontSize = "20px";
    jumpBtn.style.border = "none";
    jumpBtn.style.borderRadius = "10px";
    jumpBtn.style.backgroundColor = "#3498db";
    jumpBtn.style.color = "white";
    jumpBtn.style.cursor = "pointer";

    controlsDiv.appendChild(leftBtn);
    controlsDiv.appendChild(jumpBtn);
    controlsDiv.appendChild(rightBtn);
    document.body.appendChild(controlsDiv);

    leftBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      leftPressed = true;
    });
    leftBtn.addEventListener("touchend", (e) => {
      e.preventDefault();
      leftPressed = false;
    });

    rightBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      rightPressed = true;
    });
    rightBtn.addEventListener("touchend", (e) => {
      e.preventDefault();
      rightPressed = false;
    });

    jumpBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      if (ant.onGround) jumpPressed = true;
    });
    jumpBtn.addEventListener("touchend", (e) => {
      e.preventDefault();
      jumpPressed = false;
    });
  }

  window.addEventListener("keydown", (e) => {
    if (freezeAnt) return;
    if (e.key === "ArrowLeft") leftPressed = true;
    if (e.key === "ArrowRight") rightPressed = true;
    if ((e.key === "ArrowUp" || e.key === " ") && ant.onGround)
      jumpPressed = true;
  });
  window.addEventListener("keyup", (e) => {
    if (freezeAnt) return;
    if (e.key === "ArrowLeft") leftPressed = false;
    if (e.key === "ArrowRight") rightPressed = false;
    if (e.key === "ArrowUp" || e.key === " ") jumpPressed = false;
  });

  let loaded = 0;
  [antImg, groundImg, skyImg, cloudImg, treeImg].forEach((img) => {
    img.onload = async () => {
      loaded++;
      if (loaded === 5) await loadApples();
    };
  });

  async function loadApples() {
    const applesTemplate = hmpl.compile(
      `<div>{{#request src="./apples.html"}}{{/request}}</div>`
    );
    const response = await new Promise((res, rej) => {
      applesTemplate({
        get: (prop, value, context, request) => {
          switch (prop) {
            case "response":
              if (!value) return;
              res(value);
              break;
          }
        },
      });
    });

    const temp = document.createElement("div");
    temp.appendChild(response.cloneNode(true));
    apples = Array.from(temp.querySelectorAll(".apple")).map((el) => {
      const x = parseInt(el.getAttribute("data-x"), 10);
      const y = parseInt(el.getAttribute("data-y"), 10);
      const size = parseInt(el.getAttribute("data-size"), 10) || 32;
      const appleImg = new window.Image();
      appleImg.src =
        "data:image/svg+xml;base64," +
        btoa(
          `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'>` +
            `<circle cx='16' cy='18' r='12' fill='#2ecc40' stroke='#197d23' stroke-width='2'/>` +
            `<ellipse cx='16' cy='14' rx='6' ry='3' fill='#fff' opacity='0.25'/>` +
            `<rect x='14' y='6' width='4' height='8' rx='2' fill='#654321'/>` +
            `<ellipse cx='20' cy='8' rx='3' ry='1.5' fill='#197d23'/>` +
            `<ellipse cx='16' cy='28' rx='2' ry='1' fill='#654321' opacity='0.7'/>` +
            `<ellipse cx='13' cy='27' rx='1' ry='0.5' fill='#654321' opacity='0.5'/>` +
            `<ellipse cx='19' cy='27' rx='1' ry='0.5' fill='#654321' opacity='0.5'/>` +
            `</svg>`
        );
      return { x, y, size, img: appleImg, eaten: false };
    });
    gameLoop();
  }
});
