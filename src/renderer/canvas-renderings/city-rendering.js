import {PIXEL_PER_GRID} from "../../settings/map-settings.js";
import MetaCanvasRendering from "./meta-canvas-rendering.js";

export default class CityRendering extends MetaCanvasRendering{
  constructor(gameObject, renderer){
    super(gameObject, renderer, renderer.mapCanvas);
  }
  update(){
    let {x, y, tiles} = this.gameObject;

    for (let tile of tiles){
      const isEven = (tile.x + tile.y) % 2 === 0;

      this.ctx.drawImage(
        this.renderer.texture, 0, isEven ? 0 : 128, 128, 128, 
        tile.x * PIXEL_PER_GRID, tile.y * PIXEL_PER_GRID, 
        PIXEL_PER_GRID, PIXEL_PER_GRID
      );
    }

    this.ctx.drawImage(
      this.renderer.texture, 0, 640, 128, 128, 
      x * PIXEL_PER_GRID, y * PIXEL_PER_GRID, 
      PIXEL_PER_GRID, PIXEL_PER_GRID
    );

    
  }
}