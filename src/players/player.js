import { City } from "../tiles/city.js";
import { Improvement } from "../tiles/improvement.js";

export default class Player{
  constructor({id, game, color}){
    this._id = id;
    this._game = game;
    this._color = color;
    this._units = new Set();
    this._cities = new Set();
    this._viewport = {x: 0, y: 0};
    this._selected = undefined;
    this._isTurn = true;
  }
  get id(){ return this._id; }
  get game(){ return this._game; }
  get color(){ return this._color; }

  get cities(){ return this._cities; }
  get units(){ return this._units; }
  get viewport(){ return this._viewport; }
  get selected(){ return this._selected; }
  get accessibleTiles(){ return this._accessibleTiles; } 


  updateAccessibleTiles(){
    const set = new Set();

    for (let city of this.cities){
      let subset = city.tile.bfs(
        () => false, tile => !tile.hasEnemy(this),
        {maxCostDistance: 14, returnAll: true}
      );
      
      Array.from(subset || []).forEach(tile => set.add(tile))
    }

    this._accessibleTiles = set;
  }

  register(gameObject){
    gameObject._player = this;

    if (gameObject instanceof Unit) this.units.add(gameObject)
    else if (gameObject instanceof City) this.cities.add(gameObject)
    else if (gameObject instanceof Improvement) this.improvements.add(gameObject);

    this.game.addToScene(gameObject);
  }

  deregister(gameObject){
    this.game.removeFromScene(gameObject);

    gameObject._player = undefined;
    
    if (gameObject instanceof Unit) this.units.delete(gameObject)
    else if (gameObject instanceof City) this.cities.delete(gameObject)
    else if (gameObject instanceof Improvement) this.improvements.delete(gameObject);
  }

  findIdleUnits(){
    return Array.from(this._units)
      .filter(unit => unit.actionQueue.length === 0);
  }
  
  activate(){
    this._isTurn = true;
    return this.promptAction(this.findIdleUnits());
  }

  deactivate(){
    this.focus();
  }
  
  focus(gameObject, res){
    this._selected = gameObject;

    if (gameObject){
      this.viewport.x = gameObject.x;
      this.viewport.y = gameObject.y;
    }
    //rerender using object and viewport info

    // this.game.update(gameObject);
  }

  update(gameObject, action){
    this.game.update(gameObject, action);
    this.updateAccessibleTiles();
  }
  
  endTurn(){
    this._isTurn = false;

    for (let unit of this.units){
      unit.endTurn();
    }

    this.deactivate();
    this.game.nextTurn();
  }
}

