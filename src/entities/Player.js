import Phaser from 'phaser';

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.add.sprite(x, y, 'cat-1').setDisplaySize(143, 85.8).setOrigin(.5, .8);
    this.sprite.setDepth(25);
    this.trail=scene.add.graphics().setDepth(2800);this.sparkles=[];this.sparkleClock=0;
    this.contactShadow = scene.add.ellipse(x, y + 29, 48, 15, 0x132c20, .32).setDepth(24);
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
    this.moving=moving;
    if (moving) this.sprite.play('cat-run', true);
    else this.stop();
    if (this.moveX) this.sprite.setFlipX(this.moveX < 0);
    this.contactShadow.setPosition(this.sprite.x, this.sprite.y + 29);
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
    this.contactShadow.setPosition(x, y + 29).setVisible(true);
    this.sparkles.length=0;
    this.stop();
  }

  stop() {
    this.moving=false;
    this.sprite.stop();
    this.sprite.setTexture('cat-1');
  }

  updateVisuals(time,dt) {
    const bob=Math.sin(time*.0028)*3;
    // Keep the logical foot position fixed; bob only the rendered body.
    this.sprite.setOrigin(.5,.8+bob/85.8);
    this.sprite.setTint(this.scene.isInShadow?0x858fa6:0xb5b7bd);
    this.contactShadow.setPosition(this.sprite.x,this.sprite.y+29).setScale(1-bob*.018).setAlpha(.27-bob*.01);
    this.sparkleClock+=dt;
    if(this.moving&&this.sprite.visible&&this.sparkleClock>.055){
      this.sparkleClock=0;
      this.sparkles.push({x:this.sprite.x-this.moveX*25+(Math.random()-.5)*22,y:this.sprite.y-14+(Math.random()-.5)*22,age:0,life:.65+Math.random()*.55,angle:Math.random()*Math.PI,size:3+Math.random()*4});
    }
    const g=this.trail;g.clear();
    this.sparkles=this.sparkles.filter(p=>p.age<p.life);
    for(const p of this.sparkles){
      p.age+=dt;p.y-=dt*9;p.angle+=dt*1.7;
      const progress=Math.min(1,p.age/p.life),pulse=Math.sin(Math.PI*progress),r=p.size*pulse;
      const points=Array.from({length:8},(_,i)=>{const a=p.angle+i*Math.PI/4,rad=i%2?r*.22:r;return{x:p.x+Math.cos(a)*rad,y:p.y+Math.sin(a)*rad};});
      g.fillStyle(0xfff9de,pulse);g.fillPoints(points,true);
    }
  }

  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }
}
