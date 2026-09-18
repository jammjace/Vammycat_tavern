import './styles.css';
import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'app',
  backgroundColor: '#cce4b3',
  scene: [GameScene],
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

document.fonts.load('20px "Real Chalk"').then(() => {
  const game = new Phaser.Game(config);
  if (import.meta.env.DEV) window.game = game;
});
