export class ShadowCaster {
  constructor({scene,x,y,width,height,texture,anchorY=1}){
    Object.assign(this,{scene,x,y,width,height,texture,anchorY});
    this.source=scene.textures.get(texture).getSourceImage();
    const canvas=document.createElement('canvas');canvas.width=this.source.width;canvas.height=this.source.height;
    const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(this.source,0,0);
    this.alpha=c.getImageData(0,0,canvas.width,canvas.height).data;
    this.setShadowDirection(-5/6);
  }
  setShadowDirection(phase){
    // Height / tan(solar elevation), bounded near sunrise/sunset.
    const elevation=Math.max(.17,Math.sin((phase+1)*Math.PI/2)*1.22);
    const length=Math.min(this.height*1.9,this.height*.7/Math.tan(elevation));
    this.dx=phase*length;this.dy=35+length*.32;
  }
  draw(c){
    const {width:w,height:h}=this.source;
    c.save();c.setTransform(this.width/w,0,-this.dx/h,-this.dy/h,this.x-this.width/2+this.anchorY*this.dx,this.y+this.anchorY*this.dy);
    c.drawImage(this.source,0,0);c.restore();
    // Canopy contact shade joins the projected silhouette at the trunk, including roots.
    c.fillStyle='#27351c';c.beginPath();
    c.ellipse(this.x,this.y,this.width*.22,this.height*.075,0,0,Math.PI*2);c.fill();
  }
  contains(point){
    if(((point.x-this.x)/(this.width*.22))**2+((point.y-this.y)/(this.height*.075))**2<=1)return true;
    const v=this.anchorY-(point.y-this.y)/this.dy;
    const u=(point.x-this.x+this.width/2-(this.anchorY-v)*this.dx)/this.width;
    if(u<0||u>=1||v<0||v>=1)return false;
    return this.alpha[(Math.floor(v*this.source.height)*this.source.width+Math.floor(u*this.source.width))*4+3]>100;
  }
  getShadowPolygon(){return[
    {x:this.x-this.width/2+(this.anchorY-1)*this.dx,y:this.y+(this.anchorY-1)*this.dy},{x:this.x+this.width/2+(this.anchorY-1)*this.dx,y:this.y+(this.anchorY-1)*this.dy},
    {x:this.x+this.width/2+this.anchorY*this.dx,y:this.y+this.anchorY*this.dy},{x:this.x-this.width/2+this.anchorY*this.dx,y:this.y+this.anchorY*this.dy},
  ];}
}
