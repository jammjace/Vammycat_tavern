import { windSway } from '../levels/level1.js';
export class ShadowCaster {
  constructor({scene,x,y,width,height,texture,anchorY=1}){
    Object.assign(this,{scene,x,y,width,height,texture,anchorY});
    this.isTree=texture.startsWith('tree-');
    this.layers=(this.isTree?[`${texture}-wood`,`${texture}-foliage`]:[texture]).map(key=>{
      const source=scene.textures.get(key).getSourceImage();
      const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
      const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(source,0,0);
      return {source,alpha:c.getImageData(0,0,canvas.width,canvas.height).data};
    });
    // Retain the combined rest silhouette for inspection/debugging.
    this.source=document.createElement('canvas');
    this.source.width=this.layers[0].source.width;this.source.height=this.layers[0].source.height;
    const c=this.source.getContext('2d');for(const layer of this.layers)c.drawImage(layer.source,0,0);
    this.alpha=c.getImageData(0,0,this.source.width,this.source.height).data;
    this.setShadowDirection(-5/6);
  }
  setShadowDirection(phase){
    const elevation=Math.max(.17,Math.sin((phase+1)*Math.PI/2)*1.22);
    const length=Math.min(this.height*1.9,this.height*.7/Math.tan(elevation));
    this.dx=phase*length;this.dy=35+length*.32;
    this.foliageAngle=this.isTree?windSway(this.scene.time.now,this.x,this.y):0;
    for(const [index,layer] of this.layers.entries()){
      const angle=index===1?this.foliageAngle:0,cos=Math.cos(angle),sin=Math.sin(angle);
      const sx=this.width/layer.source.width,sy=this.height/layer.source.height;
      // Rotate only foliage, then project onto the ground. Wood never sways.
      const a=(cos-this.dx/this.height*sin)*sx;
      const b=-this.dy/this.height*sin*sx;
      const c=(-sin-this.dx/this.height*cos)*sy;
      const d=-this.dy/this.height*cos*sy;
      const e=this.x-a*layer.source.width/2-c*this.anchorY*layer.source.height;
      const f=this.y-b*layer.source.width/2-d*this.anchorY*layer.source.height;
      layer.matrix={a,b,c,d,e,f};
    }
  }
  draw(c){
    for(const layer of this.layers){
      const {a,b,c:skew,d,e,f}=layer.matrix;
      c.save();c.setTransform(a,b,skew,d,e,f);c.drawImage(layer.source,0,0);c.restore();
    }
    c.fillStyle='#27351c';c.beginPath();
    c.ellipse(this.x,this.y,this.width*.22,this.height*.075,0,0,Math.PI*2);c.fill();
  }
  contains(point){
    if(((point.x-this.x)/(this.width*.22))**2+((point.y-this.y)/(this.height*.075))**2<=1)return true;
    return this.layers.some(layer=>{
      const {a,b,c,d,e,f}=layer.matrix,det=a*d-b*c;
      const px=point.x-e,py=point.y-f;
      const u=(d*px-c*py)/det,v=(-b*px+a*py)/det;
      if(u<0||v<0||u>=layer.source.width||v>=layer.source.height)return false;
      return layer.alpha[(Math.floor(v)*layer.source.width+Math.floor(u))*4+3]>100;
    });
  }
  getShadowPolygon(){
    const points=this.layers.flatMap(layer=>{
      const {a,b,c,d,e,f}=layer.matrix,w=layer.source.width,h=layer.source.height;
      return [[0,0],[w,0],[w,h],[0,h]].map(([x,y])=>({x:a*x+c*y+e,y:b*x+d*y+f}));
    });
    const left=Math.min(...points.map(p=>p.x)),right=Math.max(...points.map(p=>p.x));
    const top=Math.min(...points.map(p=>p.y)),bottom=Math.max(...points.map(p=>p.y));
    return [{x:left,y:top},{x:right,y:top},{x:right,y:bottom},{x:left,y:bottom}];
  }
}
