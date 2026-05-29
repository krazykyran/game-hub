import Phaser from 'phaser';
import { COLORS } from '../config.js';
import { sfx } from '../audio.js';
import { addTopBar, makeButton } from '../ui/widgets.js';
import { WORD_SET, randomWord } from './words.js';

const ROWS = 6;
const COLS = 5;

// Wordle clone: guess a hidden 5-letter word in 6 tries.
// Supports physical keyboard and an on-screen keyboard.
export default class WordleScene extends Phaser.Scene {
  constructor() {
    super('Wordle');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0b1020');
    addTopBar(this, 'Wordle');

    this.answer = randomWord();
    this.row = 0;
    this.col = 0;
    this.grid = []; // grid[r][c] = { rect, text }
    this.guess = '';
    this.finished = false;
    this.keyTiles = {}; // letter -> { rect, text }

    const { width } = this.scale;

    // --- build tile grid ---
    const tile = 56;
    const gap = 7;
    const gridW = COLS * tile + (COLS - 1) * gap;
    const startX = width / 2 - gridW / 2 + tile / 2;
    const startY = 112;

    for (let r = 0; r < ROWS; r++) {
      const rowArr = [];
      for (let c = 0; c < COLS; c++) {
        const x = startX + c * (tile + gap);
        const y = startY + r * (tile + gap);
        const rect = this.add.rectangle(x, y, tile, tile, COLORS.bg).setStrokeStyle(2, 0x3a4366);
        const text = this.add
          .text(x, y, '', {
            fontFamily: 'Trebuchet MS, sans-serif',
            fontSize: '34px',
            color: COLORS.text,
            fontStyle: 'bold',
          })
          .setOrigin(0.5);
        rowArr.push({ rect, text });
      }
      this.grid.push(rowArr);
    }

    const gridBottom = startY + (ROWS - 1) * (tile + gap) + tile / 2;
    this.message = this.add
      .text(width / 2, gridBottom + 22, '', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '20px',
        color: COLORS.warnString,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this._buildKeyboard();

    // physical keyboard
    this.input.keyboard.on('keydown', this._onKey, this);
    this.events.once('shutdown', () => this.input.keyboard.off('keydown', this._onKey, this));
  }

  _buildKeyboard() {
    const { width, height } = this.scale;
    const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
    const keyW = 50;
    const keyH = 50;
    const wideW = keyW * 1.6;
    const gap = 7;
    // Anchor the keyboard to the bottom so all three rows fit on screen.
    let y = height - (keyH * 3 + gap * 2) - 24 + keyH / 2;

    rows.forEach((rowStr, ri) => {
      const keys = rowStr.split('');
      const isLast = ri === rows.length - 1;

      // Compute total row width (last row has ENTER + letters + backspace).
      let rowW = keys.length * keyW + (keys.length - 1) * gap;
      if (isLast) rowW += (wideW + gap) * 2;

      let x = width / 2 - rowW / 2;

      const placeKey = (label, w) => {
        this._makeKey(x + w / 2, y, label, w, keyH);
        x += w + gap;
      };

      if (isLast) placeKey('ENTER', wideW);
      keys.forEach((k) => placeKey(k, keyW));
      if (isLast) placeKey('⌫', wideW);

      y += keyH + gap;
    });
  }

  _makeKey(x, y, label, w, h) {
    const rect = this.add.rectangle(x, y, w, h, COLORS.panel).setStrokeStyle(1, 0x3a4366);
    rect.setInteractive({ useHandCursor: true });
    const text = this.add
      .text(x, y, label, {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: label.length > 1 ? '18px' : '22px',
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    rect.on('pointerdown', () => {
      if (label === 'ENTER') this._submit();
      else if (label === '⌫') this._backspace();
      else this._addLetter(label.toLowerCase());
    });
    if (label.length === 1 && /[A-Z]/.test(label)) {
      this.keyTiles[label.toLowerCase()] = { rect, text };
    }
    return w;
  }

  _onKey(event) {
    if (this.finished) return;
    const key = event.key;
    if (key === 'Enter') this._submit();
    else if (key === 'Backspace') this._backspace();
    else if (/^[a-zA-Z]$/.test(key)) this._addLetter(key.toLowerCase());
  }

  _addLetter(letter) {
    if (this.finished || this.col >= COLS) return;
    this.guess += letter;
    const cell = this.grid[this.row][this.col];
    cell.text.setText(letter.toUpperCase());
    cell.rect.setStrokeStyle(2, COLORS.accent);
    this.tweens.add({ targets: cell.rect, scale: 1.08, duration: 70, yoyo: true });
    this.col++;
    sfx.play('type');
    this.message.setText('');
  }

  _backspace() {
    if (this.finished || this.col <= 0) return;
    this.col--;
    this.guess = this.guess.slice(0, -1);
    const cell = this.grid[this.row][this.col];
    cell.text.setText('');
    cell.rect.setStrokeStyle(2, 0x3a4366);
  }

  _submit() {
    if (this.finished) return;
    if (this.guess.length < COLS) {
      this._flash('Not enough letters');
      return;
    }
    if (!WORD_SET.has(this.guess)) {
      this._flash('Not in word list');
      this._shakeRow();
      sfx.play('wrong');
      return;
    }

    const result = this._score(this.guess, this.answer);
    this._revealRow(result);

    if (this.guess === this.answer) {
      this.finished = true;
      this.time.delayedCall(COLS * 220 + 200, () => {
        this._flash('Brilliant! 🎉', COLORS.goodString);
        sfx.play('win');
        this._showPlayAgain();
      });
    } else if (this.row >= ROWS - 1) {
      this.finished = true;
      this.time.delayedCall(COLS * 220 + 200, () => {
        this._flash(`The word was "${this.answer.toUpperCase()}"`, COLORS.badString);
        sfx.play('lose');
        this._showPlayAgain();
      });
    } else {
      this.row++;
      this.col = 0;
      this.guess = '';
    }
  }

  // returns array of 'correct' | 'present' | 'absent'
  _score(guess, answer) {
    const res = Array(COLS).fill('absent');
    const counts = {};
    for (const ch of answer) counts[ch] = (counts[ch] || 0) + 1;
    for (let i = 0; i < COLS; i++) {
      if (guess[i] === answer[i]) {
        res[i] = 'correct';
        counts[guess[i]]--;
      }
    }
    for (let i = 0; i < COLS; i++) {
      if (res[i] === 'correct') continue;
      if (counts[guess[i]] > 0) {
        res[i] = 'present';
        counts[guess[i]]--;
      }
    }
    return res;
  }

  _revealRow(result) {
    const colorFor = (s) =>
      s === 'correct' ? COLORS.good : s === 'present' ? COLORS.warn : 0x3a4250;
    const rowCells = this.grid[this.row];
    result.forEach((s, c) => {
      const cell = rowCells[c];
      this.time.delayedCall(c * 220, () => {
        this.tweens.add({
          targets: cell.rect,
          scaleY: 0,
          duration: 110,
          ease: 'Quad.in',
          onComplete: () => {
            cell.rect.setFillStyle(colorFor(s), 1);
            cell.rect.setStrokeStyle(2, colorFor(s));
            this.tweens.add({ targets: cell.rect, scaleY: 1, duration: 110, ease: 'Quad.out' });
          },
        });
        this._updateKey(this.guess[c], s);
        sfx.play(s === 'correct' ? 'correct' : 'type');
      });
    });
  }

  _updateKey(letter, state) {
    const k = this.keyTiles[letter];
    if (!k) return;
    // Only ever upgrade a key's status (absent < present < correct), never downgrade.
    const rank = { absent: 1, present: 2, correct: 3 };
    const current = k.rect.getData('rank') || 0;
    if (rank[state] <= current) return;
    k.rect.setData('rank', rank[state]);

    if (state === 'absent') {
      // Clearly "used and not in the word": darker than unused keys + faded text.
      k.rect.setFillStyle(0x0b0f1c, 1);
      k.rect.setStrokeStyle(1, 0x232a42);
      k.text.setColor('#566080').setAlpha(0.6);
    } else if (state === 'present') {
      k.rect.setFillStyle(COLORS.warn, 1);
      k.rect.setStrokeStyle(1, COLORS.warn);
      k.text.setColor('#1a1300').setAlpha(1);
    } else {
      k.rect.setFillStyle(COLORS.good, 1);
      k.rect.setStrokeStyle(1, COLORS.good);
      k.text.setColor('#04140c').setAlpha(1);
    }
  }

  _flash(msg, color = COLORS.warnString) {
    this.message.setColor(color);
    this.message.setText(msg);
  }

  _shakeRow() {
    const cells = this.grid[this.row];
    cells.forEach((cell) => {
      this.tweens.add({ targets: [cell.rect, cell.text], x: '+=6', duration: 50, yoyo: true, repeat: 3 });
    });
  }

  _showPlayAgain() {
    const { width } = this.scale;
    makeButton(this, width / 2, 96, 'Play Again', () => this.scene.restart(), {
      width: 180,
      height: 46,
      fontSize: 20,
      fill: COLORS.panel,
      fillHover: COLORS.good,
    });
  }
}
