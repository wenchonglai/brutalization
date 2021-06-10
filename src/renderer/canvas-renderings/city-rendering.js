import {PIXEL_PER_GRID} from "../../settings/map-settings.js";
import MetaCanvasRendering from "./meta-canvas-rendering.js";

export default class CityRendering extends MetaCanvasRendering{
  constructor(gameObject, renderer){
    super(gameObject, renderer, renderer.mapCanvas);
  }
  update(){
    let {x, y, tiles} = this.gameObject;

    for (let tile of tiles){
      tile._improvements.add('farm');
      this.renderer.render(tile);
    }
  }
}