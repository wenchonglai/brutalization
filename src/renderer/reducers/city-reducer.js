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
    case 'draft': {
      newState.populations.drafted = action.drafted;
      return newState;
    }
    case 'train': {
      newState.movePoints -= 2;
      newState.trainLevel = state.trainLevel + 1;
      return newState;
    };
    default: {
      return newState;
    }
  }
}