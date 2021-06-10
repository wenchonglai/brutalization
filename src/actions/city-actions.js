import {City} from "../tiles/city.js"
import {Unit} from "../units/unit.js";

export const DRAFT = 'DRAFT';
export const TRAIN = 'TRAIN';
export const FALL = 'FALL';
export const RECEIVE_MILITARY_CHANGE = 'RECEIVE_MILITARY_CHANGE';
export const RECEIVE_CIVILIAN_CHANGE = 'RECEIVE_CIVILIAN_CHANGE';

export function draft(){ 
  const tiles = [...this.tiles, this].sort((a, b) => a.draftLevel - b.draftLevel);
  const N = tiles.length;
  
  let unitsToBeDrafted = [];
  let l = 0, r = N - 1;
  let totalUnitsToBeDrafted = 2500;
  let actualUnitsDrafted = 0;
  let m, sum;

  while (l < r){
    sum = 0;
    m = l + r >> 1;
    unitsToBeDrafted = [];
    totalUnitsToBeDrafted = 2500;

    for (let i = 0; i < m; i++){
      let delta = (tiles[m].draftLevel - tiles[i].draftLevel) * tiles[i].population;

      sum += delta;
      unitsToBeDrafted[i] = delta;
      totalUnitsToBeDrafted -= delta;
    }
    
    if (sum === totalUnitsToBeDrafted)
      break;
    else if (sum > totalUnitsToBeDrafted)
      r = m
    else
      l = m + 1
  }

  const totalPopulations = tiles.reduce((acc, t) => acc + t.population, 0);

  for (let i = 0; i <= l; i++){
    const delta = Math.round(
      ( tiles[l].draftLevel - tiles[i].draftLevel + 
        totalUnitsToBeDrafted / totalPopulations
      ) * tiles[i].population | 0
    );
    const self = tiles[i];
    const toBeDrafted = Math.max(
      Math.min( self.civilianPopulation, delta ), 0
    );

    actualUnitsDrafted += delta;

    if (self === this)
      self.dispatch({ type: DRAFT, drafted: toBeDrafted });
    else {
      self.populations.civilian -= toBeDrafted;
      self.populations.military += toBeDrafted;
    }
  }

  this.player.update(this);

  if (this.tile.units.size > 0){
    for (let unit of this.tile.units){
      if (unit instanceof Unit){
        unit.state.battleUnits += actualUnitsDrafted;
        unit.state.foodLoads.camp += actualUnitsDrafted * 5;
        unit.state.startingTotalUnits = Math.max(unit.state.startingTotalUnits, unit.totalUnits + actualUnitsDrafted);
        unit.player.update(unit);
        break;
      }
    }
  } else {
    const unit = new Unit({
      player: this.player,
      tile: this.tile,
      homeTile: this.tile,
      population: actualUnitsDrafted,
      formation: [0, 0]
    });

    unit.player.update(unit);
  }
}

export function receiveCivilianChange(amount){
  if (amount === 0) return;

  const tiles = [...this.tiles, this].sort((a, b) => a.draftLevel - b.draftLevel);
  const N = tiles.length;
  const totalCivilian = tiles.reduce((acc, el) => acc + el.civilianPopulation, 0);
  const sign = amount > 0 ? 1 : -1;
  const deltas = {};
  let abs = Math.min(
    Math.abs(amount), sign < 0 ? totalCivilian : Number.POSITIVE_INFINITY
  );

  while (abs > 0){
    for (let i in tiles){
      const tile = tiles[i];
      let delta = sign * Math.min(
        Math.max(1, 
          (abs * tile.civilianPopulation / totalCivilian | 0)
        ),
        sign < 0 ? tile.civilianPopulation : Number.POSITIVE_INFINITY,
        abs
      );
        
      deltas[i] = (deltas[i] ?? 0) + delta;
      abs -= delta * sign;

      if (abs <= 0) break;
    }
  }

  for (let i in tiles){
    const tile = tiles[i];

    if (tile === this)
      tile.dispatch({ type: RECEIVE_CIVILIAN_CHANGE, amount: deltas[i] ?? 0 });
    else 
      tile.populations.civilian += deltas[i] ?? 0;
  }
}

export function receiveMilitaryChange(amount){
  if (amount === 0) return;

  const tiles = [...this.tiles, this].sort((a, b) => a.draftLevel - b.draftLevel);
  const N = tiles.length;
  const totalMilitary = tiles.reduce((acc, el) => acc + el.militaryPopulation, 0);
  const sign = amount > 0 ? 1 : -1;
  const deltas = {};
  let abs = Math.min(
    Math.abs(amount), sign < 0 ? totalMilitary : Number.POSITIVE_INFINITY
  );

  while (abs > 0){
    for (let i in tiles){
      const tile = tiles[i];
      let delta = sign * Math.min(
        Math.max(1, 
          (abs * tile.militaryPopulation / totalMilitary | 0)
        ),
        sign < 0 ? (tile.militaryPopulation + (deltas[i] ?? 0)) : Number.POSITIVE_INFINITY,
        abs
      );

      deltas[i] = (deltas[i] ?? 0) + delta;
      abs -= delta * sign

      if (abs <= 0) break;
    }
  }
  for (let i in tiles){
    const tile = tiles[i];
    
    if (tile === this)
      tile.dispatch({ type: RECEIVE_MILITARY_CHANGE, amount: deltas[i] ?? 0 });
    else 
      tile.populations.military += deltas[i] ?? 0;
  }
}

export const fall = function(player){
  const units = [...this.units];

  this.register({player, tile: this.tile});
  this.dispatch({
    type: FALL,
    playerId: player.id
  });


  for (let unit of units){
    unit.updatePaths();
    unit._homecity = unit.closestHomeCity ?? [...unit.players.cities][0];
    
    if (!unit.homecity)
      unit.destruct();
  }

}
// draft(level){
//     totalDraftedPopulation = 0;

//     for (let tile of this.tiles){
//       let {rural, drafted} = tile.populations;
//       let maxDraftablePopulation = (rural + urban) * level / 6 | 1;

//       if (drafted < maxDraftablePopulation)
//         totalDraftedPopulation += maxDraftablePopulation - drafted;

//       drafted = maxDraftablePopulation;
//     }
//   }