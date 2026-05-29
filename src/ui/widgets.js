// Reusable UI widgets built on Phaser game objects.
import { COLORS } from '../config.js';
import { sfx } from '../audio.js';

// Rounded rectangular button with hover/press feedback.
// Returns the container so callers can position/destroy it.
export function makeButton(scene, x, y, label, onClick, opts = {}) {
  const {
    width = 220,
    height = 56,
    fill = COLORS.panel,
    fillHover = COLORS.accent,
    textColor = COLORS.text,
    textColorHover = '#0b1020',
    fontSize = 24,
    radius = 12,
  } = opts;

  const container = scene.add.container(x, y);
  const bg = scene.add.graphics();

  const draw = (color) => {
    bg.clear();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
  };
  draw(fill);

  const text = scene.add
    .text(0, 0, label, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: `${fontSize}px`,
      color: textColor,
      fontStyle: 'bold',
    })
    .setOrigin(0.5);

  container.add([bg, text]);
  container.setSize(width, height);
  container.setInteractive(
    new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
    Phaser.Geom.Rectangle.Contains
  );

  container.on('pointerover', () => {
    draw(fillHover);
    text.setColor(textColorHover);
    sfx.play('hover');
    scene.tweens.add({ targets: container, scale: 1.04, duration: 90 });
  });
  container.on('pointerout', () => {
    draw(fill);
    text.setColor(textColor);
    scene.tweens.add({ targets: container, scale: 1, duration: 90 });
  });
  container.on('pointerdown', () => {
    scene.tweens.add({ targets: container, scale: 0.96, duration: 60, yoyo: true });
    sfx.play('click');
    onClick && onClick();
  });

  return container;
}

// A small "← Menu" button + mute toggle pinned to the top-left/right.
// Call from a game scene's create(). Returns nothing.
export function addTopBar(scene, titleText) {
  const { width } = scene.scale;

  makeButton(scene, 80, 36, '← Menu', () => scene.scene.start('Menu'), {
    width: 130,
    height: 44,
    fontSize: 18,
    fill: COLORS.panel,
    fillHover: COLORS.accent2,
  });

  if (titleText) {
    scene.add
      .text(width / 2, 36, titleText, {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '28px',
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  const muteBtn = makeButton(
    scene,
    width - 60,
    36,
    sfx.muted ? '🔇' : '🔊',
    () => {
      const muted = sfx.toggleMuted();
      muteBtn.list[1].setText(muted ? '🔇' : '🔊');
    },
    { width: 56, height: 44, fontSize: 22, fill: COLORS.panel, fillHover: COLORS.warn }
  );
}
