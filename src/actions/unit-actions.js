export function rest(){ 
  this.saveAction({
    type: 'rest',
    nextCommand: {type: 'rest'}
  });
}

export function guard(formation){
  this.saveAction({
    type: 'guard', formation,
    nextCommand: {type: 'guard', formation}
  });
}

export function camp(destinationTile, formation, path){
  const pathToClosestHomeCity = this.calculatePathToClosestHomeCity();

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

export function pillage(){
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

export function action(destinationTile, formation, path){
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

    this.dispatch({ type: 'action',
      targetTile,
      costDistance,
      formation: formation,
      pathToClosestHomeCity: this.calculatePathToClosestHomeCity(),
      nextCommand: { type: 'action', destinationTile, formation }
    });
  }
}