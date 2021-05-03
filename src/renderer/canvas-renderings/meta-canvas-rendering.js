import {PIXEL_PER_GRID} from "../../settings/map-settings.js";

export default class MetaCanvasRendering{
  constructor(gameObject, renderer, canvas){
    this._renderer = renderer;
    this._ctx = canvas;
    this._gameObject = gameObject;
    this._tile = gameObject.tile;
    this.update();
  }
  get gameObject(){ return this._gameObject; }
  get ctx(){ return this._ctx; }
  get tile(){ return this._tile; }
  get x(){ return this.tile.x; }
  get y(){ return this.tile.y; }
  get renderer(){ return this._renderer; }

  update(){
    this.renderer.render(this.tile);
    this._tile = this.gameObject.tile;
    this.renderer.render(this.tile);
  }

  render(tile, textureType){
    let {x, y} = tile;

    // console.log(tile);
    return this.ctx.drawImage(
      ...this.renderer.texture[textureType],
      x * PIXEL_PER_GRID, y * PIXEL_PER_GRID, PIXEL_PER_GRID, PIXEL_PER_GRID
    );
  }
}