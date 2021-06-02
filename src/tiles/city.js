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

  constructor({player, tile, population, name, initialFoodStorage = population * 60}){
    const tiles = new Set();
    
    let totalRuralPopulation = population * 10;

    for (let t of tile.getAdjacentTilesByDistance(3)){
      let delta = Math.max(
        0, PER_LEVEL_RURAL_GRID_HOUSEHOLD_CAPACITY - t.populations.civilian
      );
      
      if (t.player)
        continue;

      if (totalRuralPopulation >= delta){
        t.populations.civilian += delta;
        totalRuralPopulation -= t.populations.civilian;
        tiles.add(t);
      } else {
        t.populations.civilian = totalRuralPopulation;
        tiles.add(t);
        break;
      }
    }

    super({player, tile, name, state: {
      tiles,
      populations: {civilian: population, military: 0},
      trainLevel: 1,
      storage: {
        food: initialFoodStorage
      },
      draftHistory: 0
    }});

    for (let t of tiles)
      t._player = this.player;
  }

  register({player, tile}){
    for (let name of CITY_NAMES[player.id])
      if (!City.getCity(name)){
        if (this._name === undefined)
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
  get populations(){ return this.state.populations; }
  get urbanPopulation(){ return this.populations.civilian; }
  get totalPopulations(){
    const totalPopulations = {
      rural: 0, 
      urban: this.urbanPopulation,
      military: this.populations.military
    };

    for (let tile of this.tiles){
      totalPopulations.rural += tile.populations.civilian;
      totalPopulations.military += tile.populations.military;
    }
    
    return totalPopulations;
  }
  get storage(){ return this.state.storage; }
  get foodStorage(){ return this.storage.food; }
  get draftHistory(){ return this.state.draftHistory; }
  get overallDraftLevel(){
    let {rural, urban, military} = this.totalPopulations;

    return military / (rural + urban);
  }

  draft(){ return CityActions.draft.call(this); }

  // state and action reducer
  actionReducer(action){
    return cityActionReducer.call(this, this.state, action);
  }

  toUserInterface(){
    let {urban, rural, military} = this.totalPopulations;

    return {
      information: {
        "city": this.name,
        "total civilians": urban + rural,
        "total military units": military,
        "total food storage": this.storage.food
      },
      commands: {
        settle: undefined,
        draft: urban + rural >= military + 2500 ? 
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
    this.state.draftHistory += this.totalPopulations.military;
    
    if (this.round % 12 === 0) {
      this.storage.food += (
        this.totalPopulations.rural - this.draftHistory / 12
      ) * 6 | 0;

      this.state.draftHistory = 0;
    }
  }

  grow(){
    let urbanPopulation = this.urbanPopulation;

    urbanPopulation += urbanPopulation * POPULATION_GROWTH_RATE | 0;
    Object.assign(this.state.populations, {civilian: urbanPopulation});
    this.tiles.forEach(tile => tile.grow());
  }
  train(){ this.state.trainLevel += 1; }
  receiveMilitaryUnits(units){
    this.populations.military = Math.max(this.populations.military - urban, 0)
  }
  receiveCasualty(casualty){
    CityActions.receiveCasualty.call(this, casualty)
  }
}