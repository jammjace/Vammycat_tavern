export class ShadowSystem {
  constructor(scene){
    this.scene=scene;this.shadowCasters=[];this.shadowPolygons=[];this.debug=false;
    this.texture=scene.textures.createCanvas('projected-shadows',scene.level.width,scene.level.height);
    this.image=scene.add.image(0,0,'projected-shadows').setOrigin(0).setDepth(4).setAlpha(.52);
    this.graphics=scene.add.graphics().setDepth(4000);
  }
  registerCaster(caster){this.shadowCasters.push(caster);}
  setDebug(enabled){this.debug=enabled;this.lastPhase=undefined;}
  update(phase){
    if(this.lastPhase!==undefined&&Math.abs(phase-this.lastPhase)<.001)return;
    this.lastPhase=phase;const c=this.texture.context;
    c.clearRect(0,0,this.texture.width,this.texture.height);c.globalCompositeOperation='source-over';this.graphics.clear();
    this.shadowPolygons=this.shadowCasters.map(caster=>{
      caster.setShadowDirection(phase);caster.draw(c);const polygon=caster.getShadowPolygon();
      if(this.debug){this.graphics.lineStyle(1,0xffc266,.7);this.graphics.strokePoints(polygon,true);}return polygon;
    });
    // Tint the union once; overlapping shelters never accumulate opaque black.
    c.globalCompositeOperation='source-in';c.fillStyle='#27351c';c.fillRect(0,0,this.texture.width,this.texture.height);
    c.globalCompositeOperation='source-over';this.texture.refresh();
  }
  getShadowPolygons(){return this.shadowPolygons;}
  isPointInAnyShadow(point){return this.shadowCasters.some(c=>c.contains(point));}
}
