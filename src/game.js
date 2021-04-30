import HumanPlayer from "./players/human-player.js";
import AIPlayer from "./players/ai-player.js";
import Renderer from "./renderer/renderer.js";
import Tile from "./tiles/tile.js";
import UI from "./ui/ui.js";
import { Unit } from "./units/unit.js";

const PLAYER_COLORS = [
  '#4f9fbf',
  '#df7f7f',
  '#00bf00',
  '#9f7fff',
];

export default class Game{
  constructor({numberOfPlayers = 2, mapSize = 16} = {}){
    this._players = [];
    this._currentPlayerId = 0;
    this._mapSize = mapSize;
    this.ui = new UI();
    this.renderer = new Renderer({game: this});
    this._dom = document.getElementById('game');

    this.renderer.attachTo(this._dom);
    this.ui.attachTo(this._dom);

    for (let id = 0; id < numberOfPlayers; id ++)
      this.players[id] = new (id ? AIPlayer : HumanPlayer)({
        game: this, id,
        color: PLAYER_COLORS[id]
      });

    this._initialize();
  }

  destruct(){
    for (let player of this.players)
      player.destruct();

    for (let x = 0; x < this.mapSize; x++)
      for (let y = 0; y < this.mapSize; y++){
        let tile = Tile.getTile({x, y});
        tile.destruct();
      }
  }
  
  get players(){ return this._players; }
  get numberOfPlayers(){ return this.players.length; }
  get currentPlayerId(){ return this._currentPlayerId; }
  get currentPlayer(){ return this.players[this.currentPlayerId]; }
  get mapSize(){ return this._mapSize; }

  _initialize(){
    // generate map
    for (let x = 0; x < this.mapSize; x++)
      for (let y = 0; y < this.mapSize; y++)
        new Tile({x, y});
    
    new Unit({
      player: this.currentPlayer, tile: Tile.getTile({x: 0, y: 0}),
      population: 2500,
      formation: [1, 1]
    });

    new Unit({
      player: this.currentPlayer, tile: Tile.getTile({x: 3, y: 5}),
      population: 5000,
      formation: [1, 0]
    });

    new Unit({
      player: this.currentPlayer, tile: Tile.getTile({x: 2, y: 0}),
      population: 12500
    });

    new Unit({
      player: this.players[1], tile: Tile.getTile({x: 11, y: 1}),
      population: 5000,
      formation: [-1, -1]
    });

    new Unit({
      player: this.players[1], tile: Tile.getTile({x: 4, y: 5}),
      population: 3500,
      formation: [1, 0]
    });

    new Unit({
      player: this.players[1], tile: Tile.getTile({x: 3, y: 0}),
      population: 12500
    });

    // generate player home location

  }

  start(){
    this.currentPlayer.activate()
      .then(res => {
        this.nextTurn();
      });
  }

  nextTurn(){
    this.currentPlayer.endTurn();
    this._currentPlayerId = (this.currentPlayerId + 1) % this.numberOfPlayers;
    this.start();
  }

  focus(gameObject, res){
    this.ui.focus(gameObject, res);
    this.renderer.focus(gameObject);
  }

  update(gameObject){
    gameObject.player instanceof HumanPlayer ?? this.ui.update(gameObject);
    this.renderer.update(gameObject);
  };

  addToScene(gameObject){ this.renderer.addToScene(gameObject); }
  removeFromScene(gameObject){ this.renderer.removeFromScene(gameObject); }

  changeMapInteraction(type, {gameObject, command}){
    this.renderer.changeMapInteraction(type, {gameObject, command})
  }
}