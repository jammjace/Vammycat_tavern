// Atlas panels share one coordinate system: stationary wood, then foliage.
export function makeTreeLayers(scene, key) {
  if (scene.textures.exists(`${key}-foliage`)) return;
  const atlas = scene.textures.get(`${key}-layers`).getSourceImage();
  const width = Math.floor(atlas.width / 2), height = atlas.height;
  for (const [index, name] of ['wood', 'foliage'].entries()) {
    const texture = scene.textures.createCanvas(`${key}-${name}`, width, height);
    texture.context.drawImage(atlas, index * width, 0, width, height, 0, 0, width, height);
    texture.refresh();
  }
}
