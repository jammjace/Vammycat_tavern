export function showLoading(message = 'waking from the shadows...', progress) {
  const panel = document.getElementById('loading');
  if (!panel) return;
  panel.hidden = false;
  panel.querySelector('p').textContent = message;
  const bar = panel.querySelector('progress');
  if (progress === undefined) bar.removeAttribute('value');
  else bar.value = progress;
}

export function hideLoading() {
  const panel = document.getElementById('loading');
  if (panel) panel.hidden = true;
}

export function trackLoading(scene) {
  showLoading('finding a path through the shadows...', 0);
  const progress = value => showLoading('finding a path through the shadows...', value);
  scene.load.on('progress', progress);
  scene.events.once('shutdown', () => scene.load.off('progress', progress));
  scene.load.once('complete', () => {
    scene.load.off('progress', progress);
    showLoading('bringing the garden to life...', 1);
  });
  scene.events.once('create', () => scene.game.events.once('postrender', hideLoading));
}
