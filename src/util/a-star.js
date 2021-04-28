export default function aStarSearch(destinationTile, pathFunc, {maxCostDistance = 1024} = {}){
  const queue = [this];
  const costDistanceMap = new Map([[this, 0]]);
  const parentMap = new Map();
  const heuristicMap = new Map([[this, this.getCostDistance(destinationTile)]]);

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

    for (let adjacentTile of tile.getAdjacentTiles())
      if (pathFunc(adjacentTile)){
        let deltaCostDistance = adjacentTile.getCostDistance(tile);

        if ( costDistanceMap.get(adjacentTile) === undefined || 
          costDistanceToTile + deltaCostDistance < Math.min(maxCostDistance, costDistanceMap.get(adjacentTile) )
        ){
          costDistanceMap.set(adjacentTile, costDistanceToTile + deltaCostDistance);
          parentMap.set(adjacentTile, tile);
          heuristicMap.set(adjacentTile, adjacentTile.getCostDistance(destinationTile));
          queue.push(adjacentTile)
        }
      }

    queue.sort((a, b) => 
      costDistanceMap.get(a) + heuristicMap.get(a) - 
      costDistanceMap.get(b) - heuristicMap.get(b)
    );
  }
}