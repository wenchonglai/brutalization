import Tile from "../tiles/tile.js";
import {City} from "../tiles/settlement.js";
import approximate from "../util/approximate.js";

export class Unit{
  constructor({player, tile, population = 0, experience = 0, formation = [0, 0]} = {}){

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
      totalHunger: 0, totalFoodLoad: population * 5, 
      morality: 0, pandemicStage: 0,
      formation,
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
  get game(){ return this.player.game; }
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
  get movePoints(){ return this.state.movePoints; }
  get nextCommand(){ return this.state.nextCommand; }
  get moveable(){ return this.movePoints >= 0; }
  get tasked(){ return !this.moveable || this.actionQueue.length > 0; }
  get overallWearinessLevel(){
    return 1 + Math.max(0, this.tiredNessLevel - 1) + Math.max(0, this.hungerLevel - 1) + Math.max(0, this.pandemicStage - 1) ** 0.5 / 4;
  }
  get staminaLevel(){ return 1 / this.overallWearinessLevel; }
  get formation(){ return this.state.formation; }
  
  // user interaction
  toUserInterface(){
    const moveable = this.movePoints >= 0;

    return {
      information: {
        population: approximate(this.population, {scales: [1]}),
        experience: approximate(this.experience),
        hunger: approximate(this.hungerLevel),
        stamina: approximate(this.staminaLevel, {isPercentage: true}),
        morality: approximate(this.morality),
        pandemic: approximate(this.pandemicStage),
        formation: this.formation
      },
      commands: {
        rest: moveable && this.rest.bind(this),
        guard: moveable && this.guard.bind(this),
        march: moveable && (() => {
          this.game.changeMapInteraction('march', {
            gameObject: this, 
            command: (...args) => this.march.call(this, ...args)
          });
        }),
        raid: moveable && (() => {
          this.game.changeMapInteraction('raid', {
            gameObject: this, 
            command: (...args) => this.raid.call(this, ...args)
          });
        }),
        pillage: moveable && this.pillage.bind(this),
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

  calculatePathToClosestHomeCity(){
    return this.tile.bfs(
      tile => tile.city && tile.city.totalFoodStorage > 0,
      tile => 
        !tile.hasUnit && 
        tile.playerId === this.playerId
    );
  }
  calculateMoralityBonus(){
    return Math.min(1.25 ** (this.morality * 0.8), 1.25);
  }
  calculateMilitaryMight(){
    return (this.population ** 0.5) * 
      this.staminaLevel * 
      this.calculateMoralityBonus() * 
      ((1 + this.experience) ** 0.5);
  }
  calculateTolerableCasualtyRate(){
    return ((1 + this.experience) ** 0.5) * this.calculateMoralityBonus() / 64;
  }
  _calculatechargeTime(formation1, formation2, attackMode = false){
    const isDenselyFormed1 = formation1.every(el => el === 0);
    const isDenselyFormed2 = formation2.every(el => el === 0);
    
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
    const isDenselyFormed = newFormation.every(el => el === 0);
    const enemyIsDenselyFormed = enemyFormation.every(el => el === 0);
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

  // state and action reducer
  actionReducer(action){
    Object.freeze(this.state);
    const newState = {...this.state};
    const foodConsumption = Math.min(newState.population, newState.totalFoodLoad);
    const isPandemic = Math.random() <= this.calculatePandemicPossibility();

    newState.totalHunger += newState.population - foodConsumption;
    newState.totalFoodLoad -= foodConsumption;
    newState.pandemicStage = Math.max(0, newState.pandemicStage + (isPandemic ? 1 : -1) );
    newState.population -= Math.random() * newState.population * (
      Math.min(newState.hungerLevel - 1, 0) + 
      Math.min(newState.tiredNessLevel / 2 - 1, 0) + 
      newState.pandemicStage
    ) / 25 | 0;
    newState.nextCommand = action.nextCommand;

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
        this.register({tile: action.targetTile});
        
        newState.movePoints -= action.costDistance;
        newState.tiredNessLevel += 0.125 * action.costDistance;
        newState.experience += Math.random() * action.costDistance/ 4;

        if (newState.tiredNessLevel > 1)
          newState.morality -= 0.125 * action.costDistance * this.overallWearinessLevel;

        return {
          ...newState, 
          campTile: action.targetTile,
          formation: action.formation
        };
      }
      case 'pillage': {
        newState.movePoints -= 2;
        newState.tiredNessLevel += 0.125;

        if (action.casualty){
          newState.tiredNessLevel += 0.125;
          newState.population -= action.casualty;
        }
        else newState.morality = Math.min(newState.morality + 1, 0);
        
        newState.totalFoodLoad += action.yield;

        return newState;
      }
      case 'raid': {
        this.register({tile: action.targetTile});

        newState.movePoints -= action.costDistance;
        newState.tiredNessLevel += 0.25 * action.costDistance;
        newState.morality -= 0.25 * this.overallWearinessLevel;
        newState.experience += Math.random() * action.costDistance / 2;

        if (newState.tiredNessLevel > 1)
          newState.morality -= 0.25 * action.costDistance * this.overallWearinessLevel;

        return newState;
      }
      case 'battle': {
        newState.movePoints -= action.movePoints ?? 2;
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

  saveAction(action){ 
    if (action)
      this._actionQueue[0] = action;
  }
  dispatch(action){
    if (!action) return;

    this.state = this.actionReducer(action);
    this.player.update(this);
  }
  endTurn(){
    if (this.state.movePoints >= 0){
      this.dispatch(this.actionQueue.shift());
    }
    
    let {type, cancelCondition, ...args} = this.nextCommand || {};
    this[type]?.(...Object.values(args));

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

  march(destinationTile, formation, path){
    if (destinationTile === this.tile) {
      this.dispatch({ type: 'march', 
        targetTile: destinationTile,
        costDistance: 1,
        pathToClosestHomeCity: this.calculatePathToClosestHomeCity(),
        formation: formation,
      });

      return;
    };

    path ||= this.tile.aStarSearch(destinationTile, tile => !tile.hasUnit);

    if (!path) return;

    const targetTile = path[1];

    if (targetTile.hasUnit){
      
    } else {
      let costDistance = this.tile.getCostDistance(targetTile);

      this.dispatch({ type: 'march', targetTile,
        costDistance,
        pathToClosestHomeCity: this.calculatePathToClosestHomeCity(),
        formation: targetTile !== destinationTile ? [undefined, undefined] : formation,
        nextCommand: { type: 'march', destinationTile, formation }
      });
    }
  }
  
  pillage(){
    const {playerId} = this;
    const self = this;

    this.tile.rangeAssign(2, function(distance){
      if (this.playerId !== playerId){
        let attitude = this.attitudes[playerId] || 0;
        this.attitudes[playerId] = attitude - (3 - distance) * self.population / 65536;
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

    const targetTile = path[1];

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
        this.calculateTolerableCasualtyRate() * this.population * ((Math.random() + 2) / 2.5);
      const tolerableCasualty2 = 
        enemy.calculateTolerableCasualtyRate() * enemy.population * ((Math.random() + 2) / 2.5);

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
      let costDistance = this.tile.getCostDistance(targetTile);

      this.dispatch({ type: 'raid',
        targetTile,
        costDistance,
        formation: targetTile !== destinationTile ? [undefined, undefined] : formation,
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

