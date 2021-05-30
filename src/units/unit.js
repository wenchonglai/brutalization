import approximate from "../util/approximate.js";
import MetaGameObject from "../meta-game-object.js";
import Tile from "../tiles/tile.js";
import unitActionReducer from "../renderer/reducers/unit-reducer.js";
import * as UnitActions from "../actions/unit-actions.js";

export class Unit extends MetaGameObject{
  constructor({player, tile, homeTile = tile, campTile = tile, population = 0, experience = 0, formation = [0, 0]} = {}){
    super({player, tile, state: {
      battleUnits: population,
      logisticUnits: 0 ,
      unitsOnLeave: 0,
      experience,
      campTile: campTile,
      tirednessLevel: 0, 
      totalHunger: 0, 
      morality: 0, pandemicStage: 0,
      formation,
      movePoints: 0,
      foodLoads: {
        battleUnits: population * 5,
        camp: 0
      }
    }});
    
    this._originalState = Object.freeze({ tile: homeTile, population });
    this._campTile = campTile;
    this.updatePaths();
    
    Object.assign(this.state, this.balanceUnits());

    this.player.update(this);
  }

  destruct(){
    this.homeTile.population += this.population;
    this.tile.food += this.totalFoodLoad;
    MetaGameObject.prototype.deregister();
  }

  deregister(){
    this.player._unresolved.delete(this);
    MetaGameObject.prototype.deregister();
  }

  dispatch(action){
    if (this.actionQueue?.[0]?.type !== action?.type)
      this.clearActions();

    MetaGameObject.prototype.dispatch.call(this, action, () => {
      if (['camp', 'action'].includes(action.type))
        this.updatePaths();
      this.balanceUnits.call(this);
    });
  }
  
  get originalState(){ return this._originalState; }
  get cityTile(){ return this._cityTile; }
  get cityTile(){ return this._cityTile; }
  get homeTile(){ return this.originalState.tile; }
  get homeCity(){ return this.homeTile.city; }
  get campTile(){ return this.state.campTile; }
  get battleUnits(){ return this.state.battleUnits; }
  get logisticUnits(){ return this.state.logisticUnits; }
  get totalUnits(){ return this.logisticUnits + this.battleUnits; }
  get experience(){ return this.state.experience; }
  get pandemicStage(){ return this.state.pandemicStage; }
  get tirednessLevel(){ return this.state.tirednessLevel; }
  get hungerLevel(){ return this.state.totalHunger / this.state.battleUnits; }
  get morality(){ return this.state.morality; }
  get movePoints(){ return this.state.movePoints; }
  get nextCommand(){ return this.state.nextCommand; }
  get population(){ return this.battleUnits + this.logisticUnits; }
  get moveable(){ return this.movePoints >= 0; }
  get tasked(){ 
    return !this.moveable || this.actionQueue.length > 0 || !!this.nextCommand
  }
  get overallWearinessLevel(){
    return 1 + Math.max(0, this.tirednessLevel - 1) + Math.max(0, this.hungerLevel - 1) + Math.max(0, this.pandemicStage - 1) ** 0.5 / 4;
  }
  get staminaLevel(){ return 1 / this.overallWearinessLevel; }
  get formation(){ return this.state.formation; }
  get pathToClosestHomeCityFromCamp(){ return this._pathToClosestHomeCityFromCamp; }
  get pathToCamp(){ return this._pathToCamp; }
  get pathToDestination(){ return this._pathToDestination; }
  get closestHomeCity(){ return this._closestHomeCity; }

  rest(){ return UnitActions.rest.call(this); }
  guard(formation){ return UnitActions.guard.call(this, formation); }
  camp(...args){ return UnitActions.camp.call(this, ...args); }
  action(...args){ return UnitActions.action.call(this, ...args); }
  pillage(){ return UnitActions.pillage.call(this); }

  getNaturalFormation(tile){
    let {x, y} = tile;
    return [x - this.x, y - this.y];
  }
  
