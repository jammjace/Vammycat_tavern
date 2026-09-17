import Phaser from 'phaser';

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.add.sprite(x, y, 'cat-1').setDisplaySize(110, 66).setOrigin(.5, .8);
    this.sprite.setDepth(25);
    this.contactShadow = scene.add.ellipse(x, y + 15, 44, 13, 0x132c20, .32).setDepth(24);
    if (!scene.anims.exists('cat-run')) scene.anims.create({
      key: 'cat-run', frames: [1, 2, 3, 4].map(i => ({ key: `cat-${i}` })), frameRate: 10, repeat: -1,
    });

    this.speed = 245;
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

    const attemptedX = Phaser.Math.Clamp(this.sprite.x + dx, 40, this.scene.level.width - 40);
    const oldX = this.sprite.x, oldY = this.sprite.y;
    const attemptedY = Phaser.Math.Clamp(this.sprite.y + dy, 40, this.scene.level.height - 40);
    const blockerX = this.scene.getPositionBlocker(attemptedX, this.sprite.y, this.radius);

    if (!blockerX) {
      this.sprite.x = attemptedX;
    }

    const blockerY = this.scene.getPositionBlocker(this.sprite.x, attemptedY, this.radius);
    if (!blockerY) {
      this.sprite.y = attemptedY;
    }

    const moving = Math.hypot(this.sprite.x - oldX, this.sprite.y - oldY) > .01;
    if (moving) this.sprite.play('cat-run', true);
    else this.stop();
    if (this.moveX) this.sprite.setFlipX(this.moveX < 0);
    this.contactShadow.setPosition(this.sprite.x, this.sprite.y + 15);
    this.sprite.setDepth(this.sprite.y + 10);
    this.contactShadow.setDepth(5);

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
    this.sprite.setDepth(y + 10);
    this.contactShadow.setPosition(x, y + 15).setVisible(true);
    this.stop();
  }

  stop() {
    this.sprite.stop();
    this.sprite.setTexture('cat-1');
  }

  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }
}
