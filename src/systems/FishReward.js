import { addChalkText } from '../art/ChalkText.js';
import Phaser from 'phaser';

export class FishReward {
  static makeTexture(scene) {
    if(scene.textures.exists('golden-fish'))return;
    const texture=scene.textures.createCanvas('golden-fish',240,160),c=texture.context;
    c.lineWidth=6;c.lineJoin='round';c.strokeStyle='#473620';
    const shape=(color,draw)=>{c.beginPath();draw();c.closePath();c.fillStyle=color;c.fill();c.stroke();};
    shape('#dc9145',()=>{c.moveTo(121,58);c.quadraticCurveTo(140,19,164,32);c.lineTo(164,68);});
    shape('#e8a451',()=>{c.moveTo(89,72);c.quadraticCurveTo(51,32,26,39);c.quadraticCurveTo(38,80,26,119);c.quadraticCurveTo(56,117,89,88);});
    const gradient=c.createLinearGradient(0,40,0,120);gradient.addColorStop(0,'#ffe8a0');gradient.addColorStop(.5,'#f3c35e');gradient.addColorStop(1,'#d59641');
    shape(gradient,()=>{c.moveTo(67,80);c.bezierCurveTo(103,20,187,28,216,77);c.quadraticCurveTo(204,124,143,125);c.quadraticCurveTo(95,124,67,80);});
    shape('#e8a451',()=>{c.moveTo(128,91);c.quadraticCurveTo(153,89,164,98);c.quadraticCurveTo(146,130,128,115);});
    c.lineWidth=3;c.beginPath();c.moveTo(168,64);c.quadraticCurveTo(155,85,169,102);c.stroke();
    c.fillStyle='#332d25';c.beginPath();c.arc(188,73,6,0,Math.PI*2);c.fill();
    c.fillStyle='#fff6d2';c.beginPath();c.arc(189,71,1.8,0,Math.PI*2);c.fill();
    c.strokeStyle='#fff0ba';c.lineWidth=4;c.beginPath();c.moveTo(104,59);c.quadraticCurveTo(128,45,151,51);c.stroke();
    texture.refresh();
  }
  constructor(scene) {
    this.scene=scene;this.elapsed=0;this.active=false;
    this.root=scene.add.container(0,0).setScrollFactor(0).setDepth(6000).setVisible(false);
    this.backdrop=scene.add.rectangle(640,360,1280,720,0x172a29,.93);
    this.rays=scene.add.graphics({x:640,y:330});
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6;
      this.rays.fillStyle(i%2?0xffd785:0xffefd0,i%2?.12:.2);
      this.rays.fillTriangle(0,0,Math.cos(a-.09)*900,Math.sin(a-.09)*900,Math.cos(a+.09)*900,Math.sin(a+.09)*900);
    }
    this.halo=scene.add.image(640,330,'sun-halo').setDisplaySize(700,700).setAlpha(.7);
    this.shadow=scene.add.ellipse(640,459,215,35,0x071b20,.48);
    this.fish=scene.add.image(640,330,'golden-fish');
    const text=(y,label,size)=>addChalkText(scene, 640,y,label,{fontFamily:'Eraser Dust',fontSize:`${size}px`,color:'#fff1c4',align:'center',letterSpacing:2}).setOrigin(.5);
    this.title=text(140,'FISH RETRIEVED!',44);
    this.caption=text(565,'A little patience. A little sunshine. A well-earned fish.',22);
    this.restart=text(622,'The garden awaits another adventure.',20);
    this.root.add([this.backdrop,this.rays,this.halo,this.shadow,this.fish,this.title,this.caption,this.restart]);
  }
  show(worldFish) {
    const c=this.scene.cameras.main;
    this.start={x:(worldFish.x-c.worldView.x)*c.zoom,y:(worldFish.y-c.worldView.y)*c.zoom,scale:worldFish.displayWidth/240*c.zoom};
    this.elapsed=0;this.active=true;this.root.setVisible(true);this.update(0);
  }
  update(dt) {
    if(!this.active)return;
    this.elapsed+=dt;
    const t=this.elapsed,progress=Phaser.Math.Clamp(t/1.05,0,1),ease=1-Math.pow(1-progress,3);
    this.backdrop.setAlpha(ease);this.rays.setAlpha(ease).setRotation(t*.12);
    this.halo.setAlpha(ease*.75);this.shadow.setAlpha(ease*.48);
    this.title.setAlpha(ease);this.caption.setAlpha(ease);this.restart.setAlpha(ease);
    const spin=Math.max(0,t-1.05),scale=Phaser.Math.Linear(this.start.scale,1.45,ease);
    this.fish.setPosition(Phaser.Math.Linear(this.start.x,640,ease),Phaser.Math.Linear(this.start.y,330,ease)+Math.sin(spin*2)*12)
      .setScale(scale*(progress<1?1:Math.cos(spin*1.35)),scale).setRotation(Math.sin(spin*.9)*.08);
    this.shadow.setScale(1-Math.sin(spin*2)*.07,1-Math.sin(spin*2)*.1);
  }
  hide(){this.active=false;this.root.setVisible(false);}
}
