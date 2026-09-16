import Phaser from 'phaser';

export class SunSystem {
  constructor(scene) {
    this.scene = scene;
    this.sunPhase = 0.2;
    this.targetPhase = 0.2;
    this.sun = scene.add.circle(1040, 120, 30, 0xf9d76d, 1);
    this.sun.setDepth(40);
    this.uiText = scene.add.text(20, 20, 'Sun: 0.20', {
      fontFamily: 'sans-serif',
      fontSize: '20px',
      color: '#fff8d9',
      backgroundColor: 'rgba(0,0,0,0.2)',
      padding: { x: 10, y: 6 },
    });
    this.uiText.setDepth(100);
  }

  update(deltaSeconds) {
    const step = (this.targetPhase - this.sunPhase) * Math.min(1, deltaSeconds * 8);
    this.sunPhase += step;
    this.sunPhase = Phaser.Math.Clamp(this.sunPhase, -1, 1);
    this.updateSunPosition();
    this.uiText.setText(`Sun: ${this.sunPhase.toFixed(2)}`);
  }

  updateSunPosition() {
    const angle = this.sunPhase * (Math.PI / 2);
    const x = 640 + Math.cos(angle) * 430;
    const y = 120 + Math.sin(angle) * 220;
    this.sun.setPosition(x, y);
  }

  adjust(amount) {
    this.targetPhase = Phaser.Math.Clamp(this.targetPhase + amount, -1, 1);
  }

  setTargetPhase(value) {
    this.targetPhase = Phaser.Math.Clamp(value, -1, 1);
  }
}
