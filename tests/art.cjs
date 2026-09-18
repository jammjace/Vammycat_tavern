const { chromium } = require('/Users/chloe/Library/Caches/ms-playwright-go/1.50.1/package');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1320, height: 780 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
    await page.goto('http://127.0.0.1:5175');
    console.log('Loaded town');
    await page.waitForFunction(() => window.game?.scene.scenes[0]?.player);
    const result = await page.evaluate(() => {
      const s = game.scene.scenes[0];
      s.scene.pause();
      const cursor = (right) => ({ left: { isDown: false }, right: { isDown: right }, up: { isDown: false }, down: { isDown: false } });
      const alpha = [1,2,3,4].map(i => {
        const image = s.textures.get(`cat-${i}`).getSourceImage();
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
        const c = canvas.getContext('2d'); c.drawImage(image,0,0);
        const data = c.getImageData(0,0,image.width,image.height).data;
        let transparent = 0, white = 0;
        for (let p=0;p<data.length;p+=4) { if(data[p+3]===0)transparent++; if(data[p]>230&&data[p+1]>230&&data[p+2]>230&&data[p+3]>240)white++; }
        return { transparent, white };
      });
      const morningClock=s.sunSystem.uiText.text;
      const spawnSafe=s.shadowSystem.isPointInAnyShadow(s.level.start);
      s.player.setPosition(s.level.start.x,s.level.start.y); s.player.update(cursor(true),.1);
      const moving = s.player.sprite.anims.isPlaying;
      const frames = s.anims.get('cat-run').frames.map(f=>f.textureKey);
      s.player.update(cursor(false),.1);
      const idle = s.player.sprite.texture.key;
      s.sunSystem.sunPhase=-.7; s.sunSystem.updateSunPosition(); s.art.update(s.sunSystem);s.shadowSystem.update(-.7);
      const before=JSON.stringify(s.shadowSystem.shadowPolygons), lightX=s.art.light.x;
      s.sunSystem.sunPhase=.7;s.sunSystem.updateSunPosition();s.art.update(s.sunSystem);s.shadowSystem.update(.7);
      const changed=before!==JSON.stringify(s.shadowSystem.shadowPolygons);
      const lightChanged=lightX!==s.art.light.x && s.art.light.x===s.sunSystem.sun.x;
      const caster=s.shadowCasters[0];
      caster.setShadowDirection(-5/6);const morningLength=Math.hypot(caster.dx,caster.dy), morningDirection=caster.dx;
      caster.setShadowDirection(0);const noonLength=Math.hypot(caster.dx,caster.dy);
      caster.setShadowDirection(5/6);const eveningLength=Math.hypot(caster.dx,caster.dy), eveningDirection=caster.dx;
      // A source opaque pixel projects to a safe point; transparent canopy corners stay unsafe.
      let opaqueMatch=false, transparentMatch=false;
      for(let v=.1;v<.9;v+=.1)for(let u=.05;u<.95;u+=.05){
        const alpha=caster.alpha[(Math.floor(v*caster.source.height)*caster.source.width+Math.floor(u*caster.source.width))*4+3];
        const p={x:caster.x-caster.width/2+u*caster.width+(caster.anchorY-v)*caster.dx,y:caster.y+(caster.anchorY-v)*caster.dy};
        if(alpha>200&&caster.contains(p))opaqueMatch=true;
        if(alpha===0&&!caster.contains(p))transparentMatch=true;
      }
      s.resetLevel();s.art.update(s.sunSystem);
      return { alpha, moving, frames, idle, changed, lightChanged, morningClock, spawnSafe, morningLength, noonLength, eveningLength, morningDirection, eveningDirection, opaqueMatch, transparentMatch };
    });
    assert(result.alpha.every(f=>f.transparent>1000&&f.white>1000),'Alpha background and opaque white fur');
    const trees=await page.evaluate(()=>{
      const s=game.scene.scenes[0];
      s.time.now=1000;s.art.update(s.sunSystem);
      const props=s.art.props.filter(p=>p.texture.startsWith('tree-'));
      const before=props.map(p=>p.sprite.rotation);
      s.shadowSystem.update(s.sunSystem.sunPhase);
      const woodBefore=s.shadowCasters.filter(c=>c.isTree).map(c=>JSON.stringify(c.layers[0].matrix));
      s.time.now=1700;s.art.update(s.sunSystem);s.shadowSystem.update(s.sunSystem.sunPhase);
      return props.map((p,i)=>({key:p.texture,still:p.bark.rotation===0&&p.bark.x===p.x&&p.bark.y===p.y,
        sways:p.sprite.rotation!==before[i],woodShadowStill:woodBefore[i]===JSON.stringify(s.shadowCasters.filter(c=>c.isTree)[i].layers[0].matrix),
        transparent:s.textures.get(`${p.texture}-foliage`).context.getImageData(0,0,1,1).data[3]===0}));
    });
    assert.equal(trees.length,4);assert(trees.every(t=>t.still&&t.sways&&t.woodShadowStill&&t.transparent),JSON.stringify(trees));
    console.log('Checked all tree layers',trees);
    console.log('Checked art and shadows');
    assert(result.moving);assert.deepEqual(result.frames,['cat-1','cat-2','cat-3','cat-4']);assert.equal(result.idle,'cat-1');
    assert(result.changed);assert(result.lightChanged);assert.deepEqual(errors,[]);
    assert.equal(result.morningClock,'07:00');assert(result.spawnSafe,'Start sheltered');
    assert(result.morningLength>result.noonLength*2);assert(result.eveningLength>result.noonLength*2);
    assert(result.morningDirection<0&&result.eveningDirection>0);assert(result.opaqueMatch&&result.transparentMatch);
    await page.screenshot({ path: 'art-preview.png' });
    await page.evaluate(()=>{const s=game.scene.scenes[0];s.cameras.main.stopFollow();s.cameras.main.centerOn(1900,580);});
    await page.waitForTimeout(100);await page.screenshot({path:'art-house-preview.png'});
    await page.evaluate(()=>{const s=game.scene.scenes[0];s.scene.resume();});
    await page.mouse.move(660,400);await page.mouse.wheel(0,500);await page.waitForTimeout(450);
    const scrolled=await page.evaluate(()=>{const s=game.scene.scenes[0];s.scene.pause();return {hour:s.sunSystem.hour,clock:s.sunSystem.uiText.text};});
    assert(scrolled.hour>7.5,'Real wheel input advances morning time');assert.notEqual(scrolled.clock,'07:00');
    console.log('Checked clock');
    const town=await page.evaluate(()=>{
      const s=game.scene.scenes[0],t=s.level.treePositions[0];
      return {panel:document.querySelector('details').open,debug:s.collisionDebug,
        trunk:s.getPositionBlocker(t.x,t.y-5,18),roots:s.getPositionBlocker(t.x+48,t.y+5,18),
        rootShade:s.shadowCasters[0].contains({x:t.x+40,y:t.y+5}),
        houseShadows:s.shadowCasters.filter(c=>c.texture==='house-art').every(c=>c.contains({x:c.x,y:c.y})),
        houses:s.level.buildingObjects.length,shader:Boolean(s.paintPipeline?.paintEnabled),uiZoom:s.uiCamera.zoom};
    });
    assert(town.panel&&town.debug);assert.equal(town.trunk,'TREE');assert.equal(town.roots,null);
    assert(town.rootShade&&town.houseShadows);assert(town.houses>=4&&town.shader);assert.equal(town.uiZoom,1);
    const effects=await page.evaluate(()=>{
      const s=game.scene.scenes[0],p=s.player,w=s.level.waterZones[0];
      const variants=new Set(s.art.props.filter(p=>p.texture.startsWith('tree-')).map(p=>p.texture)).size;
      const poolCenter=s.isInsideWater(w.x,w.y,0);
      const poolOutside=s.isInsideWater(w.x+120,w.y+55,0);
      p.moving=true;p.moveX=1;p.updateVisuals(1000,.06);p.updateVisuals(1100,.06);
      const count=p.sparkles.length,outlined=Boolean(p.outline),shadowGap=p.contactShadow.y-p.sprite.y;
      p.stop();p.updateVisuals(3000,2);p.updateVisuals(3100,.1);
      s.shadowSystem.update(s.sunSystem.sunPhase);const dx=s.shadowCasters[0].foliageAngle;
      s.time.now+=600;s.shadowSystem.update(s.sunSystem.sunPhase);
      const shadowSways=dx!==s.shadowCasters[0].foliageAngle;
      s.resetLevel();
      return {variants,poolCenter,poolOutside,count,outlined,shadowGap,expired:p.sparkles.length===0,shadowSways,windAbove:s.windSystem.graphics.depth>3001};
    });
    assert.equal(effects.variants,4);assert(effects.poolCenter&&!effects.poolOutside);
    assert(effects.count>0&&!effects.outlined&&effects.shadowGap>=29&&effects.expired);
    assert(effects.shadowSways&&effects.windAbove);
    console.log('Checked isometric pool, tree variants, wind, floating cat and sparkle lifetime',effects);
    console.log('Checked town collisions');
    await page.evaluate(()=>game.scene.scenes[0].scene.resume());
    await page.locator('canvas').evaluate(el=>el.dispatchEvent(new WheelEvent('wheel',{deltaY:-250,shiftKey:true,bubbles:true,clientX:660,clientY:400})));
    await page.waitForTimeout(150);
    const zoom=await page.evaluate(()=>{const s=game.scene.scenes[0];s.scene.pause();return {world:s.cameras.main.zoom,ui:s.uiCamera.zoom};});
    assert(zoom.world>1.1);assert.equal(zoom.ui,1);
    console.log('Checked shift-wheel zoom');
    await page.locator('input[aria-label="Map zoom"]').evaluate(el=>{el.value='0.55';el.dispatchEvent(new Event('input',{bubbles:true}));});
    await page.evaluate(()=>{const s=game.scene.scenes[0];s.cameras.main.stopFollow();s.cameras.main.centerOn(1200,800);});
    await page.waitForTimeout(100);await page.screenshot({path:'town-preview.png'});
    const painted=await page.locator('canvas').screenshot();
    await page.locator('[data-option="paint"]').uncheck();await page.waitForTimeout(100);
    assert(!painted.equals(await page.locator('canvas').screenshot()),'Painterly filter affects the world');
    await page.locator('[data-option="paint"]').check();
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({ ...result, town, zoom, errors }));
  } catch(error) { console.error(error);throw error; }
  finally { await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]); }
})().catch(e=>{console.error(e);process.exit(1);});
