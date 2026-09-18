import Phaser from 'phaser';
export class SunSystem {
  constructor(scene) {
    this.scene=scene;this.sunPhase=this.targetPhase=-5/6;this.sun={x:0,y:0};
    this.uiText=scene.add.graphics().setDepth(5000).setScrollFactor(0);
    this.caption=scene.add.text(640,88,'SCROLL TO CHANGE TIME',{
      fontFamily:'Real Chalk',letterSpacing:1.5,fontSize:'16px',color:'#efe8c7',backgroundColor:'#24372ebb',padding:{x:10,y:4},
    }).setOrigin(.5,0).setDepth(5000).setScrollFactor(0);
    this.updateSunPosition();
  }
  get hour(){return 12+this.sunPhase*6;}
  update(dt){this.sunPhase+=(this.targetPhase-this.sunPhase)*Math.min(1,dt*9);this.updateSunPosition();}
  updateSunPosition(){
    const minutes=Math.round(this.hour*60);
    const text = `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
    if (text !== this.uiText.text) this.drawClock(text);
    this.sun.x=this.scene.level.width*(.5-this.sunPhase*.48);
    this.sun.y=100+Math.abs(this.sunPhase)*350;
  }
  drawClock(text) {
    const g = this.uiText;
    g.text = text;
    g.clear().fillStyle(0x24372e, .94).fillRoundedRect(535, 18, 210, 65, 12);
    const digits = ['abcdef','bc','abdeg','abcdg','bcfg','acdfg','acdefg','abc','abcdefg','abcdfg'];
    const segments = {a:[5,0,22,4],b:[28,5,4,17],c:[28,27,4,17],d:[5,45,22,4],e:[0,27,4,17],f:[0,5,4,17],g:[5,23,22,4]};
    let x = 554;
    for (const char of text) {
      if (char === ':') {
        g.fillStyle(0xffe5a5).fillRect(x+2, 43, 4, 4).fillRect(x+2, 60, 4, 4);
        x += 14;
        continue;
      }
      for (const [name, [dx,dy,w,h]] of Object.entries(segments)) {
        g.fillStyle(digits[Number(char)].includes(name) ? 0xffe5a5 : 0x425346);
        g.fillRoundedRect(x+dx, 26+dy, w, h, 1);
      }
      x += 42;
    }
  }
  adjust(amount){this.targetPhase=Phaser.Math.Clamp(this.targetPhase+amount,-.92,.92);}
  setTargetPhase(value){this.targetPhase=Phaser.Math.Clamp(value,-.92,.92);}
}
