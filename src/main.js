import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './config.js';
import { sfx } from './audio.js';

import MenuScene from './scenes/MenuScene.js';
import TicTacToeScene from './scenes/TicTacToeScene.js';
import WordleScene from './scenes/WordleScene.js';
import FunnelsScene from './scenes/FunnelsScene.js';
import SpaceInvadersScene from './scenes/SpaceInvadersScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-root',
  backgroundColor: COLORS.bgString,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    roundPixels: false,
  },
  // Scene order: the first scene starts automatically.
  scene: [MenuScene, TicTacToeScene, WordleScene, FunnelsScene, SpaceInvadersScene],
};

const game = new Phaser.Game(config);

// Unlock audio on the very first interaction anywhere on the page.
const unlock = () => sfx.unlock();
window.addEventListener('pointerdown', unlock, { once: true });
window.addEventListener('keydown', unlock, { once: true });

export default game;
