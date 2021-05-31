import HumanPlayer from "./players/human-player.js";
import AIPlayer from "./players/ai-player.js";
import Renderer from "./renderer/renderer.js";
import Tile from "./tiles/tile.js";
import UI from "./ui/ui.js";
import { Unit } from "./units/unit.js";
import { City } from "./tiles/city.js";
import { MONTHS, PLAYER_COLORS } from "./settings/game-settings.js"

export default class Game{
  constructor({numberOfPlayers = 4, mapSize = 16} = {}){
    this._players = [];
    this._currentPlayerId = 0;
    this._mapSize = mapSize;
    this._round = 0;

    this.ui = new UI(this);
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
  get gameObject(){ return this._gameObject; }
  get round(){ return this._round; }
  get date(){
    // const xun = this.round % 3;
    const month = this.round % 12
    const year = (this.round / 12 | 0) - 500;
    const yearText = year < 0 ? `${-year} BC` : `${year} AD`
    return `${MONTHS[month]}, ${yearText}`
  }

  _initialize(){
    // generate map
    for (let x = 0; x < this.mapSize; x++)
      for (let y = 0; y < this.mapSize; y++)
        new Tile({x, y});

    const cityOfAnyi = new City({
      player: this.currentPlayer, 
      tile: Tile.getTile({x: 7, y: 6}), 
      population: 5000
    });

    // const cityOfYangdi = new City({
      // player: this.players[3],
      // tile: Tile.getTile({x: 9, y: 11}), 
      // population: 3000
    // });

    // const cityOfYewang = new City({
      // player: this.players[3],
      // tile: Tile.getTile({x: 9, y: 7}), 
      // population: 3000
    // });

    // const cityOfXinzheng = new City({
      // player: this.players[3],
      // tile: Tile.getTile({x: 10, y: 9}), 
      // population: 3000
    // });

    // const cityOfDaliang = new City({
      // player: this.currentPlayer,
      // tile: Tile.getTile({x: 11, y: 8}), 
      // population: 6000
    // });

    // const cityOfYe = new City({
      // player: this.currentPlayer,
      // tile: Tile.getTile({x: 12, y: 5}), 
      // population: 3000
    // });

    // const cityOfYong = new City({
      // player: this.players[1], 
      // tile: Tile.getTile({x: 1, y: 7}), 
      // population: 4000
    // });

    // const cityOfYueYang = new City({
      // player: this.players[1], 
      // tile: Tile.getTile({x: 4, y: 7}), 
      // population: 3000
    // });

    // const cityOfShan = new City({
      // player: this.players[1], 
      // tile: Tile.getTile({x: 6, y: 8}), 
      // population: 3000
    // });

    // const cityOfJinyang = new City({
      // player: this.players[2],
      // tile: Tile.getTile({x: 8, y: 2}), 
      // population: 4000
    // });

    // const cityOfZhongmou = new City({
      // player: this.players[2],
      // tile: Tile.getTile({x: 11, y: 4}), 
      // population: 3000
    // });

    // const cityOfHandan = new City({
      // player: this.players[2],
      // tile: Tile.getTile({x: 12, y: 3}), 
      // population: 3000
    // });

    for (let i = 0; i < 6; i++)
      cityOfAnyi.draft();

    // new Unit({
    //   player: this.currentPlayer, 
    //   tile: Tile.getTile({x: 2, y: 3}),
    //   homeTile: cityOfAnyi.tile,
    //   population: 5000,
    //   formation: [1, -1]
    // });

    // new Unit({
    //   player: this.currentPlayer,
    //   tile: Tile.getTile({x: 4, y: 4}),
    //   homeTile: cityOfAnyi.tile,
    //   population: 10000,
    //   formation: [1, 0]
    // });

    // new Unit({
    //   player: this.currentPlayer,
    //   tile: Tile.getTile({x: 5, y: 5}),
    //   homeTile: cityOfDaliang.tile,
    //   population: 20000,
    //   formation: [0, -1]
    // });

    // new Unit({
    //   player: this.players[1],
    //   tile: Tile.getTile({x: 3, y: 2}),
    //   homeTile: cityOfYong.tile,
    //   population: 5000,
    //   formation: [1, 0]
    // });

    // new Unit({
    //   player: this.players[1],
    //   tile: cityOfYueYang.tile,
    //   homeTile: cityOfYueYang.tile,
    //   population: 10000
    // });

    // new Unit({
    //   player: this.players[1],
    //   tile: Tile.getTile({x: 5, y: 4}),
    //   homeTile: cityOfYueYang.tile,
    //   population: 12500,
    //   formation: [-1, 1]
    // });



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
    if (this._currentPlayerId === 0)
      this._round ++;

    this.currentPlayer.activate();
  }

  endTurn(){
    this.currentPlayer.endTurn();
  }

  nextTurn(){
    this._currentPlayerId = (this.currentPlayerId + 1) % this.numberOfPlayers;
    this.ui.updateDate(this.date);
    this.start();
  }

  focus(gameObject, res){
    this._gameObject = gameObject;
    this.ui.focus(gameObject, res);
    this.renderer.focus(gameObject);
  }

  update(gameObject, action){
    gameObject.player instanceof HumanPlayer ?? this.ui.update(gameObject);
    this.renderer.update(gameObject, action);
  };

  addToScene(gameObject){ this.renderer.addToScene(gameObject); }

  removeFromScene(gameObject){ this.renderer.removeFromScene(gameObject); }

  changeMapInteraction(type, {gameObject, command}){
    this.renderer.changeMapInteraction(type, {gameObject, command})
  }
}