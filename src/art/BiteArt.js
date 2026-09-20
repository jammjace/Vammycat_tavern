// Convert the supplied white-backed drawings to runtime sprite textures.
// Flood only the exterior white so the cat's enclosed white body stays opaque.
export function makeBiteTextures(scene) {
  for (const pose of ['open', 'closed']) {
    const key = `bite-${pose}`;
    if (scene.textures.exists(key)) continue;
    const texture = scene.textures.createCanvas(key, 920, 730);
    const ctx = texture.context;
    ctx.drawImage(scene.textures.get(`${key}-source`).getSourceImage(), 0, 0);
    const pixels = ctx.getImageData(0, 0, 920, 730);
    const data = pixels.data, width = 920, height = 730;
    const queue = new Int32Array(width * height);
    let head = 0, tail = 0;
    const visit = index => {
      const p = index * 4;
      if (!data[p + 3] || Math.min(data[p], data[p + 1], data[p + 2]) < 225) return;
      data[p + 3] = 0;
      queue[tail++] = index;
    };
    for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
    for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
    while (head < tail) {
      const i = queue[head++], x = i % width;
      if (x > 0) visit(i - 1);
      if (x < width - 1) visit(i + 1);
      if (i >= width) visit(i - width);
      if (i < width * (height - 1)) visit(i + width);
    }
    ctx.putImageData(pixels, 0, 0);
    texture.refresh();
  }
}
