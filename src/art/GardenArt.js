import { addChalkText } from './ChalkText.js';
import { makeTreeLayers } from './TreeLayers.js';
import { townPoint, windSway } from '../levels/geometry.js';

export class GardenArt {
  constructor(scene){
    this.scene=scene;this.seed=731;this.props=[];
    this.groundKey=`garden-grass-${scene.level.id}`;
    this.makeGround();this.makeObjects();this.makeLight();
  }
  random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
  texture(key,w,h,draw,seeded=false){
    if(this.scene.textures.exists(key)){
      const t=this.scene.textures.get(key);
      // Preserve the random sequence used by subsequent decorations on restart.
      if(seeded)this.seed=t.gardenSeedAfter;
      return t;
    }
    const t=this.scene.textures.createCanvas(key,w,h);draw(t.context);
    if(seeded)t.gardenSeedAfter=this.seed;
    t.refresh();return t;
  }
  makeGround(){
    const s=this.scene,{width:w,height:h}=s.level;
    this.texture(this.groundKey,w,h,c=>{
      c.fillStyle='#849044';c.fillRect(0,0,w,h);
      for(let i=0;i<1100;i++){
        const x=this.random()*w,y=this.random()*h,r=30+this.random()*130,g=c.createRadialGradient(x,y,0,x,y,r);
        g.addColorStop(0,i%2?'#b9b55b30':'#3e682329');g.addColorStop(1,'#86944800');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
      }
      for(let i=0;i<24000;i++){
        const x=this.random()*w,y=this.random()*h;if(Math.sin(x*.018)+Math.sin(y*.025+x*.006)<.3)continue;
        const height=4+this.random()*13;c.fillStyle=i%3?'#59773655':'#b4be6866';
        c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x-3,y-height*.6,x+5,y-height);c.lineTo(x+2,y);c.fill();
      }
      const quad=(x,y,w,h)=>{
        c.beginPath();[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].forEach(([a,b],i)=>{const p=townPoint(a,b);i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y);});c.closePath();
      };
      for(const r of [...s.level.roads,s.level.square,...s.level.entrances].filter(Boolean)){
        const left=r.x-r.width/2,top=r.y-r.height/2;
        c.fillStyle='#6c7045';quad(left-5,top-5,r.width+10,r.height+10);c.fill();
        c.fillStyle='#b4aa7c';quad(left,top,r.width,r.height);c.fill();
        c.save();c.clip();c.strokeStyle='#817e5855';c.lineWidth=1;
        for(let y=top;y<top+r.height;y+=24)for(let x=left;x<left+r.width;x+=42){quad(x,y,40,22);c.stroke();}c.restore();
      }
      for(let i=0;i<2000;i++){c.fillStyle=i%2?'#ded09033':'#3e572822';c.fillRect(this.random()*w,this.random()*h,2,2);}
    },true);s.add.image(0,0,this.groundKey).setOrigin(0).setDepth(0);
  }
  makeObjects(){
    const s=this.scene;
    this.texture('bench-art',240,110,c=>{
      c.lineJoin='round';c.strokeStyle='#3c3020';c.lineWidth=4;
      const polygon=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();c.stroke();};
      polygon([[33,59],[44,63],[44,101],[32,96]],'#584631');polygon([[194,57],[204,54],[204,91],[193,96]],'#584631');
      for(let i=0;i<3;i++)polygon([[17,28+i*12],[185,9+i*12],[218,31+i*12],[50,52+i*12]],i%2?'#a68d57':'#c0a468');
    });
    for(const data of s.level.shadowCasters){
      const isTree=data.texture.startsWith('tree-');
      if(isTree)makeTreeLayers(s,data.texture);
      const bark=isTree?s.add.image(data.x,data.y,`${data.texture}-wood`).setOrigin(.5,data.anchorY).setDisplaySize(data.width,data.height).setDepth(data.y+9):null;
      const sprite=s.add.image(data.x,data.y,isTree?`${data.texture}-foliage`:data.texture).setOrigin(.5,data.anchorY).setDisplaySize(data.width,data.height).setDepth(data.y+10);
      this.props.push({sprite,bark,...data});
    }
    for(const b of s.level.buildingObjects)addChalkText(s, b.x,b.y+60,b.name,{fontFamily:'Eraser Dust',letterSpacing:1.5,fontSize:'15px',color:'#f1e1ad',backgroundColor:'#3c4934dd',padding:{x:8,y:4}}).setOrigin(.5).setDepth(15);
    for(const [index,water] of s.level.waterZones.entries()){
    const key=`garden-pond-${s.level.id}-${index}`;
    this.texture(key,300,170,c=>{
      c.translate(150,85);c.transform(.7071,.35355,-.7071,.35355,0,0);
      c.fillStyle='#526340';c.fillRect(-water.width/2-12,-water.height/2-12,water.width+24,water.height+24);
      c.fillStyle='#cfbe88';c.fillRect(-water.width/2-7,-water.height/2-7,water.width+14,water.height+14);
      const g=c.createLinearGradient(0,-75,0,75);g.addColorStop(0,'#375957');g.addColorStop(1,'#79a393');
      c.fillStyle=g;c.fillRect(-water.width/2,-water.height/2,water.width,water.height);
      c.save();c.beginPath();c.rect(-water.width/2,-water.height/2,water.width,water.height);c.clip();
      c.strokeStyle='#ced9ac88';c.lineWidth=2;
      for(let i=0;i<45;i++){const x=(this.random()-.5)*water.width,y=(this.random()-.5)*water.height;c.beginPath();c.ellipse(x,y,4+this.random()*17,2,0,0,Math.PI);c.stroke();}c.restore();
    },true);s.add.image(water.x,water.y,key).setDepth(2);
    }
  }

  makeLight(){
    const s=this.scene,{width:w,height:h}=s.level;
    this.texture('sun-halo',512,512,c=>{const g=c.createRadialGradient(256,256,0,256,256,256);g.addColorStop(0,'#ffe5ab55');g.addColorStop(1,'#ffe5ab00');c.fillStyle=g;c.fillRect(0,0,512,512);});
    this.light=s.add.image(1800,400,'sun-halo').setDisplaySize(2300,2300).setBlendMode('ADD').setAlpha(.22).setDepth(3000);
    this.warmth=s.add.rectangle(w/2,h/2,w,h,0xf1ad53,.09).setDepth(3001);
  }
  update(sun){
    this.light.setPosition(sun.sun.x,sun.sun.y);this.light.setAlpha(.16+.1*Math.abs(sun.sunPhase));
    this.warmth.setFillStyle(sun.sunPhase>0?0xdd874b:0xf1c36b);this.warmth.setAlpha(.02+Math.abs(sun.sunPhase)*.1);
    const player=this.scene.player.sprite;
    for(const p of this.props){if(p.texture.startsWith('tree-'))p.sprite.setRotation(windSway(this.scene.time.now,p.x,p.y));const behind=player.y<p.y-10&&player.y>p.y-p.height&&Math.abs(player.x-p.x)<p.width*.4;p.sprite.setAlpha(behind?.58:1);p.bark?.setAlpha(behind?.58:1);}
  }
}
