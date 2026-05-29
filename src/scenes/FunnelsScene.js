import Phaser from 'phaser';
import { COLORS } from '../config.js';
import { sfx } from '../audio.js';
import { addTopBar, makeButton } from '../ui/widgets.js';

// Funnels & Buckets — an educational math game.
// A funnel slides across the top and periodically drops a math problem.
// Type the answer and press Enter to catch it in the bucket before it
// smashes on the ground. 3 lives. Difficulty ramps up by level.
export default class FunnelsScene extends Phaser.Scene {
  constructor() {
    super('Funnels');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0b1020');
    const { width, height } = this.scale;

    this.groundY = height - 96;
    this.problems = [];
    this.typed = '';
    this.score = 0;
    this.lives = 3;
    this.solved = 0;
    this.level = 1;
    this.gameOver = false;

    this._drawScenery();
    addTopBar(this, 'Funnels & Buckets');

    // HUD
    this.scoreText = this.add.text(24, 72, 'Score: 0', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '24px',
      color: COLORS.text,
      fontStyle: 'bold',
    });
    this.levelText = this.add
      .text(width / 2, 76, 'Level 1', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '22px',
        color: COLORS.accentString,
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0);
    this.livesText = this.add
      .text(width - 24, 72, '❤️❤️❤️', { fontSize: '24px' })
      .setOrigin(1, 0);

    // Funnel
    this.funnel = this._makeFunnel(width / 2, 122);
    this.funnelDir = 1;
    this.funnelSpeed = 150;

