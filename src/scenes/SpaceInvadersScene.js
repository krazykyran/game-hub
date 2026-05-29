import Phaser from 'phaser';
import { COLORS } from '../config.js';
import { sfx } from '../audio.js';
import { addTopBar, makeButton } from '../ui/widgets.js';

// Classic Space Invaders: marching alien grid, destructible shields, two-way
// fire, explosions and synthesized arcade sound. Endless waves of increasing
// difficulty. All graphics are generated at runtime (no asset files).

const ALIEN_COLS = 11;
const ALIEN_ROWS = 5;
const MARGIN = 28;
const PX = 3; // pixel scale for generated sprites

// Two-frame "crab" invader for the marching wiggle animation.
const INVADER_A = [
  '00100000100',
  '00010001000',
  '00111111100',
  '01101110110',
  '11111111111',
  '10111111101',
  '10100000101',
  '00011011000',
];
const INVADER_B = [
  '00100000100',
  '10010001001',
  '10111111101',
  '11101110111',
  '11111111111',
  '01111111110',
  '00100000100',
  '01000000010',
];
const PLAYER_SHIP = [
  '0000001000000',
  '0000011100000',
  '0000011100000',
  '0111111111110',
  '1111111111111',
  '1111111111111',
  '1111111111111',
  '1111111111111',
];

// Per-row alien tint (top rows worth more points).
const ROW_TINT = [0xf72585, 0x9d4edd, 0x4cc9f0, 0x52b788, 0xffb703];
const ROW_POINTS = [50, 40, 30, 20, 10];

export default class SpaceInvadersScene extends Phaser.Scene {
  constructor() {
    super('SpaceInvaders');
  }

