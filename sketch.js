let screenWidth = 1200;
let screenHeight = 800;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Global variables
let glider, boat, man;
let gliderX = 100, gliderY, gliderWidth = 200, gliderHeight = 50;
let boatX = -300, boatY;
let scrollSpeed = 5;
let backgroundX = 0;
let cameraY = 0;
let gameState = "START";
let lives = 3, score = 0;
let bubbles = [], obstacles = [], redPellets = [], pellets = [], backgroundSeaweed = [];
let invincible = false, invincibleTime = 120, invincibleCounter = 0;
let firstPlayFrame = true, gameOver = false;
let globalWaveOffset = 0;
let crashSound, manSound, popSound, waterPelletSound, redPelletSound, hitSound;
let deathSoundPlayed = false, hitSoundPlayed = false;
let angle = 0;
let lift = 5, maxSpeed = 5;
let frameCountSinceLastObstacle = 0;
let obstacleInterval = 150;
let baseObstacleInterval = 150;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Preload assets
function preload() {
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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Setup game environment
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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Main game loop
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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Game state functions
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
    textSize(24);
    fill(255);
    textAlign(CENTER, CENTER);
    text("Jättebra! Tryck 'S' för att köra!", boatX + 450, boatY + 50);
}

function releaseGlider() {
    background(0, 102, 204);
    fill(135, 206, 250);
    rect(0, 0, width, height / 2);
    fill(0, 153, 153);
    
    if (gliderY < height / 2 + 300 - gliderHeight / 2) {
        gliderY += 5;
    } else {
        gameState = "PLAY";
    }
    
    image(boat, boatX, boatY, 1000, 600);
    image(glider, boatX + 400, gliderY, gliderWidth, gliderHeight);
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

    gliderY += gliderSpeedY;
    gliderX += gliderSpeedX;
    gliderY = constrain(gliderY, -gliderHeight / 2, height - gliderHeight / 2);
    gliderX = constrain(gliderX, -gliderWidth / 2, width - gliderWidth / 2);
    gliderSpeedY = constrain(gliderSpeedY, -maxSpeed, maxSpeed);
    gliderSpeedX = constrain(gliderSpeedX, -maxSpeed, maxSpeed);

    angle = map(gliderSpeedY, -maxSpeed, maxSpeed, -PI / 6, PI / 6);
    push();
    translate(gliderX + gliderWidth / 2, gliderY + gliderHeight / 2);
    rotate(angle);
    imageMode(CENTER);
    image(glider, 0, 0, gliderWidth, gliderHeight);
    pop();
    
    spawnObstacles();
    handlePellets();
    
    fill(255);
    textSize(32);
    text("Score: " + score, 60, 30);
    displayLives();
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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Input handling
function keyPressed() {
    if (gameState === "WAIT" && (key === 's' || key === 'S')) {
        gameState = "RELEASE";
    }
    if (gameState === "PLAY") {
        if (key === 'w' || key === 'W') {
            gliderSpeedY = -lift;
        } else if (key === 's' || key === 'S') {
            gliderSpeedY = lift;
        } else if (key === 'a' || key === 'A') {
            gliderSpeedX = -lift;
        } else if (key === 'd' || key === 'D') {
            gliderSpeedX = lift;
        } else if (key === ' ') {
            pellets.push(new WaterPellet(gliderX + gliderWidth, gliderY + gliderHeight / 2));
            waterPelletSound.play();
        }
    }
    if (gameState === "GAMEOVER" && (key === 'r' || key === 'R')) {
        resetGame();
    }
}

function keyReleased() {
    if (gameState === "PLAY") {
        if (key === 'w' || key === 'W' || key === 's' || key === 'S') {
            gliderSpeedY = 0;
        } else if (key === 'a' || key === 'A' || key === 'd' || key === 'D') {
            gliderSpeedX = 0;
        }
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Helper Functions

// Bubble Class
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

// Seaweed Class
class Seaweed {
    constructor(x, width, height, speed, depth) {
        this.x = x;
        this.y = height;
        this.width = width;
        this.height = height;
        this.speed = speed * depth;
        this.depth = depth;
        this.updateWaveParameters();
        this.localWaveOffset = random(TWO_PI);
    }

    update() {
        this.x -= this.speed;
        if (this.x + this.width < 0) {
            this.x = width + random(0, this.width * 3);
            this.height = random(100, 600);
            this.updateWaveParameters();
        }
        globalWaveOffset += 0.003;
    }

    display() {
        fill(34, 139, 34, map(this.depth, 0.5, 1.0, 50, 255));
        noStroke();
        this.drawWavyLine(this.x, this.y, this.height, this.width);
    }

    drawWavyLine(x, y, height, width) {
        beginShape();
        for (let i = 0; i <= 1; i++) {
            let progress = i / 1;
            let xOffset = sin(3.0 * TWO_PI * progress + this.localWaveOffset + globalWaveOffset) * this.waveHeight;
            vertex(x + xOffset, y - i * (height / 1));
        }
        vertex(x, y);
        endShape(CLOSE);
    }

    updateWaveParameters() {
        this.waveHeight = random(15, 60);
    }
}

// Pellet and Obstacle handling and other missing parts would follow similarly
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Helper Classes

// Obstacle Class
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
      this.tentacleSpeed = 0.01;
      this.waveAmplitude = 15;
      this.shootingCooldown = 0;

      if (this.type === "jellyfish" || this.type === "redJellyfish") {
          for (let i = 0; i < 5; i++) {
              this.tentacleXOffsets.push(random(-this.width / 4, this.width / 4));
              this.tentacleLengths.push(random(this.height / 2, this.height));
          }
      }
  }

  update() {
      this.x -= this.speed;
      this.animateTentacles();

      if (this.type === "redJellyfish") {
          this.shootingCooldown--;
          if (this.shootingCooldown <= 0) {
              this.shootRedPellet();
              this.shootingCooldown = 100;
          }
      }
  }

  animateTentacles() {
      for (let i = 0; i < this.tentacleXOffsets.length; i++) {
          let phase = i * PI / 2;
          this.tentacleXOffsets[i] = sin((frameCount * this.tentacleSpeed) + phase) * this.waveAmplitude;
      }
  }

  shootRedPellet() {
      redPellets.push(new RedPellet(this.x, this.y + this.height / 2));
      redPelletSound.play();
  }

  display() {
      fill(this.col);
      ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width, this.height);
      this.drawShadedBelly(this.x + this.width / 2, this.y + this.height / 2, this.width, this.height, this.col);

      stroke(this.col);
      strokeWeight(2);
      for (let i = 0; i < 5; i++) {
          line(
              this.x + this.width / 2 + this.tentacleXOffsets[i],
              this.y + this.height / 2,
              this.x + this.width / 2 + this.tentacleXOffsets[i],
              this.y + this.height / 2 + this.tentacleLengths[i]
          );
      }
      noStroke();
  }

  drawShadedBelly(centerX, centerY, width, height, jellyColor) {
      let darkerBellyColor = lerpColor(jellyColor, color(0), 0.5);
      fill(darkerBellyColor);
      ellipse(centerX, centerY + height * 0.3, width * 0.8, height * 0.3);
  }

  offscreen() {
      return this.x + this.width < 0;
  }

  hits(gx, gy, gw, gh, ga) {
      return this.rotatedCollision(gx + gw / 2, gy + gh / 2, gw, gh, ga, this.x, this.y, this.width, this.height);
  }

  rotatedCollision(gx, gy, gw, gh, ga, ox, oy, ow, oh) {
      let gliderCorners = this.getRotatedCorners(gx, gy, gw, gh, ga);
      let obstacleCorners = this.getRectangleCorners(ox, oy, ow, oh);

      return this.satCheck(gliderCorners, obstacleCorners);
  }

  getRotatedCorners(cx, cy, w, h, angle) {
      let corners = [
          this.rotatePoint(cx, cy, angle, cx - w / 2, cy - h / 2),
          this.rotatePoint(cx, cy, angle, cx + w / 2, cy - h / 2),
          this.rotatePoint(cx, cy, angle, cx + w / 2, cy + h / 2),
          this.rotatePoint(cx, cy, angle, cx - w / 2, cy + h / 2)
      ];
      return corners;
  }

  getRectangleCorners(x, y, w, h) {
      return [createVector(x, y), createVector(x + w, y), createVector(x + w, y + h), createVector(x, y + h)];
  }

  rotatePoint(cx, cy, angle, px, py) {
      let s = sin(angle);
      let c = cos(angle);
      px -= cx;
      py -= cy;
      let xnew = px * c - py * s;
      let ynew = px * s + py * c;
      return createVector(xnew + cx, ynew + cy);
  }

  satCheck(corners1, corners2) {
      let axes = [];

      for (let i = 0; i < 4; i++) {
          let edge = p5.Vector.sub(corners1[(i + 1) % 4], corners1[i]);
          axes.push(createVector(-edge.y, edge.x).normalize());
      }

      for (let i = 0; i < 4; i++) {
          let edge = p5.Vector.sub(corners2[(i + 1) % 4], corners2[i]);
          axes.push(createVector(-edge.y, edge.x).normalize());
      }

      for (let axis of axes) {
          let proj1 = this.projectShape(corners1, axis);
          let proj2 = this.projectShape(corners2, axis);

          if (!this.overlaps(proj1, proj2)) {
              return false;
          }
      }

      return true;
  }

  projectShape(corners, axis) {
      let min = p5.Vector.dot(corners[0], axis);
      let max = min;

      for (let i = 1; i < corners.length; i++) {
          let p = p5.Vector.dot(corners[i], axis);
          if (p < min) min = p;
          if (p > max) max = p;
      }

      return [min, max];
  }

  overlaps(proj1, proj2) {
      return !(proj1[1] < proj2[0] || proj2[1] < proj1[0]);
  }
}

