const themes = new WeakMap();
const KEY = 'main-theme';

// One track per game keeps the song continuous across level scene rebuilds.
export class ThemeMusic {
  static preload(scene) {
    if (!scene.cache.audio.exists(KEY)) {
      scene.load.audio(KEY, `${import.meta.env.BASE_URL}assets/audio/main-theme.m4a`);
    }
  }

  static start(scene) {
    if (themes.has(scene.game) || !scene.cache.audio.exists(KEY)) return;
    const theme = new ThemeMusic(scene.game);
    themes.set(scene.game, theme);
  }

  constructor(game) {
    this.sound = game.sound.add(KEY, { loop: true, volume: 0 });
    const update = (_time, delta) => {
      if (game.sound.locked) return;
      // The comic has its own soundtrack; never play the level theme over it.
      if (game.scene.isActive('ComicScene')) {
        if (this.sound.isPlaying) this.sound.stop();
        this.sound.setVolume(0);
        return;
      }
      if (!this.sound.isPlaying) this.sound.play({ volume: 0 });
      const level = game.scene.getScene('GameScene');
      const playing = level?.sys.isActive() && level.state === 'PLAYING';
      const target = playing ? .32 : .09;
      const dt = Math.min(delta / 1000, .1);
      // Roughly three seconds to swell in, under a second to duck for results.
      const rate = target > this.sound.volume ? .11 : .35;
      const difference = target - this.sound.volume;
      this.sound.setVolume(this.sound.volume + Math.sign(difference) * Math.min(Math.abs(difference), rate * dt));
    };
    game.events.on('step', update);
    game.events.once('destroy', () => {
      game.events.off('step', update);
      themes.delete(game);
    });
  }
}
