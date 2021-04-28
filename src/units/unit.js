import Tile from "../tiles/tile.js";
import {City} from "../tiles/settlement.js";
import approximate from "../util/approximate.js";

export class Unit{
  constructor({player, tile, population = 0, experience = 0} = {}){

    this._homeTile = tile;
    this._actionQueue = [];

    this._originalState = Object.freeze({
      tile, population
    });
    
    this._state = {
      population, 
      experience,
      campTile: tile,
      tiredNessLevel: 0, 
      totalHunger: 0, totalFoodLoad: 0, morality: 0, pandemicStage: 0,
      formation: [0, 0],
      movePoints: 0,
      pathToClosestHomeCity: []
    };

    this.register({player, tile});
  }
  register({player, tile}){
    tile?.register(this);
    player?.register(this);
  }
  get originalState(){ return this._originalState; }
  get state(){ return this._state; }
  set state(newState){ return this._state = newState; }
  get tile(){ return this._tile; }
  get homeTile(){ return this.originalState.tile; }
  get campTile(){ return this.state.campTile; }
  get player(){ return this._player; }
  get playerId(){ return this._player?.id; }
  get x(){ return this.tile.x; }
  get y(){ return this.tile.y; }
  get actionQueue(){ return this._actionQueue; }
  get action(){ return this.actionQueue[0]; }
  get population(){ return this.state.population; }
  get experience(){ return this.state.experience; }
  get pandemicStage(){ return this.state.pandemicStage; }
  get tiredNessLevel(){ return this.state.tiredNessLevel; }
  get hungerLevel(){ return this.state.totalHunger / this.state.population; }
  get morality(){ return this.state.morality; }
  get overallWearinessLevel(){
    return 1 + Math.max(0, this.tiredNessLevel - 1) + Math.max(0, this.hungerLevel - 1) + Math.max(0, this.pandemicStage - 1) ** 0.5 / 4;
  }
  get staminaLevel(){ return 1 / this.overallWearinessLevel; }
  get formation(){ return this.state.formation; }
  
  // user interaction
  toUserInterface(){
    return {
      information: {
        population: approximate(this.population),
        experience: approximate(this.experience),
        hunger: approximate(this.hungerLevel),
        stamina: approximate(this.staminaLevel),
        morality: approximate(this.morality),
        pandemic: approximate(this.pandemicStage),
        formation: this.formation
      },
      commands: {
        rest: this.rest.bind(this),
        guard: this.guard.bind(this),
        march: this.march.bind(this),
        raid: this.raid.bind(this),
        pillage: this.pillage.bind(this),
      }
    }
  }

  // calculation formula
  calculatePandemicPossibility(){
    const dx = this.x - this.homeTile.x;
    const dy = this.y - this.homeTile.y;

    return ((1 + ( dx ** 2 ) * 0.5 + dy ** 2 ) ** 0.5 / 32 ) * (this.overallWearinessLevel ** 0.5);
  }

  calculatePathToClosestHomeCity(){
    return this.tile.bfs(
      tile => tile.city && tile.city.totalFoodStorage > 0,
      tile => 
        !tile.hasUnit() && 
        tile.playerId === this.playerId
    );
  }
  calculateMoralityBonus(){
    return Math.min(1.25 ** (this.morality * 0.8), 1.25);
  }
  calculateMilitaryMight(){
    console.log(this.population, this.staminaLevel, this.experience)
    return this.population * this.staminaLevel * this.calculateMoralityBonus() * (this.experience ** 0.5);
  }
  calculateTolerableCasualtyRate(){
    return (this.experience ** 0.5) * this.calculateMoralityBonus() / 100;
  }

  // state and action reducer
  actionReducer(action){
    Object.freeze(this.state);
    const newState = {...this.state};
    const foodConsumption = Math.min(newState.population, newState.totalFoodLoad);
    const isPandemic = Math.random() >= this.calculatePandemicPossibility();

    newState.totalHunger += newState.population - foodConsumption;
    newState.totalFoodLoad -= foodConsumption;
    newState.pandemicStage = Math.max(0, newState.pandemicStage + (isPandemic ? 1 : -1) );
    newState.population -= Math.random() * newState.population * (
      Math.min(newState.hungerLevel - 1, 0) + 
      Math.min(newState.tiredNessLevel / 2 - 1, 0) + 
      newState.pandemicStage
    ) / 25 | 1;

    switch (action.type){
      case 'rest': {
        newState.movePoints -= 2;
        newState.tiredNessLevel -= 1;
        return newState;
      };
      case 'guard': {
        newState.movePoints -= 2;
        newState.tiredNessLevel -= 0.5;
        newState.experience += Math.random() / 8;
        return {...newState, formation: action.formation};
      }
      case 'march': {
        newState.tiredNessLevel += 0.125 * action.costDistance;
        newState.experience += Math.random() * action.costDistance/ 4;

        if (newState.tiredNessLevel > 1)
          newState.morality -= 0.125 * action.costDistance * overallWearinessLevel;

        return {
          ...newState, 
          campTile: action.targetTile,
          formation: action.formation
        };
      }
      case 'pillage': {
        newState.movePoints -= 2;
        newState.tiredNessLevel += 0.125;
        newState.morality += 1;
        newState.population -= action.casualty;
        newState.totalFoodLoad += action.yield;
        return newState;
      }
      case 'raid': {
        newState.tiredNessLevel += 0.25;
        newState.morality -= 0.25 * overallWearinessLevel;
        newState.experience += Math.random() / 2;
        return newState;
      }
      case 'battle': {
        newState.movePoints -= 2;
        newState.tiredNessLevel += 1;
        newState.morality += action.morality;
        newState.population -= action.casualty;
        newState.experience += Math.random() * 3;
        newState.population -= action.casualty;
        return newState;
      }
      default: {
        return newState;
      }
    }
  }

