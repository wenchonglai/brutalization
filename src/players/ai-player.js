import Player from "./player.js";

export default class AIPlayer extends Player{
  async promptAction(){
    const entities = new Set([
      ...Array.from(this.cities),
      ...Array.from(this.units)
    ]);

    for (let entity of entities)
      for (let unit of entity.enemySpotted || [])
        if (!this.isEnemy(unit))
          this.declareWar(unit.player);
    
    for (let city of this.cities){
      for (
        let i = (city.totalPopulations.military + 2499) / 2500 | 0; 
        i < (city.population / 1000 | 0); 
        i ++
      ) city.draft();
    }


    for (let unit of this.units){
      unit.rest();
      console.log(this.enemySpotted);
      // battle tactic
      // 1 detect closest enemy unit to home city
      //  1.1 if home city is empty
      //    1.1.1 if enemy unit closer than self to home city
      //          then go back to the home city
      //    1.1.2 else if enemy unit farther than self for at least 2 to home city,
      //        then move towards the closest of enemy city or unit
      //  1.2 if home city is not empty
      //      then aim at the closest of enemy city or enemy unit
    }
      // if (unit.movePoints < 0) {
      //   console.log('no move points');
      // }
      // //else if (unit.tirednessLevel > 1){
      //   // unit.rest();
      // //} 
      // else {
      //   let path = unit.tile.bfs(tile => tile.(unit), tile => tile);
        
      //   if (path)
      //     unit.action(path[path.length - 1], [0, 0]);
      // }
    
    this.endTurn();
  }
}

// 秦：假设最近城市所在国为A，则对A宣战
// 赵：假设最近城市所在国为A，且赵在该最近城市附近兵力有双倍优势，则对A宣战
// 韩：假设最近城市所在国为A，A被B攻击，且韩与B的人口总和大于A时，则对A宣战