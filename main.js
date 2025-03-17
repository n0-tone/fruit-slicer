let video;
let handPose;
let hands = [];
let gameState = "loading";
let fruits = [];
let basket;
let timer;
let isPaused = false;
let trails = [];
let grabbedFruit = null;
let grabbedFruitHand = null;
let fruitSoundPlayed = false;
let assetsLoaded = false;
let counter = 0;
let fruitSpeed = 2;
let fruitFrequency = 60;
let quota = 1;
let soundsLoaded = false;
let gameJustEnded = false;
let highScore = 0;

let bgImage;
let logoImage;
let upheavalFont;
let backArrow;

let cereja, kiwi, laranja, manga, melancia, morango, pera;

let currentBasketImg,
  basketStage0,
  basketStage1,
  basketStage2,
  basketStage3,
  basketStage4;

let bgMusic;
let fruitDropSound;
let fruitGrabSound;
let fruitInBasketSound;
let buttonClickSound;
let pauseSound;
let gameMusic;
let gameOverSound;
let gameWinSound;

let musicVolume = 0.5;
let sfxVolume = 0.5;

function preload() {
  handPose = ml5.handPose({ flipped: true });

  try {
    bgImage = loadImage("assets/imgs/bg.jpg");
    logoImage = loadImage("assets/imgs/logo.png");
    backArrow = loadImage("assets/imgs/back_arrow.png");
    upheavalFont = loadFont("assets/font/upheavtt.ttf");

    cereja = loadImage("assets/imgs/fruits/cereja.png");
    kiwi = loadImage("assets/imgs/fruits/kiwi.png");
    laranja = loadImage("assets/imgs/fruits/laranja.png");
    manga = loadImage("assets/imgs/fruits/manga.png");
    melancia = loadImage("assets/imgs/fruits/melancia.png");
    morango = loadImage("assets/imgs/fruits/morango.png");
    pera = loadImage("assets/imgs/fruits/pera.png");

    basketImg = loadImage("assets/imgs/basket/basket-1.png");
    basketStage0 = loadImage("assets/imgs/basket/basket-0.png");
    basketStage1 = loadImage("assets/imgs/basket/basket-1.png");
    basketStage2 = loadImage("assets/imgs/basket/basket-2.png");
    basketStage3 = loadImage("assets/imgs/basket/basket-3.png");
    basketStage4 = loadImage("assets/imgs/basket/basket-4.png");

    if (typeof p5.prototype.loadSound === "function") {
      bgMusic = loadSound(
        "assets/sound/bg.mp3",
        () => {},
        (err) => console.error("Música de fundo não carregada:", err)
      );
      fruitDropSound = loadSound("assets/sound/fruitdrop.mp3");
      fruitGrabSound = loadSound("assets/sound/fruitgrab.mp3");
      fruitInBasketSound = loadSound("assets/sound/fruitinbasket.mp3");
      buttonClickSound = loadSound("assets/sound/button.mp3");
      pauseSound = loadSound("assets/sound/pause.mp3");
      gameMusic = loadSound("assets/sound/game.mp3");
      gameOverSound = loadSound("assets/sound/gameover.mp3");
      gameWinSound = loadSound("assets/sound/win.mp3");
      soundsLoaded = true;
    } else {
      console.warn("Libraria de som do p5 não carregada.");
      soundsLoaded = false;
    }
  } catch (e) {
    console.error("Erro ao carregar os assets:", e);
    soundsLoaded = false;
  }

  loadSettings();
}

function loadSettings() {
  if (localStorage.getItem("highScore")) {
    highScore = parseInt(localStorage.getItem("highScore"));
    quota = Math.max(1, highScore);
  }

  if (localStorage.getItem("musicVolume")) {
    musicVolume = parseFloat(localStorage.getItem("musicVolume"));
  }

  if (localStorage.getItem("sfxVolume")) {
    sfxVolume = parseFloat(localStorage.getItem("sfxVolume"));
  }
}

function saveSettings() {
  localStorage.setItem("musicVolume", musicVolume);
  localStorage.setItem("sfxVolume", sfxVolume);

  if (counter > highScore) {
    highScore = counter;
    localStorage.setItem("highScore", highScore);
    quota = highScore;
  }
}

