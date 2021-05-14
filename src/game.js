import HumanPlayer from "./players/human-player.js";
import AIPlayer from "./players/ai-player.js";
import Renderer from "./renderer/renderer.js";
import Tile from "./tiles/tile.js";
import UI from "./ui/ui.js";
import { Unit } from "./units/unit.js";
import { City } from "./tiles/city.js";

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'DECEMBER'];
const PLAYER_COLORS = [
  '#4f9fbf',
  '#ff5f8f',
  '#00bf00',
  '#9f7fff',
];

export default class Game{
  constructor({numberOfPlayers = 2, mapSize = 16} = {}){
    this._players = [];
    this._currentPlayerId = 0;
    this._mapSize = mapSize;
    this.ui = new UI(this);
    this.renderer = new Renderer({game: this});
    this._dom = document.getElementById('game');
    this._turns = 0;

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
  get gameObject(){ return this._gameObject; }
  get turns(){ return this._turns; }
  get date(){  
    let date = (this.turns / this.numberOfPlayers | 0) % 3;
    let month = ((this.turns / this.numberOfPlayers | 0) % 36) / 3 | 0;
    
    return `${['Early', 'Mid', 'Late'][date]} ${MONTHS[month]}`
  }

  _initialize(){
    // generate map
    for (let x = 0; x < this.mapSize; x++)
      for (let y = 0; y < this.mapSize; y++)
        new Tile({x, y});

    let sf = new City({
      player: this.currentPlayer, 
      tile: Tile.getTile({x: 1, y: 4}), 
      population: 500
    });

    let ny = new City({
      player: this.currentPlayer,
      tile: Tile.getTile({x: 2, y: 7}), 
      population: 500
    });

    let city_0_2 = new City({
      player: this.currentPlayer,
      tile: Tile.getTile({x: 1, y: 10}), 
      population: 500
    });

    let la = new City({
      player: this.players[1], 
      tile: Tile.getTile({x: 4, y: 1}), 
      population: 500
    });

    let lv = new City({
      player: this.players[1], 
      tile: Tile.getTile({x: 7, y: 2}), 
      population: 500
    });

    let city_2_10 = new City({
      player: this.players[1], 
      tile: Tile.getTile({x: 10, y: 1}), 
      population: 500
    });

    new Unit({
      player: this.currentPlayer, 
      tile: Tile.getTile({x: 2, y: 3}),
      homeTile: sf.tile,
      population: 2500,
      formation: [1, -1]
    });

    new Unit({
      player: this.currentPlayer,
      tile: Tile.getTile({x: 4, y: 4}),
      homeTile: sf.tile,
      population: 5000,
      formation: [1, 0]
    });

    new Unit({
      player: this.currentPlayer,
      tile: Tile.getTile({x: 5, y: 5}),
      campTile: Tile.getTile({x: 5, y: 6}),
      homeTile: ny.tile,
      population: 12500,
      formation: [0, -1]
    });

    new Unit({
      player: this.players[1],
      tile: Tile.getTile({x: 3, y: 2}),
      homeTile: la.tile,
      population: 5000,
      formation: [1, 0]
    });

    new Unit({
      player: this.players[1],
      tile: lv.tile,
      homeTile: lv.tile,
      population: 12500
    });

    new Unit({
      player: this.players[1],
      tile: Tile.getTile({x: 5, y: 4}),
      campTile: Tile.getTile({x: 6, y: 3}),
      homeTile: lv.tile,
      population: 12500,
      formation: [-1, 1]
    });



    // new Unit({
    //   player: this.players[1], tile: Tile.getTile({x: 11, y: 1}),
    //   population: 5000,
    //   formation: [-1, -1]
    // });

    // new Unit({
    //   player: this.players[1], tile: Tile.getTile({x: 4, y: 5}),
    //   population: 3500,
    //   formation: [1, 0]
    // });

    // new Unit({
    //   player: this.players[1], tile: Tile.getTile({x: 3, y: 0}),
    //   population: 12500
    // });

    // generate player home location

  }

  start(){
    this.currentPlayer.activate();
    this._turns ++;
  }

  endTurn(){
    this.currentPlayer.endTurn();
  }

  nextTurn(){
    this._currentPlayerId = (this.currentPlayerId + 1) % this.numberOfPlayers;
    this.start();
  }

  focus(gameObject, res){
    this._gameObject = gameObject;
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