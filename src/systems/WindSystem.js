// Screen-space gusts and curled leaves drift over the entire world, below the HUD.
export class WindSystem {
  constructor(scene) {
    this.scene=scene;
    this.graphics=scene.add.graphics().setScrollFactor(0).setDepth(3900);
    this.gusts=Array.from({length:9},(_,i)=>({x:(i*193)%1500-150,y:(i*139)%720,phase:i*2.3,speed:45+i*3}));
    this.leaves=Array.from({length:24},(_,i)=>({x:(i*137)%1500-100,y:(i*83)%800-40,phase:i*1.7,speed:35+(i%5)*12,size:3+i%4}));
  }
  update(time,dt) {
    const g=this.graphics,t=time*.001,zoom=this.scene.cameras.main.zoom;
    // Counter camera zoom so the atmospheric overlay keeps a consistent density.
    g.setPosition(640,360).setScale(1/zoom);g.clear();
    for(const p of this.gusts){
      p.x+=p.speed*dt;if(p.x>1450){p.x=-200;p.y=(p.y+227)%720;}
      const fade=Math.pow(Math.max(0,Math.sin(t*.55+p.phase)),2)*.25;
      g.lineStyle(1.3,0xfff8d7,fade);g.beginPath();
      for(let i=0;i<=30;i++){
        const x=p.x-i*5-640,y=p.y+Math.sin(t*.7+p.phase+i*.12)*12+i*.32-360;
        i?g.lineTo(x,y):g.moveTo(x,y);
      }g.strokePath();
    }
    for(const p of this.leaves){
      p.x+=p.speed*dt;p.y+=dt*8;if(p.x>1380){p.x=-100;p.y=(p.y+193)%720;}if(p.y>780)p.y=-40;
      const x=p.x-640,y=p.y+Math.sin(t*1.1+p.phase)*24-360;
      const angle=t*.7+p.phase,fold=.18+.82*Math.abs(Math.cos(t*1.5+p.phase));
      const transform=(a,b)=>({x:x+Math.cos(angle)*a-Math.sin(angle)*b,y:y+Math.sin(angle)*a+Math.cos(angle)*b});
      const points=[];
      // Two curved edges form a tapered leaf; folding gives its gentle 3D tumble.
      for(let i=0;i<=10;i++){const u=i/10;points.push(transform((u-.5)*p.size*3,Math.sin(u*Math.PI)*p.size*fold));}
      for(let i=10;i>=0;i--){const u=i/10;points.push(transform((u-.5)*p.size*3,-Math.sin(u*Math.PI)*p.size*.65*fold));}
      g.fillStyle([0xc3b65e,0x829849,0xe0cd87][Math.floor(p.phase)%3],.72);g.fillPoints(points,true);
      g.lineStyle(.7,0x596538,.6);const a=transform(-p.size*1.5,0),b=transform(p.size*1.5,0);g.lineBetween(a.x,a.y,b.x,b.y);
    }
  }
}
