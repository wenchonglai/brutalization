import { CAMP } from "../actions/unit-actions.js";
import Tile from "../tiles/tile.js";
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
      // mobilize enough soldiers
      for (
        let i = (city.totalPopulations.military + 2499) / 2500 | 0; 
        i < (city.population / 1000 | 0); 
        i ++
      ) city.draft();

      // get all units drafted from this city
      const unitsByCostDistance = Array.from(this.units)
        .filter(unit => unit.homeCity === city)
        .map(unit => [unit, unit.tile.costDistanceTo(city.tile)])
        .sort((a, b) => a[1] - b[1]);

      // detect if there are any other units closer to the city than all player units
      const closestPathToOtherUnit = city.getClosestPathToOtherUnit();
      let homeCityIsSafe = (
        city.tile.units.size > 0 ||
          unitsByCostDistance[0]?.[1] <=
            Tile.getPathCostDistance(closestPathToOtherUnit)
      );

      for (let [unit, costDistance] of unitsByCostDistance){
        // if a unit is too tired, let it stay
        if (unit.tirednessLevel >= 0.5){
          if (unit.enemySpotted || unit.tirednessLevel < 1)
            unit.guard()
          else 
            unit.rest();
        }
        // if the city may be in danger, move the closest unit back to the city
        else if (!homeCityIsSafe){
          unit.camp(city.tile);
          homeCityIsSafe = true;
        }

        // otherwise, if there is an enemy nearby
        let retVal = false;

        // if the enemy is attackable, attack the enemy
        for (let tile of unit.tile.getAdjacentTiles()){
          if (tile.hasEnemy(unit)){
            unit.action(tile, [tile.x - unit.x, tile.y - unit.y]);
            retVal = true;
          }
        }

        // otherwise, camp towards the enemy until the enemy is attackable
        if (!retVal){
          let pathToClosestTarget = unit.getPathToClosestTarget();

          while (pathToClosestTarget?.length > 0){
            let tile = pathToClosestTarget.pop();

            if (tile.hasUnit) continue;

            unit.camp(tile);

            break;
          }
        }
      }

      // if home city is not safe and no unit is moving back, force the first unit to move back
      if (!homeCityIsSafe){
        console.log(unitsByCostDistance)
        unitsByCostDistance?.[0]?.[0]?.camp(city.tile);
        homeCityIsSafe = true;
      }
    }
    
    this.endTurn();
  }
}