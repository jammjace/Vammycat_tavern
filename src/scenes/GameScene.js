import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { ShadowCaster } from '../entities/ShadowCaster.js';
import { ShadowSystem } from '../systems/ShadowSystem.js';
import { SunSystem } from '../systems/SunSystem.js';
import { ExposureSystem } from '../systems/ExposureSystem.js';
import { level1 } from '../levels/level1.js';
import { GardenArt } from '../art/GardenArt.js';
import { CampbreezePipeline } from '../art/CampbreezePipeline.js';
import { DebugPanel } from '../systems/DebugPanel.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    this.load.image('tree-art', `${import.meta.env.BASE_URL}assets/scenery/tree.png`);
    this.load.image('house-art', `${import.meta.env.BASE_URL}assets/scenery/house.png`);
    for (let i = 1; i <= 4; i++) this.load.image(`cat-${i}`, `${import.meta.env.BASE_URL}assets/cat/run-0${i}.png`);
  }

  create() {
    this.level = level1;
    this.state = 'PLAYING';
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this.art = new GardenArt(this);
    this.player = new Player(this, this.level.start.x, this.level.start.y);
    this.sunSystem = new SunSystem(this);
    this.exposureSystem = new ExposureSystem(this);
    this.shadowCasters = this.level.shadowCasters.map((data) => {
      const caster = new ShadowCaster({
        ...data,
        scene: this,
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
      });
      return caster;
    });

    this.shadowSystem = new ShadowSystem(this);
    this.isInShadow = false;
    this.collisionDebug = true;
    this.collisionDebugGraphics = this.add.graphics().setDepth(4001);
    for (const caster of this.shadowCasters) {
      this.shadowSystem.registerCaster(caster);
    }

    this.shadowSystem.update(this.sunSystem.sunPhase);
    this.isInShadow = this.shadowSystem.isPointInAnyShadow(this.player.getPosition());

    this.safeText = this.add.text(20, 60, 'SAFE — IN SHADOW', {
      fontFamily: 'sans-serif',
      fontSize: '22px',
      color: '#dfffd7',
      backgroundColor: 'rgba(0,0,0,0.25)',
      padding: { x: 10, y: 6 },
    });
    this.safeText.setDepth(100);

    this.objectiveText = this.add.text(24, 110, 'OBJECTIVE\nRetrieve your fish', {
      fontFamily: 'sans-serif',
      fontSize: '20px',
      color: '#f4f1d9',
      align: 'left',
      backgroundColor: 'rgba(0,0,0,0.08)',
      padding: { x: 8, y: 6 },
    });
    this.objectiveText.setDepth(100);

    this.exposureBarBg = this.add.rectangle(120, 34, 180, 10, 0x243528).setDepth(110);
    this.exposureBar = this.add.rectangle(30, 34, 0, 10, 0xff6b6b).setDepth(111);
    this.exposureBar.setOrigin(0, 0.5);

    this.overlayText = this.add.text(640, 310, '', {
      fontFamily: 'serif',
      fontSize: '42px',
      color: '#fce6a6',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    });
    this.overlayText.setOrigin(0.5);
    this.overlayText.setDepth(120);
    this.overlayText.setVisible(false);

    this.overlaySubText = this.add.text(640, 365, '', {
      fontFamily: 'sans-serif',
      fontSize: '20px',
      color: '#f3f0d8',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
    });
    this.overlaySubText.setOrigin(0.5);
    this.overlaySubText.setDepth(120);
    this.overlaySubText.setVisible(false);

    this.createFish();
    this.add.text(24, 688, 'WASD / ARROWS  Move     SCROLL  Time     SHIFT + SCROLL  Zoom     R  Restart     F2  Debug', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#e3e7c4', backgroundColor: '#253c2ddd', padding: { x: 10, y: 5 },
    }).setDepth(100);

    this.input.on('wheel', (_pointer, _currentlyOver, _deltaX, deltaY, _deltaZ) => {
      if (_pointer.event.shiftKey || _pointer.event.ctrlKey) {
        this.setMapZoom(this.cameras.main.zoom * Math.exp(-deltaY * .001));
        return;
      }
      if (this.state !== 'PLAYING') return;
      this.sunSystem.adjust(deltaY * 0.0007);
    });

    this.input.keyboard.on('keydown-U', () => {
      if (this.state === 'PLAYING') this.sunSystem.adjust(-0.05);
    });
    this.input.keyboard.on('keydown-H', () => {
      if (this.state === 'PLAYING') this.sunSystem.adjust(0.05);
    });
    this.input.keyboard.on('keydown-F2', () => {
      this.debugPanel.toggle();
    });
    this.input.keyboard.on('keydown-R', () => this.resetLevel());
    for (const object of this.children.list) {
      if (object.depth >= 100 && object.depth <= 120) object.setScrollFactor(0).setDepth(5000 + object.depth);
    }
    this.cameras.main.setBounds(0, 0, this.level.width, this.level.height);
    this.cameras.main.startFollow(this.player.sprite, true, .08, .08);
    this.cameras.main.centerOn(this.player.sprite.x, this.player.sprite.y);
    this.art.update(this.sunSystem);
    this.updateSafetyStatus(this.isInShadow);
    this.updateExposureBar();
    // A separate unzoomed UI camera keeps the clock and status fixed and unfiltered.
    const uiObjects=this.children.list.filter(object=>object.depth>=5000);
    const worldObjects=this.children.list.filter(object=>object.depth<5000);
    this.cameras.main.ignore(uiObjects);
    this.uiCamera=this.cameras.add(0,0,1280,720,false,'UI');
    this.uiCamera.ignore(worldObjects);
    if(this.renderer.type===Phaser.WEBGL){
      if(!this.renderer.pipelines.postPipelineClasses.has('Campbreeze'))this.renderer.pipelines.addPostPipeline('Campbreeze',CampbreezePipeline);
      this.cameras.main.setPostPipeline('Campbreeze');
      this.paintPipeline=this.cameras.main.getPostPipeline('Campbreeze');
    }
    this.debugPanel=new DebugPanel(this);
    this.debugPanel.update();
    this.updateCollisionDebug();
  }

  setMapZoom(value) {
    this.cameras.main.setZoom(Phaser.Math.Clamp(value,.45,1.6));
    this.debugPanel?.update();
  }

  createFish() {
    const goal = this.level.goal;
    const fishCenter = { x: goal.x, y: goal.y };
    this.fishGlow = this.add.circle(fishCenter.x, fishCenter.y, 40, 0xffd568, 0.35);
    this.fishGlow.setDepth(12);
    this.fishBody = this.add.ellipse(fishCenter.x - 6, fishCenter.y, 40, 23, 0xf8d14f);
    this.fishBody.setDepth(14);
    this.fishTail = this.add.triangle(fishCenter.x + 8, fishCenter.y, -8, -8, 10, 0, -8, 8, 0xf3b32d);
    this.fishTail.setDepth(14);
    this.fishTail.setScale(1.5);
    this.fishGoal = { x: fishCenter.x, y: fishCenter.y, radius: 22 };
  }


  resetLevel() {
    this.state = 'PLAYING';
    this.player.setPosition(this.level.start.x, this.level.start.y);
    this.player.sprite.setVisible(true);
    this.exposureSystem.reset();
    this.sunSystem.sunPhase = -5/6;
    this.sunSystem.targetPhase = -5/6;
    this.sunSystem.updateSunPosition();
    this.art.update(this.sunSystem);
    this.shadowSystem.update(this.sunSystem.sunPhase);
    this.isInShadow = this.shadowSystem.isPointInAnyShadow(this.player.getPosition());

    this.fishGlow.setVisible(true);
    this.fishBody.setVisible(true);
    this.fishTail.setVisible(true);
    this.overlayText.setVisible(false);
    this.overlaySubText.setVisible(false);
    this.updateExposureBar();
  }

  update(_time, delta) {
    const deltaSeconds = delta / 1000;

    if (this.state !== 'PLAYING') {
      this.player.stop();
      this.shadowSystem.update(this.sunSystem.sunPhase);
      return;
    }

    const movement = {
      left: this.wasd.left.isDown || this.cursors.left.isDown,
      right: this.wasd.right.isDown || this.cursors.right.isDown,
      up: this.wasd.up.isDown || this.cursors.up.isDown,
      down: this.wasd.down.isDown || this.cursors.down.isDown,
    };

    this.player.update({
      left: { isDown: movement.left },
      right: { isDown: movement.right },
      up: { isDown: movement.up },
      down: { isDown: movement.down },
    }, deltaSeconds);

    this.sunSystem.update(deltaSeconds);
    this.art.update(this.sunSystem);
    this.shadowSystem.update(this.sunSystem.sunPhase);

    this.isInShadow = this.shadowSystem.isPointInAnyShadow(this.player.getPosition());
    const exposure = this.exposureSystem.update(deltaSeconds, this.isInShadow, this.state);
    this.updateSafetyStatus(this.isInShadow);
    this.updateExposureBar();
    this.updateCollisionDebug();

    this.checkFishPickup();

    if (exposure.deathTriggered) {
      this.state = 'DEAD';
      this.player.sprite.setVisible(false);
      this.player.contactShadow.setVisible(false);
      this.safeText.setText('SCALDING!');
      this.safeText.setColor('#ffb3b3');
      this.overlayText.setText('YOU WERE SCALDED!');
      this.overlayText.setVisible(true);
      this.overlaySubText.setText('Press R to play again');
      this.overlaySubText.setVisible(true);
    }
  }

  checkFishPickup() {
    const fish = this.fishGoal;
    const player = this.player.getPosition();
    const distance = Math.hypot(player.x - fish.x, player.y - fish.y);

    if (distance <= fish.radius + this.player.radius + 6) {
      this.state = 'WON';
      this.overlayText.setText('FISH RETRIEVED!');
      this.overlayText.setVisible(true);
      this.overlaySubText.setText('You made it through the garden.\nPress R to play again');
      this.overlaySubText.setVisible(true);
      this.fishGlow.setVisible(false);
      this.fishBody.setVisible(false);
      this.fishTail.setVisible(false);
    }
  }

  updateSafetyStatus(isInShadow) {
    this.safeText.setText(isInShadow ? 'SAFE — IN SHADOW' : 'SCALDING!');
    this.safeText.setColor(isInShadow ? '#dfffd7' : '#ffb3b3');
  }

  updateExposureBar() {
    const ratio = Phaser.Math.Clamp(this.exposureSystem.currentExposure / this.exposureSystem.maxExposure, 0, 1);
    this.exposureBar.width = 180 * ratio;
    this.exposureBar.setFillStyle(ratio >= 1 ? 0xff4242 : 0xffb347);
  }

  isPositionBlocked(x, y, radius) {
    return Boolean(this.getPositionBlocker(x, y, radius));
  }

  getPositionBlocker(x, y, radius) {
    const playerOnPlatform = this.isOnWalkablePlatform(x, y, radius);

    for (const obstacle of this.level.solidObstacles) {
      if (!obstacle.blocksMovement) continue;

      if (obstacle.radius) {
        const dx = x - obstacle.x;
        const dy = y - obstacle.y;
        if (Math.hypot(dx, dy) < obstacle.radius + radius) return obstacle.type;
      } else {
        const halfW = obstacle.width / 2;
        const halfH = obstacle.height / 2;
        const nearestX = Phaser.Math.Clamp(x, obstacle.x - halfW, obstacle.x + halfW);
        const nearestY = Phaser.Math.Clamp(y, obstacle.y - halfH, obstacle.y + halfH);
        const dx = x - nearestX;
        const dy = y - nearestY;
        if (dx * dx + dy * dy < radius * radius) return obstacle.type;
      }
    }

    const inWater = this.isInsideWater(x, y, radius);
    if (inWater && !playerOnPlatform) return 'water';

    return null;
  }

  isInsideWater(x, y, radius) {
    for (const water of this.level.waterZones) {
      const dx = x - water.x;
      const dy = y - water.y;
      if (water.width && water.height) {
        const halfW = water.width / 2;
        const halfH = water.height / 2;
        const nearestX = Phaser.Math.Clamp(x, water.x - halfW, water.x + halfW);
        const nearestY = Phaser.Math.Clamp(y, water.y - halfH, water.y + halfH);
        const edgeX = x - nearestX;
        const edgeY = y - nearestY;
        if (edgeX * edgeX + edgeY * edgeY < radius * radius) return true;
      } else if (Math.hypot(dx, dy) < water.radius + radius) {
        return true;
      }
    }
    return false;
  }

  isOnWalkablePlatform(x, y, radius) {
    for (const platform of this.level.platforms) {
      const halfW = platform.width / 2;
      const halfH = platform.height / 2;
      const nearestX = Phaser.Math.Clamp(x, platform.x - halfW, platform.x + halfW);
      const nearestY = Phaser.Math.Clamp(y, platform.y - halfH, platform.y + halfH);
      const dx = x - nearestX;
      const dy = y - nearestY;
      if (dx * dx + dy * dy <= radius * radius) return true;
    }
    return false;
  }

  updateCollisionDebug() {
    const g=this.collisionDebugGraphics;
    g.clear();
    if(!this.collisionDebug)return;
    g.lineStyle(2,0xffea82,.95);
    g.strokeCircle(this.player.sprite.x,this.player.sprite.y,this.player.radius);
    g.strokeCircle(this.fishGoal.x,this.fishGoal.y,this.fishGoal.radius);
    for(const o of this.level.solidObstacles){
      g.lineStyle(2,0xff7474,.95);
      if(o.radius)g.strokeCircle(o.x,o.y,o.radius);
      else g.strokeRect(o.x-o.width/2,o.y-o.height/2,o.width,o.height);
    }
    for(const w of this.level.waterZones){
      g.lineStyle(2,0x64ddff,.95);g.strokeRect(w.x-w.width/2,w.y-w.height/2,w.width,w.height);
    }
    g.lineStyle(2,0xbacb8a,.6);g.strokeRect(40,40,this.level.width-80,this.level.height-80);
  }
}
