import { Settlement } from "./settlement.js";
import CITY_NAMES from "../settings/city-names.js";
import {PER_LEVEL_RURAL_GRID_HOUSEHOLD_CAPACITY, POPULATION_GROWTH_RATE} from "../settings/game-settings.js";
import * as CityActions from "../actions/city-actions.js";
import cityActionReducer from "../renderer/reducers/city-reducer.js";

export class City extends Settlement{
  static COMBUSTIBILITY = 1;
  static cities = new Map();
  static getCity(name){ return this.cities.get(name); }
  static setCity(name, city){ this.cities.set(name, city) }
  static deleteCity(name){ this.cities.delete(name); }

  constructor({player, tile, population, initialFoodStorage = population * 20}){
    const tiles = new Set();
    
    let totalRuralPopulation = population * 10;

    for (let t of tile.getAdjacentTilesByDistance(3)){
      let delta = Math.max(0, PER_LEVEL_RURAL_GRID_HOUSEHOLD_CAPACITY - t.populations.rural);
      
      if (t.player)
        continue;

      if (totalRuralPopulation >= delta){
        t.populations.rural += delta;
        totalRuralPopulation -= t.populations.rural;
        tiles.add(t);
      } else {
        t.populations.rural = totalRuralPopulation;
        tiles.add(t);
        break;
      }
    }

    super({player, tile, state: {
      tiles,
      populations: {urban: population, drafted: 0},
      trainLevel: 1,
      storage: {
        food: initialFoodStorage
      }
    }});

    for (let t of tiles)
      t._player = this.player;
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
  get population(){ return this.populations.urban; }
  get populations(){ return this.state.populations; }
  get totalPopulations(){
    const totalPopulations = {rural: 0, ...this.populations};

    for (let tile of this.tiles){
      totalPopulations.rural += tile.populations.rural;
      totalPopulations.drafted += tile.populations.drafted;
    }
    
    return totalPopulations;
  }
  get storage(){ return this.state.storage; }
  get foodStorage(){ return this.storage.food; }
  get draftLevel(){ return this.populations.drafted / this.populations.urban; }
  get overallDraftLevel(){
    let {rural, urban, drafted} = this.totalPopulations;

    return drafted / (rural + urban);
  }

  draft(){ return CityActions.draft.call(this); }

  // state and action reducer
  actionReducer(action){
    return cityActionReducer.call(this, this.state, action);
  }

  toUserInterface(){
    let {urban, rural, drafted} = this.totalPopulations;

    return {
      information: {
        "city": this.name,
        "total households": urban + rural,
        "urban households": urban,
        "total food storage": this.storage.food
      },
      commands: {
        settle: undefined,
        draft: urban + rural >= drafted + 2500 ? 
          this.draft.bind(this) :
          'Maximum draft level reached',
        train: undefined
      }
    }
  }

  endTurn(){
    if (true)
      this.grow();

    this.tiles.forEach(tile => tile.endTurn());
    this.storage.food = this.storage.food * 0.95 | 0;

    if (this.round % 12 === 0) {
      this.storage.food += this.totalPopulations.rural * 2;
    }
  }

  grow(){
    let {urban, drafted} = this.populations;

    urban += (urban - drafted) * POPULATION_GROWTH_RATE | 0;
    Object.assign(this.state.populations, {urban});

    this.tiles.forEach(tile => tile.grow());
  }
  train(){ this.state.trainLevel += 1; }
}