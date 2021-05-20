import Tile from "../../tiles/tile.js";
import {screenToGrid, screenToMap} from "../../util/coordinate-converter.js";
import {defaultDragStart, defaultDrag, defaultDragEnd} from "./default.js"

let path;

function handleMouseDown(e){
  defaultDragStart.call(this, e);
}

function handleMouseMoveCreator(mode){
  return function handleMouseMove(e){
    if (!this.dragMode){
      let {x, y} = screenToGrid(e, {
        translateX: this._transformAttributes?.x || 0,
        translateY: this._transformAttributes?.y || 0,
        zoom: this._transformAttributes?.zoom || 1
      });

      if (
        x !== this.highlightedGridXY.x || 
        y !== this.highlightedGridXY.y
      ) {
        this._highlightedGridXY = {x, y};

        const gameObject = this.gameObject;
        const targetTile = Tile.getTile({x, y});
        
        path = mode === 'camp' ? 
            gameObject.getValidCampPath(targetTile) :
            gameObject.getValidRaidPath(targetTile)

        if (path && mode !== 'camp') 
          mode = path[path.length - 1].hasUnit ? 'attack' : 'raid';

        if ((path?.length || 0) >= 2){
          let [p1, p2] = path.slice(-2);

          this.mapSVG.setFormation(p2.x - p1.x, p2.y - p1.y);
        }

        this.mapSVG.updatePathfinder({x, y}, path, mode);
      }
      return;
    } 

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
    
    if (e.metaKey){

      if (dx ** 2 + dy ** 2 >= 0.16){
        const absAtan = Math.abs(Math.atan2(dx, dy)) * 8 / Math.PI;
        fx = dx / Math.abs(dx);
        fy = dy / Math.abs(dy);
        if (absAtan < 1 || absAtan > 7) fx = 0;
        if (absAtan > 3 && absAtan < 5) fy = 0;
      }
      console.log(fx, fy)
      this.mapSVG.setFormation(fx, fy);
    } else {
      defaultDrag.call(this, e);
    }

    return {
      destinationTile: Tile.getTile(this.highlightedGridXY), 
      formation: [fx, fy], 
      path
    }
  }
}

function handleMouseUpCreator(mode){
  return function handleMouseUp(e){
    const dragResult = handleMouseMoveCreator(mode).call(this, e);
    let path = dragResult?.path;
    const dx = e.x - this._dragStartXY.x;
    const dy = e.y - this._dragStartXY.y;
    const moved = dx ** 2 + dy ** 2 >= 10;

    if (path && (e.metaKey || !moved)){
      this.command(dragResult.destinationTile, dragResult.formation, dragResult.path);
      this.game.ui.handleResolve();
      this.mapSVG.resetPathFinder();
      this.changeMapInteraction("", {});

      path = undefined;
    }
    
    defaultDragEnd.call(this, e);
  }
}

function handleMouseLeave(e){
  path = undefined;
  defaultDragEnd.call(this, e);
}

export const campEventListeners = {
  'mousemove': handleMouseMoveCreator('camp'),
  'mousedown':  handleMouseDown,
  'mouseup': handleMouseUpCreator('camp'),
  'mouseleave': handleMouseLeave,
};

export const raidEventListeners = {
  'mousemove': handleMouseMoveCreator('raid'),
  'mousedown':  handleMouseDown,
  'mouseup': handleMouseUpCreator('raid'),
  'mouseleave': handleMouseLeave,
}