    // Bucket + answer box at the bottom
    this.bucket = this._makeBucket(width / 2, this.groundY + 6);
    this.answerBox = this.add
      .text(width / 2, height - 30, '', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '30px',
        color: COLORS.text,
        fontStyle: 'bold',
        backgroundColor: '#161d33',
        padding: { x: 18, y: 8 },
        fixedWidth: 220,
        align: 'center',
      })
      .setOrigin(0.5);
    this._renderAnswer();

    this.hint = this.add
      .text(width / 2, height - 66, 'Type the answer, press Enter', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '15px',
        color: COLORS.textDim,
      })
      .setOrigin(0.5);

    // Spawn timer
    this.spawnEvent = this.time.addEvent({
      delay: this._spawnDelay(),
      loop: true,
      callback: () => this._spawnProblem(),
    });
    this._spawnProblem(); // first one quickly

    // Input
    this.input.keyboard.on('keydown', this._onKey, this);
    this.events.once('shutdown', () => this.input.keyboard.off('keydown', this._onKey, this));
  }

  // ---------- scenery ----------
  _drawScenery() {
    const { width, height } = this.scale;
    const g = this.add.graphics();
    // sky gradient
    const top = Phaser.Display.Color.ValueToColor(0x0f1830);
    const bot = Phaser.Display.Color.ValueToColor(0x1a2547);
    const steps = 30;
    for (let i = 0; i < steps; i++) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, bot, 100, (i / (steps - 1)) * 100);
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
      g.fillRect(0, (height / steps) * i, width, height / steps + 1);
    }
    // ground
    g.fillStyle(0x2b231a, 1);
    g.fillRect(0, this.groundY + 38, width, height - this.groundY);
    g.fillStyle(0x3a5a40, 1);
    g.fillRect(0, this.groundY + 38, width, 10);
  }

  _makeFunnel(x, y) {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0x9aa5c4, 1);
    g.fillRoundedRect(-46, -34, 92, 24, 6); // top rim
    g.fillStyle(0xc0c8e0, 1);
    g.beginPath();
    g.moveTo(-46, -12);
    g.lineTo(46, -12);
    g.lineTo(14, 26);
    g.lineTo(-14, 26);
    g.closePath();
    g.fillPath();
    g.fillStyle(0x9aa5c4, 1);
    g.fillRect(-12, 24, 24, 14); // spout
    const face = this.add.text(0, -6, '🧪', { fontSize: '20px' }).setOrigin(0.5);
    c.add([g, face]);
    return c;
  }

  _makeBucket(x, y) {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0xffb703, 1);
    g.beginPath();
    g.moveTo(-44, -28);
    g.lineTo(44, -28);
    g.lineTo(32, 30);
    g.lineTo(-32, 30);
    g.closePath();
    g.fillPath();
    g.fillStyle(0xe09500, 1);
    g.fillRoundedRect(-48, -34, 96, 12, 4); // rim
    c.add(g);
    c.setSize(96, 64);
    return c;
  }

  // ---------- problem lifecycle ----------
  _spawnDelay() {
    return Math.max(1300, 3200 - this.level * 220);
  }

  _fallSpeed() {
    return 42 + this.level * 9; // px per second
  }

  _makeProblem() {
    // Difficulty scales with level.
    const lvl = this.level;
    const ops = lvl < 2 ? ['+'] : lvl < 4 ? ['+', '-'] : ['+', '-', '×'];
    const op = Phaser.Utils.Array.GetRandom(ops);
    let a, b, answer, label;
    const max = Math.min(9 + lvl * 3, 30);
    if (op === '+') {
      a = Phaser.Math.Between(1, max);
      b = Phaser.Math.Between(1, max);
      answer = a + b;
      label = `${a} + ${b}`;
    } else if (op === '-') {
      a = Phaser.Math.Between(1, max);
      b = Phaser.Math.Between(0, a);
      answer = a - b;
      label = `${a} − ${b}`;
    } else {
      a = Phaser.Math.Between(2, Math.min(6 + lvl, 12));
      b = Phaser.Math.Between(2, Math.min(6 + lvl, 12));
      answer = a * b;
      label = `${a} × ${b}`;
    }
    return { label, answer };
  }

  _spawnProblem() {
    if (this.gameOver) return;
    const data = this._makeProblem();
    const x = this.funnel.x;
    const y = this.funnel.y + 40;

    const container = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0x4cc9f0, 0.18);
    g.fillRoundedRect(-58, -28, 116, 56, 14);
    g.lineStyle(3, COLORS.accent, 1);
    g.strokeRoundedRect(-58, -28, 116, 56, 14);
    // little jar handle on top
    g.fillStyle(COLORS.accent, 1);
    g.fillRoundedRect(-10, -36, 20, 8, 3);
    const text = this.add
      .text(0, 0, data.label, {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '28px',
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    container.add([g, text]);
    container.setScale(0);
    this.tweens.add({ targets: container, scale: 1, duration: 200, ease: 'Back.out' });

    this.problems.push({ container, answer: data.answer, label: data.label, caught: false });
    sfx.play('drop');
  }

  // ---------- input ----------
  _onKey(event) {
    if (this.gameOver) return;
    const key = event.key;
    if (/^[0-9]$/.test(key)) {
      if (this.typed.length < 4) {
        this.typed += key;
        this._renderAnswer();
        sfx.play('type');
      }
    } else if (key === 'Backspace') {
      this.typed = this.typed.slice(0, -1);
      this._renderAnswer();
    } else if (key === 'Enter') {
      this._submit();
    }
  }

  _renderAnswer() {
    this.answerBox.setText(this.typed === '' ? '_' : this.typed);
  }

  _submit() {
    if (this.typed === '') return;
    const value = parseInt(this.typed, 10);
    // Match the lowest (closest to ground) problem with this answer.
    let target = null;
    let lowest = -Infinity;
    for (const p of this.problems) {
      if (!p.caught && p.answer === value && p.container.y > lowest) {
        lowest = p.container.y;
        target = p;
      }
    }
    if (target) {
      this._catch(target);
    } else {
      sfx.play('wrong');
      this.cameras.main.shake(120, 0.006);
      this.tweens.add({ targets: this.answerBox, x: this.answerBox.x + 8, duration: 50, yoyo: true, repeat: 2 });
    }
    this.typed = '';
    this._renderAnswer();
  }

  _catch(p) {
    p.caught = true;
    sfx.play('correct');
    this.score += 10 + this.level * 2;
    this.solved += 1;
    this.scoreText.setText('Score: ' + this.score);
    this._floatText(p.container.x, p.container.y, '+' + (10 + this.level * 2), COLORS.goodString);

    this.tweens.add({
      targets: p.container,
      x: this.bucket.x,
      y: this.bucket.y - 10,
      scale: 0.4,
      duration: 320,
      ease: 'Quad.in',
      onComplete: () => {
        p.container.destroy();
        this._sparkle(this.bucket.x, this.bucket.y - 20);
      },
    });
    this.problems = this.problems.filter((q) => q !== p);

    // Level up every 5 solved.
    if (this.solved % 5 === 0) {
      this.level += 1;
      this.levelText.setText('Level ' + this.level);
      this.spawnEvent.delay = this._spawnDelay();
      this._floatText(this.scale.width / 2, 140, 'Level ' + this.level + '!', COLORS.accentString, 36);
    }
  }

  _smash(p) {
    p.caught = true;
    sfx.play('smash');
    this.cameras.main.shake(160, 0.01);
    const x = p.container.x;
    const y = this.groundY + 20;
    // shards
    for (let i = 0; i < 12; i++) {
      const shard = this.add.rectangle(
        x,
        y,
        Phaser.Math.Between(6, 14),
        Phaser.Math.Between(6, 14),
        COLORS.accent
      );
      this.tweens.add({
        targets: shard,
        x: x + Phaser.Math.Between(-140, 140),
        y: y - Phaser.Math.Between(20, 120),
        angle: Phaser.Math.Between(-180, 180),
        alpha: 0,
        duration: Phaser.Math.Between(500, 900),
        ease: 'Quad.out',
        onComplete: () => shard.destroy(),
      });
    }
    this._floatText(x, y - 30, p.label + ' = ' + p.answer, COLORS.badString, 22);
    p.container.destroy();
    this.problems = this.problems.filter((q) => q !== p);

    this._loseLife();
  }

  _loseLife() {
    this.lives -= 1;
    this.livesText.setText('❤️'.repeat(Math.max(0, this.lives)) + '🖤'.repeat(3 - Math.max(0, this.lives)));
    if (this.lives <= 0) this._endGame();
  }

  _floatText(x, y, msg, color, size = 26) {
    const t = this.add
      .text(x, y, msg, {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: size + 'px',
        color,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 900, ease: 'Quad.out', onComplete: () => t.destroy() });
  }

  _sparkle(x, y) {
    for (let i = 0; i < 8; i++) {
      const s = this.add.star(x, y, 4, 3, 7, COLORS.warn);
      const ang = (Math.PI * 2 * i) / 8;
      this.tweens.add({
        targets: s,
        x: x + Math.cos(ang) * 40,
        y: y + Math.sin(ang) * 40,
        alpha: 0,
        duration: 500,
        onComplete: () => s.destroy(),
      });
    }
  }

  _endGame() {
    this.gameOver = true;
    this.spawnEvent.remove();
    sfx.play('lose');
    const { width, height } = this.scale;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x05070f, 0.82);
    overlay.setDepth(50);
    const panel = this.add.container(width / 2, height / 2).setDepth(51);
    const g = this.add.graphics();
    g.fillStyle(COLORS.panel, 1);
    g.fillRoundedRect(-220, -150, 440, 300, 20);
    g.lineStyle(3, COLORS.accent2, 1);
    g.strokeRoundedRect(-220, -150, 440, 300, 20);
    panel.add(g);
    panel.add(this.add.text(0, -100, 'Game Over', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '44px', color: COLORS.text, fontStyle: 'bold',
    }).setOrigin(0.5));
    panel.add(this.add.text(0, -34, 'Score: ' + this.score, {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '30px', color: COLORS.goodString, fontStyle: 'bold',
    }).setOrigin(0.5));
    panel.add(this.add.text(0, 8, 'Solved ' + this.solved + ' • Reached level ' + this.level, {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '18px', color: COLORS.textDim,
    }).setOrigin(0.5));

    makeButton(this, width / 2, height / 2 + 70, 'Play Again', () => this.scene.restart(), {
      width: 200, height: 52, fill: COLORS.panel, fillHover: COLORS.good,
    }).setDepth(52);
    makeButton(this, width / 2, height / 2 + 132, '← Back to Menu', () => this.scene.start('Menu'), {
      width: 200, height: 46, fontSize: 18, fill: COLORS.panel, fillHover: COLORS.accent2,
    }).setDepth(52);
  }

  // ---------- main loop ----------
  update(time, delta) {
    if (this.gameOver) return;
    const dt = delta / 1000;
    const { width } = this.scale;

    // Funnel slides left/right, bouncing off the edges.
    this.funnel.x += this.funnelDir * this.funnelSpeed * dt;
    if (this.funnel.x > width - 70) {
      this.funnel.x = width - 70;
      this.funnelDir = -1;
    } else if (this.funnel.x < 70) {
      this.funnel.x = 70;
      this.funnelDir = 1;
    }

    // Falling problems.
    const speed = this._fallSpeed();
    for (const p of this.problems) {
      if (p.caught) continue;
      p.container.y += speed * dt;
      if (p.container.y >= this.groundY) {
        this._smash(p);
      }
    }
  }
}
