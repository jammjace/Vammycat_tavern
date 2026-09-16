import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { ShadowCaster } from '../entities/ShadowCaster.js';
import { ShadowSystem } from '../systems/ShadowSystem.js';
import { SunSystem } from '../systems/SunSystem.js';
import { ExposureSystem } from '../systems/ExposureSystem.js';
import { level1 } from '../levels/level1.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
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

    this.createGarden();
    this.player = new Player(this, this.level.start.x, this.level.start.y);
    this.sunSystem = new SunSystem(this);
    this.exposureSystem = new ExposureSystem(this);
    this.shadowCasters = this.level.shadowCasters.map((data) => {
      const caster = new ShadowCaster({
        scene: this,
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
      });
      caster.sprite.setVisible(data.visible !== false);
      return caster;
    });

    this.shadowSystem = new ShadowSystem(this);
    this.isInShadow = false;
    this.collisionDebug = false;
    this.collisionDebugGraphics = this.add.graphics().setDepth(30);
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

    this.exposureBarBg = this.add.rectangle(180, 44, 180, 14, 0x301f1f).setDepth(110);
    this.exposureBar = this.add.rectangle(180, 44, 0, 14, 0xff6b6b).setDepth(111);
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

    this.input.on('wheel', (_pointer, _currentlyOver, _deltaX, deltaY, _deltaZ) => {
      if (this.state !== 'PLAYING') return;
      this.sunSystem.adjust(deltaY * 0.0028);
    });

    this.input.keyboard.on('keydown-U', () => {
      if (this.state === 'PLAYING') this.sunSystem.adjust(-0.05);
    });
    this.input.keyboard.on('keydown-H', () => {
      if (this.state === 'PLAYING') this.sunSystem.adjust(0.05);
    });
    this.input.keyboard.on('keydown-D', () => {
      this.shadowSystem.setDebug(!this.shadowSystem.debug);
      this.collisionDebug = this.shadowSystem.debug;
    });
    this.input.keyboard.on('keydown-R', () => this.resetLevel());
  }

  createFish() {
    const goal = this.level.goal;
    const fishCenter = { x: goal.x, y: goal.y };
    this.fishGlow = this.add.circle(fishCenter.x, fishCenter.y, 26, 0xffd568, 0.35);
    this.fishGlow.setDepth(12);
    this.fishBody = this.add.ellipse(fishCenter.x - 6, fishCenter.y, 24, 14, 0xf8d14f);
    this.fishBody.setDepth(14);
    this.fishTail = this.add.triangle(fishCenter.x + 8, fishCenter.y, -8, -8, 10, 0, -8, 8, 0xf3b32d);
    this.fishTail.setDepth(14);
    this.fishGoal = { x: fishCenter.x, y: fishCenter.y, radius: 22 };
  }

  createGarden() {
    const ground = this.add.rectangle(640, 360, 1280, 720, 0x8fc76b);
    ground.setDepth(0);

    this.add.rectangle(310, 540, 540, 120, 0x7aa15d).setDepth(1);
    this.add.rectangle(980, 550, 210, 110, 0x7aa15d).setDepth(1);
    this.add.rectangle(640, 540, 260, 80, 0xc2b795).setDepth(2);

    const pond = this.add.graphics();
    pond.fillStyle(0x5ea7d9, 1);
    const water = this.level.waterZones[0];
    pond.fillRoundedRect(
      water.x - water.width / 2,
      water.y - water.height / 2,
      water.width,
      water.height,
      26,
    );
    pond.setDepth(2);

    for (const tree of this.level.treePositions) {
      this.add.circle(tree.x, tree.y, tree.radius, 0x4f9d4a).setDepth(4);
      this.add.circle(tree.x, tree.y + tree.radius * 0.9, tree.radius * 0.42, 0x815731).setDepth(5);
    }

    for (const bench of this.level.benchObjects) {
      this.add.rectangle(bench.x, bench.y, bench.width, bench.height, 0x7a5232).setDepth(5);
      for (const support of bench.supports) {
        this.add.rectangle(support.x, support.y, support.width, support.height, 0x7a5232).setDepth(5);
      }
    }

    for (const building of this.level.buildingObjects) {
      this.add.rectangle(
        building.x,
        building.y,
        building.width,
        building.height,
        0x7d7268,
      ).setDepth(9);
      this.add.rectangle(
        building.x,
        building.y - building.height / 2 - building.roofHeight / 2 + 2,
        building.roofWidth,
        building.roofHeight,
        0xa5b7c1,
      ).setDepth(10);
    }

    const hut = this.level.pondHut;
    this.add.rectangle(hut.x, hut.y, hut.width, hut.height, 0x8b6238).setDepth(8);
    const hutBodyTop = hut.y - hut.height / 2;
    this.add.rectangle(
      hut.x,
      hutBodyTop + hut.roofHeight / 4,
      hut.roofWidth,
      hut.roofHeight,
      0x5c4633,
    ).setDepth(9);

    for (const platform of this.level.platforms) {
      this.add.ellipse(platform.x, platform.y, platform.width, platform.height, 0x69af5e).setDepth(6);
      this.add.ellipse(platform.x, platform.y, platform.width * 0.78, platform.height * 0.58, 0x8bcf69).setDepth(7);
    }

  }

  resetLevel() {
    this.state = 'PLAYING';
    this.player.setPosition(this.level.start.x, this.level.start.y);
    this.player.sprite.setVisible(true);
    this.exposureSystem.reset();
    this.sunSystem.sunPhase = 0.2;
    this.sunSystem.targetPhase = 0.2;
    this.sunSystem.updateSunPosition();
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
    if (!this.collisionDebug) {
      this.collisionDebugGraphics.clear();
      return;
    }

    this.collisionDebugGraphics.clear();
    this.collisionDebugGraphics.lineStyle(2, 0xfff06a, 0.9);
    this.collisionDebugGraphics.strokeCircle(this.player.sprite.x, this.player.sprite.y, this.player.radius);

    for (const obstacle of this.level.solidObstacles) {
      this.collisionDebugGraphics.lineStyle(2, 0xff6b6b, 0.8);
      if (obstacle.radius) {
        this.collisionDebugGraphics.strokeCircle(obstacle.x, obstacle.y, obstacle.radius + this.player.radius);
      } else {
        this.collisionDebugGraphics.strokeRect(
          obstacle.x - obstacle.width / 2 - this.player.radius,
          obstacle.y - obstacle.height / 2 - this.player.radius,
          obstacle.width + this.player.radius * 2,
          obstacle.height + this.player.radius * 2,
        );
      }
    }

    for (const water of this.level.waterZones) {
      this.collisionDebugGraphics.lineStyle(2, 0x4dd8ff, 0.8);
      if (water.width && water.height) {
        this.collisionDebugGraphics.strokeRect(
          water.x - water.width / 2 - this.player.radius,
          water.y - water.height / 2 - this.player.radius,
          water.width + this.player.radius * 2,
          water.height + this.player.radius * 2,
        );
      } else {
        this.collisionDebugGraphics.strokeCircle(water.x, water.y, water.radius + this.player.radius);
      }
    }

    for (const platform of this.level.platforms) {
      this.collisionDebugGraphics.lineStyle(2, 0x78ff9b, 0.8);
      this.collisionDebugGraphics.strokeRect(
        platform.x - platform.width / 2,
        platform.y - platform.height / 2,
        platform.width,
        platform.height,
      );
    }
  }
}
