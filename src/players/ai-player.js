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

// 秦：假设最近城市所在国为A，则对A宣战
// 赵：假设最近城市所在国为A，且赵在该最近城市附近兵力有双倍优势，则对A宣战
// 韩：假设最近城市所在国为A，A被B攻击，且韩与B的人口总和大于A时，则对A宣战