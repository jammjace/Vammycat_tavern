import { addChalkText } from '../art/ChalkText.js';
export class BurnThermometer {
  constructor(scene) {
    const x = 430, y = 650, width = 420;
    this.scene = scene;
    this.y = y;
    this.ratio = 0;
    this.heat = 0;
    this.clock = 0;
    this.lastFrame = -1;
    this.x = x;
    this.width = width;
    const shell = this.shell = scene.add.graphics().setDepth(5110).setScrollFactor(0);
    shell.fillStyle(0x24372e, .94);
    shell.fillRoundedRect(x - 42, y - 26, width + 70, 54, 25);
    shell.lineStyle(3, 0xece1b9, .9);
    shell.strokeRoundedRect(x - 8, y - 13, width + 20, 26, 13);
    shell.fillStyle(0x12291f, 1);
    shell.fillRoundedRect(x, y - 7, width, 14, 7);
    shell.fillStyle(0xff9137);
    shell.fillCircle(x - 17, y, 16);
    shell.lineStyle(3, 0xece1b9);
    shell.strokeCircle(x - 17, y, 20);
    for (let i = 1; i < 20; i++) {
      shell.lineStyle(1, 0xece1b9, .7);
      shell.lineBetween(x + i * width / 20, y + 15, x + i * width / 20, y + (i % 5 === 0 ? 23 : 19));
    }
    const key = 'burn-liquid';
    if (!scene.textures.exists(key)) {
      const texture = scene.textures.createCanvas(key, width, 14);
      const ctx = texture.context;
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#ffb337');
      gradient.addColorStop(.45, '#ff7029');
      gradient.addColorStop(1, '#ef302d');
      ctx.fillStyle = gradient;
      ctx.beginPath(); ctx.roundRect(0, 0, width, 14, 7); ctx.fill();
      texture.refresh();
    }
    this.liquid = scene.add.image(x, y, key).setOrigin(0, .5).setDepth(5111).setScrollFactor(0);
    this.flame = scene.add.graphics().setPosition(x, y).setDepth(5112).setScrollFactor(0);
    this.label = addChalkText(scene, x + width / 2, y - 39, 'BURN', {fontFamily:'Eraser Dust',letterSpacing:1.5,fontSize:'18px',color:'#f8e5ba'}).setOrigin(.5).setDepth(5110).setScrollFactor(0);
    this.makeScreenHeat();
    this.tick = (_time, delta) => this.animate(Math.min((delta || 0) / 1000, .05));
    scene.events.on('postupdate', this.tick);
    scene.events.once('shutdown', () => {
      scene.events.off('postupdate', this.tick);
      this.updateCameraShake(false);
    });
    this.update(0);
  }
  update(ratio) {
    this.ratio = Math.max(0, Math.min(1, ratio));
    this.liquid.setVisible(this.ratio > 0).setCrop(0, 0, this.width * this.ratio, 14);
    this.flame.setAlpha(.65 + this.ratio * .35);
    // Reset immediately on restart instead of carrying heat into the new attempt.
    if (this.ratio === 0) this.heat = 0;
    this.animate(0);
  }

  makeScreenHeat() {
    const key = 'burn-screen-gradient-v2';
    if (!this.scene.textures.exists(key)) {
      const texture = this.scene.textures.createCanvas(key, 32, 720);
      const c = texture.context, gradient = c.createLinearGradient(0, 720, 0, 70);
      gradient.addColorStop(0, 'rgba(239, 39, 32, .72)');
      gradient.addColorStop(.35, 'rgba(229, 45, 38, .42)');
      gradient.addColorStop(.72, 'rgba(229, 45, 38, .13)');
      gradient.addColorStop(1, 'rgba(229, 45, 38, 0)');
      c.fillStyle = gradient; c.fillRect(0, 0, 32, 720); texture.refresh();
    }
    this.overlay = this.scene.add.image(0, 0, key).setOrigin(0).setDisplaySize(1280, 720).setScrollFactor(0).setDepth(5050).setAlpha(0);
    // Both flames render through the UI camera's Campbreeze post pipeline.
    this.edges = this.scene.add.graphics().setScrollFactor(0).setDepth(5051);
  }

