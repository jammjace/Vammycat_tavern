import { loadClick } from '../systems/GameAudio.js';
import Phaser from 'phaser';
import { trackLoading } from '../loading.js';
import { trackPreload, trackFirstFrame } from '../startupTiming.js';

const PANELS = [71, 72, 74, 75, 76];
const SLIDE_MS = 3000;
const FADE_MS = 200;
const HOLD_MS = SLIDE_MS - 2 * FADE_MS;

// This boot scene runs once per game visit; level restarts never replay it.
export class ComicScene extends Phaser.Scene {
  constructor() { super('ComicScene'); }

  preload() {
    trackPreload(this);
    loadClick(this);
    trackLoading(this);
    for (const number of PANELS) {
      this.load.image(`comic-${number}`, `${import.meta.env.BASE_URL}assets/intro/Untitled_Artwork ${number}.jpg`);
    }
    this.load.image('comic-cat', `${import.meta.env.BASE_URL}assets/intro/Untitled_Artwork 136.png`);
  }

  create() {
    this.finishing = false;
    this.cameras.main.setBackgroundColor('#0b0b18');
    this.panel = this.add.container(0, 0);
    this.skipButton = document.createElement('button');
    this.skipButton.className = 'comic-skip';
    this.skipButton.textContent = 'Skip intro [Esc]';
    this.skipButton.addEventListener('click', () => this.finish());
    document.getElementById('app').append(this.skipButton);
    const skip = () => this.finish();
    this.input.keyboard.on('keydown-ESC', skip);
    this.events.once('shutdown', () => {
      this.input.keyboard.off('keydown-ESC', skip);
      this.skipButton.remove();
    });
    this.showPanel(0);
    trackFirstFrame(this);
  }

  showPanel(index) {
    this.panelIndex = index;
    this.tweens.killAll();
    this.panel.removeAll(true);
    this.panel.setAlpha(0);
    this.cat = null;
    this.stars = [];
    const artwork = this.add.image(0, 0, `comic-${PANELS[index]}`).setOrigin(0);
    // Fit the full width and sweep the entire height, including both edges.
    artwork.setScale(1280 / artwork.width);
    this.panel.add(artwork);
    this.artwork = artwork;
    this.tweens.add({ targets: this.panel, alpha: 1, duration: FADE_MS });
    this.tweens.add({
      targets: artwork, y: 720 - artwork.displayHeight,
      delay: FADE_MS + 400, duration: HOLD_MS - 800, ease: 'Sine.easeInOut',
    });
    if (index === 0) this.addNightEffects();
    this.panelTimer = this.time.delayedCall(FADE_MS + HOLD_MS, () => {
      this.tweens.add({
        targets: this.panel, alpha: 0, duration: FADE_MS,
        onComplete: () => {
          if (index < PANELS.length - 1) this.showPanel(index + 1);
          else this.finish();
        },
      });
    });
  }

  addNightEffects() {
    // Points stay in the open sky, away from the moon and rooftop silhouettes.
    const points = [[.26,.09],[.37,.17],[.51,.08],[.63,.19],[.76,.10],
      [.87,.19],[.22,.34],[.34,.40],[.47,.29],[.59,.37],[.72,.30],
      [.19,.53],[.32,.62],[.45,.52],[.54,.67],[.67,.49],[.79,.41]];
    this.stars = points.map(([x, y], i) => {
      const star = this.add.star(x * 1280, y * this.artwork.displayHeight, 4, 1, 3 + i % 3, 0xfff6d9)
        .setAlpha(.2);
      star.skyY = star.y;
      this.panel.add(star);
      this.tweens.add({ targets: star, alpha: .9, scale: 1.3,
        duration: 800 + i % 5 * 190, delay: i * 137, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return star;
    });
    // Anchor the visible silhouette rather than the PNG's transparent canvas.
    this.cat = this.add.image(-600, 530, 'comic-cat')
      .setOrigin(.47, .314).setScale(.6);
    this.cat.skyY = 530;
    this.panel.add(this.cat);
    this.tweens.add({ targets: this.cat, x: 640, skyY: 465,
      delay: FADE_MS + 300, duration: 1200, ease: 'Sine.easeOut' });
  }

  update() {
    for (const star of this.stars || []) star.y = star.skyY + this.artwork.y;
    if (this.cat) this.cat.y = this.cat.skyY + this.artwork.y;
  }

  finish() {
    if (this.finishing) return;
    this.finishing = true;
    this.panelTimer?.remove();
    this.tweens.killAll();
    this.scene.start('IntroScene');
  }
}
