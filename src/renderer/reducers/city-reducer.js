import * as CityActions from "../../actions/city-actions.js"

export default function cityActionReducer(state, action){
  Object.freeze(state);

  const newState = {...state};

  newState.nextCommand = action.nextCommand;

  /* City commands */
  // settle:  settle into another location
  // draft:   draft a group of soldiers
  // train:   execute action immediately
  
  switch (action.type){
    // case 'settle': {
    //   newState.movePoints -= 2;
    //   newState.tirednessLevel -= 1;
    //   return newState;
    // };
    case CityActions.DRAFT: {
      const drafted = action.drafted;
      newState.populations.military += drafted;
      newState.populations.civilian -= drafted;
      return newState;
    }
    case CityActions.TRAIN: {
      newState.movePoints -= 2;
      newState.trainLevel = state.trainLevel + 1;
      return newState;
    };
    case CityActions.RECEIVE_CASUALTY: {
      newState.populations.military -= action.casualty;
    }
    default: {
      return newState;
    }
  }
}