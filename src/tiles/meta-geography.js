import { POPULATION_GROWTH_RATE } from "../settings/game-settings.js";
import MetaGameObject from "../meta-game-object.js";

export default class MetaGeography extends MetaGameObject{
  get totalPopulation(){ return this.civilianPopulation + this.militaryPopulation; }
  get population(){ return this.totalPopulation; }
  get civilianPopulation(){ return this.populations.civilian; }
  get militaryPopulation(){ return this.populations.military; }
  get draftLevel(){ return this.militaryPopulation / this.population; }

  _hasCertainUnit(gameObject, callback){
    const set = new Set(
      Array.from(this.units)  
        .filter(callback)
    );

    return set.size === 0 ? false : set;
  }

  grow(){
    // increase population
    let civilian = this.populations.civilian;

    civilian += civilian * POPULATION_GROWTH_RATE | 0;
    Object.assign(this._populations, {civilian});
  }


}