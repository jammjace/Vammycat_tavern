export class ShadowSystem {
  constructor(scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(20);
    this.shadowCasters = [];
    this.shadowPolygons = [];
    this.debug = false;
  }

  registerCaster(caster) {
    this.shadowCasters.push(caster);
  }

  setDebug(enabled) {
    this.debug = enabled;
  }

  update(sunPhase) {
    this.graphics.clear();
    this.graphics.fillStyle(0x1b1a18, 0.42);
    this.shadowPolygons = [];

    for (const caster of this.shadowCasters) {
      caster.setShadowDirection(sunPhase);
      const polygon = caster.getShadowPolygon();
      this.shadowPolygons.push(polygon);

      if (polygon.length >= 3) {
        this.graphics.fillPoints(polygon, true);
      }

      if (this.debug) {
        this.graphics.lineStyle(2, 0xff0000, 0.8);
        this.graphics.strokePoints(polygon, true);
      }
    }
  }

  getShadowPolygons() {
    return this.shadowCasters.map((caster) => {
      caster.setShadowDirection(this.scene.sunSystem.sunPhase);
      return caster.getShadowPolygon();
    });
  }

  pointInPolygon(point, polygon) {
    if (!polygon || polygon.length === 0) {
      return false;
    }

    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;

      const intersects = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi + Number.EPSILON) + xi);

      if (intersects) inside = !inside;
    }

    return inside;
  }

  isPointInAnyShadow(point) {
    const candidates = this.shadowPolygons.length > 0 ? this.shadowPolygons : this.getShadowPolygons();
    return candidates.some((polygon) => polygon && polygon.length >= 3 && this.pointInPolygon(point, polygon));
  }
}
