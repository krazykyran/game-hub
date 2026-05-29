# 🎮 Game Hub

A browser-based game hub built with [Phaser 3](https://phaser.io/) and [Vite](https://vitejs.dev/).
It opens on a splash screen of game tiles — pick one and play. All sound effects are
synthesized at runtime with the Web Audio API, so the project ships with **zero asset files**.

## Games

| Game | Status | Description |
| --- | --- | --- |
| ⭕ Tic Tac Toe | ✅ Playable | Beat an unbeatable minimax computer opponent. |
| 🔤 Wordle | ✅ Playable | Guess the hidden 5-letter word in 6 tries (physical + on-screen keyboard). |
| 🧮 Funnels & Buckets | ✅ Playable | A funnel drops math problems — type the answer before they smash! |
| 👾 Space Invaders | ✅ Playable | Marching aliens, destructible shields, explosions and endless waves. |
| 🧱 Tetris | 🔜 Coming soon | |
| 🦘 Crossy Road | 🔜 Coming soon | (kangaroo hero) |

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the dev server at http://localhost:5173
```

Then open the printed URL in your browser. Other commands:

```bash
npm run build    # production build into dist/
npm run preview  # preview the production build locally
```

## How to play

- **Tic Tac Toe** — You are X and move first. Click a square. Press *New Game* to reset.
- **Wordle** — Type a 5-letter word and press Enter. Green = right spot, yellow = wrong spot,
  grey = not in the word.
- **Funnels & Buckets** — Watch the funnel slide across the top and drop math problems.
  Type the answer with the number keys and press **Enter** to catch it in the bucket.
  If a problem hits the ground it smashes and you lose a life (3 lives). Difficulty ramps
  up every 5 solved.
- **Space Invaders** — Move with **← →** (or A/D) and fire with **Space**. Clear the
  marching alien grid before it reaches you. Hide behind the shields, but they crumble
  when hit. Each cleared wave gets faster and shoots more. 3 lives.

## Project structure

```
index.html              # host page (mounts Phaser into #game-root)
src/
  main.js               # Phaser game config + scene registration
  config.js             # shared constants, colour palette, GAMES registry
  audio.js              # Web Audio sound-effect synthesizer (sfx.play('...'))
  ui/widgets.js         # reusable button + top bar (back/mute) widgets
  scenes/
    MenuScene.js        # splash screen with the tile grid
    TicTacToeScene.js
    WordleScene.js      # uses words.js
    words.js            # 5-letter word list (answers + guess validation)
    FunnelsScene.js
```

## Adding a new game

1. Add an entry to the `GAMES` array in `src/config.js` (set `available: true` and a unique `key`).
2. Create `src/scenes/<YourGame>Scene.js` extending `Phaser.Scene` with `super('<key>')`.
3. Import and register it in the `scene` array in `src/main.js`.
4. Use `addTopBar(this, 'Title')` for the back/mute bar and `sfx.play(...)` for sound.

The menu automatically renders any registered game; `available: false` shows a "Soon" tile.
