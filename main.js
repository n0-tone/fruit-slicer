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
let quota = 30;
let soundsLoaded = false;
let gameJustEnded = false;
let leaderboardWithDifficulty = [];

// Speech recognition variables
let speechRec;
let speechReady = false;
let lastCommand = "";
let commandRecognized = false;
let commandFeedbackTimer = 0;

let bgImage;
let logoImage;
let upheavalFont;
let backArrow;

let cereja, kiwi, laranja, manga, melancia, morango, pera, basketImg;

let bgMusic;
let fruitDropSound;
let fruitGrabSound;
let fruitInBasketSound;
let buttonClickSound;
let pauseSound;
let gameMusic;
let gameOverSound;
let gameWinSound;

let difficulty;
let musicVolume;
let sfxVolume;

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

    basketImg = loadImage("assets/imgs/basket.png");

    if (typeof p5.prototype.loadSound === "function") {
      bgMusic = loadSound(
        "assets/sound/bg.mp3",
        () =>
          //console.log("Música de fundo carregada."),
          (err) =>
            console.error("Música de fundo não carregada:", err)
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
      //console.log("Ficheiros carregados.");
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
  if (localStorage.getItem("difficulty")) {
    difficulty = localStorage.getItem("difficulty");
    updateDifficultySettings();
  }

  if (localStorage.getItem("musicVolume")) {
    musicVolume = parseFloat(localStorage.getItem("musicVolume"));
  }

  if (localStorage.getItem("sfxVolume")) {
    sfxVolume = parseFloat(localStorage.getItem("sfxVolume"));
  }
}

function saveSettings() {
  localStorage.setItem("difficulty", difficulty);
  localStorage.setItem("musicVolume", musicVolume);
  localStorage.setItem("sfxVolume", sfxVolume);
}

function updateDifficultySettings() {
  switch (difficulty) {
    case "Fácil":
      fruitSpeed = 1;
      fruitFrequency = 90;
      quota = 20;
      break;
    case "Médio":
      fruitSpeed = 2;
      fruitFrequency = 60;
      quota = 30;
      break;
    case "Difícil":
      fruitSpeed = 2.5;
      fruitFrequency = 45;
      quota = 40;
      break;
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

  // Initialize speech recognition
  initSpeechRecognition();

  setTimeout(() => {
    assetsLoaded = true;
    gameState = "menu";
    if (soundsLoaded && !isSoundPlaying(bgMusic)) {
      loopSoundSafe(bgMusic);
    }
  }, 2000);

  basket = { x: width / 2, y: height - 60, w: 120, h: 60 };
}

function initSpeechRecognition() {
  try {
    speechRec = new p5.SpeechRec("pt-PT", gotSpeech);
    speechRec.continuous = true;
    speechRec.interimResults = true;
    speechRec.start();
    //console.log("Reconhecimento de voz inicializado.");
    speechReady = true;
  } catch (e) {
    console.error("Erro ao inicializar o reconhecimento de voz:", e);
    speechReady = false;
  }
}

function gotSpeech() {
  if (speechRec.resultValue) {
    let command = speechRec.resultString.toLowerCase().trim();
    processVoiceCommand(command);
  }
}

function processVoiceCommand(command) {
  // Only process these specific commands
  if (
    command === "pausar" ||
    command === "voltar" ||
    command === "jogar" ||
    command === "sair" ||
    command === "instruções" ||
    command === "objetivo" ||
    command === "opções" ||
    command === "sim" ||
    command === "não" ||
    command === "eliminar"
  ) {
    lastCommand = command;
    commandRecognized = true;
    commandFeedbackTimer = 60;

    // Handle commands based on game state
    if (command === "pausar" && gameState === "playing") {
      gameState = "pauseMenu";
      isPaused = true;
      if (soundsLoaded) {
        playSoundSafe(pauseSound);
        if (gameMusic.isPlaying()) {
          gameMusic.pause();
        }
      }
    } else if (command === "voltar" && gameState === "pauseMenu") {
      gameState = "playing";
      isPaused = false;
      playSoundSafe(pauseSound);
      if (soundsLoaded && !gameMusic.isPlaying()) {
        gameMusic.loop();
      }
    } else if (command === "sair" && gameState === "pauseMenu") {
      playSoundSafe(buttonClickSound);
      gameState = "menu";
      isPaused = false;
      resetGame();
    } else if (command === "jogar" && gameState === "menu") {
      playSoundSafe(buttonClickSound);
      gameState = "playing";
      resetGame();
    } else if (
      command === "voltar" &&
      [
        "instructions",
        "objective",
        "options",
        "gameOver",
        "gameWin",
        "confirmClear",
      ].includes(gameState)
    ) {
      playSoundSafe(buttonClickSound);
      gameState = "menu";
    } else if (command === "sim" && gameState === "confirmClear") {
      playSoundSafe(buttonClickSound);
      clearLeaderboard();
      gameState = "menu";
    } else if (command === "não" && gameState === "confirmClear") {
      playSoundSafe(buttonClickSound);
      gameState = "menu";
    } else if (command === "instruções" && gameState === "menu") {
      playSoundSafe(buttonClickSound);
      gameState = "instructions";
    } else if (command === "objetivo" && gameState === "menu") {
      playSoundSafe(buttonClickSound);
      gameState = "objective";
    } else if (command === "opções" && gameState === "menu") {
      playSoundSafe(buttonClickSound);
      gameState = "options";
    } else if (command === "eliminar" && gameState === "menu") {
      playSoundSafe(buttonClickSound);
      gameState = "confirmClear";
    } else if (
      (command === "sim" && gameState === "gameOver") ||
      gameState === "gameWin"
    ) {
      playSoundSafe(buttonClickSound);
      gameState = "playing";
      resetGame();
    } else if (
      (command === "não" && gameState === "gameOver") ||
      gameState === "gameWin"
    ) {
      playSoundSafe(buttonClickSound);
      gameState = "menu";
    }
  }
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
    case "instructions":
      if (soundsLoaded) {
        if (!isSoundPlaying(bgMusic)) {
          stopAllSounds();
          loopSoundSafe(bgMusic);
        }
      }
      drawInstructionsScreen();
      break;
    case "objective":
      if (soundsLoaded) {
        if (!isSoundPlaying(bgMusic)) {
          stopAllSounds();
          loopSoundSafe(bgMusic);
        }
      }
      drawObjectiveScreen();
      break;
    case "options":
      if (soundsLoaded) {
        if (!isSoundPlaying(bgMusic)) {
          stopAllSounds();
          loopSoundSafe(bgMusic);
        }
      }
      drawOptionsScreen();
      break;
    case "gameOver":
      if (soundsLoaded && gameJustEnded) {
        stopAllSounds();
        playSoundSafe(gameOverSound);
        gameJustEnded = false;
      }
      drawGameOverScreen();
      break;
    case "gameWin":
      if (soundsLoaded && gameJustEnded) {
        stopAllSounds();
        playSoundSafe(gameWinSound);
        gameJustEnded = false;
      }
      drawGameWinScreen();
      break;
    case "confirmClear":
      if (soundsLoaded) {
        if (!isSoundPlaying(bgMusic)) {
          stopAllSounds();
          loopSoundSafe(bgMusic);
        }
      }
      drawConfirmClearScreen();
      break;
    case "pauseMenu":
      drawPauseMenuScreen();
      break;
  }

  // Display voice command feedback if a command was recognized
  if (commandRecognized && commandFeedbackTimer > 0) {
    displayCommandFeedback();
    commandFeedbackTimer--;
    if (commandFeedbackTimer <= 0) {
      commandRecognized = false;
    }
  }
}

function displayCommandFeedback() {
  push();
  fill(0, 200, 100, 200);
  noStroke();
  rect(width - 150, 10, 140, 40, 10);

  fill(255);
  textSize(18);
  textAlign(CENTER, CENTER);
  text("Voz: " + lastCommand, width - 80, 30);
  pop();
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
  tint(60, 60, 90);
  image(bgImage, 0, 0, width, height);
  noTint();

  push();
  image(logoImage, width / 12, height / 10);
  pop();

  let buttonY = height * 0.4;
  let buttonSpacing = 70;

  drawButton("Jogar", width / 2, buttonY, () => {
    playSoundSafe(buttonClickSound);
    gameState = "playing";
    resetGame();
  });

  drawButton("Instruções", width / 2, buttonY + buttonSpacing, () => {
    playSoundSafe(buttonClickSound);
    gameState = "instructions";
  });

  drawButton("Objetivo", width / 2, buttonY + 2 * buttonSpacing, () => {
    playSoundSafe(buttonClickSound);
    gameState = "objective";
  });

  drawButton("Opções", width / 2, buttonY + 3 * buttonSpacing, () => {
    playSoundSafe(buttonClickSound);
    gameState = "options";
  });

  if (speechReady) {
    textSize(16);
    fill(255);
    textAlign(CENTER, TOP);
    text("Diz 'jogar' para começar o jogo", width / 2, height - 25);
  }

  fill(180);
  textSize(14);
  textAlign(LEFT, BOTTOM);
  text("t2ne/cyzuko - 2025", 10, height - 10);

  textAlign(RIGHT, BOTTOM);
  fill(180);
  text("Eliminar pontuação", width - 10, height - 10);

  if (!window.buttons) window.buttons = [];
  window.buttons.push({
    x1: width - 150,
    y1: height - 25,
    x2: width,
    y2: height,
    onClick: () => {
      playSoundSafe(buttonClickSound);
      gameState = "confirmClear";
    },
  });
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

function drawInstructionsScreen() {
  // Background
  tint(60, 60, 90);
  image(bgImage, 0, 0, width, height);
  noTint();

  // Back button
  image(backArrow, 20, 20, 40, 40);

  // Back button click handler
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

  // Title
  fill(255);
  textSize(36);
  textAlign(CENTER, TOP);
  text("Instruções", width / 2, 30);

  // Instructions content
  textSize(22);
  textAlign(CENTER, TOP);

  const instructions = [
    "1. Usa as mãos para apanhar as frutas que caem",
    "2. Fecha a mão para agarrar uma fruta",
    "3. Abre a mão sobre o cesto para soltar a fruta",
    "4. Tenta pegar no máximo de frutas possível",
    "5. Tens 2 minutos para jogar",
    "6. Pressiona ESC ou diz 'pausar' para pausar o jogo",
  ];

  for (let i = 0; i < instructions.length; i++) {
    text(instructions[i], width / 2, 155 + i * 40);
  }
}

function drawObjectiveScreen() {
  // Background
  tint(60, 60, 90);
  image(bgImage, 0, 0, width, height);
  noTint();

  // Back button
  image(backArrow, 20, 20, 40, 40);

  // Back button click handler
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

  // Title
  fill(255);
  textSize(36);
  textAlign(CENTER, TOP);
  text("Objetivo", width / 2, 30);

  // Objective content
  textSize(22);
  textAlign(CENTER, CENTER);

  const objectives = [
    "Apanha o maior número de frutas",
    "possível antes que o tempo acabe!",
    "",
    "Cada fruta vale 1 ponto.",
    "",
    `Objetivo atual: ${quota} frutas (${difficulty})`,
    "",
    "Tenta superar o teu próprio recorde",
  ];

  let startY = 145;
  for (let i = 0; i < objectives.length; i++) {
    text(objectives[i], width / 2, startY + i * 35);
  }
}

function drawOptionsScreen() {
  tint(60, 60, 90);
  image(bgImage, 0, 0, width, height);
  noTint();

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
        saveSettings();
      },
    },
  ];

  fill(255);
  textSize(36);
  textAlign(CENTER, TOP);
  text("Opções", width / 2, 30);

  textSize(26);
  textAlign(CENTER, TOP);
  text("Dificuldade:", width / 2, 100);

  let buttonY = 180;
  let buttonWidth = 120;
  let buttonSpacing = 140;

  let easyX = width / 2 - buttonSpacing;
  let easySelected = difficulty === "Fácil";

  drawDifficultyButton(
    "Fácil",
    easyX,
    buttonY,
    buttonWidth,
    50,
    easySelected,
    () => {
      playSoundSafe(buttonClickSound);
      difficulty = "Fácil";
      updateDifficultySettings();
    }
  );

  let mediumSelected = difficulty === "Médio";
  drawDifficultyButton(
    "Médio",
    width / 2,
    buttonY,
    buttonWidth,
    50,
    mediumSelected,
    () => {
      playSoundSafe(buttonClickSound);
      difficulty = "Médio";
      updateDifficultySettings();
    }
  );

  let hardX = width / 2 + buttonSpacing;
  let hardSelected = difficulty === "Difícil";
  drawDifficultyButton(
    "Difícil",
    hardX,
    buttonY,
    buttonWidth,
    50,
    hardSelected,
    () => {
      playSoundSafe(buttonClickSound);
      difficulty = "Difícil";
      updateDifficultySettings();
    }
  );

  textSize(26);
  textAlign(CENTER, TOP);
  text("Volume:", width / 2, 235);

  textSize(20);
  text("Música:", width / 2, 280);

  let sliderX = width / 2;
  let sliderWidth = 200;
  drawSlider(sliderX, 330, sliderWidth, musicVolume, (value) => {
    musicVolume = value;
    updateSoundVolumes();
  });

  text("Efeitos:", width / 2, 360);

  drawSlider(sliderX, 410, sliderWidth, sfxVolume, (value) => {
    sfxVolume = value;
    updateSoundVolumes();
  });
}

