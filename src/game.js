import HumanPlayer from "./players/human-player.js";
import AIPlayer from "./players/ai-player.js";
import Renderer from "./renderer/renderer.js";
import Tile from "./tiles/tile.js";
import UI from "./ui/ui.js";
import { Unit } from "./units/unit.js";

export default class Game{
  constructor({numberOfPlayers = 2, mapSize = 16} = {}){
    this._players = [];
    this._currentPlayerId = 0;
    this._mapSize = mapSize;
    this.ui = new UI();
    this.renderer = new Renderer({game: this});
    document.getElementById('game').appendChild(this.renderer._dom);

    for (let id = 0; id < numberOfPlayers; id ++)
      this.players[id] = new (id ? AIPlayer : HumanPlayer)({
        game: this, id
      });

    this.#_initialize();
  }

  destruct(){
    for (let player of this.players)
      player.destruct();

    for (let i = 0; i < this.mapSize; i++)
      for (let j = 0; j < this.mapSize; j++){
        let tile = Tile.getTile([i, j]);
        tile.destruct();
      }
  }
  
  get players(){ return this._players; }
  get numberOfPlayers(){ return this.players.length; }
  get currentPlayerId(){ return this._currentPlayerId; }
  get currentPlayer(){ return this.players[this.currentPlayerId]; }
  get mapSize(){ return this._mapSize; }

  #_initialize(){
    // generate map
    for (let i = 0; i < this.mapSize; i++)
      for (let j = 0; j < this.mapSize; j++)
        new Tile([i, j]);
    
    new Unit({
      player: this.currentPlayer, tile: Tile.getTile([1, 1]),
      population: 2500
    });

    new Unit({
      player: this.currentPlayer, tile: Tile.getTile([3, 5]),
      population: 5000
    });

    new Unit({
      player: this.currentPlayer, tile: Tile.getTile([2, 0]),
      population: 12500
    });
    
    // generate player home location

  }

  start(){
    this.currentPlayer.makeActive();
  }

  nextTurn(){
    this.currentPlayerId = (this.currentPlayerId + 1) / this.numberOfPlayers;
    return this.currentPlayer.makeActive();
  }

  focus(gameObject, res){
    this.ui.render(gameObject.toUserInterface(), res);
  }

  addToScene(gameObject){ this.renderer.addToScene(gameObject); }
  removeFromScene(gameObject){ this.renderer.removeFromScene(gameObject); }
}