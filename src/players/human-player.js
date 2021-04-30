import Player from "./player.js";

export default class HumanPlayer extends Player{
  focus(gameObject, res){
    Player.prototype.focus.call(this, gameObject, res);
    this.game.focus(gameObject, res);
  }

  async promptAction(idleUnits){
    this._unresolved = new Set(idleUnits);
    
    for (let unit of idleUnits){
      await new Promise(resolve => {
        if (unit.movePoints < 0) resolve()
        else this.focus(unit, resolve);
      });

      this._unresolved.delete(unit);
    }
      
    this._endable = true;
  }

  async finishTurn(){
    let idleUnits = this.findIdleUnits();

    while (idleUnits.length > 0){
      await this.promptAction(idleUnits);

      idleUnits = this.findIdleUnits();
    }

    // this.game.nextTurn();
  }
}