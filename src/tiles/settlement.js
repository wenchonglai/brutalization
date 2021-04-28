import { Improvement } from "./improvement.js";

export class Settlement extends Improvement{
  static MAX_DENSITY = 2500
}

export class City extends Settlement{
  static COMBUSTIBILITY = 1;
  constructor({regions, ...args}){
    super({...args})
    this._tiles = [this.tile];
    this._populations = this._sumPopulationsFromTiles();
    this._conscriptionQueue = [];
  }

  attach(tile){
    tile.city = this;
  }
  detach(tile){
    tile.city = null;
  }
  endYear(){
    this.grow();
  }
  grow(){
    this._tiles.forEach(tile => tile.grow());
    this._sumPopulationsFromTiles();
  }
  train(){
    for (let tile of tiles){
      tile.train();
    }
  }
  draft(level){
    totalDraftedPopulation = 0;

    for (let tile of tiles){
      let {rural, urban, drafted} = tile.populations;
      let maxDraftablePopulation = (rural + urban) * level / 6 | 1;

      if (drafted < maxDraftablePopulation)
        totalDraftedPopulation += maxDraftablePopulation - drafted;

      drafted = maxDraftablePopulation;
    }
  }
  
  _sumPopulationsFromTiles(){
    Object.assign(this._populations, {rural: 0, urban: 0, drafted: 0});
    for (let tile of tiles){
      this._populations.rural += tile.populations.rural;
      this._populations.urban += tile.populations.urban;
      this._populations.drafted += tile.populations.drafted;
    }
  }
}

export class Camp extends Settlement{
  static COMBUSTIBILITY = 2;
}