  saveAction(action){ action && this._actionQueue.push(action); }
  dispatch(){ this.state = actionReducer(this.state, action); }
  endTurn(){
    if (this.state.movePoints >= 0){
      dispatchAction(this.actionQueue.shift());
    }
    this.state.movePoints = Math.min(0, this.state.movePoints + 2);
  }

  /* User commands */
  // rest:    add action to action queue; next command is still rest; clear action queue if no food or tireness is 0
  //          cannot rest if camp tile is not current tile
  // guard:   add action to action queue; next command is still guard; clear action queue if no food or enemy is spotted
  // pillage: execute action immediately
  // march:   cancel if enemy is spotted in the surrounding or destination is reached
  //          else: move to the target tile immediately; next command is still march until reaching the destination
  // raid:    cancel if 1) enemy is spotted in the surrounding; 2) destination is reached; or 3) food is barely enough to go back to camptile and destination tile is not camptile
  //          else: move to the target tile immediately; next command is still march 

  rest(){ this.saveAction({type: 'rest'}); console.log(this);}
  guard(formation){ this.saveAction({type: 'guard', formation}); }
  march(destinationTile, formation, path){
    if (destinationTile === this.tile) return;

    path ||= this.tile.aStarSearch(destinationTile);

    const targetTile = path[1];
    
    if (targetTile.hasUnit()){
      
    } else {
      costDistance = this.tile.getCostDistance(targetTile);

      this.saveAction({ type: 'march', targetTile,
        costDistance,
        pathToClosestHomeCity: this.calculatePathToClosestHomeCity(),
        formation: targetTile !== destinationTile ? [undefined, undefined] : formation,
        nextCommand: { type: 'march', destinationTile, formation }
      });
    }
  }
  
  pillage(targetTile){
    let {playerId} = this;

    targetTile.rangeAssign(2, function(distance){
      if (this.playerId !== playerId)
        this.attitudes[playerId] -= (3 - distance) * this.population / 65536;
    });

    this.saveAction({type: 'pillage'});
  }

  raid(destinationTile, formation){
    const targetTile = Tile.getPath(this.tile, destinationTile)[1];
    let enemy = targetTile.getEnemy();

    if (targetTile === destinationTile && enemy){
      const formationBonus = this.calculateFormationBonus(
        [targetTile.x - this.x, targetTile.y - this.y], 
        enemy.formation
      );

      const militaryMight1 = this.calculateMilitaryMight() * formationBonus * ( Math.random() * 1 + 1 ) / 1.5;
      const militaryMight2 = enemy.calculateMilitaryMight() * ( Math.random() * 1 + 1 ) / 1.5;
      
      const tolerableCasualty1 = this.calculateTolerableCasualtyRate() * this.population;
      const tolerableCasualty2 = enemy.calculateTolerableCasualtyRate() * enemy.population;

      let casualty1, casualty2, moralityDelta = 1;

      if (tolerableCasualty1 / militaryMight2 > tolerableCasualty2 / militaryMight1 ){
        casualty1 = tolerableCasualty1;
        casualty2 = tolerableCasualty1 * militaryMight1 / militaryMight2;
        
      } else {
        casualty2 = tolerableCasualty2;
        casualty1 = tolerableCasualty2 * militaryMight2 / militaryMight1;
        moralityDelta = -1;
      }

      moralityDelta *= 3 * Math.abs(casualty1 - casualty2) / (casualty1 + casualty2);

      this.saveAction({type: 'battle', casualty: casualty1, morality: moralityDelta - 0.25});
      enemy.saveAction({type: 'battle', casualty: casualty2, morality: -moralityDelta - 0.25});
    } else {
      this.saveAction({
        type: 'raid', 
        targetTile,
        formation: targetTile !== destinationTile ? 
          getFormation(targetTile, this.tile) : formation,
        nextCommand: { type: 'raid', destinationTile, formation }
      });
    }
  }
} 