import aStarSearch from "../util/a-star.js";
import bfs from "../util/bfs.js";
import { Improvement } from "./improvement.js";
import { Settlement } from "./settlement.js";
import { Unit } from "../units/unit.js";

const TERRAINS = [
  "OCEAN",      // 0
  "SEA",        // 1
  "LAKE",       // 2
  "MARSH",      // 3
  "PLAIN",      // 4
  "HILL_PLAIN", // 5
  "HILL",       // 6
  "ALPINE",     // 7
];

export default class Tile {
  static tiles = {};
  static setTile({x, y}, tile){
    if (Tile.tiles[x] === undefined) Tile.tiles[x] = {};
    Tile.tiles[x][y] = tile;
  }
  static getTile({x, y}){
    if (!Tile.tiles[x]) return undefined;
    return Tile.tiles[x][y];
  }

  constructor({x, y}, {
    terrain = 4,
    population = {rural: 500, urban: 0, drafted: 0}
  } = {}){
    this._x = x;
    this._y = y;
    this._terrain = terrain;
    this._improvements = new Set();
    this._settlements = new Set();
    this._units = new Set();
    this._connections = [];
    this._city = null;
    this._populations = {...population};
    this._totalLaborTime = 0;
    this._trainLevel = 0;
    this._attitudes = {};

    Tile.setTile({x, y}, this);
  }

  destruct(){
    Tile.setTile(this, null);
    
    for (let improvement of this.improvements)
      improvement?.destruct();
    
    for (let settlement of this.settlements)
      settlement?.destruct();

    for (let unit of this.units)
      unit?.destruct();
  }

  get x(){return this._x;}
  get y(){return this._y;}
  get populations(){ return this._populations; }  // total populations (rural, urban, drafted) of this tile
  get attitudes(){ return this._attitudes; }      // attitudes towards different countries
  get improvements(){ return this._improvements; }
  get settlements(){ return this._settlements; }
  get units(){ return this._units; }
  get hasUnit(){ return this.units.size > 0; }

  hasEnemy(gameObject){
    return Array.from(this.units).some(unit => unit.player !== gameObject.player);
  }

  getEnemy(gameObject){
    for (let unit of Array.from(this.units)){
      if (unit.player !== gameObject.player)
        return unit;
    }
  }

  getDistance(tile){
    return tile ? 
      (( (this.x - tile.x) ** 2 + (this.y - tile.y) ** 2 ) ** 0.5).toFixed(4) : 
      Infinity;
  }

  getCostDistance(tile){
    return this.getDistance(tile) * 2;
  }

  endYear(){
    // increase population
    let {rural, urban, drafted} = this._populations;

    rural += ( rural - drafted * rural / (rural + urban) ) / 8 | 1;
    urban += ( urban - drafted * urban / (rural + urban) ) / 8 | 1;

    Object.assign(this._populations, {rural, urban});
    
    // decrease train level
    if (this._trainLevel > 0) this._trainLevel -= 1;

    // change attitude
    for (let key of Object.keys(this.attitudes)){
      let currentAttitude = this.attitudes[key];

      if (currentAttitude < 0)
        this.attitudes[key] += Math.min(5, -currentAttitude)
    }
    
    // reset labor time
    this._totalLaborTime = 0;
  }
  
  // get all valid adjoining tiles
  getAdjacentTiles(){
    const tiles = [];

    for (let i = -1; i <= 1; i ++)
      for (let j = -1; j <= 1; j ++)
        if (i !== 0 || j !== 0){
          let tile = Tile.getTile({x: this.x + i, y: this.y + j});
          if (tile) tiles.push(tile);
        }
        
    return tiles;
  }

  // assign values determined by assignFunction to surrounding tiles
  rangeAssign(range, assignFunction){
    for (let i = -range, tile; i <= range; i += 1)
      for (let j = -range; j <= range; j += 1){
        let tile = Tile.getTile({x: this.x + i, y: this.y + j});
        tile && assignFunction.call(tile, this.getDistance(tile));
      }
  }

  // get the closest path when the destination tile is certain (fast)
  aStarSearch(destinationTile, pathFunc, {maxDistance = 4096} = {}){
    return aStarSearch.call(this, destinationTile, pathFunc, {maxDistance});
  }

  // find the closest tile meeting the findFunc criteria (slow)
  bfs(findFunc, pathFunc, {maxDistance = 4096} = {}){
    return bfs.call(this, findFunc, pathFunc, {maxDistance});
  }

  register(gameObject){
    gameObject.tile?.deregister(gameObject);
    gameObject._tile = this;
    
    if (gameObject instanceof Unit) this.units.add(gameObject)
    else if (gameObject instanceof Settlement) this.settlements.add(gameObject)
    else if (gameObject instanceof Improvement) this.improvements.add(gameObject);
  }

  deregister(gameObject){
    gameObject._tile = undefined;
    
    if (gameObject instanceof Unit) this.units.delete(gameObject)
    else if (gameObject instanceof Settlement) this.settlements.delete(gameObject)
    else if (gameObject instanceof Improvement) this.improvements.delete(gameObject);
  }

  /* User-related */
  train(){ this._trainLevel += 1; }  
}