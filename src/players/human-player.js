import Player from "./player.js";

export default class HumanPlayer extends Player{
  focus(object, res){
    Player.prototype.focus.call(this, object, res);
    this.game.focus(object, res);
  }
}