import { Settlement } from "./settlement.js";
import CITY_NAMES from "../settings/city-names.js";

export class City extends Settlement{
  static COMBUSTIBILITY = 1;
  static cities = new Map();
  static getCity(name){ return this.cities.get(name); }
  static setCity(name, city){ this.cities.set(name, city) }
  static deleteCity(name){ this.cities.delete(name); }

  constructor({player, tile, population}){
    const tiles = new Set([tile]);

    for (let t of tile.getAdjacentTiles()){
      tiles.add(t);
    }

    super({player, tile, state: {
      tiles,
      population: population,
      trainLevel: 1,
    }});
  }

  register({player, tile}){
    for (let name of CITY_NAMES[player.id])
      if (!City.getCity(name)){
        this._name = name;
        City.setCity(this.name, this);
        break;
      }

    Settlement.prototype.register.call(this, {player, tile});
  }

  deregister(){
    City.deleteCity(this.name);
  }

  get name(){ return this._name; }
  get tiles(){ return Array.from(this.state.tiles); }
  get population(){ return this.state.population; }
  get populations(){
    const populations = {rural: 0, urban: 0, drafted: 0};

    Object.assign({rural: 0, urban: 0, drafted: 0});
    for (let tile of this.tiles){
      populations.rural += tile.populations.rural;
      populations.urban += tile.populations.urban;
      populations.drafted += tile.populations.drafted;
    }
    
    return populations;
  }

  toUserInterface(){
    let {urban, rural, drafted} = this.populations;
    return {
      information: {
        "city": this.name,
        "total households": urban + rural,
        "urban households": this.population,
      },
      commands: {
        settle: undefined,
        draft: undefined
      }
    }
  }

  endTurn(){ this.grow(); }

  grow(){ this._tiles.forEach(tile => tile.grow()); }
  train(){ this.state.trainLevel += 1; }
  draft(level){
    totalDraftedPopulation = 0;

    for (let tile of this.tiles){
      let {rural, urban, drafted} = tile.populations;
      let maxDraftablePopulation = (rural + urban) * level / 6 | 1;

      if (drafted < maxDraftablePopulation)
        totalDraftedPopulation += maxDraftablePopulation - drafted;

      drafted = maxDraftablePopulation;
    }
  }
}