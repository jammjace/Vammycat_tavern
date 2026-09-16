import Phaser from 'phaser';

export class ExposureSystem {
  constructor(scene) {
    this.scene = scene;
    this.maxExposure = 1.0;
    this.currentExposure = 0;
    this.burnRate = 1.0;
    this.recoveryRate = 0.5;
    this.deathTriggered = false;
  }

  update(deltaSeconds, isInShadow, gameState) {
    const exposureBefore = this.currentExposure;
    let exposureDelta = 0;

    if (gameState === 'PLAYING') {
      exposureDelta = (isInShadow ? -this.recoveryRate : this.burnRate) * deltaSeconds;
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

    console.debug('[Exposure]', result);
    return result;
  }

  reset() {
    this.currentExposure = 0;
    this.deathTriggered = false;
  }
}
