import { Improvement } from "./improvement";

class AreaImprovement extends Improvement{
  constructor({maxArea, ...args}){
    super(...args);
    this._totalImprovement = 0;
    this._maxArea = maxArea;
  }

  get maxArea(){ return this._maxArea; }
  get level(){
    let l = 0;
    let totalImprovement = this._totalImprovement;

    for (l = 0; l < MAX_LEVEL; l += 1){
      let maxImprovementByLevel = 
        this.constructor.CONSTRUCTION_TIME[l] *
        this.maxArea;

      if (totalImprovement < maxImprovementByLevel)
        return totalImprovement / maxImprovementByLevel;
      
      totalImprovement -= maxImprovementByLevel;
    }

    return l;
  }

  improve(laborTime){
    this._totalImprovement += laborTime;
  }

  degrade(){
    this._totalImprovement -= 
      this.level * this.maxArea / this.constructor.DEGRADATION_TIME | 1;
  }

  destroy(population){
    this._totalImprovement -= population * Math.ceil(this.level) / 
      ( this.constructor.DEGRADATION_TIME * 100 ) | 1;
  }
}

export class Pasture extends AreaImprovement{
  static MAX_LEVEL = 1;
  static CONSTRUCTION_TIME = [1];
  static DEGRADATION_TIME = 16;
}

export class Farmland extends AreaImprovement{
  // level 1: dryland; allows for farming
  // level 2: irrigated farm; allows for 
  // level 3: paddy; 2.5x yield for rice farming
  static MAX_LEVEL = 3;
  static CONSTRUCTION_TIME = [10, 10, 20];
  static DEGRADATION_TIME = 4;
}