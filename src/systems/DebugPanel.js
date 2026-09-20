export class DebugPanel {
  constructor(scene){
    this.scene=scene;
    const panel=document.createElement('aside');panel.className='debug-panel';
    panel.innerHTML=`<details open><summary>Town debug · F2</summary>
      <label><input type="checkbox" data-option="hitboxes" checked> Hitboxes</label>
      <label><input type="checkbox" data-option="shadows"> Shadow projection bounds</label>
      <label><input type="checkbox" data-option="paint" checked> Campbreeze painterly</label>
      <label>Zoom <input aria-label="Map zoom" type="range" min="0.45" max="1.6" step="0.05" value="1"></label>
      <div class="zoom-buttons"><button data-zoom="-0.15">−</button><button data-zoom="0">Reset</button><button data-zoom="0.15">+</button></div>
      <small>Shift + scroll: zoom · Scroll: time<br>Red: solid · Cyan: water · Gold: cat / fish<br>Tree circles cover trunks only; roots are walkable.</small>
      <output></output></details>`;
    document.querySelector('#app').append(panel);this.element=panel;
    panel.querySelector('details').open=scene.level.debugVisible ?? true;
    panel.querySelector('[data-option="hitboxes"]').checked=scene.collisionDebug;
    panel.querySelector('[data-option="hitboxes"]').onchange=e=>{scene.collisionDebug=e.target.checked;scene.updateCollisionDebug();};
    panel.querySelector('[data-option="shadows"]').onchange=e=>scene.shadowSystem.setDebug(e.target.checked);
    panel.querySelector('[data-option="paint"]').onchange=e=>{for(const pipeline of [scene.paintPipeline,scene.uiPaintPipeline])if(pipeline)pipeline.paintEnabled=e.target.checked;};
    this.slider=panel.querySelector('input[type="range"]');this.slider.oninput=e=>scene.setMapZoom(Number(e.target.value));
    for(const button of panel.querySelectorAll('button'))button.onclick=()=>scene.setMapZoom(Number(button.dataset.zoom)===0?1:scene.cameras.main.zoom+Number(button.dataset.zoom));
    scene.events.once('shutdown',()=>panel.remove());
  }
  toggle(){const details=this.element.querySelector('details');details.open=!details.open;}
  update(){this.slider.value=this.scene.cameras.main.zoom;this.element.querySelector('output').textContent=`${Math.round(this.scene.cameras.main.zoom*100)}% · ${this.scene.level.solidObstacles.length} solid objects`;}
}