function updateSoundVolumes() {
  if (!soundsLoaded) return;

  try {
    if (bgMusic && typeof bgMusic.setVolume === "function")
      bgMusic.setVolume(musicVolume);
    if (gameMusic && typeof gameMusic.setVolume === "function")
      gameMusic.setVolume(musicVolume);

    if (fruitDropSound && typeof fruitDropSound.setVolume === "function")
      fruitDropSound.setVolume(sfxVolume);
    if (fruitGrabSound && typeof fruitGrabSound.setVolume === "function")
      fruitGrabSound.setVolume(sfxVolume);
    if (
      fruitInBasketSound &&
      typeof fruitInBasketSound.setVolume === "function"
    )
      fruitInBasketSound.setVolume(sfxVolume);
    if (buttonClickSound && typeof buttonClickSound.setVolume === "function")
      buttonClickSound.setVolume(sfxVolume);
    if (pauseSound && typeof pauseSound.setVolume === "function")
      pauseSound.setVolume(sfxVolume);
    if (gameOverSound && typeof gameOverSound.setVolume === "function")
      gameOverSound.setVolume(sfxVolume);
    if (gameWinSound && typeof gameWinSound.setVolume === "function")
      gameWinSound.setVolume(sfxVolume);
  } catch (e) {
    console.error("Erro ao atualizar o volume:", e);
  }
}

function playSoundSafe(sound) {
  if (soundsLoaded && sound && typeof sound.play === "function") {
    try {
      sound.play();
    } catch (e) {
      console.error("Erro ao tocar música:", e);
    }
  }
}

function stopSoundSafe(sound) {
  if (soundsLoaded && sound && typeof sound.stop === "function") {
    try {
      sound.stop();
    } catch (e) {
      console.error("Erro ao parar a música:", e);
    }
  }
}

function isSoundPlaying(sound) {
  if (soundsLoaded && sound && typeof sound.isPlaying === "function") {
    try {
      return sound.isPlaying();
    } catch (e) {
      console.error("Erro ao ver se a música está a tocar:", e);
    }
  }
  return false;
}

function loopSoundSafe(sound) {
  if (soundsLoaded && sound && typeof sound.loop === "function") {
    try {
      sound.loop();
    } catch (e) {
      console.error("Erro ao dar loop á música:", e);
    }
  }
}

function gotHands(results) {
  hands = results;
}

function setup() {
  createCanvas(640, 480);
  frameRate(60);
  video = createCapture(VIDEO, { flipped: true });
  video.hide();
  handPose.detectStart(video, gotHands);

  textFont(upheavalFont);

  if (soundsLoaded) {
    updateSoundVolumes();
  }

  setTimeout(() => {
    assetsLoaded = true;
    gameState = "menu";
    if (soundsLoaded && !isSoundPlaying(bgMusic)) {
      loopSoundSafe(bgMusic);
    }
  }, 2000);

  basket = { x: width / 2, y: height - 60, w: 120, h: 60 };
}

function draw() {
  background(0);

  switch (gameState) {
    case "loading":
      drawLoadingScreen();
      break;
    case "menu":
      if (soundsLoaded) {
        if (!isSoundPlaying(bgMusic)) {
          stopAllSounds();
          loopSoundSafe(bgMusic);
        }
      }
      drawMainMenu();
      break;
    case "playing":
      if (soundsLoaded) {
        if (!isSoundPlaying(gameMusic) && !isPaused) {
          stopAllSounds();
          loopSoundSafe(gameMusic);
        }
      }
      playGame();
      break;
    case "gameEnd":
      if (soundsLoaded && gameJustEnded) {
        stopAllSounds();
        playSoundSafe(gameWinSound);
        gameJustEnded = false;
      }
      drawGameEndScreen();
      break;
    case "pauseMenu":
      drawPauseMenuScreen();
      break;
  }
}

function stopAllSounds() {
  if (!soundsLoaded) return;

  stopSoundSafe(bgMusic);
  stopSoundSafe(gameMusic);
  stopSoundSafe(gameOverSound);
  stopSoundSafe(gameWinSound);
}

