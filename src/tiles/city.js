import { Settlement } from "./settlement.js";
import CITY_NAMES from "../settings/city-names.js";
import {PER_LEVEL_RURAL_GRID_HOUSEHOLD_CAPACITY} from "../settings/game-settings.js"

export class City extends Settlement{
  static COMBUSTIBILITY = 1;
  static cities = new Map();
  static getCity(name){ return this.cities.get(name); }
  static setCity(name, city){ this.cities.set(name, city) }
  static deleteCity(name){ this.cities.delete(name); }

  constructor({player, tile, population}){
    const tiles = new Set();
    let totalRuralPopulation = population * 10;

    for (let t of tile.getAdjacentTilesByDistance(3)){
      let delta = Math.max(0, PER_LEVEL_RURAL_GRID_HOUSEHOLD_CAPACITY - t.populations.rural);

      if (totalRuralPopulation >= delta){
        totalRuralPopulation -= delta;
        t.populations.rural += delta;
        tiles.add(t);
      } else {
        t.populations.rural += totalRuralPopulation;
        tiles.add(t);
        break;
      }
    }

    super({player, tile, state: {
      tiles,
      population: population,
      trainLevel: 1,
      storage: {
        food: 0
      }
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
    const populations = {rural: 0, urban: this.population, drafted: 0};

    for (let tile of this.tiles){
      populations.rural += tile.populations.rural;
      populations.urban += tile.populations.urban;
      populations.drafted += tile.populations.drafted;
    }
    
    return populations;
  }
  get storage(){ return this.state.storage; }

  toUserInterface(){
    let {urban, rural, drafted} = this.populations;

    return {
      information: {
        "city": this.name,
        "total households": urban + rural,
        "urban households": this.population,
        "total food storage": this.storage.food
      },
      commands: {
        settle: undefined,
        draft: undefined,
        train: undefined
      }
    }
  }

  endTurn(){
    this.grow();

  }

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