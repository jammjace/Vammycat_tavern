export class ShadowCaster {
  constructor({ scene, x, y, width, height, strength = 0.7, castsShadow = true }) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.strength = strength;
    this.castsShadow = castsShadow;
    this.sunPhase = 0;

    this.sprite = scene.add.rectangle(x, y, width, height, 0x6f9d52, 1);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setDepth(5);
  }

  setShadowDirection(sunPhase) {
    this.sunPhase = sunPhase;
  }

  getShadowPolygon() {
    if (!this.castsShadow) {
      return [];
    }

    const minLength = 45;
    const maxLength = 560;
    const length = minLength + (maxLength - minLength) * Math.pow(Math.abs(this.sunPhase), 1.5);

    // The shadow is approximated as a projected rectangle. We use one consistent direction vector here,
    // and the renderer and safety logic both consume this exact polygon. This keeps the rendered shadow and
    // the gameplay test in sync instead of recalculating a second, slightly different version elsewhere.
    const sunAngle = Math.PI * (0.35 + 0.35 * (this.sunPhase + 1));
    const dirX = Math.cos(sunAngle);
    const dirY = Math.sin(sunAngle);

    const shadowWidth = this.width + 28;
    const left = this.x - shadowWidth / 2;
    const right = this.x + shadowWidth / 2;
    const top = this.y - this.height / 2;
    const bottom = this.y + this.height / 2;

    const offsetX = dirX * length;
    const offsetY = dirY * length;

    return [
      { x: left, y: top },
      { x: right, y: top },
      { x: right + offsetX, y: top + offsetY },
      { x: right + offsetX, y: bottom + offsetY },
      { x: left + offsetX, y: bottom + offsetY },
      { x: left + offsetX, y: top + offsetY },
    ];
  }
}
