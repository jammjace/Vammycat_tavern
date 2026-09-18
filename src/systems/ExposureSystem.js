import Phaser from 'phaser';

export class ExposureSystem {
  constructor(scene) {
    this.scene = scene;
    this.maxExposure = 1.0;
    this.currentExposure = 0;
    this.burnRate = 0.22;
    this.recoveryRate = 0.5;
    this.sunDuration = 0;
    this.deathTriggered = false;
  }

  update(deltaSeconds, isInShadow, gameState) {
    const exposureBefore = this.currentExposure;
    let exposureDelta = 0;

    if (gameState === 'PLAYING') {
      if (isInShadow) {
        this.sunDuration = 0;
        exposureDelta = -this.recoveryRate * deltaSeconds;
      } else {
        // Integrate a front-loaded heat surge plus a steady tail. The tail
        // guarantees full burn; integration keeps the curve frame-rate independent.
        const nextDuration = this.sunDuration + deltaSeconds;
        exposureDelta = this.burnRate * 0.45 * deltaSeconds
          + 0.55 * (Math.exp(-3 * this.sunDuration) - Math.exp(-3 * nextDuration));
        this.sunDuration = nextDuration;
      }
      this.currentExposure = Phaser.Math.Clamp(
        this.currentExposure + exposureDelta,
        0,
        this.maxExposure,
      );

      if (this.currentExposure >= this.maxExposure && !this.deathTriggered) {
        this.deathTriggered = true;
      }
    }

    const result = {
      isInShadow,
      exposureBefore,
      exposureDelta,
      exposureAfter: this.currentExposure,
      burnRate: this.burnRate,
      recoveryRate: this.recoveryRate,
      dtSeconds: deltaSeconds,
      gameState,
      deathTriggered: this.deathTriggered,
    };

    return result;
  }

  reset() {
    this.sunDuration = 0;
    this.currentExposure = 0;
    this.deathTriggered = false;
  }
}
