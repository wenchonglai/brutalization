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

    const cities = [
      new City({  // AnYi
        player: this.currentPlayer, 
        tile: Tile.getTile({x: 7, y: 5}), 
        population: 5000,
      }),
      // new City({  // YangDi
      //   player: this.players[3],
      //   tile: Tile.getTile({x: 9, y: 9}), 
      //   population: 3000
      // }),
      // new City({  // YeWang
      //   player: this.players[3],
      //   tile: Tile.getTile({x: 9, y: 6}), 
      //   population: 4000,
      //   name: 'YeWang'
      // }),
      // new City({  // XinZheng
      //   player: this.players[3],
      //   tile: Tile.getTile({x: 10, y: 8}), 
      //   population: 4000,
      //   name: 'XinZheng'
      // }),
      // new City({ // Daliang
        // player: this.currentPlayer,
        // tile: Tile.getTile({x: 11, y: 7}), 
        // population: 6000
      // }),
      // new City({ // Ye
        // player: this.currentPlayer,
        // tile: Tile.getTile({x: 12, y: 5}), 
        // population: 5000
      // }),
      // new City({ // Yong
        // player: this.players[1], 
        // tile: Tile.getTile({x: 1, y: 6}), 
        // population: 4000
      // }),
      new City({ // YueYang
        player: this.players[1], 
        tile: Tile.getTile({x: 4, y: 6}), 
        population: 3000,
        name: "YueYang"
      }),
      // new City({ // Shan
        // player: this.players[1], 
        // tile: Tile.getTile({x: 6, y: 7}), 
        // population: 3000
      // }),
      // new City({ // Jinyang
        // player: this.players[2],
        // tile: Tile.getTile({x: 8, y: 2}), 
        // population: 4000
      // }),
      // new City({ // Zhongmou
        // player: this.players[2],
        // tile: Tile.getTile({x: 11, y: 4}), 
        // population: 3500
      // }),
      // new City({ // Handan
        // player: this.players[2],
        // tile: Tile.getTile({x: 12, y: 3}), 
        // population: 3500
      // })
    ];

    for (let city of cities)
      for (let i = 0; i < (city.population / 1000 | 0); i++)
        city.draft();

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