import { ThemeMusic } from './ThemeMusic.js';

const names = ['run', 'wind', 'burn', 'win', 'lose', 'tick'];

export function loadClick(scene) {
  if (!scene.cache.audio.exists('sfx-click')) scene.load.audio('sfx-click', `${import.meta.env.BASE_URL}assets/audio/click.mp3`);
}

export function playClick(scene) {
  if (scene.cache.audio.exists('sfx-click')) scene.sound.play('sfx-click', { volume: .55 });
}

export class GameAudio {
  static preload(scene) {
    ThemeMusic.preload(scene);
    loadClick(scene);
    for (const name of names) {
      if (!scene.cache.audio.exists(`sfx-${name}`)) scene.load.audio(`sfx-${name}`, `${import.meta.env.BASE_URL}assets/audio/${name}.mp3`);
    }
  }

  constructor(scene) {
    this.scene = scene;
    ThemeMusic.start(scene);
    this.sounds = Object.fromEntries(names.filter(name => scene.cache.audio.exists(`sfx-${name}`))
      .map(name => [name, scene.sound.add(`sfx-${name}`, { loop: ['run', 'burn', 'tick'].includes(name), volume: 0 })]));
    this.reset();
    scene.events.once('shutdown', () => {
      for (const sound of Object.values(this.sounds)) sound.destroy();
    });
  }

  reset() {
    for (const sound of Object.values(this.sounds)) sound.stop();
    this.windWait = 4 + Math.random() * 5;
    this.windAge = null;
  }

  loop(name, active, volume, dt) {
    const sound = this.sounds[name];
    if (!sound) return;
    if (active && !sound.isPlaying) sound.play({ volume: 0 });
    const target = active ? volume : 0;
    sound.setVolume(Math.max(0, Math.min(1, sound.volume + Math.sign(target - sound.volume) * Math.min(Math.abs(target - sound.volume), dt * 3))));
    if (!active && sound.volume === 0 && sound.isPlaying) sound.stop();
  }

  update(dt, moving, burning, changingTime = false) {
    if (this.scene.sound.locked) return;
    this.loop('run', moving, .42, dt);
    this.loop('burn', burning, .32, dt);
    this.loop('tick', changingTime, .45, dt);
    const wind = this.sounds.wind;
    if (!wind) return;
    if (this.windAge === null) {
      this.windWait -= dt;
      if (this.windWait <= 0 && wind.play({ volume: 0 })) this.windAge = 0;
    } else {
      this.windAge += dt;
      const duration = Math.min(20, wind.duration || 20);
      wind.setVolume(.24 * Math.max(0, Math.min(1, this.windAge / 4, (duration - this.windAge) / 5)));
      if (this.windAge >= duration) {
        wind.stop();
        this.windAge = null;
        this.windWait = 10 + Math.random() * 16;
      }
    }
  }

  finish(won) {
    this.reset();
    this.sounds[won ? 'win' : 'lose']?.play({ volume: won ? .65 : .6 });
  }
}
