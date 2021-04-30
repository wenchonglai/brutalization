import {PIXEL_PER_GRID} from "../../settings/map-settings.js";

export default class MetaCanvasRendering{
  constructor(gameObject, renderer, canvas){
    this._ctx = canvas;
    this._gameObject = gameObject;
    this._x = -PIXEL_PER_GRID;
    this._y = -PIXEL_PER_GRID;
    this._renderer = renderer;
    this.update();
  }
  get x(){ return this._x; }
  get y(){ return this._y; }
  get renderer(){ return this._renderer; }
  get ctx(){ return this._ctx; }
  get gameObject(){ return this._gameObject; }

  update(){
    this.ctx.clearRect({
      x: this.x,
      y: this.y,
      width: PIXEL_PER_GRID,
      height: PIXEL_PER_GRID
    });
  }
}