import { loadClick } from '../systems/GameAudio.js';
import Phaser from 'phaser';
import { trackLoading } from '../loading.js';
import { trackPreload, trackFirstFrame } from '../startupTiming.js';

const PANELS = [71, 72, 74, 75, 76];
const FADE_MS = 200;

// This boot scene runs once per game visit; level restarts never replay it.
export class ComicScene extends Phaser.Scene {
  constructor() { super('ComicScene'); }

  preload() {
    trackPreload(this);
    loadClick(this);
    this.load.audio('comic-audio', `${import.meta.env.BASE_URL}assets/audio/comic.m4a`);
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
    this.comicAudio = this.sound.add('comic-audio', { volume: .9 });
    this.slideMs = this.comicAudio.duration * 1000 / PANELS.length;
    this.elapsedMs = 0;
    this.showPanel(0);
    const startAudio = () => {
      if (this.finishing || this.comicAudio.isPlaying) return;
      if (this.sound.context && this.sound.context.state !== 'running') return;
      if (!this.sound.context && this.sound.locked) return;
      // If the browser blocked autoplay, join at the current comic position
      // on its first permitted interaction rather than replaying the recording.
      this.comicAudio.play({ seek: this.elapsedMs / 1000 });
    };
    this.comicAudio.once('complete', () => this.finish());
    this.sound.on('unlocked', startAudio);
    startAudio();
    this.sound.context?.resume().then(startAudio).catch(() => {});
    this.skipButton = document.createElement('button');
    this.skipButton.className = 'comic-skip';
    this.skipButton.textContent = 'Skip intro [Esc]';
    this.skipButton.addEventListener('click', () => this.finish());
    document.getElementById('app').append(this.skipButton);
    const skip = () => this.finish();
    this.input.keyboard.on('keydown-ESC', skip);
    this.events.once('shutdown', () => {
      this.finishing = true;
      this.input.keyboard.off('keydown-ESC', skip);
      this.skipButton.remove();
      this.sound.off('unlocked', startAudio);
      this.comicAudio.destroy();
    });
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
    this.tweens.add({
      targets: artwork, y: 720 - artwork.displayHeight,
      delay: FADE_MS + 400, duration: Math.max(100, this.slideMs - 2 * FADE_MS - 800), ease: 'Sine.easeInOut',
    });
    if (index === 0) this.addNightEffects();
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

  update(_time, delta) {
    if (this.finishing) return;
    const audioRunning = this.comicAudio.isPlaying
      && (!this.sound.context || this.sound.context.state === 'running');
    this.elapsedMs = audioRunning ? this.comicAudio.seek * 1000 : this.elapsedMs + delta;
    if (this.elapsedMs >= this.slideMs * PANELS.length) {
      this.finish();
      return;
    }
    const index = Math.min(PANELS.length - 1, Math.floor(this.elapsedMs / this.slideMs));
    if (index !== this.panelIndex) this.showPanel(index);
    const local = this.elapsedMs - index * this.slideMs;
    this.panel.setAlpha(Math.max(0, Math.min(1, local / FADE_MS, (this.slideMs - local) / FADE_MS)));
    for (const star of this.stars || []) star.y = star.skyY + this.artwork.y;
    if (this.cat) this.cat.y = this.cat.skyY + this.artwork.y;
  }

  finish() {
    if (this.finishing) return;
    this.finishing = true;
    this.comicAudio.stop();
    this.tweens.killAll();
    this.scene.start('IntroScene');
  }
}
