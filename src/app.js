import Game from "./game.js";
import Tile from "./tiles/tile.js";
import { Unit } from "./units/unit.js";

window.Tile = Tile;
window.Unit = Unit;

document.addEventListener('DOMContentLoaded', () => {
  let game = new Game();
  game.start();
});
