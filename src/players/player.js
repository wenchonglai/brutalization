export default class Player{
  constructor({id, game, color}){
    this._id = id;
    this._game = game;
    this._color = color;
    this._cities = new Set();
    this._units = new Set();
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

  register(gameObject){
    gameObject._player = this;

    if (gameObject instanceof Unit) this.units.add(gameObject)
    else if (gameObject instanceof Settlement) this.settlements.add(gameObject)
    else if (gameObject instanceof Improvement) this.improvements.add(gameObject);

    this.game.addToScene(gameObject);
  }

  deregister(gameObject){
    gameObject._player = undefined;
    
    if (gameObject instanceof Unit) this.units.delete(gameObject)
    else if (gameObject instanceof Settlement) this.settlements.delete(gameObject)
    else if (gameObject instanceof Improvement) this.improvements.delete(gameObject);

    this.game.removeFromScene(gameObject);
  }

  findIdleUnits(){
    return Array.from(this._units)
      .filter(unit => unit.actionQueue.length === 0);
  }
  
  makeActive(){
    this._isTurn = true;

    this.promptAction(this.findIdleUnits());
  }

  async promptAction(idleUnits){
 
    for (let unit of idleUnits)
      await new Promise(resolve => {

        if (unit.movePoints < 0) resolve()
        else this.focus(unit, resolve);
      });
  }

  async finishTurn(){
    let idleUnits = this.findIdleUnits();

    while (idleUnits.length > 0){
      await this.promptAction(idleUnits);

      idleUnits = this.findIdleUnits();
    }

    this._isTurn = false;
    this.game.nextTurn();
  }
  
  focus(gameObject, res){
    this._selected = gameObject;
    this.viewport.x = gameObject.x;
    this.viewport.y = gameObject.y;
    //rerender using object and viewport info
  }

  update(gameObject){
    this.game.update(gameObject);
  }
  
}

