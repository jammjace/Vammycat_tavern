const { chromium } = require('/Users/chloe/Library/Caches/ms-playwright-go/1.50.1/package');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({viewport:{width:1320,height:780}});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:5175');
    await page.waitForFunction(()=>window.game?.scene.scenes[0]?.thermometer);
    const result=await page.evaluate(()=>{
      const s=game.scene.scenes[0];s.scene.pause();
      const e=s.exposureSystem;
      function heat(dt){e.reset();for(let t=0;t<60;t++)e.update(dt,false,'PLAYING');return e.currentExposure;}
      const fine=heat(1/60);e.reset();e.update(1,false,'PLAYING');const coarse=e.currentExposure;
      e.reset();e.update(.25,false,'PLAYING');const first=e.currentExposure;e.update(.25,false,'PLAYING');const second=e.currentExposure-first;
      e.update(5,false,'PLAYING');const dies=e.deathTriggered;
      e.reset();e.update(.2,false,'PLAYING');e.update(2,true,'PLAYING');const cooled=e.currentExposure;
      e.update(1,false,'DEAD');const frozen=e.currentExposure;
      e.reset();e.currentExposure=.65;s.updateExposureBar();
      document.querySelector('details').open=false;
      return {fine,coarse,first,second,dies,cooled,frozen,font:document.fonts.check('20px "Real Chalk"'),shader:s.uiPaintPipeline.paintEnabled,oldBar:!!s.exposureBar,clock:s.sunSystem.uiText.text,head:s.thermometer.flame.x};
    });
    assert(Math.abs(result.fine-result.coarse)<1e-10);
    assert(result.first>result.second*1.5);
    assert(result.dies&&result.font&&result.shader&&!result.oldBar);
    assert.equal(result.cooled,0);assert.equal(result.frozen,0);
    assert.equal(result.clock,'07:00');assert.equal(result.head,703);
    await page.screenshot({path:'/tmp/vammycat-ui.png'});
    assert.deepEqual(errors,[]);console.log(result);
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
