import Phaser from 'phaser';
export class SunSystem {
  constructor(scene) {
    this.scene=scene;this.sunPhase=this.targetPhase=-5/6;this.sun={x:0,y:0};
    this.uiText=scene.add.text(640,24,'',{
      fontFamily:'monospace',fontSize:'30px',color:'#ffe5a5',backgroundColor:'#24372eef',align:'center',padding:{x:28,y:12},
    }).setOrigin(.5,0).setDepth(5000).setScrollFactor(0);
    this.caption=scene.add.text(640,88,'SCROLL TO CHANGE TIME',{
      fontFamily:'sans-serif',fontSize:'11px',color:'#efe8c7',backgroundColor:'#24372ebb',padding:{x:10,y:4},
    }).setOrigin(.5,0).setDepth(5000).setScrollFactor(0);
    this.updateSunPosition();
  }
  get hour(){return 12+this.sunPhase*6;}
  update(dt){this.sunPhase+=(this.targetPhase-this.sunPhase)*Math.min(1,dt*9);this.updateSunPosition();}
  updateSunPosition(){
    const minutes=Math.round(this.hour*60);
    this.uiText.setText(`${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`);
    this.sun.x=this.scene.level.width*(.5-this.sunPhase*.48);
    this.sun.y=100+Math.abs(this.sunPhase)*350;
  }
  adjust(amount){this.targetPhase=Phaser.Math.Clamp(this.targetPhase+amount,-.92,.92);}
  setTargetPhase(value){this.targetPhase=Phaser.Math.Clamp(value,-.92,.92);}
}
