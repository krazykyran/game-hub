import Phaser from 'phaser';
import { GAMES, COLORS, GAME_WIDTH } from '../config.js';
import { sfx } from '../audio.js';

// Splash / home screen. Shows a title and a responsive grid of game tiles.
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(COLORS.bgString);
    this._drawBackdrop();

    // Title
    this.add
      .text(width / 2, 92, '🎮  GAME HUB', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '64px',
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 146, 'Pick a game and play', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '24px',
        color: COLORS.textDim,
      })
      .setOrigin(0.5);

    // Tile grid: 3 columns x 2 rows
    const cols = 3;
    const tileW = 268;
    const tileH = 196;
    const gapX = 28;
    const gapY = 28;
    const gridW = cols * tileW + (cols - 1) * gapX;
    const startX = (width - gridW) / 2 + tileW / 2;
    const startY = 248;

    GAMES.forEach((game, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (tileW + gapX);
      const y = startY + row * (tileH + gapY);
      this._makeTile(game, x, y, tileW, tileH);
    });

    this.add
      .text(width / 2, height - 30, 'More games coming soon • Built with Phaser', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '16px',
        color: COLORS.textDim,
      })
      .setOrigin(0.5);
  }

  _drawBackdrop() {
    const { width, height } = this.scale;
    const g = this.add.graphics();
    // Subtle vertical gradient via stacked rectangles.
    const top = Phaser.Display.Color.ValueToColor(0x121a36);
    const bottom = Phaser.Display.Color.ValueToColor(0x070b18);
    const steps = 40;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, bottom, 100, t * 100);
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
      g.fillRect(0, (height / steps) * i, width, height / steps + 1);
    }
  }

  _makeTile(game, x, y, w, h) {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    const radius = 18;

    const drawBg = (hover) => {
      bg.clear();
      bg.fillStyle(COLORS.panel, hover ? 1 : 0.92);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
      bg.lineStyle(hover ? 4 : 2, game.color, game.available ? 1 : 0.4);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);
      // accent bar at the top
      bg.fillStyle(game.color, game.available ? 1 : 0.35);
      bg.fillRoundedRect(-w / 2, -h / 2, w, 8, { tl: radius, tr: radius, bl: 0, br: 0 });
    };
    drawBg(false);

    const emoji = this.add
      .text(0, -38, game.emoji, { fontSize: '58px' })
      .setOrigin(0.5)
      .setAlpha(game.available ? 1 : 0.5);

    const title = this.add
      .text(0, 24, game.title, {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '26px',
        color: COLORS.text,
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5)
      .setAlpha(game.available ? 1 : 0.55);

    const blurb = this.add
      .text(0, 58, game.blurb, {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '15px',
        color: COLORS.textDim,
        align: 'center',
        wordWrap: { width: w - 36 },
      })
      .setOrigin(0.5);

    container.add([bg, emoji, title, blurb]);

    if (!game.available) {
      const badge = this.add
        .text(w / 2 - 14, -h / 2 + 26, 'SOON', {
          fontFamily: 'Trebuchet MS, sans-serif',
          fontSize: '13px',
          color: '#0b1020',
          fontStyle: 'bold',
          backgroundColor: COLORS.warnString,
          padding: { x: 6, y: 3 },
        })
        .setOrigin(1, 0.5);
      container.add(badge);
    }

    container.setSize(w, h);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      Phaser.Geom.Rectangle.Contains
    );

    if (game.available) {
      container.on('pointerover', () => {
        drawBg(true);
        sfx.play('hover');
        this.tweens.add({ targets: container, scale: 1.05, duration: 110, ease: 'Quad.out' });
      });
      container.on('pointerout', () => {
        drawBg(false);
        this.tweens.add({ targets: container, scale: 1, duration: 110, ease: 'Quad.out' });
      });
      container.on('pointerdown', () => {
        sfx.play('click');
        this.tweens.add({
          targets: container,
          scale: 0.97,
          duration: 70,
          yoyo: true,
          onComplete: () => this.scene.start(game.key),
        });
      });
    } else {
      container.on('pointerdown', () => {
        sfx.play('wrong');
        this.tweens.add({ targets: container, x: x + 6, duration: 50, yoyo: true, repeat: 3 });
      });
    }
  }
}
