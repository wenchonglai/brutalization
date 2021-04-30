import Tile from "../../tiles/tile.js";
import {screenToMap, screenToGrid} from "../../util/coordinate-converter.js";

let path;

function handleMouseMoveCreator(mode){
  return function handleMouseMove(e){
    if (!this.dragMode){
      let {x, y} = screenToMap(e, {
        translateX: this._transformAttributes?.x || 0,
        translateY: this._transformAttributes?.y || 0,
        zoom: this._transformAttributes?.zoom || 1
      });

      x = x | 0; y = y | 0;

      if (
        x !== this.highlightedGridXY.x || 
        y !== this.highlightedGridXY.y
      ) {
        this._highlightedGridXY = {x, y};

        const gameObject = this.gameObject;
        const thisTile = Tile.getTile({x, y});

        path = gameObject.tile.aStarSearch(
          thisTile, 
          tile => !tile.hasUnit ||
            mode === 'march' && gameObject.tile === thisTile ||
            mode !== 'march' && tile === thisTile && tile.hasEnemy(gameObject)
        );

        if (Tile.getPathCostDistance(path) > 14) path = undefined;

        if (path && mode !== 'march') 
          mode = path[path.length - 1].hasUnit ? 'attack' : 'raid';

        if ((path?.length || 0) >= 2){
          let [p1, p2] = path.slice(-2);

          this.mapSVG.setFormation(p2.x - p1.x, p2.y - p1.y);
        }

        this.mapSVG.updatePathfinder({x, y}, path, mode);
      }
    } else {
      const {x, y} = screenToMap(e, {
        translateX: this._transformAttributes?.x || 0,
        translateY: this._transformAttributes?.y || 0,
        zoom: this._transformAttributes?.zoom || 1
      });
      
      const dx = x - this.highlightedGridXY.x - 0.5;
      const dy = y - this.highlightedGridXY.y - 0.5;
      let fx = 0;
      let fy = 0;

      if ((path?.length || 0) >= 2){
        let [p1, p2] = path.slice(-2);

        fx = p2.x - p1.x;
        fy = p2.y - p1.y;
      }
      
      if (dx ** 2 + dy ** 2 >= 0.16){
        const absAtan = Math.abs(Math.atan2(dx, dy)) * 8/ Math.PI;
        fx = dx / Math.abs(dx);
        fy = dy / Math.abs(dy);
    
        if (absAtan < 1 || absAtan > 7) fx = 0;
        if (absAtan > 3 && absAtan < 5) fy = 0;
      }

      this.mapSVG.setFormation(fx, fy);

      return {
        destinationTile: Tile.getTile(this.highlightedGridXY), 
        formation: [fx, fy], 
        path
      }
    }
  }
}

function handleMouseUpCreator(mode){
  return function handleMouseUp(e){
    const dragResult = handleMouseMoveCreator(mode).call(this, e);

    path = undefined;

    if (dragResult?.path){
      this.command(dragResult.destinationTile, dragResult.formation, dragResult.path);
      this.game.ui.handleResolve();
      this.mapSVG.resetPathFinder();
      this.changeMapInteraction("", {});
    }
    this._dragMode = false;
  }
}

function handleMouseLeave(e){
  path = undefined;
  this._dragMode = false;
}

export const marchEventListeners = {
  'mousemove': handleMouseMoveCreator('march'),
  'mouseup': handleMouseUpCreator('march'),
  'mouseleave': handleMouseLeave,
};

export const raidEventListeners = {
  'mousemove': handleMouseMoveCreator('raid'),
  'mouseup': handleMouseUpCreator('raid'),
  'mouseleave': handleMouseLeave,
}