function drawLoadingScreen() {
  for (let y = 0; y < height; y++) {
    let c = lerpColor(color(0, 0, 50), color(0, 0, 20), y / height);
    stroke(c);
    line(0, y, width, y);
  }

  fill(255);
  textSize(40);
  textAlign(CENTER, CENTER);
  textFont(upheavalFont);
  text("A CARREGAR...", width / 2, height / 2);

  noStroke();
  fill(0, 98, 38);
  let loadingWidth = map(sin(frameCount * 0.05), -1, 1, 100, 300);
  rect(width / 2 - loadingWidth / 2, height / 2 + 50, loadingWidth, 10, 5);
}

function drawMainMenu() {
  push();
  tint(120, 120, 150, 150);
  image(video, 0, 0, width, height);
  noTint();
  pop();

  fill(0, 0, 0, 50);
  rect(0, 0, width, height);

  push();
  image(logoImage, width / 12, height / 10);
  pop();

  let buttonY = height * 0.5;
  drawButton("Jogar", width / 2, buttonY, () => {
    playSoundSafe(buttonClickSound);
    gameState = "playing";
    resetGame();
  });

  textSize(20);
  fill(255);
  textAlign(CENTER, TOP);
  text("Volume", width / 2, height * 0.7);

  textSize(16);
  text("Música:", width / 3, height * 0.75);
  let sliderWidth = 150;
  drawSlider(width / 3, height * 0.83, sliderWidth, musicVolume, (value) => {
    musicVolume = value;
    updateSoundVolumes();
    saveSettings();
  });

  text("Efeitos:", (width * 2) / 3, height * 0.75);
  drawSlider(
    (width * 2) / 3,
    height * 0.83,
    sliderWidth,
    sfxVolume,
    (value) => {
      sfxVolume = value;
      updateSoundVolumes();
      saveSettings();
    }
  );

  textSize(20);
  fill(255, 215, 0);
  textAlign(CENTER, CENTER);
  text("Melhor Pontuação: " + highScore, width / 2, height * 0.92);

  fill(180);
  textSize(14);
  textAlign(LEFT, BOTTOM);
  text("t2ne/cyzuko - 2025", 10, height - 10);
}

function drawButton(label, x, y, onClick) {
  let buttonWidth = 200;
  let buttonHeight = 50;
  let isHovered =
    mouseX > x - buttonWidth / 2 &&
    mouseX < x + buttonWidth / 2 &&
    mouseY > y - buttonHeight / 2 &&
    mouseY < y + buttonHeight / 2;

  push();
  if (isHovered) {
    fill(51, 149, 90);
  } else {
    fill(0, 98, 38);
  }
  stroke(255);
  strokeWeight(2);
  rect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight, 5);

  textSize(24);
  textAlign(CENTER, CENTER);
  noStroke();
  fill(255);
  strokeWeight(1.5);
  text(label, x, y);
  pop();

  if (!window.buttons) window.buttons = [];
  window.buttons.push({
    x1: x - buttonWidth / 2,
    y1: y - buttonHeight / 2,
    x2: x + buttonWidth / 2,
    y2: y + buttonHeight / 2,
    onClick: onClick,
  });
}

function drawSlider(x, y, w, value, onChange) {
  push();
  fill(50);
  noStroke();
  rect(x - w / 2, y - 10, w, 20, 10);

  fill(0, 98, 38);
  rect(x - w / 2, y - 10, w * value, 20, 10);

  fill(255);
  ellipse(x - w / 2 + w * value, y, 20, 20);
  pop();

  if (
    mouseIsPressed &&
    mouseX >= x - w / 2 &&
    mouseX <= x + w / 2 &&
    mouseY >= y - 15 &&
    mouseY <= y + 15
  ) {
    let newValue = constrain((mouseX - (x - w / 2)) / w, 0, 1);
    onChange(newValue);
  }
}

function drawGameEndScreen() {
  push();
  tint(120, 120, 150, 120);
  image(video, 0, 0, width, height);
  noTint();
  pop();

  fill(0, 0, 0, 50);
  rect(0, 0, width, height);

  image(backArrow, 20, 20, 40, 40);

  if (!window.buttons) window.buttons = [];
  window.buttons = [
    {
      x1: 20,
      y1: 20,
      x2: 60,
      y2: 60,
      onClick: () => {
        playSoundSafe(buttonClickSound);
        gameState = "menu";
      },
    },
  ];

  fill(255);
  textSize(48);
  textAlign(CENTER, CENTER);
  text("Jogo Terminado", width / 2, height / 5);

  fill(255);
  textSize(30);
  text(`Pontuação: ${counter}`, width / 2, height / 5 + 70);

  fill(255, 215, 0);
  textSize(36);
  textAlign(CENTER, CENTER);
  text("Melhor Pontuação", width / 2, height / 2);

  fill(255);
  textSize(40);
  text(highScore, width / 2, height / 2 + 60);

  drawButton("Reiniciar", width / 2, height * 0.8, () => {
    playSoundSafe(buttonClickSound);
    gameState = "playing";
    resetGame();
  });
}

