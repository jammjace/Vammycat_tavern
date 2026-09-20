import { addChalkText, loadChalkText } from '../art/ChalkText.js';
import { trackLoading } from '../loading.js';
import { record, trackPreload, trackFirstFrame } from '../startupTiming.js';
import Phaser from 'phaser';

export class IntroScene extends Phaser.Scene {
  constructor() { super('IntroScene'); }

  preload() {
    trackPreload(this);
    trackLoading(this);
    loadChalkText(this, 'intro');
    if (!this.textures.exists('cat-1')) this.load.image('cat-1', `${import.meta.env.BASE_URL}assets/cat/run-01.png`);
  }

  create() {
    const createStart = performance.now();
    this.cameras.main.setBackgroundColor('#253c2d');
    const ink = this.add.graphics();
    ink.fillStyle(0x849044, .15);
    for (let i = 0; i < 80; i++) {
      const x = (i * 193) % 1280, y = (i * 137) % 720;
      ink.fillEllipse(x, y, 15 + i % 25, 5);
    }
    ink.lineStyle(2, 0xb7b875, .65).strokeRoundedRect(120, 36, 1040, 644, 28);
    ink.lineStyle(1, 0xb7b875, .3).strokeRoundedRect(130, 46, 1020, 624, 24);
    const text = (y, value, size, color = '#f4e9bf') => addChalkText(this, 640, y, value, {
      fontFamily: 'Real Chalk', fontSize: `${size}px`, color,
      align: 'center', letterSpacing: 1.5, lineSpacing: 10,
    }).setOrigin(.5);
    text(102, 'VAMMYCAT', 68);
    this.add.ellipse(640, 222, 95, 18, 0x10291d, .6);
    this.add.image(640, 191, 'cat-1').setDisplaySize(150, 90);
    text(269, 'A vampire cat. A hungry little quest for a fish.', 24);
    text(329, 'Sunlight burns. Shadows keep you safe.', 28);
    text(386, 'Change the time of day to move the shadows\nand find a safe path to the fish.', 23);
    text(475, 'WASD / ARROWS  Move     MOUSE WHEEL / U, H  Change time\nR  Restart the current level', 19);
    const button = this.add.rectangle(640, 572, 240, 60, 0x617344)
      .setStrokeStyle(2, 0xe5d79b).setInteractive({ useHandCursor: true });
    text(572, 'BEGIN', 32);
    text(630, 'or press ENTER / SPACE', 17, '#c9d0a4');
    const begin = () => {
      if (this.starting) return;
      this.starting = true;
      this.scene.start('GameScene', { levelIndex: 0 });
    };
    record(`${this.startupTag}:create`, createStart);
    trackFirstFrame(this);
    this.starting = false;
    button.on('pointerover', () => button.setFillStyle(0x7b8a53));
    button.on('pointerout', () => button.setFillStyle(0x617344));
    button.on('pointerdown', begin);
    this.input.keyboard.on('keydown-ENTER', begin);
    this.input.keyboard.on('keydown-SPACE', begin);
    this.events.once('shutdown', () => {
      this.input.keyboard.off('keydown-ENTER', begin);
      this.input.keyboard.off('keydown-SPACE', begin);
    });
  }
}
