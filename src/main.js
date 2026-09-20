import { mark, record } from './startupTiming.js';
import './styles.css';
import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene.js';
import { IntroScene } from './scenes/IntroScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'app',
  // No object uses Phaser's built-in pre-FX. Camera post-FX remain enabled.
  disablePreFX: true,
  backgroundColor: '#cce4b3',
  scene: [IntroScene, GameScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
};

mark('app-init');
const fontStart = performance.now();
document.fonts.load('20px "Real Chalk"').then(() => {
  record('font-ready', fontStart);
  const bootStart = performance.now();
  const game = new Phaser.Game(config);
  game.events.once('ready', () => record('phaser-ready', bootStart));
  if (import.meta.env.DEV) window.game = game;
});
