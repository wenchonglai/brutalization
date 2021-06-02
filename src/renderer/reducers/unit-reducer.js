import * as UnitActions from "../../actions/unit-actions.js"

export default function unitActionReducer(state, action){
  Object.freeze(state);

  const newState = {...state};

  newState.nextCommand = action.nextCommand;
    
  /* User commands */
  // rest:    add action to action queue; next command is still rest; clear action queue if no food or tireness is 0
  //          cannot rest if camp tile is not current tile
  // guard:   add action to action queue; next command is still guard; clear action queue if no food or enemy is spotted
  // pillage: execute action immediately
  // camp:   cancel if enemy is spotted in the surrounding or destination is reached
  //          else: move to the target tile immediately; next command is still camp until reaching the destination
  // action:    cancel if 1) enemy is spotted in the surrounding; 2) destination is reached; or 3) food is barely enough to go back to camptile and destination tile is not camptile
  //          else: move to the target tile immediately; next command is still camp 

  switch (action.type?.toUpperCase()){
    case UnitActions.REST: {
      newState.movePoints -= 2;
      newState.tirednessLevel = Math.max(0, newState.tirednessLevel - 1);
      return newState;
    };
    case UnitActions.GUARD: {
      newState.movePoints -= 2;
      newState.tirednessLevel -= 0.5;
      newState.experience += Math.random() / 8;
      return {...newState, 
        formation: action.formation
      };
    }
    case UnitActions.CAMP: {
      this.register({tile: action.targetTile});
      
      newState.movePoints -= action.costDistance;
      newState.tirednessLevel += 0.125 * action.costDistance;
      newState.experience += Math.random() * action.costDistance/ 4;

      if (newState.tirednessLevel > 1)
        newState.morality -= 0.125 * action.costDistance * this.overallWearinessLevel;
        this.registerCamp(action.targetTile);

      return {...newState, 
        campTile: action.targetTile,
        formation: action.formation
      };
    }
    case UnitActions.PILLAGE: {
      newState.movePoints -= 2;
      newState.tirednessLevel += 0.125;

      if (action.casualty){
        newState.tirednessLevel += 0.125;
        newState.battleUnits -= action.casualty;
      }
      else newState.morality = Math.min(newState.morality + 1, 0);
      
      newState.foodLoads.battleUnits += action.yield;

      return newState;
    }
    case UnitActions.ACTION: {
      this.register({tile: action.targetTile});

      newState.formation = action.formation;
      newState.foodLoads = action.foodLoads;
      newState.movePoints -= action.costDistance;
      newState.tirednessLevel += 0.25 * action.costDistance;
      newState.morality -= 0.25 * this.overallWearinessLevel;
      newState.experience += Math.random() * action.costDistance / 2;

      if (newState.tirednessLevel > 1)
        newState.morality -= 0.25 * action.costDistance * this.overallWearinessLevel;

      return newState;
    }
    case UnitActions.BATTLE: {
      newState.movePoints -= action.movePoints ?? 2;
      newState.tirednessLevel += 1;
      newState.morality += action.morality;
      newState.battleUnits -= action.casualty;
      newState.experience += Math.random() * 3;

      return newState;
    }
    case UnitActions.ADD_MOVEPOINTS: {
      newState.movePoints = Math.min(1, state.movePoints + 2);
      return newState;
    }
    case UnitActions.RECEIVE_CASUALTIES: {
      const {isPandemic, battleUnitCasualties, logisticUnitCasualties} = action;

      return {...newState,
        pandemicStage: Math.max(0, state.pandemicStage + (isPandemic ? 1 : -1) ),
        battleUnits: state.battleUnits - battleUnitCasualties,
        logisticUnits: state.logisticUnits - logisticUnitCasualties
      }
    }
    case UnitActions.RECEIVE_FOOD_CHANGE: {
      return {...newState, ...action.data}
    }
    default: {
      return newState;
    }
  }
}