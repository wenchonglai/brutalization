import Player from "./player.js";

export default class AIPlayer extends Player{
  async promptAction(idleUnits){
    for (let unit of idleUnits)
      if (unit.movePoints < 0) {
        console.log('no move points');
      }
      //else if (unit.tirednessLevel > 1){
        // unit.rest();
      //} 
      else {
        let path = unit.tile.bfs(tile => tile.hasEnemy(unit), tile => tile);
        
        if (path)
          unit.action(path[path.length - 1], [0, 0]);
      }
    
    this.endTurn();
  }
}