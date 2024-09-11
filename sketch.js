let glider, boat, man; // Images
let gliderX = 100, gliderY, gliderWidth = 200, gliderHeight = 50;
let boatX = -300, boatY;
let scrollSpeed = 5;
let backgroundX = 0;
let cameraY = 0;
let screenWidth = 1200, screenHeight = 800;
let gameState = "START";
let lives = 3, score = 0;
let bubbles = [], obstacles = [], redPellets = [], pellets = [], backgroundSeaweed = [];
let invincible = false, invincibleTime = 120, invincibleCounter = 0;
let firstPlayFrame = true, gameOver = false;
let crashSound, manSound, popSound, waterPelletSound, redPelletSound, hitSound;
let deathSoundPlayed = false, hitSoundPlayed = false;

function preload() {
    // Load images and sounds
    glider = loadImage('assets/glider.png');
    boat = loadImage('assets/boat.png');
    man = loadImage('assets/man.png');
    crashSound = loadSound('assets/crashSound.mp3');
    manSound = loadSound('assets/manSound.mp3');
    popSound = loadSound('assets/popSound.mp3');
    waterPelletSound = loadSound('assets/shot.mp3');
    redPelletSound = loadSound('assets/squish.mp3');
    hitSound = loadSound('assets/hit.mp3');
}

function setup() {
    let canvas = createCanvas(screenWidth, screenHeight);
    canvas.parent('game-container');
    boatY = height / 2 - 350;
    gliderY = boatY + 350;
    let seaweedSpacing = random(width / 5, width / 10);
    for (let i = 0; i < 10; i++) {
        let swHeight = random(200, 400);
        let swX = i * seaweedSpacing + width;
        let depth = random(0.5, 1.0);
        backgroundSeaweed.push(new Seaweed(swX, random(20, 40), swHeight, scrollSpeed * 0.5, depth));
    }
    noLoop(); // Wait for the game to start
}

function draw() {
    if (gameState === "START") {
        startScreen();
    } else if (gameState === "WAIT") {
        waitForStart();
    } else if (gameState === "RELEASE") {
        releaseGlider();
    } else if (gameState === "PLAY") {
        playGame();
    } else if (gameState === "GAMEOVER") {
        gameOverScreen();
    }
}

class Bubble {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = random(1, 3);
    }

    update() {
        this.y -= this.speed;
        this.x -= scrollSpeed;
    }

    display() {
        fill(173, 216, 230, 150);
        noStroke();
        ellipse(this.x, this.y, this.size, this.size);
    }

    offscreen() {
        return this.y < -this.size || this.x < -this.size;
    }
}

class Seaweed {
    constructor(x, width, height, speed, depth) {
        this.x = x;
        this.y = screenHeight;
        this.width = width;
        this.height = height;
        this.speed = speed * depth;
        this.depth = depth;
        this.waveHeight = random(15, 60);
        this.localWaveOffset = random(TWO_PI);
    }

    update() {
        this.x -= this.speed;
        if (this.x + this.width < 0) {
            this.x = screenWidth + random(0, this.width * 3);
            this.height = random(100, 600);
            this.localWaveOffset = random(TWO_PI);
        }
    }

    display() {
        fill(34, 139, 34, map(this.depth, 0.5, 1.0, 50, 255));
        noStroke();
        beginShape();
        let segments = 1;
        for (let i = 0; i <= segments; i++) {
            let progress = i / segments;
            let xOffset = sin(3.0 * TWO_PI * progress + this.localWaveOffset) * this.waveHeight;
            vertex(this.x + xOffset, this.y - i * (this.height / segments));
        }
        endShape(CLOSE);
    }
}

class Obstacle {
    constructor(x, y, width, height, col, type, speed) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.col = col;
        this.type = type;
        this.speed = speed;
        this.tentacleXOffsets = [];
        this.tentacleLengths = [];
        for (let i = 0; i < 5; i++) {
            this.tentacleXOffsets[i] = random(-width / 4, width / 4);
            this.tentacleLengths[i] = random(height / 2, height);
        }
    }

    update() {
        this.x -= this.speed;
    }

    display() {
        fill(this.col);
        ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width, this.height);
        stroke(this.col);
        strokeWeight(2);
        for (let i = 0; i < 5; i++) {
            line(this.x + this.width / 2 + this.tentacleXOffsets[i], this.y + this.height / 2, this.x + this.width / 2 + this.tentacleXOffsets[i], this.y + this.height / 2 + this.tentacleLengths[i]);
        }
        noStroke();
    }

    offscreen() {
        return this.x + this.width < 0;
    }

    hits(gliderX, gliderY, gliderWidth, gliderHeight) {
        return this.x < gliderX + gliderWidth && this.x + this.width > gliderX && this.y < gliderY + gliderHeight && this.y + this.height > gliderY;
    }
}

