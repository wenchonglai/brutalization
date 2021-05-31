import {City} from "../tiles/city.js"
import { Unit } from "../units/unit.js";

export const DRAFT = 'DRAFT';
export const TRAIN = 'TRAIN';

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

  if (this.tile.units.size > 0){
    for (let unit of this.tile.units){
      if (unit instanceof Unit){
        unit.state.battleUnits += actualUnitsDrafted;
        unit.state.foodLoads.camp += actualUnitsDrafted * 5;
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