  create() {
    this.cameras.main.setBackgroundColor('#05070f');
    const { width, height } = this.scale;

    this._generateTextures();
    this._drawStars();
    addTopBar(this, 'Space Invaders');

    // State
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.gameOver = false;
    this.dir = 1;
    this.marchStep = 0;
    this.invuln = 0;
    this.playerBullets = [];
    this.alienBullets = [];
    this.aliens = [];
    this.shieldBlocks = [];
    this.lastShot = 0;

    // HUD
    this.scoreText = this.add.text(24, 70, 'Score: 0', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '22px', color: COLORS.text, fontStyle: 'bold',
    });
    this.waveText = this.add.text(width / 2, 72, 'Wave 1', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '20px', color: COLORS.accentString, fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.livesGroup = this.add.container(width - 24, 80);
    this._renderLives();

    // Player
    this.playerY = height - 64;
    this.player = this.add.image(width / 2, this.playerY, 'si_player').setTint(0x52ffa8);

    this._buildShields();
    this._spawnWave();

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.input.keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
    ]);

    this.hint = this.add.text(width / 2, height - 24,
      '← →  move   •   SPACE  fire', {
        fontFamily: 'Trebuchet MS, sans-serif', fontSize: '14px', color: COLORS.textDim,
      }).setOrigin(0.5);

    this.events.once('shutdown', () => {
      this.stepTimer && this.stepTimer.remove();
      this.fireTimer && this.fireTimer.remove();
    });
  }

  // ---------- texture generation ----------
  _generateTextures() {
    const make = (key, matrix) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1);
      matrix.forEach((row, r) => {
        row.split('').forEach((cell, c) => {
          if (cell === '1') g.fillRect(c * PX, r * PX, PX, PX);
        });
      });
      g.generateTexture(key, matrix[0].length * PX, matrix.length * PX);
      g.destroy();
    };
    make('si_invA', INVADER_A);
    make('si_invB', INVADER_B);
    make('si_player', PLAYER_SHIP);
  }

  _drawStars() {
    const { width, height } = this.scale;
    const g = this.add.graphics();
    for (let i = 0; i < 90; i++) {
      const a = Phaser.Math.FloatBetween(0.2, 0.9);
      g.fillStyle(0xffffff, a);
      g.fillRect(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), Phaser.Math.Between(1, 2), Phaser.Math.Between(1, 2));
    }
  }

  // ---------- shields ----------
  _buildShields() {
    const { width, height } = this.scale;
    const count = 4;
    const bs = 9;
    const cols = 9;
    const rows = 6;
    const shieldW = cols * bs;
    const gap = (width - count * shieldW) / (count + 1);
    const baseY = height - 170;

    for (let s = 0; s < count; s++) {
      const sx = gap + s * (shieldW + gap);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // round the top corners
          if (r === 0 && (c === 0 || c === cols - 1)) continue;
          // carve a doorway in the bottom-middle
          if (r >= rows - 2 && c >= 3 && c <= 5) continue;
          const block = this.add.rectangle(sx + c * bs + bs / 2, baseY + r * bs + bs / 2, bs - 1, bs - 1, 0x52b788);
          this.shieldBlocks.push(block);
        }
      }
    }
  }

  // ---------- aliens ----------
  _spawnWave() {
    const { width } = this.scale;
    const spacingX = 56;
    const spacingY = 44;
    const formationW = (ALIEN_COLS - 1) * spacingX;
    const startX = width / 2 - formationW / 2;
    const startY = 130 + Math.min(this.wave - 1, 4) * 14; // start a touch lower each wave

    this.aliens = [];
    for (let r = 0; r < ALIEN_ROWS; r++) {
      for (let c = 0; c < ALIEN_COLS; c++) {
        const sprite = this.add
          .image(startX + c * spacingX, startY + r * spacingY, 'si_invA')
          .setTint(ROW_TINT[r]);
        this.aliens.push({ sprite, alive: true, row: r, col: c, points: ROW_POINTS[r] });
      }
    }
    this.totalAliens = this.aliens.length;
    this.stepX = 12;
    this.stepY = 22;

    this._restartTimers();
    sfx.play('newWave');
  }

  _aliveAliens() {
    return this.aliens.filter((a) => a.alive);
  }

  _stepDelay() {
    const alive = this._aliveAliens().length;
    const frac = alive / this.totalAliens;
    // Full grid ~560ms, last alien ~90ms, faster on later waves.
    const base = Phaser.Math.Linear(90, 560, frac);
    return Math.max(60, base - (this.wave - 1) * 30);
  }

  _fireDelay() {
    return Math.max(350, 1200 - (this.wave - 1) * 120);
  }

  _restartTimers() {
    if (this.stepTimer) this.stepTimer.remove();
    if (this.fireTimer) this.fireTimer.remove();
    this.stepTimer = this.time.addEvent({ delay: this._stepDelay(), loop: true, callback: this._step, callbackScope: this });
    this.fireTimer = this.time.addEvent({ delay: this._fireDelay(), loop: true, callback: this._alienFire, callbackScope: this });
  }

  _step() {
    if (this.gameOver) return;
    const alive = this._aliveAliens();
    if (alive.length === 0) return;

    const { width } = this.scale;
    const halfW = this.aliens[0].sprite.displayWidth / 2;
    const xs = alive.map((a) => a.sprite.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);

    let moveDown = false;
    if (this.dir > 0 && maxX + halfW + this.stepX > width - MARGIN) moveDown = true;
    if (this.dir < 0 && minX - halfW - this.stepX < MARGIN) moveDown = true;

    if (moveDown) {
      this.dir *= -1;
      alive.forEach((a) => (a.sprite.y += this.stepY));
    } else {
      alive.forEach((a) => (a.sprite.x += this.stepX * this.dir));
    }

    // Wiggle animation: swap frame each step.
    this.marchStep = (this.marchStep + 1) % 4;
    const frame = this.marchStep % 2 === 0 ? 'si_invA' : 'si_invB';
    alive.forEach((a) => a.sprite.setTexture(frame).setTint(ROW_TINT[a.row]));
    sfx.play(['marchA', 'marchB', 'marchC', 'marchD'][this.marchStep]);

    // Did they reach the shields/player?
    const lowest = Math.max(...alive.map((a) => a.sprite.y));
    if (lowest >= this.playerY - 30) {
      this._endGame(false);
    }
  }

  _alienFire() {
    if (this.gameOver) return;
    const alive = this._aliveAliens();
    if (alive.length === 0) return;

    // Find the lowest alien in a random occupied column (so shots come from the front line).
    const byCol = {};
    alive.forEach((a) => {
      if (!byCol[a.col] || a.sprite.y > byCol[a.col].sprite.y) byCol[a.col] = a;
    });
    const shooters = Object.values(byCol);
    const shooter = Phaser.Utils.Array.GetRandom(shooters);
    const b = this.add.rectangle(shooter.sprite.x, shooter.sprite.y + 16, 4, 14, 0xff5d6c);
    this.alienBullets.push(b);
  }

  // ---------- player ----------
  _renderLives() {
    this.livesGroup.removeAll(true);
    for (let i = 0; i < this.lives; i++) {
      const icon = this.add.image(-i * 30, 0, 'si_player').setTint(0x52ffa8).setScale(0.6).setOrigin(1, 0.5);
      this.livesGroup.add(icon);
    }
  }

  _shoot() {
    if (this.gameOver) return;
    const now = this.time.now;
    if (now - this.lastShot < 300) return;
    if (this.playerBullets.length >= 2) return;
    this.lastShot = now;
    const b = this.add.rectangle(this.player.x, this.playerY - 26, 4, 16, 0x9bffd6);
    this.playerBullets.push(b);
    sfx.play('shoot');
  }

  _hitPlayer() {
    if (this.invuln > 0 || this.gameOver) return;
    sfx.play('playerExplode');
    this._explode(this.player.x, this.player.y, 0x52ffa8, 22);
    this.cameras.main.shake(260, 0.014);
    this.lives -= 1;
    this._renderLives();
    if (this.lives <= 0) {
      this.player.setVisible(false);
      this._endGame(false);
      return;
    }
    this.invuln = 1600;
    this.player.setX(this.scale.width / 2);
  }

  // ---------- effects ----------
  _explode(x, y, color, count = 14) {
    for (let i = 0; i < count; i++) {
      const p = this.add.rectangle(x, y, Phaser.Math.Between(3, 7), Phaser.Math.Between(3, 7), color);
      const ang = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(20, 90);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(ang) * dist,
        y: y + Math.sin(ang) * dist,
        alpha: 0,
        angle: Phaser.Math.Between(-180, 180),
        duration: Phaser.Math.Between(350, 700),
        ease: 'Quad.out',
        onComplete: () => p.destroy(),
      });
    }
  }

  // ---------- collisions ----------
  _hits(a, b) {
    return Phaser.Geom.Intersects.RectangleToRectangle(a.getBounds(), b.getBounds());
  }

  _damageShields(bullet) {
    for (let i = this.shieldBlocks.length - 1; i >= 0; i--) {
      const block = this.shieldBlocks[i];
      if (this._hits(bullet, block)) {
        this._explode(block.x, block.y, 0x52b788, 5);
        block.destroy();
        this.shieldBlocks.splice(i, 1);
        sfx.play('shieldHit');
        return true;
      }
    }
    return false;
  }

  // ---------- end ----------
  _endGame(won) {
    if (this.gameOver) return;
    this.gameOver = true;
    this.stepTimer && this.stepTimer.remove();
    this.fireTimer && this.fireTimer.remove();
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x05070f, 0.85).setDepth(50);
    const panel = this.add.container(width / 2, height / 2).setDepth(51);
    const g = this.add.graphics();
    g.fillStyle(COLORS.panel, 1);
    g.fillRoundedRect(-230, -150, 460, 300, 20);
    g.lineStyle(3, won ? COLORS.good : COLORS.accent2, 1);
    g.strokeRoundedRect(-230, -150, 460, 300, 20);
    panel.add(g);
    panel.add(this.add.text(0, -100, won ? 'You Win!' : 'Game Over', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '44px', color: COLORS.text, fontStyle: 'bold',
    }).setOrigin(0.5));
    panel.add(this.add.text(0, -34, 'Score: ' + this.score, {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '30px', color: COLORS.goodString, fontStyle: 'bold',
    }).setOrigin(0.5));
    panel.add(this.add.text(0, 8, 'Reached wave ' + this.wave, {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '18px', color: COLORS.textDim,
    }).setOrigin(0.5));

    makeButton(this, width / 2, height / 2 + 70, 'Play Again', () => this.scene.restart(), {
      width: 200, height: 52, fill: COLORS.panel, fillHover: COLORS.good,
    }).setDepth(52);
    makeButton(this, width / 2, height / 2 + 132, '← Back to Menu', () => this.scene.start('Menu'), {
      width: 200, height: 46, fontSize: 18, fill: COLORS.panel, fillHover: COLORS.accent2,
    }).setDepth(52);

    sfx.play(won ? 'win' : 'lose');
  }

  // ---------- main loop ----------
  update(time, delta) {
    if (this.gameOver) return;
    const dt = delta / 1000;
    const { width } = this.scale;

    // Player movement
    const speed = 420;
    let vx = 0;
    if (this.cursors.left.isDown || this.keyA.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.keyD.isDown) vx += 1;
    this.player.x = Phaser.Math.Clamp(this.player.x + vx * speed * dt, 30, width - 30);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) this._shoot();

    // Invulnerability flicker
    if (this.invuln > 0) {
      this.invuln -= delta;
      this.player.setAlpha(Math.floor(time / 80) % 2 === 0 ? 0.35 : 1);
      if (this.invuln <= 0) this.player.setAlpha(1);
    }

    // Player bullets travel up
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const b = this.playerBullets[i];
      b.y -= 620 * dt;
      let consumed = false;
      // hit aliens
      for (const a of this.aliens) {
        if (a.alive && this._hits(b, a.sprite)) {
          a.alive = false;
          a.sprite.destroy();
          this.score += a.points;
          this.scoreText.setText('Score: ' + this.score);
          this._explode(a.sprite.x, a.sprite.y, ROW_TINT[a.row], 16);
          sfx.play('invaderHit');
          this._restartTimers(); // speed up as the horde thins
          consumed = true;
          break;
        }
      }
      if (!consumed && this._damageShields(b)) consumed = true;
      if (consumed || b.y < 40) {
        b.destroy();
        this.playerBullets.splice(i, 1);
      }
    }

    // Win the wave?
    if (this._aliveAliens().length === 0 && !this.gameOver) {
      this.wave += 1;
      this.waveText.setText('Wave ' + this.wave);
      this.score += 100;
      this.scoreText.setText('Score: ' + this.score);
      this._spawnWave();
      return;
    }

    // Alien bullets travel down
    for (let i = this.alienBullets.length - 1; i >= 0; i--) {
      const b = this.alienBullets[i];
      b.y += 340 * dt;
      let consumed = false;
      if (this._damageShields(b)) {
        consumed = true;
      } else if (this.invuln <= 0 && this._hits(b, this.player) && this.player.visible) {
        this._hitPlayer();
        consumed = true;
      }
      if (consumed || b.y > this.scale.height + 20) {
        b.destroy();
        this.alienBullets.splice(i, 1);
      }
    }
  }
}
