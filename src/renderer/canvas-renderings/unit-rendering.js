import {PIXEL_PER_GRID} from "../../settings/map-settings.js";
import MetaCanvasRendering from "./meta-canvas-rendering.js";

export default class UnitRendering extends MetaCanvasRendering{
  constructor(gameObject, renderer){
    super(gameObject, renderer, renderer.unitCanvas);
    this._campTile = gameObject.campTile;
  }

  get campTile(){ return this._campTile; }

  update(){
    MetaCanvasRendering.prototype.update.call(this);
    const oldCampTile = this.campTile;
    const {gameObject} = this;
    this._campTile = gameObject.campTile;

    if (oldCampTile !== this.tile)
      this.renderer.render(oldCampTile);
  }
}