function resetGame() {
  fruits = [];
  timer = 59;
  counter = 0;
  isPaused = false;

  grabbedFruit = null;
  grabbedFruitHand = null;
  fruitSoundPlayed = false;

  if (window.timerInterval) clearInterval(window.timerInterval);
  window.timerInterval = setInterval(() => {
    if (timer > 0 && gameState === "playing" && !isPaused) {
      timer--;
      if (timer === 0) {
        endGame();
      }
    }
  }, 1000);
}

function endGame() {
  gameJustEnded = true;
  saveSettings();
  gameState = "gameEnd";
}

function mousePressed() {
  if (!window.buttons) return;

  for (let btn of window.buttons) {
    if (
      mouseX > btn.x1 &&
      mouseX < btn.x2 &&
      mouseY > btn.y1 &&
      mouseY < btn.y2
    ) {
      btn.onClick();
      break;
    }
  }

  window.buttons = [];
}

function keyPressed() {
  if (keyCode === 27) {
    if (gameState === "playing") {
      gameState = "pauseMenu";
      isPaused = true;
      if (soundsLoaded) {
        pauseSound.play();
        if (gameMusic.isPlaying()) {
          gameMusic.pause();
        }
      }
    } else if (gameState === "pauseMenu") {
      gameState = "playing";
      isPaused = false;
      playSoundSafe(pauseSound);
      if (soundsLoaded && !gameMusic.isPlaying()) {
        gameMusic.loop();
      }
    }
  }
}

function playGame() {
  image(video, 0, 0);

  if (!isPaused) {
    updateFruits();
  }

  drawBasket();
  drawFruits();
  updateTrails();
  drawTrails();

  if (!isPaused) {
    handleHandDetection();
  }

  let seconds = timer % 60;

  fill(1, 50, 32);
  textSize(26);
  strokeWeight(2);
  stroke(255);
  textAlign(LEFT, TOP);
  text(`Tempo: ${nf(seconds, 2)}  `, 10, 5);
  text("Fruta Apanhada: " + counter + "/" + quota, 10, 35);

  noStroke();
}

function handleHandDetection() {
  if (hands.length > 0) {
    let currentHands = new Set();
    let fruitToRemove = [];

    for (let i = 0; i < hands.length; i++) {
      let hand = hands[i];
      let handIndex = i;
      let palm = hand.keypoints[9];

      currentHands.add(handIndex);
      trails.push({ x: palm.x, y: palm.y, time: millis() });

      let isClosed = isHandClosed(hand);

      if (isClosed) {
        let heldFruit = fruits.find(
          (f) => f.grabbed && f.grabbedBy === handIndex
        );

        if (heldFruit) {
          heldFruit.x = palm.x;
          heldFruit.y = palm.y;
        } else {
          let nearestFruit = fruits.find(
            (f) => !f.grabbed && dist(palm.x, palm.y, f.x, f.y) < f.w
          );

          if (nearestFruit) {
            nearestFruit.grabbed = true;
            nearestFruit.grabbedBy = handIndex;
            playSoundSafe(fruitGrabSound);
          }
        }
      } else {
        let releasedFruit = fruits.find(
          (f) => f.grabbed && f.grabbedBy === handIndex
        );
        if (releasedFruit) {
          if (
            dist(releasedFruit.x, releasedFruit.y, basket.x, basket.y) <
            basket.w * 0.6
          ) {
            counter++;
            playSoundSafe(fruitInBasketSound);
            fruitToRemove.push(releasedFruit);
          } else {
            playSoundSafe(fruitDropSound);
            releasedFruit.grabbed = false;
            releasedFruit.grabbedBy = null;
          }
        }
      }
    }

    fruits = fruits.filter((f) => !fruitToRemove.includes(f));

    fruits.forEach((fruit) => {
      if (fruit.grabbed && !currentHands.has(fruit.grabbedBy)) {
        fruit.grabbed = false;
        fruit.grabbedBy = null;
        playSoundSafe(fruitDropSound);
      }
    });
  }
}

