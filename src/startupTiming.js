const enabled = import.meta.env.DEV;
const entries = [];
export function record(name, start, detail) {
  if (enabled) entries.push({ name, start: +start.toFixed(2), duration: +(performance.now() - start).toFixed(2), detail });
}
export function mark(name, detail) { record(name, performance.now(), detail); }
export function timed(name, fn) {
  if (!enabled) return fn();
  const start = performance.now();
  try { return fn(); } finally { record(name, start); }
}
export function trackPreload(scene) {
  if (!enabled) return;
  const start = performance.now(), files = new Map();
  scene.startupTag = `${scene.sys.settings.key}:${scene.levelIndex ?? 'intro'}:${entries.length}`;
  mark(`${scene.startupTag}:preload-start`);
  const loaded = file => files.set(file.key, performance.now());
  const processed = (key, type) => {
    if (files.has(key)) record(`${scene.startupTag}:asset-process`, files.get(key), { key, type });
  };
  scene.load.on('load', loaded);
  scene.load.on('filecomplete', processed);
  scene.load.once('complete', () => {
    record(`${scene.startupTag}:preload`, start);
    scene.load.off('load', loaded);
    scene.load.off('filecomplete', processed);
  });
}
export function trackFirstFrame(scene) {
  if (!enabled) return;
  scene.game.events.once('postrender', () => mark(`${scene.startupTag}:first-frame`));
}
if (enabled) window.__startup = { entries, report: () => console.table(entries) };