// WaterPellet Class
class WaterPellet {
  constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = 10;
      this.speed = 10;
      this.spawnParticleSystem = new ParticleSystem(this.x, this.y, color(0, 0, 255));
  }

  update() {
      this.x += this.speed;

      if (this.spawnParticleSystem != null) {
          this.spawnParticleSystem.update();
          if (this.spawnParticleSystem.isEmpty()) {
              this.spawnParticleSystem = null;
          }
      }
  }

  display() {
      if (this.spawnParticleSystem != null) {
          this.spawnParticleSystem.display();
      }
      fill(0, 0, 255);
      ellipse(this.x, this.y, this.size, this.size);
  }

  hits(gx, gy, gw, gh) {
      return this.x > gx && this.x < gx + gw && this.y > gy && this.y < gy + gh;
  }

  offscreen() {
      return this.x > width;
  }
}

// RedPellet Class
class RedPellet {
  constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = 10;
      this.speed = 8;
      this.spawnParticleSystem = new ParticleSystem(this.x, this.y, color(255, 0, 0));
  }

  update() {
      this.x -= this.speed;

      if (this.spawnParticleSystem != null) {
          this.spawnParticleSystem.update();
          if (this.spawnParticleSystem.isEmpty()) {
              this.spawnParticleSystem = null;
          }
      }
  }

  display() {
      if (this.spawnParticleSystem != null) {
          this.spawnParticleSystem.display();
      }
      fill(255, 0, 0);
      ellipse(this.x, this.y, this.size, this.size);
  }

  hits(gx, gy, gw, gh) {
      return this.x > gx && this.x < gx + gw && this.y > gy && this.y < gy + gh;
  }

  offscreen() {
      return this.x < -this.size;
  }
}

// Particle and ParticleSystem Classes
class Particle {
  constructor(x, y, col) {
      this.position = createVector(x, y);
      this.velocity = p5.Vector.random2D();
      this.velocity.mult(random(1, 3));
      this.size = random(3, 7);
      this.col = col;
      this.lifespan = 255;
  }

  update() {
      this.position.add(this.velocity);
      this.lifespan -= 15;
  }

  display() {
      noStroke();
      fill(this.col, this.lifespan);
      ellipse(this.position.x, this.position.y, this.size, this.size);
  }

  isDead() {
      return this.lifespan <= 0;
  }
}

class ParticleSystem {
  constructor(x, y, col) {
      this.particles = [];
      this.col = col;
      for (let i = 0; i < 10; i++) {
          this.particles.push(new Particle(x, y, this.col));
      }
  }

  update() {
      for (let i = this.particles.length - 1; i >= 0; i--) {
          this.particles[i].update();
          if (this.particles[i].isDead()) {
              this.particles.splice(i, 1);
          }
      }
  }

  display() {
      for (let particle of this.particles) {
          particle.display();
      }
  }

  isEmpty() {
      return this.particles.length === 0;
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