  // user interaction
  toUserInterface(){
    const moveable = this.movePoints >= 0;

    return {
      information: {
        "battle units": this.battleUnits,
        "total units": this.totalUnits,
        experience: approximate(this.experience),
        hunger: this.hungerLevel,
        stamina: this.staminaLevel,
        morality: this.morality,
        pandemic: this.pandemicStage,
        movePoints: this.movePoints,
        formation: this.formation
      },
      commands: {
        rest: moveable && this.rest.bind(this),
        guard: moveable && this.guard.bind(this),
        camp: moveable && this.tile == this.campTile ? 
          () => {
            this.game.changeMapInteraction('camp', {
              gameObject: this, 
              command: (...args) => this.camp.call(this, ...args)
            });

            return {skipResolve: true};
          } : 'Unit is away from camp. Go back to the camp first before re-camping.',
        action: moveable && (() => {
          this.game.changeMapInteraction('action', {
            gameObject: this, 
            command: (...args) => this.action.call(this, ...args)
          });

          return {skipResolve: true};
        }),
        pillage: moveable && this.pillage.bind(this),
        disband: moveable && this.destruct.bind(this)
      }
    }
  }

  // calculation formula
  calculatePandemicPossibility(){
    const dx = this.x - this.homeTile.x;
    const dy = this.y - this.homeTile.y;

    return ((1 + ( dx ** 2 ) * 0.5 + dy ** 2 ) ** 0.5 / 32 ) * 
      (this.overallWearinessLevel ** 0.5);
  }

  calculatePathToClosestHomeCity(sourceTile = this.tile){
    return sourceTile.bfs(
      tile => tile.city && tile.city.player === this.player && 
        (tile.city.foodStorage >= this.totalUnits || tile.city === this.homeTile),
      tile => !tile.hasEnemy(this),
    ) || this.calculatePathToHomeCityFromCamp();
  }
  calculatePathToClosestHomeCityFromCamp(){
    return this.calculatePathToClosestHomeCity(this.campTile);
  }
  calculatePathToHomeCityFromCamp(sourceTile = this.tile){
    return this.campTile.aStarSearch(
      this.homeTile,
      tile => !tile.hasEnemy(this)
    );
  }
  calculatePathToCamp(sourceTile = this.tile){
    return this.campTile.aStarSearch(
      sourceTile,
      tile => !tile.hasEnemy(this)
    );
  }
  calculatePathToDestination(sourceTile = this.tile){
    const destinationTile = this.state.nextCommand?.destinationTile || this.tile;

    return sourceTile.aStarSearch(
      destinationTile,
      tile => tile === destinationTile || !tile.hasEnemy(this)
    );
  }
  calculateMoralityBonus(){
    return Math.min(1.25 ** (this.morality * 0.8), 1.25);
  }
  calculateMilitaryMight(){
    return (this.battleUnits ** 0.5) * 
      this.staminaLevel * 
      this.calculateMoralityBonus() * 
      ((1 + this.experience) ** 0.5);
  }
  calculateTolerableCasualtyRate(){
    return ((1 + this.experience) ** 0.5) * this.calculateMoralityBonus() / 64;
  }
  
  get isDenselyFormed(){ !!this.formation?.every(el => el === 0); }

  _calculatechargeTime(formation1, formation2, attackMode = false){
    const isDenselyFormed1 = formation1.isDenselyFormed;
    const isDenselyFormed2 = formation2.isDenselyFormed;
    
    if (isDenselyFormed1 && isDenselyFormed2) return 0;
    if (isDenselyFormed1 || isDenselyFormed2) return 0.5;

    let time = 0;
    const angle1 = Math.atan2(...formation1);
    const angle2 = Math.atan2(...formation2);
    const deltaAngle = Math.min(
      Math.abs(angle1 - angle2), 
      Math.PI * 2 - Math.abs(angle1 - angle2)
    );

    if (!attackMode){
      if (angle1 * angle2 < 0) time += 0.25
      time += Math.abs(Math.abs(angle1) - Math.abs(angle2)) * 2 / Math.PI;
    } else {
      time += Math.abs(deltaAngle) * 2 / Math.PI;
    }

    return time;
  }
  _calculateFormationBonus(
    originalFormation, chargeFormation, newFormation, enemyFormation
  ){
    const chargeTime = 
      this._calculatechargeTime(originalFormation, chargeFormation) +
      this._calculatechargeTime(chargeFormation, newFormation, true);
    const isDenselyFormed = newFormation.isDenselyFormed;
    const enemyIsDenselyFormed = enemyFormation.isDenselyFormed;
    const attackAngle = Math.atan2(...(
      isDenselyFormed ? chargeFormation : newFormation
    ));
    const defenseAngle = enemyIsDenselyFormed ? undefined :
      Math.atan2(...enemyFormation.map(x => -x));
    const deltaAngle = Math.min(
      Math.abs(attackAngle - defenseAngle), 
      Math.PI * 2 - Math.abs(attackAngle - defenseAngle)
    );
// console.log(chargeTime, isDenselyFormed, enemyIsDenselyFormed, attackAngle, defenseAngle)
    return (
      (isDenselyFormed ? 1.5 : 2) *
      (enemyIsDenselyFormed ? 0 : deltaAngle ** 0.5) / 
        (1 + chargeTime) -
      (isDenselyFormed ? 0.5 : 1) *
        chargeTime * (enemyIsDenselyFormed ? 0.5 : 1)
    );
  }
  calculateFormationBonus(enemy, formation, targetTile){
    return this._calculateFormationBonus(
      this.formation,
      this.getFormationWhileMoving(targetTile),
      formation,
      enemy.formation
    );
  }

