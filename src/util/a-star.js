export default function aStarSearch(destinationTile, pathFunc, {maxCostDistance = 1024} = {}){
  if (this === destinationTile && !pathFunc(this)) return;
  
  const queue = [this];
  const costDistanceMap = new Map([[this, 0]]);
  const parentMap = new Map();
  const heuristicMap = new Map([[this, this.getEuclideanCostDistance(destinationTile)]]);

  while (queue.length){
    let tile = queue.shift();
    const costDistanceToTile = costDistanceMap.get(tile);

    if (tile === destinationTile){
      let tile = destinationTile;
      let path = [];

      while (tile){
        path.push(tile);
        tile = parentMap.get(tile);
      }

      return path.reverse();
    }

    if ( costDistanceToTile >= maxCostDistance) continue;
    
    for (let adjacentTile of tile.getAdjacentTiles()){
      let deltaCostDistance = adjacentTile.getEuclideanCostDistance(tile);

      if (pathFunc(adjacentTile, costDistanceToTile)){
        let totalHeuristicDistance = costDistanceToTile + deltaCostDistance;
        let adjacentMapPrevCostDistance = costDistanceMap.get(adjacentTile);

        if ( adjacentMapPrevCostDistance === undefined || 
          totalHeuristicDistance < Math.min(
            maxCostDistance, 
            adjacentMapPrevCostDistance ?? maxCostDistance 
          )
        ){
          costDistanceMap.set(adjacentTile, totalHeuristicDistance);
          parentMap.set(adjacentTile, tile);
          heuristicMap.set(adjacentTile, adjacentTile.getEuclideanCostDistance(destinationTile));
          queue.push(adjacentTile);
        }
      }
    }

    queue.sort((a, b) => 
      costDistanceMap.get(a) + heuristicMap.get(a) - 
      costDistanceMap.get(b) - heuristicMap.get(b)
    );
  }
}