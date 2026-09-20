import Phaser from 'phaser';
import cache from './ui-text-cache.json';
import { textCacheKey, fontMetricsKey } from './textCacheKey.js';
import { mark } from '../startupTiming.js';

const entries = new Map(cache.entries.map(entry => [entry.key, entry]));
const misses = new Set();

// These are lossless captures of the original Phaser Text canvases. Retain the
// Text API and render path; only replace expensive cold font rasterization.
export class ChalkText extends Phaser.GameObjects.Text {
  constructor(scene, x, y, text, style = {}) {
    const metrics = cache.metrics[fontMetricsKey(style)];
    super(scene, x, y, text, metrics ? { ...style, metrics } : style);
    this.cacheReady = true;
    this.updateText();
  }

  updateText() {
    // Text's constructor applies padding/spacing in several separate updates.
    if (!this.cacheReady) return this;
    const key = textCacheKey(this), entry = entries.get(key);
    const textureKey = entry && 'ui-text-' + entry.id;
    if (!entry || !this.scene.textures.exists(textureKey)) {
      this.lastCacheKey = null;
      if (this.text && !misses.has(key)) {
        misses.add(key); mark('text-cache-miss', { text: this.text });
      }
      return super.updateText();
    }
    if (this.lastCacheKey === key) return this;
    this.lastCacheKey = key;
    const image = this.scene.textures.get(textureKey).getSourceImage();
    this.width = entry.width; this.height = entry.height;
    this.canvas.width = image.width; this.canvas.height = image.height;
    this.frame.setSize(image.width, image.height);
    this.context.drawImage(image, 0, 0);
    this.updateDisplayOrigin();
    if (this.renderer?.gl) {
      this.frame.source.glTexture = this.renderer.canvasToTexture(this.canvas, this.frame.source.glTexture, true);
    }
    if (this.input && !this.input.customHitArea) {
      this.input.hitArea.width = this.width; this.input.hitArea.height = this.height;
    }
    return this;
  }
}

export function addChalkText(scene, x, y, text, style) {
  return scene.add.existing(new ChalkText(scene, x, y, text, style));
}

export function loadChalkText(scene, group) {
  for (const entry of cache.entries) {
    const key = 'ui-text-' + entry.id;
    if (entry.groups.includes(group) && !scene.textures.exists(key)) {
      scene.load.image(key, import.meta.env.BASE_URL + 'assets/ui/' + entry.id + '.png');
    }
  }
}