  registerCamp(tile){
    tile.registerCamp(this);
  }

  balanceUnits(){
    if (this.campTile === this.tile){
      const costDistance = Tile.getPathCostDistance(this.pathToClosestHomeCityFromCamp);
      const population = this.population;
      const battleUnits = population * (15 - costDistance) / 15 | 0;
      const logisticUnits = population - battleUnits;

      Object.assign(this.state, {battleUnits, logisticUnits});
    }
  }

  // state and action reducer
  actionReducer(action){
    return unitActionReducer.call(this, this.state, action);
  }

  updatePaths(){
    this._pathToClosestHomeCityFromCamp = this.calculatePathToClosestHomeCityFromCamp();
    this._pathToCamp = this.calculatePathToCamp();
    this._pathToDestination = this.calculatePathToDestination();
    this._closestHomeCity = this.pathToClosestHomeCityFromCamp.slice(-1)[0].city;
  }

  endTurn(){
    if (this.movePoints >= 0){
      this.dispatch(this.actionQueue.shift());

      let {type, cancelCondition, ...args} = this.nextCommand || {};
      this[type]?.(...Object.values(args));
    }

    const state = this.state;
    
    state.movePoints = Math.min(1, this.movePoints + 2);
    this.updatePaths();

    const hungerLevel = this.hungerLevel;

    // calculate death
    const isPandemic = Math.random() <= this.calculatePandemicPossibility();
    const baseCasualtyRate = Math.random() * (
      1 + state.pandemicStage
    ) / 64;

    const battleUnitCasualtyRate = Math.min(
      baseCasualtyRate + Math.random() * (
        Math.max(this.hungerLevel - 1, 0) ** 2 +
        Math.max(state.tirednessLevel / 4 - 1, 0) ** 2
      ) / 16,
      1
    );

    state.pandemicStage = Math.max(0, state.pandemicStage + (isPandemic ? 1 : -1) );
    state.battleUnits -= battleUnitCasualtyRate * state.battleUnits | 0;
    state.logisticUnits -= baseCasualtyRate * state.logisticUnits | 0;

    // consume food
    this._closestHomeCity.storage.food -= this.battleUnits;
    const battleUnitFoodConsumption = Math.min(state.battleUnits, state.foodLoads.battleUnits);
    
    state.totalHunger = Math.min(
      state.battleUnits * (hungerLevel + 1) - battleUnitFoodConsumption,
      5 * state.battleUnits
    );

    if (state.campTile !== this.tile){
      state.foodLoads.battleUnits -= battleUnitFoodConsumption;
      state.foodLoads.camp += battleUnitFoodConsumption;
    } else {
      const maxFoodLoadDiff = Math.min(
        state.battleUnits * 5 - state.foodLoads.battleUnits,
        state.foodLoads.camp
      );

      state.foodLoads.battleUnits += maxFoodLoadDiff;
      state.foodLoads.camp -= maxFoodLoadDiff;
    }
  }

  getValidCampPath(destinationTile){
    this.player.updateAccessibleTiles(this.homeCity);

    return this.tile.aStarSearch(
      destinationTile, 
      tile => 
        this.player.accessibleTiles.has(tile) &&
        (!tile.camp && !(tile.city && tile.city.player !== this.player) ) &&
        
        (!tile.hasUnit || this.tile === destinationTile ) ||
        tile == this.campTile || tile == this.tile
    )
  }

  getValidActionPath(destinationTile){
    return this.tile.aStarSearch(
      destinationTile, 
      tile => 
        (!tile.hasUnit || tile === destinationTile && tile.hasEnemy(this) )
    )
  }

  getFormationWhileMoving(targetTile){
    return [targetTile.x - this.x, targetTile.y - this.y];
  }
} 