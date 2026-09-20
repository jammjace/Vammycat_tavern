import { timed } from '../startupTiming.js';

// Sources are owned by Phaser's TextureManager. Weak keys permit collection if
// an asset is ever replaced, without sharing each caster's mutable transforms.
const sources = new WeakMap();
const silhouettes = new WeakMap();

export function shadowSource(source) {
  if (!sources.has(source)) {
    sources.set(source, timed('shadow-source-readback', () => {
      const canvas = document.createElement('canvas');
      canvas.width = source.width; canvas.height = source.height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(source, 0, 0);
      return { source, alpha: context.getImageData(0, 0, canvas.width, canvas.height).data };
    }));
  }
  return sources.get(source);
}

export function restSilhouette(layers) {
  if (layers.length === 1) return layers[0];
  const first = layers[0].source, second = layers[1].source;
  const cached = silhouettes.get(first);
  if (cached?.second === second) return cached.data;
  const canvas = document.createElement('canvas');
  canvas.width = first.width; canvas.height = first.height;
  const context = canvas.getContext('2d');
  for (const layer of layers) context.drawImage(layer.source, 0, 0);
  const data = shadowSource(canvas);
  silhouettes.set(first, { second, data });
  return data;
}