  drawFlame(frame) {
    const f = this.flame, phase = frame * Math.PI / 3;
    const lean = Math.sin(phase) * 4, lift = Math.cos(phase) * 4;
    f.clear().fillStyle(0xff5930);
    f.fillPoints([{x:0,y:10},{x:-13,y:3},{x:-15,y:-9},{x:-8+lean,y:-24-lift},{x:-4,y:-15},{x:3+lean,y:-39+lift},{x:12,y:-23},{x:10,y:-13},{x:17-lean,y:-20-lift},{x:19,y:-3},{x:12,y:7}], true);
    f.fillStyle(0xffc24b);
    f.fillPoints([{x:1,y:7},{x:-6,y:0},{x:-4-lean*.5,y:-12},{x:1,y:-8},{x:5+lean*.5,y:-23-lift},{x:11,y:-6},{x:9,y:3}], true);
    f.fillStyle(0xffef9e);
    f.fillPoints([{x:1,y:5},{x:0,y:-3},{x:5,y:-10-lift*.4},{x:9,y:3}], true);
  }

  updateCameraShake(burning) {
    const camera = this.scene.cameras.main;
    if (burning) {
      // Shake the world camera; the screen-edge fire and HUD remain anchored.
      const intensity = .0012 + this.ratio * .0033;
      if (!camera.shakeEffect.isRunning) camera.shake(160, intensity);
      camera.shakeEffect.intensity.set(intensity, intensity * .8);
      this.shaking = true;
    } else if (this.shaking) {
      camera?.shakeEffect?.reset();
      this.shaking = false;
    }
  }

  animate(dt) {
    this.clock += dt;
    const burning = this.scene.state === 'PLAYING' && !this.scene.isInShadow;
    const target = burning ? .55 + this.ratio * .45 : 0;
    this.heat += (target - this.heat) * (1 - Math.exp(-dt * (burning ? 7 : 4)));
    this.updateCameraShake(burning);
    // Six hand-shaped frames loop even while idle, faster in direct sunlight.
    const frame = Math.floor(this.clock * (burning ? 12 : 7)) % 6;
    if (frame !== this.lastFrame) { this.drawFlame(frame); this.lastFrame = frame; }
    const strength = burning ? .7 + this.ratio * 3 : 0;
    const dx = Math.sin(this.clock * 71) * strength;
    const dy = Math.sin(this.clock * 89 + .8) * strength * .6;
    this.shell.setPosition(dx, dy);
    this.liquid.setPosition(this.x + dx, this.y + dy);
    this.flame.setPosition(this.x + this.width * this.ratio + dx, this.y + dy);
    this.label.setPosition(this.x + this.width / 2 + dx, this.y - 39 + dy);
    this.overlay.setAlpha(this.heat);
    const g = this.edges; g.clear();
    if (this.heat < .005) return;
    // Tapered tongues grow inward from all four borders, leaving the centre clear.
    for (let edge = 0; edge < 4; edge++) {
      const length = edge < 2 ? 1280 : 720, count = edge < 2 ? 23 : 13;
      for (let i = 0; i < count; i++) {
        const phase = this.clock * 5 + i * 2.37 + edge * 1.4;
        const along = (i + .5) * length / count;
        const height = (24 + (Math.sin(phase) + 1) * 22) * (.55 + this.heat * .7) * (edge === 1 ? .5 : 1);
        const lean = Math.sin(phase * .7) * 12, half = length / count * .65;
        const map = (a, b) => edge === 0 ? {x:a,y:720-b} : edge === 1 ? {x:a,y:b} : edge === 2 ? {x:b,y:a} : {x:1280-b,y:a};
        for (let layer = 0; layer < 2; layer++) {
          const h = height * (layer ? .53 : 1), w = half * (layer ? .55 : 1);
          g.fillStyle(layer ? 0xffbb50 : 0xf45830, this.heat * (layer ? .55 : .48));
          g.fillPoints([map(along-w,-5),map(along-w*.6,h*.3),map(along+lean*.3,h*.58),map(along+lean,h),map(along+w*.35,h*.4),map(along+w,-5)],true);
        }
      }
    }
  }
}
