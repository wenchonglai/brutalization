import approximate from "../util/approximate.js";
import MetaGameObject from "../meta-game-object.js";
import { Camp } from "../tiles/settlement.js";

export class Unit extends MetaGameObject{
  constructor({player, tile, homeTile = tile, campTile = tile, population = 0, experience = 0, formation = [0, 0]} = {}){
    super({player, tile, state: {
      battleUnits: population,
      logisticUnits: 0 ,
      experience,
      campTile: campTile,
      tirednessLevel: 0, 
      totalHunger: 0, 
      totalFoodLoad: population * 5, 
      morality: 0, pandemicStage: 0,
      formation,
      movePoints: 0,
      pathToClosestHomeCity: []
    }});
    
    this._originalState = Object.freeze({
      tile, population
    });

    this._homeTile = homeTile;
    this._campTile = campTile;

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
    MetaGameObject.prototype.dispatch.call(this, action, this.balanceUnits.bind(this));
  }
  
  get originalState(){ return this._originalState; }
  get homeTile(){ return this._homeTile; }
  get campTile(){ return this.state.campTile; }
  get battleUnits(){ return this.state.battleUnits; }
  get logisticUnits(){ return this.state.logisticUnits; }
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
        "logistic units": this.logisticUnits,
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
        camp: moveable && (() => {
          this.game.changeMapInteraction('camp', {
            gameObject: this, 
            command: (...args) => this.camp.call(this, ...args)
          });

          return {skipResolve: true};
        }),
        raid: moveable && (() => {
          this.game.changeMapInteraction('raid', {
            gameObject: this, 
            command: (...args) => this.raid.call(this, ...args)
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

  calculatePathToClosestHomeCity(targetTile = this.tile){
    return targetTile.bfs(
      tile => tile.city, //&& tile.city.totalFoodStorage > 0,
      tile => !tile.hasEnemy(this)
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
      let costDistance = this.campTile.costDistanceTo(
        this.homeTile,
        tile => !tile.hasEnemy(this)
      );

      const population = this.population;
      const battleUnits = population * (15 - costDistance) / 15 | 0;
      const logisticUnits = population - battleUnits;

      Object.assign(this.state, {battleUnits, logisticUnits});
    }
  }

  // state and action reducer
  actionReducer(action){
    Object.freeze(this.state);

    const newState = {...this.state};
    const foodConsumption = Math.min(newState.battleUnits, newState.totalFoodLoad);
    const isPandemic = Math.random() <= this.calculatePandemicPossibility();

    newState.totalHunger += newState.battleUnits - foodConsumption;
    newState.totalFoodLoad -= foodConsumption;
    newState.pandemicStage = Math.max(0, newState.pandemicStage + (isPandemic ? 1 : -1) );
    newState.battleUnits -= Math.random() * newState.battleUnits * (
      Math.min(newState.hungerLevel - 1, 0) + 
      Math.min(newState.tirednessLevel / 2 - 1, 0) + 
      newState.pandemicStage
    ) / 25 | 0;
    newState.nextCommand = action.nextCommand;

    switch (action.type){
      case 'rest': {
        newState.movePoints -= 2;
        newState.tirednessLevel -= 1;
        return newState;
      };
      case 'guard': {
        newState.movePoints -= 2;
        newState.tirednessLevel -= 0.5;
        newState.experience += Math.random() / 8;
        return {...newState, formation: action.formation};
      }
      case 'camp': {
        this.register({tile: action.targetTile});
        
        newState.movePoints -= action.costDistance;
        newState.tirednessLevel += 0.125 * action.costDistance;
        newState.experience += Math.random() * action.costDistance/ 4;

        if (newState.tirednessLevel > 1)
          newState.morality -= 0.125 * action.costDistance * this.overallWearinessLevel;
          this.registerCamp(action.targetTile);

          return {
          ...newState, 
          campTile: action.targetTile,
          formation: action.formation
        };
      }
      case 'pillage': {
        newState.movePoints -= 2;
        newState.tirednessLevel += 0.125;

        if (action.casualty){
          newState.tirednessLevel += 0.125;
          newState.battleUnits -= action.casualty;
        }
        else newState.morality = Math.min(newState.morality + 1, 0);
        
        newState.totalFoodLoad += action.yield;

        return newState;
      }
      case 'raid': {
        this.register({tile: action.targetTile});

        newState.movePoints -= action.costDistance;
        newState.tirednessLevel += 0.25 * action.costDistance;
        newState.morality -= 0.25 * this.overallWearinessLevel;
        newState.experience += Math.random() * action.costDistance / 2;

        if (newState.tirednessLevel > 1)
          newState.morality -= 0.25 * action.costDistance * this.overallWearinessLevel;

        return newState;
      }
      case 'battle': {
        newState.movePoints -= action.movePoints ?? 2;
        newState.tirednessLevel += 1;
        newState.morality += action.morality;
        newState.battleUnits -= action.casualty;
        newState.experience += Math.random() * 3;
        newState.battleUnits -= action.casualty;
        return newState;
      }
      default: {
        return newState;
      }
    }
  }

  endTurn(){
    if (this.movePoints >= 0){
      this.dispatch(this.actionQueue.shift());

      let {type, cancelCondition, ...args} = this.nextCommand || {};
      this[type]?.(...Object.values(args));
    }
    
    this.state.movePoints = Math.min(1, this.movePoints + 2);
  }

  /* User commands */
  // rest:    add action to action queue; next command is still rest; clear action queue if no food or tireness is 0
  //          cannot rest if camp tile is not current tile
  // guard:   add action to action queue; next command is still guard; clear action queue if no food or enemy is spotted
  // pillage: execute action immediately
  // camp:   cancel if enemy is spotted in the surrounding or destination is reached
  //          else: move to the target tile immediately; next command is still camp until reaching the destination
  // raid:    cancel if 1) enemy is spotted in the surrounding; 2) destination is reached; or 3) food is barely enough to go back to camptile and destination tile is not camptile
  //          else: move to the target tile immediately; next command is still camp 

  rest(){ 
    this.saveAction({
      type: 'rest',
      nextCommand: {type: 'rest'}
    });
  }

  guard(formation){
    this.saveAction({
      type: 'guard', formation,
      nextCommand: {type: 'guard', formation}
    });
  }

  getValidCampPath(destinationTile){
    this.player.updateAccessibleTiles();

    return this.tile.aStarSearch(
      destinationTile, 
      tile => 
        this.player.accessibleTiles.has(tile) &&
        (!tile.hasUnit || this.tile === destinationTile )
    )
  }

  getValidRaidPath(destinationTile){
    return this.tile.aStarSearch(
      destinationTile, 
      tile => 
        (!tile.hasUnit || tile === destinationTile && tile.hasEnemy(this) )
    )
  }

  camp(destinationTile, formation, path){

    const pathToClosestHomeCity = this.calculatePathToClosestHomeCity;

    if (destinationTile === this.tile) {
      this.dispatch({ type: 'camp', 
        targetTile: destinationTile,
        costDistance: 1,
        pathToClosestHomeCity: pathToClosestHomeCity,
        formation: formation,
      });

      return;
    };

    path ||= this.tile.aStarSearch(destinationTile, tile => !tile.hasUnit);

    if (!path) return;

    const targetTile = path[1];

    if (!targetTile.hasUnit){
      let costDistance = this.tile.getEuclideanCostDistance(targetTile);

      this.dispatch({ type: 'camp', targetTile,
        costDistance,
        pathToClosestHomeCity: pathToClosestHomeCity,
        formation: targetTile === destinationTile ? 
          formation :
          this.getNaturalFormation(targetTile),
        nextCommand: { type: 'camp', destinationTile, formation }
      });
    }
  }
  
  pillage(){
    const {playerId} = this;
    const self = this;

    this.tile.rangeAssign(2, function(distance){
      if (this.playerId !== playerId){
        let attitude = this.attitudes[playerId] || 0;
        this.attitudes[playerId] = attitude - (3 - distance) * self.battleUnits / 65536;
      }
    });

    const isAttacked = Math.random() <= -this.tile.attitudes[playerId]
    const casualty = isAttacked ? Math.random() * 100 | 0 : 0;

    this.dispatch({
      type: 'pillage', 
      casualty,
      yield: 0
    });
  }

  raid(destinationTile, formation, path){
    if (destinationTile === this.tile) return;

    path ||= this.tile.aStarSearch(
      destinationTile,
      tile => !tile.hasUnit ||
        tile === destinationTile && tile.hasEnemy(this)
    );
    
    if (!path) return;

    const targetTile = path[1];

    if (!targetTile) return;

    let enemy = targetTile.getEnemy(this);

    if (targetTile === destinationTile && enemy){
      const formationBonus = 
        this.calculateFormationBonus(enemy, formation, targetTile);
      const militaryMight1 = 
        this.calculateMilitaryMight() * 
        (1 + Math.min(formationBonus, 0)) * 
        ( Math.random() * 1 + 1 ) / 1.5;
      const militaryMight2 = 
        enemy.calculateMilitaryMight() * 
        (1 + Math.max(-formationBonus, 0)) *
        ( Math.random() * 1 + 1 ) / 1.5;
      const tolerableCasualty1 = 
        this.calculateTolerableCasualtyRate() * this.battleUnits * ((Math.random() + 2) / 2.5);
      const tolerableCasualty2 = 
        enemy.calculateTolerableCasualtyRate() * enemy.battleUnits * ((Math.random() + 2) / 2.5);

      let casualty1, casualty2, moralityDelta = 1;

      if (tolerableCasualty1 / militaryMight2 > tolerableCasualty2 / militaryMight1 ){
        casualty1 = tolerableCasualty1 | 0;
        casualty2 = tolerableCasualty1 * militaryMight1 / militaryMight2 | 0;
        
      } else {
        casualty2 = tolerableCasualty2 | 0;
        casualty1 = tolerableCasualty2 * militaryMight2 / militaryMight1 | 0;
        moralityDelta = -1;
      }

      moralityDelta *= 3 * Math.abs(casualty1 - casualty2) / (casualty1 + casualty2);

      this.dispatch({type: 'battle', casualty: casualty1, morality: moralityDelta - 0.25});
      enemy.dispatch({type: 'battle', movePoints: 0, casualty: casualty2, morality: -moralityDelta - 0.25});
    } else {
      let costDistance = this.tile.getEuclideanCostDistance(targetTile);

      this.dispatch({ type: 'raid',
        targetTile,
        costDistance,
        formation: formation,
        pathToClosestHomeCity: this.calculatePathToClosestHomeCity(),
        nextCommand: { type: 'raid', destinationTile, formation }
      });
    }
  }

  getFormationWhileMoving(targetTile){
    return [targetTile.x - this.x, targetTile.y - this.y];
  }
} 

// [ 
//   [ 0, 0, 0, 0 ],
//   [ 0, 0, 0, 1 ],
//   [ 0, 1, 0, 0 ],
//   [ 0, 1, 1, 0 ],
//   [ 0, 1, 2, 0 ],
//   [ 0, 1, 4, 0 ],
//   [ 0, 1, 0, 1 ],
//   [ 0, 1, 1, 1 ],
//   [ 0, 1, 2, 1 ],
//   [ 0, 1, 4, 1 ],
//   [ 1, 0, 0, 0 ],
//   [ 1, 0, 0, 1 ],
//   [ 1, 1, 0, 0 ],
//   [ 1, 1, 1, 0 ],
//   [ 1, 1, 2, 0 ],
//   [ 1, 1, 4, 0 ],
//   [ 1, 1, 0, 1 ],
//   [ 1, 1, 1, 1 ],
//   [ 1, 1, 2, 1 ],
//   [ 1, 1, 4, 1 ],
// ].map(([start, end, direction, enemy]) => {
//   console.log(`${start ? '横队' : '方阵'}${start !== end ? `变阵${end ? '横队' : '方阵'}` : ''}${['正面', '斜向', '迂回侧翼', '背角包抄', '背后包抄'][direction]}冲击敌${enemy ? '横队' : '方阵'}`);
  
//   const directions = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]];

//   for (let i = 4; i >= (enemy ? 0 : 4); i--){

    

//     for (let j = 0; j <= 0; j++){
//       let s = start === 0 ? [0, 0] : directions[0 + j];
//       let t = directions[0 + j];
//       let e = end === 0 ? [0, 0] : directions[(0 + j + direction) % 8];
//       let x = enemy === 0 ? [0, 0] : directions[(0 + i + j) % 8];

//       // console.log(
//       //   `-`, ['敌暴露后方', '敌暴露侧后', '敌暴露侧翼', '敌暴露侧前', '正面迎敌'][i],
//       //   Unit.prototype._calculateFormationBonus(s, t, e, x).toFixed(1), s,t,e,x
//       // );
//     }
//   }
// })