function drawPauseMenuScreen() {
  image(video, 0, 0);
  drawFruits();
  drawBasket();

  fill(0, 0, 0, 180);
  rect(0, 0, width, height);

  fill(255);
  textSize(40);
  textAlign(CENTER, CENTER);
  text("Jogo Pausado", width / 2, height / 6);

  let buttonY = height * 0.45;
  let buttonSpacing = 70;

  drawButton("Voltar", width / 2, buttonY, () => {
    playSoundSafe(pauseSound);
    gameState = "playing";
    isPaused = false;
    if (soundsLoaded && !gameMusic.isPlaying()) {
      gameMusic.loop();
    }
  });

  drawButton("Reiniciar", width / 2, buttonY + 70 + buttonSpacing, () => {
    playSoundSafe(buttonClickSound);
    gameState = "playing";
    resetGame();
  });

  drawButton("Sair", width / 2, buttonY + buttonSpacing, () => {
    playSoundSafe(buttonClickSound);
    gameState = "menu";
    isPaused = false;
    resetGame();
  });

  if (hands.length > 0) {
    updateTrails();
    drawTrails();
  }
}

function isHandClosed(hand) {
  let fingersClosed = 0;
  let fingertips = [4, 8, 12, 16, 20];
  let knuckles = [2, 5, 9, 13, 17];

  for (let i = 0; i < fingertips.length; i++) {
    let fingertip = hand.keypoints[fingertips[i]];
    let knuckle = hand.keypoints[knuckles[i]];

    if (fingertip.y > knuckle.y) {
      fingersClosed++;
    }
  }

  return fingersClosed >= 3;
}

function updateFruits() {
  if (frameCount % fruitFrequency === 0) {
    const fruitImages = [cereja, kiwi, laranja, manga, melancia, morango, pera];
    const randomFruitImg =
      fruitImages[Math.floor(Math.random() * fruitImages.length)];
    fruits.push({
      x: random(50, width - 50),
      y: 0,
      w: 40,
      h: 40,
      caught: false,
      img: randomFruitImg,
      grabbed: false,
      grabbedBy: null,
    });
  }

  for (let i = fruits.length - 1; i >= 0; i--) {
    if (!fruits[i].grabbed) {
      fruits[i].y += fruitSpeed;

      if (fruits[i].y > height + 50) {
        fruits.splice(i, 1);
      }
    }
  }
}

function drawFruits() {
  imageMode(CENTER);
  for (let fruit of fruits) {
    if (fruit.grabbed) {
      fill(255, 255, 0, 150);
      noStroke();
      ellipse(fruit.x, fruit.y, fruit.w * 1.8, fruit.h * 1.8);
    }

    image(fruit.img, fruit.x, fruit.y, fruit.w * 1.5, fruit.h * 1.5);
  }
  imageMode(CORNER);
}

function drawBasket() {
  imageMode(CENTER);
  currentBasketImg = getBasketStageImage();

  image(
    currentBasketImg,
    basket.x,
    basket.y + basket.h / 2,
    basket.w * 1.2,
    basket.h * 1.5
  );
  imageMode(CORNER);
}

function getBasketStageImage() {
  let progressPercentage = (counter / quota) * 100;

  if (progressPercentage >= 100) {
    return basketStage4;
  } else if (progressPercentage >= 75) {
    return basketStage3;
  } else if (progressPercentage >= 50) {
    return basketStage2;
  } else if (progressPercentage >= 25) {
    return basketStage1;
  } else if (progressPercentage > 0) {
    return basketStage1;
  } else {
    return basketStage0;
  }
}

function updateTrails() {
  trails = trails.filter((t) => millis() - t.time < 500);
}

function drawTrails() {
  noFill();
  for (let i = 0; i < trails.length; i++) {
    let hue = (frameCount + i * 10) % 360;
    let alpha = map(millis() - trails[i].time, 0, 500, 200, 0);
    stroke(hue, 100, 100, alpha);
    strokeWeight(10);
    point(trails[i].x, trails[i].y);
  }
}
