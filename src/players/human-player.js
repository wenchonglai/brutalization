import Player from "./player.js";

export default class HumanPlayer extends Player{
  get unresolved(){
    return this._unresolved;
  }

  focus(gameObject, res){
    Player.prototype.focus.call(this, gameObject, res);
    this.game.focus(gameObject, res);
  }

  async promptAction(idleUnits){
    this._unresolved = new Set(idleUnits);
    for (let unit of idleUnits){
      await new Promise(resolve => {
        if (unit.tasked) resolve()
        else this.focus(unit, resolve);
      });
      
      this._unresolved.delete(unit);
    }
  }
}