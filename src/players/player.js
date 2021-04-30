import { Improvement } from "../tiles/improvement.js";
import { Settlement } from "../tiles/settlement.js";

export default class Player{
  constructor({id, game, color}){
    this._id = id;
    this._game = game;
    this._color = color;
    this._units = new Set();
    this._settlements = new Set();
    this._viewport = {x: 0, y: 0};
    this._selected = undefined;
    this._isTurn = true;
  }
  get id(){ return this._id; }
  get game(){ return this._game; }
  get color(){ return this._color; }
  get settlements(){ return this._settlements; }
  get units(){ return this._units; }
  get viewport(){ return this._viewport; }
  get selected(){ return this._selected; }

  register(gameObject){
    gameObject._player = this;

    if (gameObject instanceof Unit) this.units.add(gameObject)
    else if (gameObject instanceof Settlement) this.settlements.add(gameObject)
    else if (gameObject instanceof Improvement) this.improvements.add(gameObject);

    this.game.addToScene(gameObject);
  }

  deregister(gameObject){
    this.game.removeFromScene(gameObject);

    gameObject._player = undefined;
    
    if (gameObject instanceof Unit) this.units.delete(gameObject)
    else if (gameObject instanceof Settlement) this.settlements.delete(gameObject)
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

  update(gameObject){
    this.game.update(gameObject);
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

