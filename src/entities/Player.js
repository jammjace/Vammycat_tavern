import Phaser from 'phaser';

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.add.circle(x, y, 18, 0x7d5fff, 1);
    this.sprite.setDepth(25);

    this.speed = 190;
    this.radius = 18;
    this.moveX = 0;
    this.moveY = 0;
    this.isAlive = true;
  }

  update(cursors, deltaSeconds) {
    if (!this.isAlive) {
      return;
    }

    this.moveX = 0;
    this.moveY = 0;

    if (cursors.left.isDown) this.moveX -= 1;
    if (cursors.right.isDown) this.moveX += 1;
    if (cursors.up.isDown) this.moveY -= 1;
    if (cursors.down.isDown) this.moveY += 1;

    const magnitude = Math.hypot(this.moveX, this.moveY) || 1;
    const dx = (this.moveX / magnitude) * this.speed * deltaSeconds;
    const dy = (this.moveY / magnitude) * this.speed * deltaSeconds;

    const attemptedX = Phaser.Math.Clamp(this.sprite.x + dx, 40, 1240);
    const attemptedY = Phaser.Math.Clamp(this.sprite.y + dy, 40, 680);
    const blockerX = this.scene.getPositionBlocker(attemptedX, this.sprite.y, this.radius);

    if (!blockerX) {
      this.sprite.x = attemptedX;
    }

    const blockerY = this.scene.getPositionBlocker(this.sprite.x, attemptedY, this.radius);
    if (!blockerY) {
      this.sprite.y = attemptedY;
    }

    this.scene.lastMovementDebug = {
      attemptedX,
      attemptedY,
      acceptedX: this.sprite.x,
      acceptedY: this.sprite.y,
      blockedBy: blockerX || blockerY || null,
    };
  }

  setPosition(x, y) {
    this.sprite.x = x;
    this.sprite.y = y;
  }

  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }
}
