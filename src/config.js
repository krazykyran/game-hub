// Global game configuration shared across scenes.

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 720;

// Central colour palette (hex numbers for Phaser, strings for CSS/text styles).
export const COLORS = {
  bg: 0x0b1020,
  bgString: '#0b1020',
  panel: 0x161d33,
  panelString: '#161d33',
  accent: 0x4cc9f0,
  accentString: '#4cc9f0',
  accent2: 0xf72585,
  accent2String: '#f72585',
  good: 0x52b788,
  goodString: '#52b788',
  warn: 0xffb703,
  warnString: '#ffb703',
  bad: 0xe5383b,
  badString: '#e5383b',
  text: '#f5f7ff',
  textDim: '#9aa5c4',
  white: 0xffffff,
};

// Registry of all games. `scene` of null = "coming soon" tile.
// Adding a new game = register it here + add its Scene class in main.js.
export const GAMES = [
  {
    key: 'TicTacToe',
    title: 'Tic Tac Toe',
    emoji: '⭕',
    blurb: 'Beat the computer. Classic 3-in-a-row.',
    color: 0x4cc9f0,
    available: true,
  },
  {
    key: 'Wordle',
    title: 'Wordle',
    emoji: '🔤',
    blurb: 'Guess the 5-letter word in 6 tries.',
    color: 0x52b788,
    available: true,
  },
  {
    key: 'Funnels',
    title: 'Funnels & Buckets',
    emoji: '🧮',
    blurb: 'Solve the falling sums before they smash!',
    color: 0xf72585,
    available: true,
  },
  {
    key: 'SpaceInvaders',
    title: 'Space Invaders',
    emoji: '👾',
    blurb: 'Blast the alien horde before they land!',
    color: 0x9d4edd,
    available: true,
  },
  {
    key: 'Tetris',
    title: 'Tetris',
    emoji: '🧱',
    blurb: 'Coming soon — stack the falling blocks.',
    color: 0xffb703,
    available: false,
  },
  {
    key: 'CrossyRoad',
    title: 'Crossy Road',
    emoji: '🦘',
    blurb: 'Coming soon — hop the kangaroo across.',
    color: 0xff7b00,
    available: false,
  },
];