function drawDifficultyButton(label, x, y, w, h, selected, onClick) {
  push();
  if (selected) {
    fill(51, 149, 90);
  } else {
    fill(0, 98, 38);
  }
  stroke(255);
  strokeWeight(2);
  rect(x - w / 2, y - h / 2, w, h, 5);
  textSize(20);
  textAlign(CENTER, CENTER);
  text(label, x, y);
  pop();

  if (!window.buttons) window.buttons = [];
  window.buttons.push({
    x1: x - w / 2,
    y1: y - h / 2,
    x2: x + w / 2,
    y2: y + h / 2,
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

function drawGameOverScreen() {
  tint(90, 60, 60);
  image(bgImage, 0, 0, width, height);
  noTint();

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

  fill(255, 100, 100);
  textSize(48);
  textAlign(CENTER, CENTER);
  text("Perdeste!", width / 2, height / 7);

  fill(255);
  textSize(30);
  text(`Pontuação: ${counter}/${quota}`, width / 2, height / 7 + 60);

  displayLeaderboard();

  drawTryAgainButtons();
}

function drawGameWinScreen() {
  tint(60, 100, 60);
  image(bgImage, 0, 0, width, height);
  noTint();

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

  fill(100, 255, 100);
  textSize(48);
  textAlign(CENTER, CENTER);
  text("Ganhaste!", width / 2, height / 7);

  fill(255);
  textSize(30);
  text(`Pontuação: ${counter}`, width / 2, height / 7 + 60);

  displayLeaderboard();

  drawTryAgainButtons();
}

function drawTryAgainButtons() {
  fill(255);
  textSize(26);
  textAlign(CENTER, CENTER);
  text("Tentar outra vez?", width / 2, height - 150);

  let buttonY = height - 90;
  let buttonSpacing = 110;

  drawButton("Sim", width / 2 - buttonSpacing, buttonY, () => {
    playSoundSafe(buttonClickSound);
    gameState = "playing";
    resetGame();
  });

  drawButton("Não", width / 2 + buttonSpacing, buttonY, () => {
    playSoundSafe(buttonClickSound);
    gameState = "menu";
  });
}

function drawConfirmClearScreen() {
  tint(60, 60, 90);
  image(bgImage, 0, 0, width, height);
  noTint();

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
  textSize(30);
  textAlign(CENTER, CENTER);
  text("Tem a certeza que quer", width / 2, height / 3);
  text("eliminar a pontuação?", width / 2, height / 3 + 40);

  let buttonY = height / 2 + 50;
  let buttonSpacing = 110;

  drawButton("Sim", width / 2 - buttonSpacing, buttonY, () => {
    playSoundSafe(buttonClickSound);
    clearLeaderboard();
    gameState = "menu";
  });

  drawButton("Não", width / 2 + buttonSpacing, buttonY, () => {
    playSoundSafe(buttonClickSound);
    gameState = "menu";
  });
}

function clearLeaderboard() {
  localStorage.removeItem("leaderboardWithDiff");
  //console.log("Classificação limpa.");
}

function displayLeaderboard() {
  let leaderboard = getLeaderboard();

  fill(255, 215, 0);
  textSize(36);
  textAlign(CENTER, CENTER);
  text("Top 3", width / 2, height / 3 + 20);

  fill(255);
  textSize(24);
  let startY = height / 3 + 60;

  if (leaderboard.length === 0) {
    textAlign(CENTER, CENTER);
    text("Sem pontuações", width / 2, startY + 30);
  } else {
    for (let i = 0; i < leaderboard.length; i++) {
      textAlign(CENTER, CENTER);

      let difficultyIndicator =
        leaderboard[i].difficulty === "Fácil"
          ? "(F) "
          : leaderboard[i].difficulty === "Médio"
          ? "(M) "
          : "(D) ";
      text(
        `${i + 1}. ${difficultyIndicator}${leaderboard[i].score}`,
        width / 2,
        startY + i * 30
      );
    }
  }
}

function getLeaderboard() {
  let leaderboard = [];
  if (localStorage.getItem("leaderboardWithDiff")) {
    leaderboard = JSON.parse(localStorage.getItem("leaderboardWithDiff"));
  }

  if (
    (gameState === "gameOver" || gameState === "gameWin") &&
    gameJustEnded === false
  ) {
    let newEntry = {
      score: counter,
      difficulty: difficulty,
    };

    let newLeaderboard = [...leaderboard];
    newLeaderboard.push(newEntry);

    newLeaderboard.sort((a, b) => b.score - a.score);

    let uniqueLeaderboard = [];
    let seen = new Set();

    for (let entry of newLeaderboard) {
      let key = `${entry.score}-${entry.difficulty}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueLeaderboard.push(entry);
      }
    }

    uniqueLeaderboard = uniqueLeaderboard.slice(0, 3);

    localStorage.setItem(
      "leaderboardWithDiff",
      JSON.stringify(uniqueLeaderboard)
    );

    return uniqueLeaderboard;
  }

  return leaderboard;
}

function resetGame() {
  fruits = [];
  timer = 120;
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

  if (counter >= quota) {
    gameState = "gameWin";
  } else {
    gameState = "gameOver";
  }
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

  let minutes = Math.floor(timer / 60);
  let seconds = timer % 60;

  fill(0);
  textSize(26);
  strokeWeight(2);
  stroke(255);
  textAlign(LEFT, TOP);
  text(`Tempo: ${nf(minutes, 1)}m ${nf(seconds, 2)}s`, 10, 5);
  text("Fruta Apanhada: " + counter + "/" + quota, 10, 35);

  textSize(16);
  text("ESC para pausar", 10, height - 25);
  text("Diz 'pausar' para pausar", 10, height - 45);

  noStroke();
}

function handleHandDetection() {
  if (hands.length > 0) {
    // Create arrays to track hands and their held fruits
    let currentHands = new Set();
    let fruitToRemove = [];

    // First pass - update hand positions and mark active hands
    for (let i = 0; i < hands.length; i++) {
      let hand = hands[i];
      let handIndex = i;
      let palm = hand.keypoints[9];

      currentHands.add(handIndex);
      trails.push({ x: palm.x, y: palm.y, time: millis() });

      let isClosed = isHandClosed(hand);

      if (isClosed) {
        // Check if this hand is already holding a fruit
        let heldFruit = fruits.find(
          (f) => f.grabbed && f.grabbedBy === handIndex
        );

        if (heldFruit) {
          // Update held fruit position
          heldFruit.x = palm.x;
          heldFruit.y = palm.y;
        } else {
          // Try to grab a new fruit
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
        // Handle releasing fruits
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

    // Remove fruits that were successfully basketed
    fruits = fruits.filter((f) => !fruitToRemove.includes(f));

    // Release fruits held by hands that are no longer detected
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
  text("Jogo Pausado", width / 2, height / 4);

  textSize(18);
  text(
    "Diz 'voltar' para continuar ou 'sair' para sair",
    width / 2,
    height / 4 + 65
  );

  let buttonY = height * 0.55;
  let buttonSpacing = 70;

  drawButton("Voltar", width / 2, buttonY, () => {
    playSoundSafe(pauseSound);
    gameState = "playing";
    isPaused = false;
    if (soundsLoaded && !gameMusic.isPlaying()) {
      gameMusic.loop();
    }
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
  let fingertips = [4, 8, 12, 16, 20]; // ponta dos dedos
  let knuckles = [2, 5, 9, 13, 17]; // juntas dos dedos

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
    image(fruit.img, fruit.x, fruit.y, fruit.w * 1.5, fruit.h * 1.5);
  }
  imageMode(CORNER);
}

function drawBasket() {
  imageMode(CENTER);
  image(
    basketImg,
    basket.x,
    basket.y + basket.h / 2,
    basket.w * 1.2,
    basket.h * 1.5
  );
  imageMode(CORNER);
}

function updateTrails() {
  trails = trails.filter((t) => millis() - t.time < 500);
}

function drawTrails() {
  noFill();
  for (let i = 0; i < trails.length; i++) {
    let hue = (frameCount + i * 10) % 360;
    let alpha = map(millis() - trails[i].time, 0, 500, 200, 0);
    stroke(hue, 100, 100, alpha); // cor e transparência do trail
    strokeWeight(10);
    point(trails[i].x, trails[i].y); // desenha um ponto na posição do rastro
  }
}
