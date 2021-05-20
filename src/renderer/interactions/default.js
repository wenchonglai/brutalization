import {screenToGrid} from "../../util/coordinate-converter.js";
import {MIN_ZOOM, MAX_ZOOM} from "../../settings/map-settings.js";

export function defaultDragStart(e){
  this._dragMode = true;
  this._dragStartXY = {x: e.x, y: e.y};
}

export function defaultDragEnd(e){
  if (!this._dragMode) return;

  if (!this._dragged) {};
  
  const {x, y, zoom} = this._transformAttributes;
  const dx = e.x - this._dragStartXY.x;
  const dy = e.y - this._dragStartXY.y;

  this._dragStartXY = {};
  this._dragMode = false;
  this._dragged = false;

  this._transformAttributes = { x: x + dx, y: y + dy, zoom};
  this.transform(this._transformAttributes, false);
}

export function defaultDrag(e){
  if (!this._dragMode){
    let {x, y} = screenToGrid(e, {
      translateX: this._transformAttributes?.x || 0,
      translateY: this._transformAttributes?.y || 0,
      zoom: this._transformAttributes?.zoom || 1
    });

    x = x | 0; y = y | 0;

    if (
      x !== this._highlightedGridXY.x || 
      y !== this._highlightedGridXY.y
    ) {
      this._highlightedGridXY = {x, y};
    }
    return;
  };

  const {x, y, zoom} = this._transformAttributes;
  const dx = e.x - this._dragStartXY.x;
  const dy = e.y - this._dragStartXY.y;

  if (dx !== 0 || dy !== 0) this._dragged = true;

  this._animationFrame = requestAnimationFrame( () => 
    this.transform({x: x + dx, y: y + dy, zoom}, false)
  );
}

export function defaultScroll(e){
  const {x, y, zoom} = this._transformAttributes;
  const newZoom = Math.min(Math.max(MIN_ZOOM, zoom - e.deltaY / 64), MAX_ZOOM);

  this.transform({
    x: x * newZoom / zoom - e.x * (newZoom / zoom - 1),
    y: y * newZoom / zoom - e.y * (newZoom / zoom - 1),
    zoom: newZoom
  });
}