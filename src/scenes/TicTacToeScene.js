import Phaser from 'phaser';
import { COLORS } from '../config.js';
import { sfx } from '../audio.js';
import { addTopBar, makeButton } from '../ui/widgets.js';

// Tic Tac Toe vs a (near-)unbeatable minimax computer opponent.
// Player is X and moves first.
export default class TicTacToeScene extends Phaser.Scene {
  constructor() {
    super('TicTacToe');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0b1020');
    addTopBar(this, 'Tic Tac Toe');

    const { width, height } = this.scale;
    this.boardSize = 420;
    this.cell = this.boardSize / 3;
    this.originX = width / 2 - this.boardSize / 2;
    this.originY = 170;

    this.board = Array(9).fill(null); // 'X' | 'O' | null
    this.marks = Array(9).fill(null); // game objects
    this.gameOver = false;
    this.busy = false;
    this.scores = this.scores || { X: 0, O: 0, draw: 0 };

    this._drawGrid();

    this.statusText = this.add
      .text(width / 2, this.originY + this.boardSize + 36, 'Your turn (X)', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '28px',
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.scoreText = this.add
      .text(width / 2, this.originY - 28, this._scoreLabel(), {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '20px',
        color: COLORS.textDim,
      })
      .setOrigin(0.5);

    makeButton(this, width / 2, height - 70, 'New Game', () => this._reset(), {
      width: 200,
      height: 52,
      fill: COLORS.panel,
      fillHover: COLORS.good,
    });

    // Clickable cells
    this.zones = [];
    for (let i = 0; i < 9; i++) {
      const { cx, cy } = this._cellCenter(i);
      const zone = this.add
        .zone(cx, cy, this.cell, this.cell)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this._playerMove(i));
      this.zones.push(zone);
    }
  }

  _scoreLabel() {
    return `You ${this.scores.X}   •   Computer ${this.scores.O}   •   Draws ${this.scores.draw}`;
  }

  _cellCenter(i) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    return {
      cx: this.originX + col * this.cell + this.cell / 2,
      cy: this.originY + row * this.cell + this.cell / 2,
    };
  }

  _drawGrid() {
    const g = this.add.graphics();
    g.fillStyle(COLORS.panel, 1);
    g.fillRoundedRect(this.originX - 10, this.originY - 10, this.boardSize + 20, this.boardSize + 20, 16);
    g.lineStyle(6, COLORS.accent, 1);
    for (let i = 1; i < 3; i++) {
      g.lineBetween(this.originX + i * this.cell, this.originY + 8, this.originX + i * this.cell, this.originY + this.boardSize - 8);
      g.lineBetween(this.originX + 8, this.originY + i * this.cell, this.originX + this.boardSize - 8, this.originY + i * this.cell);
    }
  }

  _playerMove(i) {
    if (this.gameOver || this.busy || this.board[i]) return;
    this._place(i, 'X');
    sfx.play('place');
    if (this._checkEnd()) return;

    this.busy = true;
    this.statusText.setText('Computer thinking…');
    this.time.delayedCall(420, () => {
      const move = this._bestMove();
      if (move != null) {
        this._place(move, 'O');
        sfx.play('place');
      }
      this.busy = false;
      if (!this._checkEnd()) this.statusText.setText('Your turn (X)');
    });
  }

  _place(i, player) {
    this.board[i] = player;
    const { cx, cy } = this._cellCenter(i);
    const color = player === 'X' ? COLORS.accentString : COLORS.accent2String;
    const mark = this.add
      .text(cx, cy, player, {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '110px',
        color,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(0);
    this.marks[i] = mark;
    this.tweens.add({ targets: mark, scale: 1, duration: 180, ease: 'Back.out' });
  }

  _checkEnd() {
    const line = this._winningLine(this.board);
    if (line) {
      const winner = this.board[line[0]];
      this.gameOver = true;
      this._highlight(line);
      if (winner === 'X') {
        this.scores.X++;
        this.statusText.setText('You win! 🎉');
        sfx.play('win');
      } else {
        this.scores.O++;
        this.statusText.setText('Computer wins 🤖');
        sfx.play('lose');
      }
      this.scoreText.setText(this._scoreLabel());
      return true;
    }
    if (this.board.every((c) => c)) {
      this.gameOver = true;
      this.scores.draw++;
      this.statusText.setText("It's a draw 🤝");
      this.scoreText.setText(this._scoreLabel());
      sfx.play('click');
      return true;
    }
    return false;
  }

  _highlight(line) {
    const a = this._cellCenter(line[0]);
    const b = this._cellCenter(line[2]);
    const g = this.add.graphics();
    g.lineStyle(10, COLORS.good, 1);
    const tween = { t: 0 };
    this.tweens.add({
      targets: tween,
      t: 1,
      duration: 300,
      onUpdate: () => {
        g.clear();
        g.lineStyle(10, COLORS.good, 1);
        g.lineBetween(a.cx, a.cy, a.cx + (b.cx - a.cx) * tween.t, a.cy + (b.cy - a.cy) * tween.t);
      },
    });
  }

  _reset() {
    this.scene.restart();
  }

  // --- AI (minimax) ---
  _winningLine(b) {
    const wins = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const w of wins) {
      if (b[w[0]] && b[w[0]] === b[w[1]] && b[w[1]] === b[w[2]]) return w;
    }
    return null;
  }

  _bestMove() {
    let bestScore = -Infinity;
    let move = null;
    for (let i = 0; i < 9; i++) {
      if (!this.board[i]) {
        this.board[i] = 'O';
        const score = this._minimax(this.board, 0, false);
        this.board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  }

  _minimax(b, depth, isMax) {
    const line = this._winningLine(b);
    if (line) return b[line[0]] === 'O' ? 10 - depth : depth - 10;
    if (b.every((c) => c)) return 0;

    if (isMax) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!b[i]) {
          b[i] = 'O';
          best = Math.max(best, this._minimax(b, depth + 1, false));
          b[i] = null;
        }
      }
      return best;
    }
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        b[i] = 'X';
        best = Math.min(best, this._minimax(b, depth + 1, true));
        b[i] = null;
      }
    }
    return best;
  }
}