class WaterPellet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 10;
        this.speed = 10;
    }

    update() {
        this.x += this.speed;
    }

    display() {
        fill(0, 0, 255);
        ellipse(this.x, this.y, this.size, this.size);
    }

    offscreen() {
        return this.x > width;
    }
}

class RedPellet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 10;
        this.speed = 8;
    }

    update() {
        this.x -= this.speed;
    }

    display() {
        fill(255, 0, 0);
        ellipse(this.x, this.y, this.size, this.size);
    }

    hits(gliderX, gliderY, gliderWidth, gliderHeight) {
        return this.x > gliderX && this.x < gliderX + gliderWidth && this.y > gliderY && this.y < gliderY + gliderHeight;
    }

    offscreen() {
        return this.x < -this.size;
    }
}

function startScreen() {
    background(0, 102, 204);
    fill(135, 206, 250);
    rect(0, 0, width, height / 2);
    fill(0, 153, 153);
    if (boatX < width / 2 - 600) {
        boatX += 5;
        image(man, boatX + 300, boatY + 120, 100, 200);
        image(boat, boatX, boatY, 1000, 600);
        image(glider, boatX + 400, gliderY, gliderWidth, gliderHeight);
    } else {
        boatX = width / 2 - 600;
        gameState = "WAIT";
    }
}

function waitForStart() {
    if (!manSound.isPlaying()) {
        manSound.play();
    }
    background(0, 102, 204);
    fill(135, 206, 250);
    rect(0, 0, width, height / 2);
    fill(0, 153, 153);
    image(man, boatX + 300, boatY + 120, 100, 200);
    image(boat, boatX, boatY, 1000, 600);
    image(glider, boatX + 400, gliderY, gliderWidth, gliderHeight);
    fill(255);
    textSize(24);
    textAlign(CENTER, CENTER);
    text("Jättebra! Tryck 'S' för att köra!", boatX + 450, boatY + 50);
}

function releaseGlider() {
    background(0, 102, 204);
    fill(135, 206, 250);
    rect(0, 0, width, height / 2);
    fill(0, 153, 153);
    if (gliderY < height / 2 + 300 - gliderHeight / 2) {
        cameraY += 5;
    } else {
        gameState = "PLAY";
    }
    image(man, boatX + 300, boatY + 120 - cameraY, 100, 200);
    image(boat, boatX, boatY - cameraY, 1000, 600);
    gliderY += 5;
    image(glider, boatX + 400, gliderY - cameraY, gliderWidth, gliderHeight);
}

function playGame() {
    background(0, 102, 204);
    if (frameCount % 50 === 0) {
        bubbles.push(new Bubble(random(width), height, random(10, 30)));
    }
    for (let i = bubbles.length - 1; i >= 0; i--) {
        bubbles[i].update();
        bubbles[i].display();
        if (bubbles[i].offscreen()) {
            bubbles.splice(i, 1);
        }
    }
    for (let sw of backgroundSeaweed) {
        sw.update();
        sw.display();
    }
    for (let pellet of pellets) {
        pellet.update();
        pellet.display();
    }
    for (let redPellet of redPellets) {
        redPellet.update();
        redPellet.display();
    }
    if (firstPlayFrame) {
        gliderX = boatX + 400;
        gliderY = height / 2 + 300 - gliderHeight / 2 - 280;
        firstPlayFrame = false;
    }
    push();
    translate(gliderX + gliderWidth / 2, gliderY + gliderHeight / 2);
    imageMode(CENTER);
    image(glider, 0, 0, gliderWidth, gliderHeight);
    pop();
}

function gameOverScreen() {
    background(0);
    fill(255);
    textSize(50);
    textAlign(CENTER, CENTER);
    text("GAME OVER", width / 2, height / 2 - 50);
    textSize(32);
    text("Final Score: " + score, width / 2, height / 2 + 50);
    textSize(24);
    text("Press 'R' to restart", width / 2, height / 2 + 100);
}

function keyPressed() {
    if (gameState === "WAIT" && key === 'S') {
        gameState = "RELEASE";
    }
    if (gameState === "PLAY") {
        if (key === 'w' || key === 'W') {
            gliderY -= 5;
        } else if (key === 's' || key === 'S') {
            gliderY += 5;
        } else if (key === 'a' || key === 'A') {
            gliderX -= 5;
        } else if (key === 'd' || key === 'D') {
            gliderX += 5;
        } else if (key === ' ') {
            pellets.push(new WaterPellet(gliderX + gliderWidth, gliderY + gliderHeight / 2));
            waterPelletSound.play();
        }
    }
    if (gameState === "GAMEOVER" && (key === 'r' || key === 'R')) {
        resetGame();
    }
}

function resetGame() {
    gameOver = false;
    score = 0;
    lives = 3;
    gameState = "START";
    invincible = false;
    gliderX = 100;
    gliderY = boatY + 350;
    bubbles = [];
    obstacles = [];
    redPellets = [];
    pellets = [];
    firstPlayFrame = true;
    noLoop();
}